#!/usr/bin/env python3
"""Whether flattened boards still match their sources.

    python3 scripts/screens/board_fresh.py DqTaak DqZaken            # compares with preview/screens/boards/<Key>.html
    python3 scripts/screens/board_fresh.py DqTaak --preview /tmp/x.html

Flattens each board in memory, as build.py does, and compares the result with the flattened file. Prints one JSON
object: {"<Key>": "fresh" | "stale" | "unknown"}. A board is stale when its source, or a board it imports, changed and
the board was not built again. Comparing content, not file or commit times, keeps a rebuild that wrote identical
output (and so committed nothing) from reading as stale. Needs python3 and node, not Chrome.
"""
import argparse
import contextlib
import io
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import build  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('keys', nargs='+')
    ap.add_argument('--preview', help='compare one board with this file instead of its preview')
    a = ap.parse_args()
    # build_index reports on stdout; only the verdict goes there.
    with contextlib.redirect_stdout(io.StringIO()):
        index = build.build_index()
        fls = build.flatteners(index)
    out = {}
    for key in a.keys:
        board = index['boards'].get(key)
        if not board:
            out[key] = 'unknown'
            continue
        path = pathlib.Path(a.preview) if a.preview else build.OUT / board['file']
        if not path.exists():
            out[key] = 'stale'
            continue
        out[key] = 'fresh' if build.render_one(fls[board['set']], board) == path.read_text() else 'stale'
    print(json.dumps(out))


if __name__ == '__main__':
    main()
