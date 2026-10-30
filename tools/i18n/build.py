"""Build translated copies of the key pages (/es/, /pt/) and add the language menu + hreflang to every page.

Run from the repo root:  python3 tools/i18n/build.py
Re-run after editing an English page; then re-run extract.py and translate any new segments.
"""
import json, os, re, sys, posixpath
sys.path.insert(0, os.path.dirname(__file__))
from common import *
from bs4 import BeautifulSoup, NavigableString

ROOT = '.'
SITE = 'https://www.pan-american.org/'
HERE = os.path.dirname(__file__)
TR = {lang: json.load(open(os.path.join(HERE, lang + '.json'), encoding='utf-8')) for lang in LANGS}
LABEL = {'en': 'English', 'es': 'Español', 'pt': 'Português'}
SKIP_SCHEMES = ('http:', 'https:', '//', '#', 'mailto:', 'tel:', 'data:', 'javascript:')
missing = set()

def rel(from_dir, to_path):
    """Relative URL from directory from_dir ('' or 'es/about/') to site path to_path ('about/' or 'assets/x.css')."""
    r = posixpath.relpath(to_path or '.', from_dir or '.')
    if to_path.endswith('/') or to_path == '':
        r = r.rstrip('/') + '/'
        if r == './':
            r = './'
    return r

def resolve(base_dir, url):
    """Site path for a relative url found in a page whose directory is base_dir."""
    path, sep, frag = url.partition('#')
    path, qsep, query = path.partition('?')
    trailing = path.endswith('/') or path in ('', '.', './')
    full = posixpath.normpath(posixpath.join(base_dir or '.', path or '.'))
    full = '' if full == '.' else full
    if trailing and full:
        full += '/'
    return full, (qsep + query if qsep else '') + (sep + frag if sep else '')

def localize(page, lang):
    src = open(os.path.join(ROOT, page_file(page)), encoding='utf-8').read()
    src = re.sub(r'<li class="lang-li">.*?</details></li>', '', src, flags=re.S)
    soup = soup_of(src)
    tr = TR[lang]
    # Keep stored form values in English even when the visible text is translated.
    for opt in soup.find_all('option'):
        if not opt.has_attr('value'):
            opt['value'] = opt.get_text()
    # Text segments
    for kind, node in segments(soup):
        frag = inner(node) if kind == 'html' else str(node)
        tpl, _ = to_template(frag)
        t = tr.get(sid(tpl))
        if t is None:
            missing.add(tpl[:80]); continue
        if kind == 'html':
            new = from_template(t, frag)
            node.clear()
            for child in list(soup_of(new).contents):
                node.append(child)
        else:
            lead = re.match(r'^\s*', frag).group(0); trail = re.search(r'\s*$', frag).group(0)
            node.replace_with(NavigableString(lead + t + trail))
    # Attributes, <title>, meta descriptions
    for el, a in attr_targets(soup):
        v = el.string if a == '#string' else el.get(a)
        t = tr.get(sid(re.sub(r'\s+', ' ', v).strip()))
        if t is None:
            missing.add(v[:80]); continue
        if a == '#string':
            el.string = t
        else:
            el[a] = t
    soup.html['lang'] = lang
    # Rewrite relative URLs for the deeper location, pointing to translated pages where they exist.
    base_dir = page
    new_dir = lang + '/' + page
    for el in soup.find_all(True):
        for a in ('href', 'src', 'action', 'data-src'):
            v = el.get(a)
            if not v or v.startswith(SKIP_SCHEMES):
                continue
            el[a] = fix_url(v, base_dir, new_dir, lang)
        if el.get('srcset') and not el['srcset'].startswith(SKIP_SCHEMES):
            el['srcset'] = ', '.join(fix_url(p.strip().split(' ')[0], base_dir, new_dir, lang) +
                                     ('' if len(p.strip().split(' ')) == 1 else ' ' + p.strip().split(' ', 1)[1])
                                     for p in el['srcset'].split(','))
    url = SITE + lang + '/' + page
    for link in soup.find_all('link', rel='canonical'):
        link['href'] = url
    for m in soup.find_all('meta', property='og:url'):
        m['content'] = url
    for m in soup.find_all('meta', property='og:locale'):
        m.decompose()
    out = str(soup)
    out = add_lang_head(out, page)
    os.makedirs(os.path.join(ROOT, lang, page), exist_ok=True)
    open(os.path.join(ROOT, lang, page, 'index.html'), 'w', encoding='utf-8').write(out)

