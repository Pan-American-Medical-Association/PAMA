"""Build the private search index for the PAMA chat assistant.
Usage: python3 build_index.py <mgi_txt_dir> <site_root> <out_dir> [<library_txt_dir>]
<library_txt_dir> holds pdftotext output (*.raw.txt, \f page breaks) for the other library books and course notes;
titles come from library.json (files not listed there are labelled as course notes).
Output: meta.json, pNN.json.gz (postings shards), cNN.json.gz (passage shards). Upload out_dir's files to the
'PAMA Chat Index' Drive folder (never publish them: the book text is copyrighted)."""
import sys, os, re, json, gzip, math, glob, zlib
sys.path.insert(0, os.path.dirname(__file__))
from textproc import tokens
from bs4 import BeautifulSoup

MGI_DIR, SITE, OUT = sys.argv[1:4]
LIB_DIR = sys.argv[4] if len(sys.argv) > 4 else None
CATALOG = json.load(open(os.path.join(os.path.dirname(__file__), 'library.json'), encoding='utf-8'))
NP, NC = 96, 96            # shard counts (postings / passages)
CHUNK, OVERLAP = 230, 40   # words
os.makedirs(OUT, exist_ok=True)
docs = []                  # {s: source idx, p: page, h: heading, t: text}
sources = []

def add_chunks(src_idx, words_with_page, heading_of):
    i = 0
    while i < len(words_with_page):
        seg = words_with_page[i:i + CHUNK]
        if len(seg) < 25 and docs and docs[-1]['s'] == src_idx:
            docs[-1]['t'] += ' ' + ' '.join(w for w, _ in seg)
            break
        page = seg[0][1]
        docs.append({'s': src_idx, 'p': page, 'h': heading_of(page), 't': ' '.join(w for w, _ in seg)})
        i += CHUNK - OVERLAP

