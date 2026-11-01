"""Like split_running_headers.py, for books whose text has a bare page-number line just before a running header,
e.g. Llanio's Propedéutica:  "199" / "CAPÍTULO 15 SISTEMA NERVIOSO: ..."  or  "198" / "PROPEDÉUTICA CLÍNICA Y SEMIOLOGÍA MÉDICA".
Usage: python3 split_page_numbers.py <in.txt> <out.raw.txt>"""
import re, sys, unicodedata
src, out = sys.argv[1:3]
lines = unicodedata.normalize('NFC', open(src, encoding='utf-8', errors='replace').read()).replace('\r', '').split('\n')
chap_re = re.compile(r'^\s*CAP[IÍ]TULO\s+(\d+)\s+(.{3,120}?)\s*$')
book_re = re.compile(r'^\s*PROPED[EÉ]UTICA CL[IÍ]NICA Y SEMIOLOG[IÍ]A M[EÉ]DICA')
num_re = re.compile(r'^\s*(\d{1,4})\s*$')
pages, cur, chap, page = [], [], '', 0
for i, l in enumerate(lines):
    m = chap_re.match(l)
    if m or book_re.match(l):
        pn = None
        for j in range(i - 1, max(i - 4, -1), -1):           # page number sits just above the header
            n = num_re.match(lines[j])
            if n and int(n.group(1)) > page and (page == 0 or int(n.group(1)) - page < 40):
                pn = int(n.group(1)); break
        if pn:
            if cur and cur[-1].strip() == str(pn): cur.pop()
            while cur and not cur[-1].strip(): cur.pop()
            pages.append((page, chap, cur)); cur = []; page = pn
        if m:
            chap = 'Cap. %s. %s' % (m.group(1), m.group(2).strip().title())
        continue
    cur.append(l)
pages.append((page, chap, cur))
with open(out, 'w', encoding='utf-8') as fh:
    fh.write('\f'.join('@@PAGE %d @@CAP %s\n%s' % (p, c, '\n'.join(ls)) for p, c, ls in pages))
print(out, 'pages', len(pages), 'last page', pages[-1][0], 'chapters', len({c for _, c, _ in pages}))
