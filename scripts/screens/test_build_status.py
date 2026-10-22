#!/usr/bin/env python3
"""Tests for build_status.py: inventory TSVs and COMPDIFF runs as sources.

    python3 -m unittest scripts/screens/test_build_status.py
"""
import json
import os
import pathlib
import subprocess
import sys
import tempfile
import unittest

SCRIPT = pathlib.Path(__file__).resolve().parent / 'build_status.py'
HEAD = 'board\tverdict\tfailing\tcomponents\tnot_measured\tdata_unpaired\tfailing_detail\n'


def write_run(root, name, rows, measured_at):
    d = root / name
    d.mkdir()
    lines = [HEAD] + ['\t'.join(str(c) for c in r) + '\n' for r in rows]
    (d / 'verdicts.tsv').write_text(''.join(lines), encoding='utf-8')
    for r in rows:
        (d / f'{r[0]}.json').write_text(json.dumps({'board': r[0], 'url': f'/apps/x/{r[0].lower()}', 'measuredAt': measured_at}), encoding='utf-8')
    return d


class BuildStatusTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = pathlib.Path(self.tmp.name)
        boards = {'DqZaken': 'dossiq', 'DqZaak': 'dossiq', 'DqTaken': 'dossiq', 'Contact': 'portaliq'}
        self.screens = self.root / 'screens.json'
        self.screens.write_text(json.dumps({'boards': {n: {'app': a} for n, a in boards.items()}}), encoding='utf-8')
        inv = self.root / 'INV-Dq'
        inv.mkdir()
        self.tsv = inv / 'inventory.tsv'
        self.tsv.write_text('board\tkind\troute\tstatus\tmismatchPct\tnotes\n'
                            'DqZaken\tpage\t/apps/dossiq/zaken\tbuilt\t4.2\tlayout match\n'
                            'DqZaak\tpage\t/apps/dossiq/zaak\tpartial\t12\tno layout match\n'
                            'DqTaken\tpage\t-\tmissing\t-\tno page\n', encoding='utf-8')
        self.old = write_run(self.root, 'r1', [
            ('DqZaken', 'NO-MATCH', 3, 10, 0, 0, 'card: y +20 | button "Opslaan": missing on live | button "X": extra on live'),
            ('DqZaak', 'NO-MATCH', 8, 12, 1, 0, 'tabs: y -70'),
        ], '2026-10-19T20:00:00.000Z')
        self.new = write_run(self.root, 'r2', [
            ('DqZaken', 'MATCH', 0, 10, 0, 0, ''),
            ('DqZaak', 'NO-MATCH', 5, 12, 0, 0, 'tabs: y -70'),
            ('Retired', 'NO-MATCH', 1, 1, 0, 0, 'card: missing on live'),
        ], '2026-10-21T01:00:00.000Z')
        self.out = self.root / 'out.json'

    def tearDown(self):
        self.tmp.cleanup()

    def run_script(self, *args):
        res = subprocess.run([sys.executable, str(SCRIPT), *map(str, args), '--screens', str(self.screens), '--out', str(self.out)],
                             capture_output=True, text=True, env={**os.environ, 'PYTHONDONTWRITEBYTECODE': '1'})
        self.assertEqual(res.returncode, 0, res.stderr)
        return json.loads(self.out.read_text(encoding='utf-8')), res.stderr

    def test_inventory_only_still_works(self):
        d, _ = self.run_script(self.tsv)
        self.assertTrue(d['boards']['DqZaken']['layoutMatch'])
        self.assertEqual(d['boards']['DqTaken']['status'], 'missing')
        self.assertNotIn('compdiff', d)
        self.assertEqual(d['apps']['Dq']['layoutMatch'], 1)

    def test_newest_run_wins_whatever_the_argument_order(self):
        d, err = self.run_script(self.tsv, '--compdiff', self.new, '--compdiff', self.old)
        zaken, zaak = d['boards']['DqZaken'], d['boards']['DqZaak']
        self.assertEqual((zaken['run'], zaken['runDate']), ('r2', '2026-10-21T01:00:00.000Z'))
        self.assertEqual(zaken['verdict'], 'MATCH')
        self.assertTrue(zaken['layoutMatch'])
        self.assertEqual(zaken['status'], 'built')
        self.assertEqual(zaken['mismatchPct'], 0.0)
        self.assertEqual(zaak['verdict'], 'NO-MATCH')
        self.assertEqual(zaak['failing'], 5)
        self.assertEqual(zaak['status'], 'partial', 'a partial board stays partial until it matches')
        self.assertEqual(zaak['route'], '/apps/x/dqzaak')
        self.assertEqual(d['boards']['DqTaken']['status'], 'missing', 'boards no run measured keep their inventory row')
        self.assertNotIn('Retired', d['boards'])
        self.assertIn('Retired', err)

    def test_mismatch_pct_counts_items_extra_on_live(self):
        d, _ = self.run_script('--compdiff', self.old)
        # 3 failing of 10 components plus 1 item extra on live
        self.assertEqual(d['boards']['DqZaken']['mismatchPct'], 27.3)
        self.assertEqual(d['boards']['DqZaken']['mismatchBasis'], 'components')

    def test_summary_per_app_with_trend(self):
        d, _ = self.run_script(self.tsv, '--compdiff', self.old, '--compdiff', self.new)
        c = d['compdiff']
        self.assertEqual([r['id'] for r in c['runs']], ['r1', 'r2'])
        dq = c['apps']['dossiq']
        self.assertEqual((dq['boards'], dq['measured'], dq['match'], dq['failing']), (3, 2, 1, 5))
        self.assertEqual(dq['lastRun']['id'], 'r2')
        self.assertEqual(dq['trend'], {'from': 'r1', 'fromDate': '2026-10-19T20:00:00.000Z', 'to': 'r2', 'toDate': '2026-10-21T01:00:00.000Z',
                                       'boards': 2, 'matchFrom': 0, 'matchTo': 1, 'failingFrom': 11, 'failingTo': 5})
        self.assertEqual(c['total'], {'boards': 3, 'measured': 2, 'match': 1, 'failing': 5})

    def test_no_trend_from_a_single_run(self):
        d, _ = self.run_script('--compdiff', self.new)
        self.assertIsNone(d['compdiff']['apps']['dossiq']['trend'])

    def test_each_board_keeps_its_history_oldest_first(self):
        d, _ = self.run_script(self.tsv, '--compdiff', self.new, '--compdiff', self.old)
        self.assertEqual(d['boards']['DqZaak']['history'], [
            {'run': 'r1', 'date': '2026-10-19T20:00:00.000Z', 'verdict': 'NO-MATCH', 'failing': 8},
            {'run': 'r2', 'date': '2026-10-21T01:00:00.000Z', 'verdict': 'NO-MATCH', 'failing': 5},
        ])
        self.assertNotIn('history', d['boards']['DqTaken'], 'a board no run measured has no history')


if __name__ == '__main__':
    unittest.main()
