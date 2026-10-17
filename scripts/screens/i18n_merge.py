#!/usr/bin/env python3
"""Merge translated work chunks back into the catalogues.

    python3 scripts/screens/i18n_merge.py chunk_*.json

A chunk is a JSON array of {"board", "field", "nl", "en"} items, as written
by a translator. For board "_common" the string goes to _common.json; for
field "_title_nl" / "_note_nl" it fills the catalogue's _title / _note; else
it fills the key `nl` in the board's catalogue. Items with an empty "en" are
skipped. Prints what was applied and what did not match a key.
"""
import json
import os
import sys

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'preview', 'screens', 'i18n', 'en')


def main(paths):
    cats = {}

    def cat(key):
        if key not in cats:
            with open(os.path.join(OUT, key + '.json'), encoding='utf-8') as fh:
                cats[key] = json.load(fh)
        return cats[key]

    applied = skipped = missed = 0
    for path in paths:
        with open(path, encoding='utf-8') as fh:
            items = json.load(fh)
        for it in items:
            en = (it.get('en') or '').strip()
            if not en:
                skipped += 1
                continue
            c = cat(it['board'])
            if it.get('field') in ('_title_nl', '_note_nl'):
                c[it['field'][:-3]] = en
                applied += 1
            elif it['nl'] in c:
                c[it['nl']] = en
                applied += 1
            else:
                missed += 1
                print('no key: %s %r' % (it['board'], it['nl'][:60]))
    for key, c in cats.items():
        with open(os.path.join(OUT, key + '.json'), 'w', encoding='utf-8') as fh:
            json.dump(c, fh, ensure_ascii=False, indent=2)
            fh.write('\n')
    print('applied %d, left empty %d, no key %d, files %d' % (applied, skipped, missed, len(cats)))


if __name__ == '__main__':
    main(sys.argv[1:])
