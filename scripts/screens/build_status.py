#!/usr/bin/env python3
"""Build preview/screens/build-status.json: how far each screen is built in its app and how well it matches.

    python3 scripts/screens/build_status.py INV-Dq/inventory.tsv LIVE-Dq/inventory.tsv ... \
        --compdiff COMPDIFF/runs/r19b --compdiff COMPDIFF/runs/dd1 ...

Every positional argument is a measurement TSV with the header
    board  kind  route  status  mismatchPct  notes
status is built, partial, missing, accepted, measured (or done) or "state-of <Board>"; mismatchPct is a number or "-".
A "measured" row is a live verdict: it marks the board built (or keeps it partial while the layout does not
match) and carries the new number and notes. Other statuses, such as baseline or invalid, are left out.

A file in a directory whose name starts with LIVE- holds live verdicts on builder branches. Its rows win
over every other row for the same board, whatever the argument order. Among files of the same kind the
later argument wins. Rows with status "-" carry no measurement and are left out, so the gallery shows
the board as not measured yet.

layoutMatch is true for status accepted or notes starting with "layout match", false for notes starting
with "no layout match" or "layout differs", and null otherwise. measuredOn is the branch named in the
notes ("[feature/x abc123]", "[round 2: branches]", "[branch]"), else development.

A --compdiff argument is a COMPDIFF run directory (scripts/screens/compdiff): its verdicts.tsv with the
header  board  verdict  failing  components  not_measured  data_unpaired  failing_detail  and one
<Board>.json per board (route and measuredAt). A run's date is the latest measuredAt of its boards, or
the mtime of verdicts.tsv. Runs are applied after every TSV, oldest first, so the newest run that
measured a board wins. A component verdict marks the board built (partial stays partial until it
matches), sets layoutMatch from MATCH or NO-MATCH, and records verdict, failing, components,
notMeasured, run and runDate. Its mismatchPct is the share of compared items that fail:
failing / (components + items extra on live), so it is a component share, not a pixel share
(mismatchBasis "components"). Boards not in screens.json are left out of a run with a warning.

The output's "compdiff" block holds per run and per app: boards measured, boards matching, failing
items, the last run, and the trend against the latest earlier run that measured some of the same
boards (counted over those shared boards only), plus the totals over all apps.

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

PREFIX = re.compile(r'^([A-Z][a-z])(?=[A-Z])')
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
    elif status in ('measured', 'done'):
        status = 'measured'
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


NOTE_ITEMS = 12


def extra_count(detail):
    return sum(1 for item in detail.split(' | ') if item.strip().endswith(': extra on live'))


def read_compdiff(rundir):
    """One COMPDIFF run: (run id, run date, {board: row}). Rows carry the board's verdict and counts."""
    rundir = pathlib.Path(rundir)
    tsv = rundir / 'verdicts.tsv'
    rows, dates = {}, []
    with open(tsv, newline='', encoding='utf-8') as fh:
        for row in csv.reader(fh, delimiter='\t', quoting=csv.QUOTE_NONE):
            if not row or row[0].strip() in ('', 'board') or len(row) < 4:
                continue
            board, verdict, failing, components = (c.strip() for c in row[:4])
            not_measured = row[4].strip() if len(row) > 4 else ''
            detail = row[6].strip() if len(row) > 6 else ''
            if verdict not in ('MATCH', 'NO-MATCH'):
                continue
            failing, components = int(failing or 0), int(components or 0)
            compared = components + extra_count(detail)
            meta = {}
            try:
                meta = json.loads((rundir / f'{board}.json').read_text(encoding='utf-8'))
            except (OSError, ValueError):
                pass
            if meta.get('measuredAt'):
                dates.append(meta['measuredAt'])
            items = [i for i in detail.split(' | ') if i]
            shown = '; '.join(items[:NOTE_ITEMS]) + (f'; and {len(items) - NOTE_ITEMS} more' if len(items) > NOTE_ITEMS else '')
            rows[board] = {
                'route': meta.get('url') or None,
                'verdict': verdict,
                'layoutMatch': verdict == 'MATCH',
                'failing': failing,
                'components': components,
                'notMeasured': int(not_measured) if not_measured.isdigit() else None,
                'mismatchPct': round(100 * failing / compared, 1) if compared else (0.0 if verdict == 'MATCH' else None),
                'mismatchBasis': 'components',
                'notes': (f'layout match: component-measured in run {rundir.name}, all {components} items pass'
                          if verdict == 'MATCH' else
                          f'no layout match: component-measured in run {rundir.name}, {failing} of {compared} items fail: {shown}'),
            }
    if dates:
        date = max(dates)
    else:
        date = datetime.datetime.fromtimestamp(tsv.stat().st_mtime, datetime.timezone.utc).isoformat(timespec='seconds')
    return rundir.name, date, rows


def run_info(rundir):
    try:
        line = (pathlib.Path(rundir) / 'RUN-INFO').read_text(encoding='utf-8').strip().splitlines()[0]
        return line.replace(str(pathlib.Path.home()), '~')[:400]
    except (OSError, IndexError):
        return None


def tally(rows):
    rows = list(rows)
    return {'measured': len(rows), 'match': sum(1 for r in rows if r['verdict'] == 'MATCH'),
            'failing': sum(r['failing'] for r in rows)}


