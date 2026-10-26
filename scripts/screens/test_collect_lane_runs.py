#!/usr/bin/env python3
"""Tests for collect_lane_runs.py: one COMPDIFF run from the lanes' own measurement directories.

    python3 -m unittest scripts/screens/test_collect_lane_runs.py
"""
import json
import pathlib
import sys
import tempfile
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import collect_lane_runs as clr  # noqa: E402


def measure(lane, name, board, at, png=True):
    lane.mkdir(parents=True, exist_ok=True)
    (lane / f'{name}.json').write_text(json.dumps({'board': board, 'url': '/x', 'measuredAt': at}), encoding='utf-8')
    if png:
        (lane / f'{name}-board.png').write_bytes(b'png')
        (lane / f'{name}-live.png').write_bytes(b'png')


class CollectLaneRunsTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = pathlib.Path(self.tmp.name)
        self.boards = {'DqZaken', 'DqTaak', 'DqContracten'}
        measure(self.root / 'L1/m/r31', 'DqZaken', 'DqZaken', '2026-10-26T10:00:00Z')
        measure(self.root / 'L1/m/r31', 'DqTaak', 'DqTaak', '2026-10-26T10:05:00Z')
        measure(self.root / 'L1/m/r31', 'DqTaak-oldroute', 'DqTaak', '2026-10-26T11:00:00Z')
        measure(self.root / 'L2/m/r31', 'DqContracten', 'DqContracten', '2026-10-26T09:00:00Z')
        measure(self.root / 'L3/m/r31', 'DqContracten', 'DqContracten', '2026-10-26T12:00:00Z')
        measure(self.root / 'L3/m/r31', 'NotABoard', 'NotABoard', '2026-10-26T12:00:00Z')
        (self.root / 'L3/m/r31/zd.json').write_text('[1, 2]', encoding='utf-8')
        measure(self.root / 'L1/m/r30', 'DqZaken', 'DqZaken', '2026-10-25T10:00:00Z')

    def tearDown(self):
        self.tmp.cleanup()

    def run_collect(self, out):
        return clr.collect('r31', str(self.root / 'L*/m/{run}'), out, self.boards, verdict=False)

    def test_takes_each_board_once_from_its_final_measurement(self):
        chosen = self.run_collect(self.root / 'out')
        self.assertEqual(set(chosen), {'DqZaken', 'DqTaak', 'DqContracten'})
        self.assertEqual(chosen['DqContracten'], self.root / 'L3/m/r31/DqContracten.json')

    def test_leaves_out_variants_unknown_boards_and_other_json(self):
        chosen = self.run_collect(self.root / 'out')
        self.assertEqual(chosen['DqTaak'], self.root / 'L1/m/r31/DqTaak.json')
        self.assertNotIn('NotABoard', chosen)

    def test_copies_the_json_with_its_pngs_and_clears_earlier_files(self):
        out = self.root / 'out'
        out.mkdir()
        (out / 'Stale.json').write_text('{}', encoding='utf-8')
        self.run_collect(out)
        names = sorted(p.name for p in out.iterdir())
        self.assertNotIn('Stale.json', names)
        self.assertIn('DqContracten.json', names)
        self.assertIn('DqContracten-live.png', names)
        self.assertNotIn('DqTaak-oldroute.json', names)
        self.assertEqual(json.loads((out / 'DqContracten.json').read_text())['measuredAt'], '2026-10-26T12:00:00Z')

    def test_only_the_named_round(self):
        chosen = self.run_collect(self.root / 'out')
        self.assertTrue(all('/r31/' in str(p) for p in chosen.values()))


if __name__ == '__main__':
    unittest.main()
