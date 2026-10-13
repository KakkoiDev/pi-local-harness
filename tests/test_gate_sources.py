"""Task 129: Gate checks know their project folder and whether they came from the web workbench or terminal Pi."""
import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
import tempfile
import unittest
from pathlib import Path

from gate.engine import GateEngine
from gate.ledger import ProposalLedger

ROOT = Path(__file__).resolve().parent.parent


class GateSourceTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.ledger = ProposalLedger(GateEngine(str(ROOT / 'specs/judges.md'), str(Path(self.temp.name) / 'audit.log')))

    def test_events_keep_folder_and_source_through_the_audit(self):
        allowed = self.ledger.propose('execute_command', {'command': 'ls'}, 'admin', cwd='/work/app', tool_call_id='t1', source='web')
        self.ledger.complete(allowed['proposal_id'], 'execute_command', {'command': 'ls'}, 'out', 0)
        self.ledger.propose('execute_command', {'command': 'rm -rf /'}, 'admin', cwd='/work/other', tool_call_id='t2', source='terminal')
        events = self.ledger.recent_events()
        self.assertEqual([(event['phase'], event['cwd'], event['source']) for event in events],
                         [('gate', '/work/app', 'web'), ('audit', '/work/app', 'web'), ('gate', '/work/other', 'terminal')])

    def test_checks_survive_a_restart(self):
        events = Path(self.temp.name) / 'gate-events.jsonl'; engine = GateEngine(str(ROOT / 'specs/judges.md'), str(Path(self.temp.name) / 'audit.log'))
        first = ProposalLedger(engine, events_file=events)
        first.propose('execute_command', {'command': 'ls'}, 'admin', cwd='/work/app', source='web')
        restarted = ProposalLedger(engine, events_file=events)
        self.assertEqual([(event['phase'], event['cwd']) for event in restarted.recent_events()], [('gate', '/work/app')])
        restarted.propose('execute_command', {'command': 'pwd'}, 'admin', cwd='/work/app', source='web')
        self.assertEqual([event['id'] for event in restarted.recent_events()], [1, 2], 'ids keep counting')

    def test_web_view_maps_folders_to_projects_and_counts_today(self):
        from harness.web_chat import WebChat
        chat = WebChat(Path(self.temp.name) / 'chats', 1, 2, data_root=Path(self.temp.name) / 'data'); self.addCleanup(chat.close)
        parent = Path(self.temp.name) / 'code'; parent.mkdir()
        project = chat.documents.create_project('Shop', str(parent)); chat.ledger = self.ledger
        self.ledger.propose('execute_command', {'command': 'ls'}, 'admin', cwd=str(parent / 'Shop' / 'src'), source='web')
        self.ledger.propose('execute_command', {'command': 'rm -rf /'}, 'admin', cwd='/elsewhere', source='terminal')
        events = chat.gate_events()
        self.assertEqual([(event['project'], event['from']) for event in events], [(project, 'Web'), (None, 'Terminal')])
        self.assertEqual(chat.workspace()['gate'], {'today': 2, 'blocked_today': 1})


if __name__ == '__main__':
    unittest.main()