# --- MGI books ---
VOL = {'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5}
for path in sorted(glob.glob(os.path.join(MGI_DIR, '*.raw.txt'))):
    vol = re.search(r'Vol\.?\s*([IVX]+)', path).group(1)
    sources.append({'type': 'book', 'title': 'Medicina General Integral, Vol. %s (Álvarez Sintes, ECIMED, 2014, 3.ª ed.)' % vol, 'short': 'MGI Vol. %s' % vol})
    si = len(sources) - 1
    pages = open(path, encoding='utf-8').read().split('\f')
    chapter_at, current = {}, ''
    words = []
    for pno, page in enumerate(pages, start=1):
        lines = [l.strip() for l in page.splitlines()]
        for k, l in enumerate(lines):
            m = re.match(r'^Cap[ií]tulo\s+(\d+)\s*$', l)
            if m:
                tl = []
                for x in lines[k + 1:k + 5]:
                    if not x:
                        continue
                    if x.upper() != x or not re.search(r'[A-ZÁÉÍÓÚÑ]{3}', x):
                        break
                    tl.append(x)
                title = ' '.join(tl).title()[:90]
                current = 'Cap. %s. %s' % (m.group(1), title)
        chapter_at[pno] = current
        # join hyphenated line breaks, drop page-number-only lines
        text = re.sub(r'-\n(\w)', r'\1', page)
        text = '\n'.join(l for l in text.splitlines() if not re.fullmatch(r'\s*\d{1,4}\s*', l))
        words += [(w, pno) for w in text.split()]
    add_chunks(si, words, lambda p, ca=chapter_at: ca.get(p, ''))

# --- Other library books and course notes ---
def chapter_heading(lines, k, m):
    tl = []
    for x in lines[k + 1:k + 5]:
        if not x:
            continue
        if x.upper() != x or not re.search(r'[A-ZÁÉÍÓÚÑ]{3}', x):
            break
        tl.append(x)
    return ('Cap. %s. %s' % (m.group(1), ' '.join(tl).title()[:90])).rstrip('. ')

if LIB_DIR:
    for path in sorted(glob.glob(os.path.join(LIB_DIR, '*.raw.txt'))):
        stem = os.path.basename(path)[:-len('.raw.txt')]
        meta_b = CATALOG.get(stem)
        if meta_b:
            sources.append({'type': 'book', 'title': meta_b['title'], 'short': meta_b['short']})
        else:
            name = re.sub(r'^Conf - ', 'Lecture: ', stem)
            d = CATALOG['_default_notes']
            sources.append({'type': 'book', 'title': d['title'] % name, 'short': d['short'] % name})
        si = len(sources) - 1
        pages = open(path, encoding='utf-8', errors='replace').read().split('\f')
        chapter_at, current, words = {}, '', []
        for pno, page in enumerate(pages, start=1):
            mk = re.match(r'@@PAGE (\d+) @@CAP ([^\n]*)\n', page)
            if mk:                                   # from split_running_headers.py: printed page + chapter
                pno, current = int(mk.group(1)), mk.group(2)
                sources[si]['pg'] = 'printed'
                page = page[mk.end():]
            lines = [l.strip() for l in page.splitlines()]
            for k, l in enumerate(lines):
                m = re.match(r'^CAP[IÍ]TULO\s+(\d+)\s*$', l, re.I)
                if m:
                    current = chapter_heading(lines, k, m)
            chapter_at[pno] = current
            text = re.sub(r'-\n(\w)', r'\1', page)
            text = '\n'.join(l for l in text.splitlines() if not re.fullmatch(r'\s*\d{1,4}\s*', l))
            words += [(w, pno) for w in text.split()]
        add_chunks(si, words, lambda p, ca=chapter_at: ca.get(p, ''))

# --- Website (English pages and blog) ---
skip = re.compile(r'^(es|pt|fr|it|zh|ru|de|pl|tools|apps-script|members|404)(/|$)')
for f in sorted(glob.glob(os.path.join(SITE, '**/index.html'), recursive=True)):
    rel = os.path.relpath(os.path.dirname(f), SITE)
    rel = '' if rel == '.' else rel + '/'
    if skip.match(rel):
        continue
    html = open(f, encoding='utf-8').read()
    if 'http-equiv="refresh"' in html:
        continue
    soup = BeautifulSoup(html, 'html.parser')
    for t in soup(['script', 'style', 'noscript', 'svg', 'form']):
        t.decompose()
    main = soup.find('main') or soup.body
    for t in main.select('.pama-popup, .pama-overlay'):
        t.decompose()
    title = (soup.title.string or '').split(' — ')[0].split(' | ')[0].strip()
    url = 'https://www.pan-american.org/' + rel
    sources.append({'type': 'web', 'title': title, 'short': title, 'url': url})
    si = len(sources) - 1
    words = []
    for el in main.find_all(['h1', 'h2', 'h3', 'p', 'li', 'td', 'th', 'blockquote', 'figcaption', 'dt', 'dd']):
        if el.find(['p', 'li', 'h2', 'h3']):
            continue
        words += [(w, 0) for w in el.get_text(' ', strip=True).split()]
    add_chunks(si, words, lambda p, t=title: t)

# --- Index ---
def shard(s, n):
    return zlib.crc32(s.encode('utf-8')) % n

postings = [dict() for _ in range(NP)]
lens = []
for i, d in enumerate(docs):
    toks = tokens(d['h'] + ' ' + d['t'])
    lens.append(len(toks))
    tf = {}
    for t in toks:
        tf[t] = tf.get(t, 0) + 1
    for t, c in tf.items():
        postings[shard(t, NP)].setdefault(t, []).extend([i, c])
for k, ps in enumerate(postings):
    with gzip.open(os.path.join(OUT, 'p%02d.json.gz' % k), 'wt', encoding='utf-8') as fh:
        json.dump(ps, fh, separators=(',', ':'))
for k in range(NC):
    part = {i: [d['s'], d['p'], d['h'], d['t']] for i, d in enumerate(docs) if i % NC == k}
    with gzip.open(os.path.join(OUT, 'c%02d.json.gz' % k), 'wt', encoding='utf-8') as fh:
        json.dump(part, fh, separators=(',', ':'), ensure_ascii=False)
meta = {'version': 1, 'N': len(docs), 'avgdl': sum(lens) / len(lens), 'len': lens, 'NP': NP, 'NC': NC, 'sources': sources}
with gzip.open(os.path.join(OUT, 'meta.json.gz'), 'wt', encoding='utf-8') as fh:
    json.dump(meta, fh, separators=(',', ':'), ensure_ascii=False)
tot = sum(os.path.getsize(os.path.join(OUT, x)) for x in os.listdir(OUT))
print('passages', len(docs), 'sources', len(sources), 'files', len(os.listdir(OUT)), 'total MB %.2f' % (tot / 1e6),
      'max file KB', max(os.path.getsize(os.path.join(OUT, x)) for x in os.listdir(OUT)) // 1024)