def compdiff_summary(runs, boards, screens):
    """Per app and overall: the current COMPDIFF state, the last run and the trend between runs."""
    by_app = collections.defaultdict(list)
    for run in runs:
        for name in run['rows']:
            by_app[screens[name]['app']].append(run)
    drawn = collections.Counter(s.get('app') for s in screens.values())
    apps = {}
    for app in sorted(by_app):
        seen, app_runs = set(), []
        for run in by_app[app]:
            if run['id'] not in seen:
                seen.add(run['id'])
                app_runs.append(run)
        current = [b for b in boards.values() if b.get('app') == app and b.get('verdict')]
        a = {'app': app, 'boards': drawn[app], **tally(current), 'lastRun': {'id': app_runs[-1]['id'], 'date': app_runs[-1]['date']},
             'runs': [], 'trend': None}
        for run in app_runs:
            own = {n: r for n, r in run['rows'].items() if screens[n]['app'] == app}
            a['runs'].append({'id': run['id'], 'date': run['date'], **tally(own.values())})
        last = app_runs[-1]
        last_rows = {n: r for n, r in last['rows'].items() if screens[n]['app'] == app}
        for prev in reversed(app_runs[:-1]):
            shared = sorted(set(last_rows) & set(prev['rows']))
            if shared:
                was, now = tally(prev['rows'][n] for n in shared), tally(last_rows[n] for n in shared)
                a['trend'] = {'from': prev['id'], 'fromDate': prev['date'], 'to': last['id'], 'toDate': last['date'],
                              'boards': len(shared), 'matchFrom': was['match'], 'matchTo': now['match'],
                              'failingFrom': was['failing'], 'failingTo': now['failing']}
                break
        apps[app] = a
    total = {'boards': sum(a['boards'] for a in apps.values()),
             **{k: sum(a[k] for a in apps.values()) for k in ('measured', 'match', 'failing')}}
    return {
        'runs': [{'id': r['id'], 'date': r['date'], 'info': r['info'], 'apps': sorted({screens[n]['app'] for n in r['rows']}), **tally(r['rows'].values())} for r in runs],
        'apps': apps,
        'total': total,
    }


def source_name(path):
    return f'{path.parent.name}/{path.name}'


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('tsv', nargs='*', type=pathlib.Path, help='measurement TSV files')
    ap.add_argument('--compdiff', action='append', type=pathlib.Path, default=[], metavar='RUNDIR',
                    help='a COMPDIFF run directory with verdicts.tsv; repeat for more runs')
    ap.add_argument('--screens', type=pathlib.Path, default=SCREENS / 'screens.json', help=argparse.SUPPRESS)
    ap.add_argument('--out', type=pathlib.Path, default=OUT)
    args = ap.parse_args()

    if not args.tsv and not args.compdiff:
        ap.error('give at least one TSV or --compdiff run')
    screens = json.loads(args.screens.read_text(encoding='utf-8'))['boards']

    files = sorted(args.tsv, key=lambda p: p.resolve().parent.name.startswith('LIVE-'))
    boards, sources = {}, []
    for path in files:
        rows = read_tsv(path)
        live = path.resolve().parent.name.startswith('LIVE-')
        sources.append({'file': source_name(path), 'rows': len(rows), 'live': live})
        for name, r in rows.items():
            app = screens[name]['app'] if name in screens else None
            if r['status'] == 'measured':
                # A live verdict: the board is built and measured. Keep a partial status until the layout matches.
                prev = boards.get(name, {}).get('status')
                r = {**r, 'status': 'partial' if prev == 'partial' and not r['layoutMatch'] else 'built'}
            boards[name] = {'app': app, **r, 'source': source_name(path)}

    runs = []
    for rundir in args.compdiff:
        run_id, date, rows = read_compdiff(rundir)
        for name in sorted(n for n in rows if n not in screens):
            print(f'warning: {name} in run {run_id} is not a board in screens.json, left out', file=sys.stderr)
        rows = {n: r for n, r in rows.items() if n in screens}
        runs.append({'id': run_id, 'date': date, 'info': run_info(rundir), 'rows': rows})
        sources.append({'file': f'compdiff/{run_id}', 'rows': len(rows), 'live': True, 'date': date})
    runs.sort(key=lambda r: r['date'])
    for run in runs:
        for name, r in run['rows'].items():
            prev = boards.get(name, {})
            status = 'partial' if prev.get('status') == 'partial' and not r['layoutMatch'] else 'built'
            boards[name] = {'app': screens[name]['app'], 'kind': prev.get('kind'), **r,
                            'route': r['route'] or prev.get('route'), 'status': status,
                            'measuredOn': f'compdiff {run["id"]}', 'stateOf': None,
                            'run': run['id'], 'runDate': run['date'], 'source': f'compdiff/{run["id"]}'}

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
    if runs:
        out['compdiff'] = compdiff_summary(runs, boards, screens)
    args.out.write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print(f'{args.out.relative_to(REPO) if args.out.is_relative_to(REPO) else args.out}: {len(boards)} boards, '
          + ', '.join(f"{p} {a['layoutMatch']}/{a['boards']} match, {a['built']} built, {a['missing']} missing" for p, a in apps.items()))
    for app, a in out.get('compdiff', {}).get('apps', {}).items():
        print(f"compdiff {app}: {a['match']}/{a['measured']} match of {a['boards']} drawn, {a['failing']} failing, last run {a['lastRun']['id']}"
              + (f", trend {a['trend']['from']}->{a['trend']['to']} failing {a['trend']['failingFrom']}->{a['trend']['failingTo']}" if a['trend'] else ''))


if __name__ == '__main__':
    main()
