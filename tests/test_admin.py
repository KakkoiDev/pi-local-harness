"""Task 159: harness/admin.py, the console's backend (plan 158): read the harness's state as plain data, from the live
services when they run and from the data folder otherwise, for slash commands, model tools and scripts."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:  # run as tests.<module> from the repository root
    from tests import isolation  # noqa: F401
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from harness import admin
from harness.documents import DocumentStore
from harness.markdown_records import write_record


class AdminTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.data = (Path(self.temp.name) / 'data').resolve(); self.data.mkdir()
        (self.data / 'config.json').write_text(json.dumps({'effort': 'medium'}))
        self.project = DocumentStore(self.data).create_project('Demo')
        events = [
            {'id': 1, 'timestamp': '2026-10-14T10:00:00+09:00', 'phase': 'gate', 'outcome': 'ALLOW', 'tool': 'execute_command', 'args': {'command': 'ls'}, 'reason': '', 'source': 'web', 'cwd': '/x'},
            {'id': 2, 'timestamp': '2026-10-14T10:01:00+09:00', 'phase': 'gate', 'outcome': 'BLOCK', 'tool': 'execute_command', 'args': {'command': 'rm -rf /'}, 'reason': 'Destructive shell guard', 'source': 'terminal', 'cwd': '/x'},
            {'id': 3, 'timestamp': '2026-10-14T10:02:00+09:00', 'phase': 'audit', 'outcome': 'VERIFIED', 'tool': 'execute_command', 'args': {'command': 'ls'}, 'reason': '', 'source': 'web', 'cwd': '/x'},
        ]
        (self.data / 'gate-events.jsonl').write_text(''.join(json.dumps(event) + '\n' for event in events))
        write_record(self.data / 'activity' / ('a' * 32 + '.md'), {'id': 'a' * 32, 'project': self.project, 'chat': 'c', 'data': {'message': 'Fix the badge'}, 'created': '2026-10-14T10:00:00+09:00', 'status': 'failed', 'progress': 'Pi exited', 'text': '', 'thinking': ''}, '# Fix the badge\n\nStatus: **failed**\n')
        self.console = admin.Console(self.data, web_port=None)

    def test_paths_name_every_place_the_harness_keeps_data(self):
        paths = self.console.paths()
        for key in ['data', 'config', 'model', 'projects', 'activity', 'gate_events', 'comments', 'trash']:
            self.assertIn(key, paths)
        self.assertEqual(paths['config'], str(self.data / 'config.json'))

    def test_config_is_the_file_with_defaults_and_an_explanation_per_key(self):
        config = self.console.config()
        self.assertEqual(config['values']['effort'], 'medium'); self.assertEqual(config['values']['web_port'], 3000, 'defaults filled in')
        self.assertTrue(all(config['explain'].get(key) for key in config['values']), 'every key is explained')

    def test_gate_reads_the_history_newest_first_and_filters(self):
        self.assertEqual([event['id'] for event in self.console.gate(10)], [3, 2, 1])
        self.assertEqual([event['id'] for event in self.console.gate(10, blocked=True)], [2], 'blocked: gate checks that did not allow')
        self.assertEqual(self.console.gate_event(2)['reason'], 'Destructive shell guard')

    def test_queue_and_job_read_the_activity_records_when_the_services_are_down(self):
        jobs = self.console.queue()
        self.assertEqual([(job['id'], job['status'], job['message']) for job in jobs], [('a' * 32, 'failed', 'Fix the badge')])
        self.assertEqual(self.console.queue('running'), [])
        self.assertIn('Status: **failed**', self.console.job('a' * 32)['markdown'])
        with self.assertRaisesRegex(ValueError, 'No request'): self.console.job('b' * 32)

    def test_status_and_doctor_say_what_is_wrong_and_what_to_do(self):
        status = self.console.status()
        self.assertFalse(status['services']['web']); self.assertEqual(status['queue']['failed'], 1); self.assertEqual(status['data'], str(self.data))
        checks = {check['check']: check for check in self.console.doctor()}
        self.assertFalse(checks['Ollama']['ok']); self.assertTrue(checks['Ollama']['fix'], 'a failing check says what to do')
        self.assertTrue(checks['Data folder']['ok'])
        lock = self.data / '.agent-lock'; lock.write_text(json.dumps({'pid': 999999999}))
        self.assertFalse({check['check']: check for check in self.console.doctor()}['Agent lock']['ok'], 'a lock held by a process that is gone')

    def test_the_command_line_prints_tables_and_raw_json(self):
        run = lambda *args: subprocess.run([sys.executable, '-m', 'harness.admin', *args, '--data', str(self.data)], capture_output=True, text=True, timeout=30)
        table = run('gate', '2')
        self.assertEqual(table.returncode, 0, table.stderr); self.assertIn('BLOCK', table.stdout); self.assertIn('rm -rf /', table.stdout)
        raw = run('gate', '2', '--json')
        self.assertEqual([event['id'] for event in json.loads(raw.stdout)], [3, 2])
        self.assertEqual(run('help').returncode, 0)
        unknown = run('nonsense'); self.assertNotEqual(unknown.returncode, 0); self.assertIn('Unknown command', unknown.stderr)

    def test_every_command_is_listed_in_the_console_guide(self):
        guide = Path('harness/CONSOLE.md').read_text()
        for name in admin.COMMANDS:
            self.assertIn(f'`/{name}', guide, f'/{name} is documented in harness/CONSOLE.md')


if __name__ == '__main__':
    unittest.main()
