"""Collect every translatable string from the key pages into segments.json."""
import json, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from common import *

root = sys.argv[1] if len(sys.argv) > 1 else '.'
segs = {}
for p in PAGES:
    soup = soup_of(open(os.path.join(root, page_file(p)), encoding='utf-8').read())
    for kind, node in segments(soup):
        src = inner(node) if kind == 'html' else str(node)
        if src.strip():
            tpl, _ = to_template(src)
            segs.setdefault(sid(tpl), tpl)
    for el, a in attr_targets(soup):
        v = el.string if a == '#string' else el.get(a)
        v = re.sub(r'\s+', ' ', v).strip()
        segs.setdefault(sid(v), v)
json.dump(segs, open(os.path.join(os.path.dirname(__file__), 'segments.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
words = sum(len(re.sub(r'<[^>]+>', ' ', s).split()) for s in segs.values())
print(len(segs), 'segments,', words, 'words')
