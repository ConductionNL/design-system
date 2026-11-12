#!/usr/bin/env python3
"""Tests for capabilities.py: reading an openspec screens.md.

    python3 -m unittest scripts/screens/test_capabilities.py
"""
import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from capabilities import parse_screens_md  # noqa: E402

BY_NAME = {'DqZaak': 'dossiq/DqZaak', 'DqContacten': 'dossiq/DqContacten', 'OrFlowKop': 'openregister/OrFlowKop',
           'PtVerkeer': 'portaliq/PtVerkeer', 'Contact': 'portaliq/Contact', 'DqSubsidie': 'dossiq/DqSubsidie'}
GALLERY = set(BY_NAME.values()) | {'wilgenboom/Detail', 'vaartveld/LqBord'}


def parse(text):
    return parse_screens_md(text, BY_NAME, GALLERY)


class ScreensMdTest(unittest.TestCase):
    def test_board_url(self):
        boards, reason, _ = parse('# Screens\n\n- dossiq/DqZaak de zaak '
                                  'https://identity.conduction.nl/screens/board?id=dossiq/DqZaak\n\n'
                                  'Components: CnDetailPage, CnTabs\n')
        self.assertEqual(boards, ['dossiq/DqZaak'])
        self.assertIsNone(reason)

    def test_app_board_without_url(self):
        self.assertEqual(parse('- dossiq/DqContacten: the list of contacts\n')[0], ['dossiq/DqContacten'])

    def test_short_names(self):
        boards = parse('Boards in design-system `screens-src/zuiddrecht`:\nDqZaak, OrFlowKop, NotABoard.\n')[0]
        self.assertEqual(boards, ['dossiq/DqZaak', 'openregister/OrFlowKop'])

    def test_single_word_board_name_needs_its_app(self):
        self.assertEqual(parse('- Contact the team for help\n')[0], [])
        self.assertEqual(parse('- portaliq/Contact the contact page\n')[0], ['portaliq/Contact'])

    def test_old_app_name_resolves_through_short_name(self):
        self.assertEqual(parse('- procest/DqZaak de zaak\n')[0], ['dossiq/DqZaak'])

    def test_school_board_counts_by_full_id_only(self):
        boards, _, notes = parse('- wilgenboom/Detail https://identity.conduction.nl/screens/board?id=wilgenboom/Detail\n'
                                 '- wilgenboom/Nergens https://identity.conduction.nl/screens/board?id=wilgenboom/Nergens\n')
        self.assertEqual(boards, ['wilgenboom/Detail'])
        self.assertEqual(notes, ['screens.md board wilgenboom/Nergens is not in the gallery'])

    def test_reason_forms(self):
        for line, want in [
            ('- No screen: engineering work with no screen of its own.', 'engineering work with no screen of its own.'),
            ('- No screen of its own: a rule in the token layer.', 'No screen of its own: a rule in the token layer.'),
            ('None. This change adds no screen.', 'None. This change adds no screen.'),
            ('- From change `shell-catalogue`: No screen: a data file.', 'a data file.'),
            ('- From change `x`: draws nothing new: one more entry.', 'draws nothing new: one more entry.'),
            ('- portaliq has no board of its own for row ana-daily-rollups: the figures show on PtVerkeer',
             'portaliq has no board of its own for row ana-daily-rollups: the figures show on PtVerkeer'),
            ('- buildiq: no board for row logic-task-substitute; it has no buildiq screen of its own',
             'buildiq: no board for row logic-task-substitute; it has no buildiq screen of its own'),
            ('- pipelinq/plat-restore-deleted: no pipelinq screen; it comes back through Open Register restore',
             'pipelinq/plat-restore-deleted: no pipelinq screen; it comes back through Open Register restore'),
        ]:
            with self.subTest(line=line):
                self.assertEqual(parse('# Screens\n\n' + line + '\n'), ([], want, []))

    def test_board_wins_over_reason(self):
        boards, reason, _ = parse('- dossiq/DqZaak de zaak\n- portaliq has no board of its own for row x: none\n')
        self.assertEqual(boards, ['dossiq/DqZaak'])
        self.assertIsNone(reason)

    def test_backlog_is_not_a_reason(self):
        boards, reason, notes = parse('- Design backlog: OcOogsten (decision 157)\n')
        self.assertEqual((boards, reason), ([], None))
        self.assertEqual(notes, ['screen not drawn yet: Design backlog: OcOogsten (decision 157)'])

    def test_backlog_board_counts_once_drawn(self):
        self.assertEqual(parse('- dossiq/DqSubsidie not drawn yet, gap list b\n')[0], ['dossiq/DqSubsidie'])

    def test_empty(self):
        self.assertEqual(parse(None), ([], None, []))
        self.assertEqual(parse('# Screens\n\nComponents: CnDetailPage\n'), ([], None, []))


if __name__ == '__main__':
    unittest.main()
