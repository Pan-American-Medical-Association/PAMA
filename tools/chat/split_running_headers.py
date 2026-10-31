"""Convert a book text with no page breaks (e.g. the Claude app's PDF-to-text) into the .raw.txt format build_index.py
reads, using the book's running headers ("21 Capítulo 3. Principios de genética médica" / "22 Roca Goderich. Temas…").
Usage: python3 split_running_headers.py <in.txt> <out.raw.txt>
Each page starts with "@@PAGE <book page> @@CAP <chapter>" so citations use the printed page number."""
import re, sys, unicodedata
src, out = sys.argv[1:3]
t = unicodedata.normalize('NFC', open(src, encoding='utf-8', errors='replace').read()).replace('\r', '')
hdr = re.compile(r'^\s*(\d{1,4}) (?:Cap[ií]tulo (\d+)\. (.{3,90})|Roca Goderich\. Temas de Medicina Interna.*|Bibliograf[ií]a\. Parte .*)$')
pages, cur, chap, page = [], [], '', 0
for line in t.split('\n'):
    m = hdr.match(line)
    if m:
        pages.append((page, chap, cur))
        page = int(m.group(1))
        if m.group(2):
            chap = 'Cap. %s. %s' % (m.group(2), m.group(3).strip())
        cur = []
        continue
    cur.append(line)
pages.append((page, chap, cur))
with open(out, 'w', encoding='utf-8') as fh:
    fh.write('\f'.join('@@PAGE %d @@CAP %s\n%s' % (p, c, '\n'.join(ls)) for p, c, ls in pages))
print(out, 'pages', len(pages))
