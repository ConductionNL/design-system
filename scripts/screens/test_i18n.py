#!/usr/bin/env python3
"""Tests for i18n.py extract: how strings move between _common.json and the board catalogues.

    python3 -m unittest scripts/screens/test_i18n.py
"""
import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from i18n import COMMON_MIN, plan  # noqa: E402


def screens(*keys):
    return {'boards': {k: {'app': k[:2].lower(), 'file': 'boards/%s.html' % k} for k in keys}}


class ExtractTest(unittest.TestCase):
    def test_common_min_is_three(self):
        self.assertEqual(COMMON_MIN, 3, 'the cases below draw three boards for a common string')

    def test_shared_string_used_by_fewer_boards_stays_common(self):
        data = screens('KqKluisBewerken', 'PlRapporten', 'DqZaak')
        per = {'KqKluisBewerken': ['Werk'], 'PlRapporten': ['Werk', 'Rapporten'], 'DqZaak': ['Zaak']}
        common_old = {'_comment': '', 'Werk': 'Work'}
        common, common_new, written = plan(data, per, common_old, {}, None)
        self.assertIn('Werk', common)
        self.assertEqual(common_new['Werk'], 'Work')
        self.assertNotIn('Werk', written['KqKluisBewerken'])
        self.assertNotIn('Werk', written['PlRapporten'])

    def test_shared_string_no_board_uses_is_dropped(self):
        data = screens('DqZaak')
        _, common_new, _ = plan(data, {'DqZaak': ['Zaak']}, {'Werkpakketten': 'Work packages'}, {}, None)
        self.assertNotIn('Werkpakketten', common_new)

    def test_string_that_becomes_common_keeps_its_translation(self):
        data = screens('AaEen', 'BbTwee', 'CcDrie')
        per = {'AaEen': ['Kaart'], 'BbTwee': ['Kaart'], 'CcDrie': ['Kaart']}
        olds = {'AaEen': {'Kaart': 'Map'}, 'BbTwee': {'Kaart': 'Map'}, 'CcDrie': {'Kaart': 'Card'}}
        _, common_new, written = plan(data, per, {}, olds, None)
        self.assertEqual(common_new['Kaart'], 'Map')
        self.assertNotIn('Kaart', written['AaEen'])
        self.assertEqual(written['CcDrie']['Kaart'], 'Card')

    def test_untranslated_board_entry_does_not_hide_the_new_common_value(self):
        data = screens('AaEen', 'BbTwee', 'CcDrie')
        per = {'AaEen': ['Werk'], 'BbTwee': ['Werk'], 'CcDrie': ['Werk']}
        olds = {'AaEen': {'Werk': 'Work'}, 'BbTwee': {'Werk': ''}}
        _, common_new, written = plan(data, per, {}, olds, None)
        self.assertEqual(common_new['Werk'], 'Work')
        self.assertNotIn('Werk', written['BbTwee'])

    def test_override_of_a_common_string_is_kept(self):
        data = screens('AaEen', 'BbTwee', 'CcDrie')
        per = {'AaEen': ['Kaart'], 'BbTwee': ['Kaart'], 'CcDrie': ['Kaart']}
        _, common_new, written = plan(data, per, {'Kaart': 'Map'}, {'CcDrie': {'Kaart': ''}}, None)
        self.assertEqual(common_new['Kaart'], 'Map')
        self.assertEqual(written['CcDrie']['Kaart'], '')

    def test_board_string_keeps_its_translation_and_others_are_new(self):
        data = screens('AaEen')
        _, _, written = plan(data, {'AaEen': ['Zaak', 'Nieuw']}, {}, {'AaEen': {'Zaak': 'Case', 'Weg': 'Gone'}}, None)
        self.assertEqual(written['AaEen']['Zaak'], 'Case')
        self.assertEqual(written['AaEen']['Nieuw'], '')
        self.assertNotIn('Weg', written['AaEen'])

    def test_only_named_apps_are_written(self):
        data = screens('AaEen', 'BbTwee')
        _, _, written = plan(data, {'AaEen': ['Zaak'], 'BbTwee': ['Zaak']}, {}, {}, {'aa'})
        self.assertEqual(list(written), ['AaEen'])


if __name__ == '__main__':
    unittest.main()