def fix_url(v, base_dir, new_dir, lang):
    target, extra = resolve(base_dir, v)
    if target in PAGES:
        target = lang + '/' + target
    return rel(new_dir, target) + extra

def alternates(page):
    tags = ['<link rel="alternate" hreflang="en" href="%s%s">' % (SITE, page)]
    tags += ['<link rel="alternate" hreflang="%s" href="%s%s/%s">' % (l, SITE, l, page) for l in LANGS]
    tags.append('<link rel="alternate" hreflang="x-default" href="%s%s">' % (SITE, page))
    return '\n'.join(tags)

def add_lang_head(html, page):
    html = re.sub(r'\n?<link rel="alternate" hreflang="[^"]+" href="[^"]+">', '', html)
    return html.replace('</head>', alternates(page) + '\n</head>', 1)

def switcher(cur_dir, cur_lang, page):
    """Language menu for a page living in cur_dir. page = English page path if translated, else None."""
    items = []
    for code in ['en'] + list(LANGS):
        if code == 'en':
            target = page if page is not None else (cur_dir[len(cur_lang) + 1:] if cur_lang != 'en' else cur_dir)
        else:
            target = code + '/' + (page if page is not None else '')
        cur = ' aria-current="true"' if code == cur_lang else ''
        items.append('<li><a href="%s" hreflang="%s" lang="%s"%s>%s</a></li>' % (rel(cur_dir, target), code, code, cur, LABEL[code]))
    return ('<li class="lang-li"><details class="lang-menu"><summary aria-label="Language / Idioma">'
            '<svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.9 6h-2.9a15.7 15.7 0 0 0-1.4-3.6A8 8 0 0 1 18.9 8ZM12 4c.8 1.1 1.5 2.5 1.9 4h-3.8c.4-1.5 1.1-2.9 1.9-4ZM4.3 14a8 8 0 0 1 0-4h3.3a16.5 16.5 0 0 0 0 4H4.3Zm.8 2h2.9c.3 1.3.8 2.5 1.4 3.6A8 8 0 0 1 5.1 16ZM8 8H5.1a8 8 0 0 1 4.3-3.6C8.8 5.5 8.3 6.7 8 8Zm4 12c-.8-1.1-1.5-2.5-1.9-4h3.8c-.4 1.5-1.1 2.9-1.9 4Zm2.3-6H9.7a14.6 14.6 0 0 1 0-4h4.6a14.6 14.6 0 0 1 0 4Zm.3 5.6c.6-1.1 1.1-2.3 1.4-3.6h2.9a8 8 0 0 1-4.3 3.6Zm1.8-5.6a16.5 16.5 0 0 0 0-4h3.3a8 8 0 0 1 0 4h-3.3Z"/></svg>'
            '<span>%s</span></summary><ul>%s</ul></details></li>' % (cur_lang.upper(), ''.join(items)))

def add_switcher(html, cur_dir, cur_lang, page):
    html = re.sub(r'<li class="lang-li">.*?</details></li>', '', html, flags=re.S)
    return re.sub(r'(<li><a class="nav-login")', switcher(cur_dir, cur_lang, page) + r'\1', html, count=1)

def main():
    for lang in LANGS:
        for p in PAGES:
            localize(p, lang)
    # Language menu + hreflang on every page (English pages edited as text to keep diffs small).
    for dirpath, _, files in os.walk(ROOT):
        if '/.git' in dirpath or '/tools' in dirpath or 'index.html' not in files:
            continue
        d = os.path.relpath(dirpath, ROOT)
        d = '' if d == '.' else d + '/'
        f = os.path.join(dirpath, 'index.html')
        html = open(f, encoding='utf-8').read()
        if 'http-equiv="refresh"' in html or 'nav-login' not in html:
            continue
        lang = d.split('/')[0] if d.split('/')[0] in LANGS else 'en'
        eng = d[len(lang) + 1:] if lang != 'en' else d
        page = eng if eng in PAGES else None
        html = add_switcher(html, d, lang, page)
        if page is not None:
            html = add_lang_head(html, page)
        open(f, 'w', encoding='utf-8').write(html)
    if missing:
        print('MISSING translations:', len(missing))
        for m in sorted(missing)[:40]:
            print('  ', m)
    else:
        print('All segments translated.')

if __name__ == '__main__':
    main()
