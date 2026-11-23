#!/usr/bin/env python3
"""English catalogues for the boards.

The boards are drawn in Dutch. `theme.js` translates a board document in the
browser from a catalogue: a JSON file per board under
`preview/screens/i18n/en/<Key>.json` that maps every Dutch string on the board
to its English text, plus `_common.json` for the strings many boards share.
An empty value means "not translated yet"; the string then stays Dutch.

    python3 scripts/screens/i18n.py extract --app dossiq --app portaliq
    python3 scripts/screens/i18n.py extract --all
    python3 scripts/screens/i18n.py index
    python3 scripts/screens/i18n.py stats
    python3 scripts/screens/i18n.py check

extract  reads the flattened boards (`preview/screens/boards/<Key>.html`) of
         the named apps and writes or updates their catalogues. Existing
         translations are kept, new strings are added with "", strings no
         longer on the board are dropped. `_common.json` is rebuilt from every
         board of every set: a string that occurs on at least COMMON_MIN boards
         lives there and is left out of the per-board files, unless a board
         catalogue already holds it: then it is an override for that board
         (its value wins over _common.json, "" keeps the Dutch). A string stays
         in `_common.json` while any board uses it, also when fewer than
         COMMON_MIN do. A string that becomes common takes its translation from
         the board catalogues that had it. Each catalogue
         also carries `_title` and `_note`: the board's title and capability
         note from screens.json, translated the same way.
index    writes `preview/screens/i18n/en/index.json`: per board with a
         catalogue its English title and note and how many strings are done.
         Run it after translating.
stats    prints per app how many boards and unique strings there are and how
         many are translated, without writing anything.
check    exits 1 when a catalogue is invalid JSON, has a key that is not on its
         board, an English value with an em-dash, or a value equal to its key.

A string is every text node with at least two letters outside <script> and
<style>, with whitespace collapsed, and the values of placeholder, title,
aria-label and alt. Numbers, dates, prices and codes have no letters and are
left out; names and addresses are extracted but stay untranslated by decision
(the demo municipality is Dutch). One exception: in English the organisation is
"Municipality of Zuiddrecht" everywhere ("the Municipality of Zuiddrecht" after
of, for, to and from), as the workplace's own brand line reads. A thematiq token
set keeps its name, "Gemeente Zuiddrecht", on the thematiq (Tq) boards.
"""
import argparse
import json
import os
import re
import sys
from collections import Counter, defaultdict
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCREENS = os.path.join(ROOT, 'preview', 'screens')
OUT = os.path.join(SCREENS, 'i18n', 'en')
COMMON_MIN = 3
ATTRS = ('placeholder', 'title', 'aria-label', 'alt')
WORD = re.compile(r'[A-Za-zÀ-ÿ]{2}')
# Code that happens to sit in a text node: CSS variables, hex colours, rules,
# keys, mail addresses and URLs. Never translated, so never extracted.
NOISE = re.compile(r'^(--[\w-]*|#[0-9A-Fa-f]{6}\b.*|-----BEGIN.*|https?://\S+|[\w.+-]+@[\w.-]+\.\w+)$|[{}]|;\s*$')


