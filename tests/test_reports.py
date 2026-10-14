"""Plan 184, part 1: every incident is reported in <data>/reports.jsonl, for the later analysis; /reports reads them."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:  # run as tests.<module> from the repository root
    from tests import isolation  # noqa: F401
import json
import tempfile
import unittest
from pathlib import Path

from harness import reports, admin
from gate.engine import GateEngine
from gate.ledger import ProposalLedger


class ReportsTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.data = Path(self.temp.name)

    def test_a_report_is_one_json_line_with_time_kind_and_detail(self):
        reports.report(self.data, 'wake-up', 'Continue: not verified', request='a' * 32, project='p1')
        line = json.loads((self.data / 'reports.jsonl').read_text())
        self.assertEqual((line['kind'], line['detail'], line['request'], line['project']), ('wake-up', 'Continue: not verified', 'a' * 32, 'p1'))
        self.assertIn('time', line)

    def test_gate_reports_each_rule_that_sent_something_back(self):
        ledger = ProposalLedger(GateEngine('', str(self.data / 'audit.log')), events_file=self.data / 'gate-events.jsonl')
        ledger.propose('execute_command', {'command': 'echo x >> ROADMAP.md'}, 'admin', cwd=str(self.data))
        ledger.propose('execute_command', {'command': 'ls'}, 'admin', cwd=str(self.data))
        lines = [json.loads(line) for line in (self.data / 'reports.jsonl').read_text().splitlines()]
        self.assertEqual([(line['kind'], line['rule']) for line in lines], [('rule', 'G-008')], 'only what was sent back')

    def test_the_console_counts_them_by_kind_and_lists_the_latest(self):
        for kind in ('rule', 'rule', 'gate-failed', 'stopped'): reports.report(self.data, kind, f'{kind} detail')
        value, text = admin.run(admin.Console(self.data), 'reports', [])
        self.assertEqual(value['counts'], {'rule': 2, 'gate-failed': 1, 'stopped': 1})
        self.assertIn('── Reports', text); self.assertIn('stopped detail', text)
        self.assertIn('reports', admin.COMMANDS)


if __name__ == '__main__':
    unittest.main()
