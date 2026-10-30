"""Tokenizer shared by the index builder (Python) and Chat.gs (JavaScript port must match exactly)."""
import re, unicodedata
STOP = set("""a al algo algunas algunos ante antes como con contra cual cuales cuando de del desde donde dos el ella ellas ellos en entre era eran es esa esas ese eso esos esta estas este esto estos fue fueron ha han hasta hay la las le les lo los mas me mi mis muy ni no nos o otra otras otro otros para pero poco por porque que quien se ser si sin sobre son su sus tambien tiene tienen todo todos tu un una uno unos y ya
about after all also an and any are as at be been but by can could did do does for from had has have how if in into is it its may more most no not of on or other our out over should so some such than that the their them then there these they this those to under up was we were what when where which while who why will with would you your""".split())
SUFFIXES = ['aciones','iciones','amientos','imientos','acion','icion','amiento','imiento','idades','idad','ismos','ismo','istas','ista','mente','ales','ores','ivas','ivos','iva','ivo','antes','ante','entes','ente','osas','osos','osa','oso','ing','ed','es','s','a','o','e']

def norm(text):
    t = unicodedata.normalize('NFD', text.lower())
    return ''.join(c for c in t if unicodedata.category(c) != 'Mn')

def stem(t):
    for suf in SUFFIXES:
        if t.endswith(suf) and len(t) - len(suf) >= 4:
            return t[:-len(suf)]
    return t

def tokens(text):
    return [stem(w) for w in re.findall(r'[a-z0-9]+', norm(text)) if len(w) > 1 and w not in STOP]
