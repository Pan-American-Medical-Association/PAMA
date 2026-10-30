# Site translations (Spanish /es/, Portuguese /pt/)

Key pages listed in `common.py` (PAGES) are published in Spanish and Portuguese.
English pages are the source; never edit files under `es/` or `pt/` by hand.

After changing an English key page:
1. `python3 tools/i18n/extract.py .` — refreshes `segments.json` (new or changed text gets a new id).
2. Translate the new ids into `es.json` and `pt.json` (keep `<tN>` tokens exactly; see `glossary.md`).
3. `python3 tools/i18n/build.py` — rebuilds `/es/` and `/pt/`, the language menu on every page, and hreflang tags.
   It prints any text still missing a translation (that text stays in English until translated).
