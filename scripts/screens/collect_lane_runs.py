#!/usr/bin/env python3
"""Collect one measurement round that the lanes ran in their own directories into one COMPDIFF run.

    python3 scripts/screens/collect_lane_runs.py r31 \
        --lanes '/path/R20/DQ-L*/m/{run}' --out /path/COMPDIFF/runs/r31

Since r25 every lane measures its own boards with compdiff into a directory of its own: one
<Board>.json per board (plus <Board>-board.png, <Board>-live.png and <Board>.md). build_status.py
reads one run directory per round with a verdicts.tsv, so this script makes that directory:

- every <Board>.json under the lane directories that names a board in preview/screens/screens.json,
  whose file name is exactly its board name (variants such as DqTaak-oldroute.json are left out);
- when two lanes measured the same board, the one with the latest measuredAt (the lane's final run);
- copied with its pngs and .md into --out, which is emptied of earlier board files first;
- then scripts/screens/compdiff/verdict.mjs writes verdicts.tsv and verdicts.md there, in the header
  build_status.py expects (board verdict failing components not_measured data_unpaired failing_detail).

--no-verdict skips the last step. The script prints what it took from where.
"""
import argparse
import glob
import json
import pathlib
import shutil
import subprocess
import sys

REPO = pathlib.Path(__file__).resolve().parents[2]
SCREENS = REPO / 'preview' / 'screens' / 'screens.json'
VERDICT = REPO / 'scripts' / 'screens' / 'compdiff' / 'verdict.mjs'
COMPANIONS = ('-board.png', '-live.png', '.md')


def known_boards(path=SCREENS):
    """The board keys in screens.json."""
    return set(json.loads(pathlib.Path(path).read_text())['boards'])


def pick(lane_dirs, boards):
    """{board: path of its final measurement} over the lane directories."""
    chosen = {}
    for d in lane_dirs:
        for f in sorted(pathlib.Path(d).glob('*.json')):
            try:
                data = json.loads(f.read_text())
            except (ValueError, OSError):
                continue
            board = data.get('board') if isinstance(data, dict) else None
            if not board or board not in boards or f.stem != board:
                continue
            at = str(data.get('measuredAt') or '')
            if board not in chosen or at > chosen[board][0]:
                chosen[board] = (at, f)
    return {b: f for b, (_, f) in chosen.items()}


def collect(run, lanes, out, boards, verdict=True):
    """Fill `out` with the round's final measurements; return {board: source json}."""
    lane_dirs = sorted(glob.glob(lanes.format(run=run)))
    if not lane_dirs:
        sys.exit(f'no lane directories match {lanes.format(run=run)}')
    chosen = pick(lane_dirs, boards)
    out = pathlib.Path(out)
    out.mkdir(parents=True, exist_ok=True)
    for f in out.iterdir():
        if f.is_file() and (f.suffix in ('.json', '.png', '.md', '.tsv')):
            f.unlink()
    for board, src in sorted(chosen.items()):
        shutil.copy2(src, out / src.name)
        for suffix in COMPANIONS:
            companion = src.with_name(board + suffix)
            if companion.exists():
                shutil.copy2(companion, out / companion.name)
    if verdict and chosen:
        subprocess.run(['node', str(VERDICT), str(out)], check=True)
    return chosen


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('run', help='round name, such as r31')
    ap.add_argument('--lanes', required=True, help="glob of the lanes' run directories, with {run}")
    ap.add_argument('--out', required=True, help='the combined run directory to write')
    ap.add_argument('--no-verdict', action='store_true')
    a = ap.parse_args()
    chosen = collect(a.run, a.lanes, a.out, known_boards(), verdict=not a.no_verdict)
    for board, src in sorted(chosen.items()):
        print(f'{board}\t{src}')
    print(f'{a.run}: {len(chosen)} boards into {a.out}')


if __name__ == '__main__':
    main()
