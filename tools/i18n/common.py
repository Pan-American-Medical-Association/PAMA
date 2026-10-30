"""Shared helpers for PAMA site translation (extract + build)."""
import hashlib, re
from bs4 import BeautifulSoup, NavigableString, Comment, Doctype

PAGES = ['', 'about/', 'programs/', 'donate/', 'member/', 'contact/', 'coalition/', 'guatemala/', 'philly-for-cuba/']
LANGS = {'es': 'Español', 'pt': 'Português'}
INLINE = {'a', 'abbr', 'b', 'br', 'cite', 'code', 'em', 'i', 'small', 'span', 'strong', 'sub', 'sup',
          'time', 'mark', 'u', 'q', 's', 'wbr', 'img', 'input', 'picture', 'source'}
SKIP = {'script', 'style', 'noscript', 'svg', 'code', 'pre', 'template', 'head'}
ATTRS = ['alt', 'title', 'aria-label', 'placeholder', 'data-title']
LETTER = re.compile(r'[A-Za-zÀ-ÿ]{2,}')

def sid(text):
    return hashlib.sha1(text.strip().encode('utf-8')).hexdigest()[:12]

def page_file(p):
    return 'index.html' if p == '' else p + 'index.html'

def soup_of(html):
    return BeautifulSoup(html, 'html.parser')

def _has_block_desc(el):
    for d in el.descendants:
        if getattr(d, 'name', None) and d.name not in INLINE:
            return True
    return False

def _skipped(node):
    for p in node.parents:
        if p.name in SKIP:
            return True
        if p.get and (p.get('translate') == 'no' or 'notranslate' in (p.get('class') or [])):
            return True
    return False

def segments(soup):
    """Return ordered list of (kind, node) where kind is 'html' (translate innerHTML) or 'text'."""
    roots, seen = [], set()
    body = soup.body or soup
    for t in body.find_all(string=True):
        if isinstance(t, (Comment, Doctype)) or not LETTER.search(str(t)) or _skipped(t):
            continue
        # climb through inline ancestors to the nearest block element
        node, top_inline = t, t
        parent = t.parent
        while parent is not None and parent.name in INLINE:
            top_inline = parent
            parent = parent.parent
        block = parent
        if block is not None and not _has_block_desc(block):
            root, kind = block, 'html'
        else:
            root, kind = (top_inline, 'html') if top_inline is not t else (t, 'text')
            if kind == 'html' and _has_block_desc(root):
                root, kind = t, 'text'
        if id(root) in seen:
            continue
        seen.add(id(root))
        roots.append((kind, root))
    return roots

def inner(el):
    return ''.join(str(c) for c in el.contents)

def attr_targets(soup):
    out = []
    for el in soup.find_all(True):
        if _skipped(el) and el.name != 'title' and el.name != 'meta':
            continue
        for a in ATTRS:
            v = el.get(a)
            if isinstance(v, str) and LETTER.search(v):
                out.append((el, a))
        if el.name == 'input' and el.get('type') in ('submit', 'button') and el.get('value'):
            out.append((el, 'value'))
    head = soup.head
    if head:
        if head.title and head.title.string:
            out.append((head.title, '#string'))
        for m in head.find_all('meta'):
            if m.get('name') in ('description',) or m.get('property') in ('og:title', 'og:description'):
                out.append((m, 'content'))
    return out

TAG = re.compile(r'<(/?)([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|\'[^\']*\'|[^\'">])*)>')
VOID = {'br', 'img', 'input', 'source', 'wbr', 'hr', 'meta', 'link'}

def to_template(fragment):
    """Replace every tag with a numbered token: <t1>..</t1>, <t2/>. Returns (template, tags)."""
    tags, stack, n = [], [], 0
    def rep(m):
        nonlocal n
        closing, name, rest = m.group(1), m.group(2).lower(), m.group(3)
        if closing:
            k = stack.pop() if stack else 0
            tags.append((k, m.group(0)))
            return '</t%d>' % k
        n += 1
        if name in VOID or rest.rstrip().endswith('/'):
            tags.append((n, m.group(0)))
            return '<t%d/>' % n
        stack.append(n)
        tags.append((n, m.group(0)))
        return '<t%d>' % n
    tpl = TAG.sub(rep, fragment)
    return re.sub(r'\s+', ' ', tpl).strip(), tags

def from_template(tpl, fragment):
    """Rebuild translated HTML using the original fragment's real tags."""
    _, tags = to_template(fragment)
    opens, closes = {}, {}
    for k, t in tags:
        (closes if t.startswith('</') else opens)[k] = t
    def rep(m):
        closing, k, selfc = m.group(1), int(m.group(2)), m.group(3)
        return closes.get(k, '') if closing else opens.get(k, '')
    return re.sub(r'<(/?)t(\d+)(/?)>', rep, tpl)
