#!/usr/bin/env python3
"""Build preview/screens/component-status.json: how well each component matches its drawn specimen.

    python3 scripts/screens/component_status.py ~/memcap-work/screens/round6/COMP/components.tsv

Each input is a TSV with the header `component specimenBoard mismatchPct verdict notes` (lane COMP
measures a component against the board that draws its specimen). Later files win over earlier ones
for the same component. The file may be missing, empty or partial: a component without a row is
shown as not measured yet, and a missing file still writes a valid output with no components.

The `kind` per component, the same three the pages colour: `match` when the verdict says so
(match, ok, pass, klopt) or, without a verdict, when mismatchPct is 0; `differs` when the verdict says
so (differs, mismatch, fail, wijkt af) or mismatchPct is above 0; `none` otherwise. Idempotent.
"""
import argparse
import csv
import datetime
import json
import pathlib

REPO = pathlib.Path(__file__).resolve().parents[2]
OUT = REPO / 'preview' / 'screens' / 'component-status.json'
MATCH = {'match', 'matches', 'ok', 'pass', 'klopt', 'yes'}
DIFFERS = {'differs', 'differ', 'mismatch', 'fail', 'no', 'wijkt af', 'wijkt'}


def kind_of(pct, verdict):
    v = (verdict or '').strip().lower()
    if v in MATCH:
        return 'match'
    if v in DIFFERS:
        return 'differs'
    if pct is not None:
        return 'match' if pct == 0 else 'differs'
    return 'none'


def read_tsv(path):
    rows = {}
    if not path.is_file():
        return rows, False
    with open(path, encoding='utf-8', newline='') as f:
        reader = csv.DictReader(f, delimiter='\t')
        for r in reader:
            name = (r.get('component') or '').strip()
            if not name or name.startswith('#'):
                continue
            pct_raw = (r.get('mismatchPct') or '').strip().rstrip('%').replace(',', '.')
            try:
                pct = float(pct_raw) if pct_raw else None
            except ValueError:
                pct = None
            rows[name] = {
                'name': name,
                'specimenBoard': (r.get('specimenBoard') or '').strip() or None,
                'mismatchPct': pct,
                'verdict': (r.get('verdict') or '').strip() or None,
                'notes': (r.get('notes') or '').strip() or None,
            }
            rows[name]['kind'] = kind_of(pct, rows[name]['verdict'])
    return rows, True


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('tsv', nargs='*', type=pathlib.Path, help='measurement TSV files (component specimenBoard mismatchPct verdict notes)')
    ap.add_argument('--out', type=pathlib.Path, default=OUT)
    args = ap.parse_args()

    components, sources = {}, []
    for path in args.tsv:
        rows, found = read_tsv(path)
        sources.append({'file': str(path), 'found': found, 'rows': len(rows)})
        components.update(rows)
        if not found:
            print('not found, treated as empty:', path)

    counts = {'match': 0, 'differs': 0, 'none': 0}
    for c in components.values():
        counts[c['kind']] += 1
    out = {
        'generated': datetime.datetime.now().astimezone().isoformat(timespec='minutes'),
        'sources': sources,
        'how': 'Per component the match of the live component against the board that draws its specimen, from the '
               'COMP lane TSV (scripts/screens/component_status.py). A component without a row is not measured yet.',
        'counts': counts,
        'components': dict(sorted(components.items())),
    }
    args.out.write_text(json.dumps(out, indent=1, ensure_ascii=False) + '\n', encoding='utf-8')
    print('wrote', args.out, '(%d components: %d match, %d differ, %d undecided)' % (
        len(components), counts['match'], counts['differs'], counts['none']))


if __name__ == '__main__':
    main()
