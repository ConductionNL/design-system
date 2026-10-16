#!/usr/bin/env python3
"""Build preview/screens/build-status.json: how far each screen is built in its app and how well it matches.

    python3 scripts/screens/build_status.py INV-Dq/inventory.tsv LIVE-Dq/inventory.tsv ...

Every argument is a measurement TSV with the header
    board  kind  route  status  mismatchPct  notes
status is built, partial, missing, accepted or "state-of <Board>"; mismatchPct is a number or "-".

A file in a directory whose name starts with LIVE- holds live verdicts on builder branches. Its rows win
over every other row for the same board, whatever the argument order. Among files of the same kind the
later argument wins. Rows with status "-" carry no measurement and are left out, so the gallery shows
the board as not measured yet.

layoutMatch is true for status accepted or notes starting with "layout match", false for notes starting
with "no layout match" or "layout differs", and null otherwise. measuredOn is the branch named in the
notes ("[feature/x abc123]", "[round 2: branches]", "[branch]"), else development.

The app of a board and the number of boards per app come from preview/screens/screens.json.
"""
import argparse
import collections
import csv
import datetime
import json
import pathlib
import re
import sys

REPO = pathlib.Path(__file__).resolve().parents[2]
SCREENS = REPO / 'preview' / 'screens'
OUT = SCREENS / 'build-status.json'

PREFIX = re.compile(r'^([A-Z][a-z]+)(?=[A-Z])')
BRANCH = re.compile(r'\[(?:round \d+: )?([^\]=]*(?:/|branch)[^\]=]*)\]')
STATUSES = ('built', 'partial', 'missing', 'accepted')


def pct(value):
    try:
        return round(float(str(value).strip().rstrip('%')), 2)
    except ValueError:
        return None


def layout_match(status, notes):
    n = notes.strip().lower()
    if status == 'accepted' or n.startswith('layout match'):
        return True
    if n.startswith('no layout match') or n.startswith('layout differs'):
        return False
    return None


def measured_on(notes):
    m = BRANCH.search(notes)
    return m.group(1).strip() if m else 'development'


def parse_row(row):
    board, kind, route, status, mismatch = (row + [''] * 5)[:5]
    notes = row[5] if len(row) > 5 else ''
    status = status.strip()
    state_of = None
    if status.startswith('state-of'):
        state_of = status[len('state-of'):].strip() or None
        status = 'state-of'
    elif status not in STATUSES:
        return None
    return {
        'kind': kind.strip() or None,
        'route': None if route.strip() in ('', '-') else route.strip(),
        'status': status,
        'mismatchPct': pct(mismatch),
        'layoutMatch': layout_match(status, notes),
        'notes': notes.strip(),
        'measuredOn': measured_on(notes),
        'stateOf': state_of,
    }


def read_tsv(path):
    rows = {}
    with open(path, newline='', encoding='utf-8') as fh:
        for row in csv.reader(fh, delimiter='\t', quoting=csv.QUOTE_NONE):
            if not row or row[0].strip() in ('', 'board') or len(row) < 4:
                continue
            parsed = parse_row(row)
            if parsed:
                rows[row[0].strip()] = parsed
    return rows


def source_name(path):
    return f'{path.parent.name}/{path.name}'


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('tsv', nargs='+', type=pathlib.Path, help='measurement TSV files')
    ap.add_argument('--out', type=pathlib.Path, default=OUT)
    args = ap.parse_args()

    screens = json.loads((SCREENS / 'screens.json').read_text(encoding='utf-8'))['boards']

    files = sorted(args.tsv, key=lambda p: p.resolve().parent.name.startswith('LIVE-'))
    boards, sources = {}, []
    for path in files:
        rows = read_tsv(path)
        live = path.resolve().parent.name.startswith('LIVE-')
        sources.append({'file': source_name(path), 'rows': len(rows), 'live': live})
        for name, r in rows.items():
            app = screens[name]['app'] if name in screens else None
            boards[name] = {'app': app, **r, 'source': source_name(path)}

    unknown = sorted(b for b in boards if b not in screens)
    for name in unknown:
        print(f'warning: {name} is not a board in screens.json', file=sys.stderr)

    # One block per board prefix (Dq, Pq), named after the app most of its measured boards belong to.
    apps_of = collections.defaultdict(collections.Counter)
    for name, b in boards.items():
        m = PREFIX.match(name)
        if m and b['app']:
            apps_of[m.group(1)][b['app']] += 1
    apps = {}
    for prefix, counter in sorted(apps_of.items()):
        app = counter.most_common(1)[0][0]
        names = [n for n, s in screens.items() if s.get('app') == app and PREFIX.match(n) and PREFIX.match(n).group(1) == prefix]
        a = {'app': app, 'boards': len(names), 'built': 0, 'partial': 0, 'missing': 0, 'stateOf': 0, 'measured': 0, 'layoutMatch': 0}
        for n in names:
            b = boards.get(n)
            if not b:
                continue
            a['measured'] += 1
            key = {'accepted': 'built', 'state-of': 'stateOf'}.get(b['status'], b['status'])
            a[key] += 1
            if b['layoutMatch']:
                a['layoutMatch'] += 1
        apps[prefix] = a

    out = {
        'generated': datetime.datetime.now().astimezone().isoformat(timespec='minutes'),
        'sources': sources,
        'boards': dict(sorted(boards.items())),
        'apps': apps,
    }
    args.out.write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print(f'{args.out.relative_to(REPO) if args.out.is_relative_to(REPO) else args.out}: {len(boards)} boards, '
          + ', '.join(f"{p} {a['layoutMatch']}/{a['boards']} match, {a['built']} built, {a['missing']} missing" for p, a in apps.items()))


if __name__ == '__main__':
    main()
