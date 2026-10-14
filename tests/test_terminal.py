"""Task 171: console output as the TerminalOutput card draws it. tests/fixtures/terminal-views.json is the contract
both renderers meet (this one, plain text; harness/terminal-render.mjs, checked by tests/harness/terminal-render.test.mjs)."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:  # run as tests.<module> from the repository root
    from tests import isolation  # noqa: F401
import json
import unittest
from pathlib import Path

from harness import terminal

CASES = json.loads(Path('tests/fixtures/terminal-views.json').read_text())


class TerminalTest(unittest.TestCase):
    def test_the_fixtures(self):
        for case in CASES:
            self.assertEqual(terminal.plain(case['view'], case['width'], ascii=case.get('ascii', False)), case['plain'], (case['view'].get('title'), case['width']))

    def test_the_shape_follows_the_card(self):
        queue = next(case for case in CASES if case['view'].get('title') == 'Queue' and case['view']['parts'][0]['rows'] and case['width'] == 100)['plain'].splitlines()
        self.assertTrue(queue[0].startswith('── Queue') and queue[0].endswith('1 running · 2 need attention'), 'title rule with the summary at the right')
        self.assertTrue(set(queue[2].strip()) == {'═'}, '═ under the table header only')
        self.assertIn('PROJECT', queue[1]); self.assertIn('f954b438', queue[3])
        narrow = next(case for case in CASES if case['view'].get('title') == 'Queue' and case['view']['parts'][0]['rows'] and case['width'] == 60)['plain']
        self.assertNotIn('PROJECT', narrow, 'under 80 columns, PROJECT then ID drop'); self.assertNotIn('f954b438', narrow)
        self.assertTrue(all(len(line) <= 60 for line in narrow.splitlines()), 'nothing wider than the terminal')
        status = next(case for case in CASES if case.get('ascii'))['plain']
        self.assertNotIn('✓', status); self.assertIn('ok Running', status, 'ASCII fallback for terminals without UTF-8')


if __name__ == '__main__':
    unittest.main()