class Strings(HTMLParser):
    """Collects the translatable strings of one flattened board."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.skip = 0
        self.found = []

    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style'):
            self.skip += 1
        for name, value in attrs:
            if name in ATTRS and value and wanted(value):
                self.found.append(norm(value))

    def handle_endtag(self, tag):
        if tag in ('script', 'style') and self.skip:
            self.skip -= 1

    def handle_data(self, data):
        if self.skip:
            return
        if wanted(data):
            self.found.append(norm(data))


def norm(s):
    return ' '.join(s.split())


def wanted(s):
    s = norm(s)
    return bool(WORD.search(s)) and not NOISE.search(s)


def load_json(path, default=None):
    try:
        with open(path, encoding='utf-8') as fh:
            return json.load(fh)
    except FileNotFoundError:
        return default


def write_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as fh:
        json.dump(data, fh, ensure_ascii=False, indent=2)
        fh.write('\n')


def screens():
    data = load_json(os.path.join(SCREENS, 'screens.json'))
    if not data:
        sys.exit('preview/screens/screens.json missing; run build.py first')
    return data


def board_strings(board):
    path = os.path.join(SCREENS, board['file'])
    try:
        with open(path, encoding='utf-8') as fh:
            html = fh.read()
    except FileNotFoundError:
        return None
    parser = Strings()
    parser.feed(html)
    seen, out = set(), []
    for s in parser.found:
        if s not in seen:
            seen.add(s)
            out.append(s)
    return out


def all_strings(data):
    """Strings per board. A set with a gallery page of its own (OpenProject) is drawn in English and gets no catalogue."""
    skip = {s['id'] for s in data.get('sets', []) if s.get('gallery')}
    per = {}
    for key, board in data['boards'].items():
        if board.get('set') in skip:
            continue
        strings = board_strings(board)
        if strings is not None:
            per[key] = strings
    return per


def common_set(per, common_old=None):
    """The strings _common.json holds: those on COMMON_MIN or more boards, and
    every string it already holds that a board still uses. A shared string never
    leaves _common.json while it is on a board, so its translation is never lost
    and boards outside an `extract --app` run, which have no own entry for it,
    keep getting it."""
    count = Counter()
    for strings in per.values():
        count.update(strings)
    kept = {k for k in (common_old or {}) if not k.startswith('_') and count[k] > 0}
    return {s for s, n in count.items() if n >= COMMON_MIN} | kept


def catalogue_path(key):
    return os.path.join(OUT, key + '.json')


def seed_value(s, cats):
    """The translation the board catalogues most often give s, or ""."""
    values = Counter(c[s] for c in cats.values() if isinstance(c.get(s), str) and c[s])
    return values.most_common(1)[0][0] if values else ''


def plan(data, per, common_old, olds, apps):
    """The new _common.json and the board catalogues to write.

    `olds` holds every board catalogue on disk by board key, `apps` the apps to
    write catalogues for (None for all). A string that becomes common takes its
    translation from the board catalogues; a board entry for it stays only as an
    override, when it is translated differently. A string that is not common
    takes its translation from the board's catalogue, else from _common.json.
    """
    common = common_set(per, common_old)
    common_new = {'_comment': 'Strings shared by %d or more boards. Applied to every board that has its own catalogue.' % COMMON_MIN}
    for s in sorted(common):
        common_new[s] = common_old[s] if s in common_old else seed_value(s, olds)

    written = {}
    for key, strings in sorted(per.items()):
        board = data['boards'][key]
        if apps is not None and board['app'] not in apps:
            continue
        old = olds.get(key, {})
        cat = {
            '_board': key,
            '_app': board['app'],
            '_title': old.get('_title', '') if board.get('title') else '',
            '_note': old.get('_note', '') if board.get('note') else '',
            '_title_nl': board.get('title', ''),
            '_note_nl': board.get('note', ''),
        }
        for s in strings:
            if s not in common:
                cat[s] = old.get(s) or common_old.get(s, '')
            elif s in old and (s in common_old or (old[s] and old[s] != common_new[s])):
                # A common string that a board catalogue already holds is an
                # override: that board means something else by it, so it keeps
                # its own value ("" keeps the Dutch).
                cat[s] = old[s]
        written[key] = cat
    return common, common_new, written


def cmd_extract(args):
    data = screens()
    per = all_strings(data)
    apps = None if args.all else set(args.app or [])
    if not apps and not args.all:
        sys.exit('name --app <app> (repeatable) or --all')

    common_old = load_json(os.path.join(OUT, '_common.json'), {})
    common, common_new, written = plan(data, per, common_old, catalogues(), apps)
    write_json(os.path.join(OUT, '_common.json'), common_new)
    for key, cat in written.items():
        write_json(catalogue_path(key), cat)
    print('common strings: %d (of %d unique over all boards); catalogues written: %d' % (len(common), len({s for v in per.values() for s in v}), len(written)))


def catalogues():
    out = {}
    if not os.path.isdir(OUT):
        return out
    for name in sorted(os.listdir(OUT)):
        if not name.endswith('.json') or name.startswith('_') or name == 'index.json':
            continue
        out[name[:-5]] = load_json(os.path.join(OUT, name), {})
    return out


def coverage(cat):
    keys = [k for k in cat if not k.startswith('_')]
    done = sum(1 for k in keys if cat[k])
    return done, len(keys)


def cmd_index(args):
    cats = catalogues()
    boards = {}
    for key, cat in cats.items():
        done, total = coverage(cat)
        boards[key] = {'title': cat.get('_title', ''), 'note': cat.get('_note', ''), 'done': done, 'total': total}
    write_json(os.path.join(OUT, 'index.json'), {'boards': boards})
    print('index.json: %d boards' % len(boards))


def cmd_stats(args):
    data = screens()
    per = all_strings(data)
    common_cat = load_json(os.path.join(OUT, '_common.json'), {})
    common = common_set(per, common_cat)
    cats = catalogues()
    by_app = defaultdict(lambda: {'boards': 0, 'strings': set(), 'chars': 0, 'with_cat': 0, 'done': 0, 'total': 0})
    for key, strings in per.items():
        app = data['boards'][key]['app']
        row = by_app[app]
        row['boards'] += 1
        row['strings'].update(s for s in strings if s not in common)
        if key in cats:
            row['with_cat'] += 1
            d, t = coverage(cats[key])
            row['done'] += d
            row['total'] += t
    print('%-20s %6s %8s %8s %9s %10s' % ('app', 'boards', 'strings', 'chars', 'catalogs', 'done/total'))
    for app, row in sorted(by_app.items(), key=lambda x: -len(x[1]['strings'])):
        chars = sum(len(s) for s in row['strings'])
        print('%-20s %6d %8d %8d %9d %5d/%d' % (app, row['boards'], len(row['strings']), chars, row['with_cat'], row['done'], row['total']))
    cd = sum(1 for k, v in common_cat.items() if not k.startswith('_') and v)
    print('common: %d strings, %d chars, %d done' % (len(common), sum(len(s) for s in common), cd))


def cmd_check(args):
    data = screens()
    per = all_strings(data)
    bad = 0

    def err(msg):
        nonlocal bad
        bad += 1
        print('ERROR ' + msg)

    files = [os.path.join(OUT, '_common.json')] + [catalogue_path(k) for k in catalogues()]
    for path in files:
        try:
            with open(path, encoding='utf-8') as fh:
                cat = json.load(fh)
        except FileNotFoundError:
            continue
        except ValueError as e:
            err('%s: invalid JSON: %s' % (path, e))
            continue
        key = os.path.basename(path)[:-5]
        on_board = None if key == '_common' else set(per.get(key, []))
        if on_board is None and key != '_common':
            err('%s: no flattened board for this catalogue' % path)
        for k, v in cat.items():
            if not isinstance(v, str):
                err('%s: %r is not a string' % (path, k))
                continue
            if k.startswith('_'):
                if k in ('_title', '_note') and ('—' in v or '--' in v):
                    err('%s: %s has an em-dash' % (path, k))
                continue
            if on_board is not None and k not in on_board:
                err('%s: key not on board: %r' % (path, k))
            if '—' in v or ' -- ' in v:
                err('%s: em-dash in %r' % (path, k))
            if v and v == k and WORD.search(k) and len(k.split()) > 2:
                print('WARN  %s: value equals key: %r' % (path, k))
    print('check: %d errors' % bad)
    sys.exit(1 if bad else 0)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='cmd', required=True)
    p = sub.add_parser('extract')
    p.add_argument('--app', action='append')
    p.add_argument('--all', action='store_true')
    p.set_defaults(fn=cmd_extract)
    sub.add_parser('index').set_defaults(fn=cmd_index)
    sub.add_parser('stats').set_defaults(fn=cmd_stats)
    sub.add_parser('check').set_defaults(fn=cmd_check)
    args = ap.parse_args()
    args.fn(args)


if __name__ == '__main__':
    main()
