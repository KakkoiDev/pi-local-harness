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
from unittest.mock import patch
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
        # Round 6: /queue shows the first 8 characters, and they are enough for /job; /queue all is everything.
        self.assertEqual(self.console.job('aaaaaaaa')['id'], 'a' * 32)
        write_record(self.data / 'activity' / ('aaaaaaab' + 'c' * 24 + '.md'), {'id': 'aaaaaaab' + 'c' * 24, 'project': self.project, 'chat': 'c', 'data': {'message': 'Other'}, 'created': '2026-10-14T11:00:00+09:00', 'status': 'completed', 'progress': '', 'text': '', 'thinking': ''}, '# Other\n')
        with self.assertRaisesRegex(ValueError, 'more than one request'): self.console.job('aaaaaaa')
        with self.assertRaisesRegex(ValueError, 'hexadecimal'): self.console.job('zz')
        self.assertEqual(len(self.console.queue('all')), 2)

    def test_status_and_doctor_say_what_is_wrong_and_what_to_do(self):
        status = self.console.status()
        self.assertFalse(status['services']['web']); self.assertEqual(status['queue']['failed'], 1); self.assertEqual(status['data'], str(self.data))
        checks = {check['check']: check for check in self.console.doctor()}
        self.assertFalse(checks['Ollama']['ok']); self.assertTrue(checks['Ollama']['fix'], 'a failing check says what to do')
        self.assertTrue(checks['Data folder']['ok'])
        lock = self.data / '.agent-lock'; lock.write_text(json.dumps({'pid': 999999999}))
        stale = {check['check']: check for check in self.console.doctor()}['Agent lock']
        self.assertTrue(stale['note'], 'task 177: a stale lock is a note, not a fix'); self.assertIn('clears itself when the next agent starts', stale['detail'])
        # Task 177 (round 7, item 3): a fix names an existing command that asks first.
        self.assertTrue(checks['Ollama']['fix'].startswith('/ollama restart'), checks['Ollama']['fix'])
        (self.data / 'config.json').write_text(json.dumps({'effort': 'loud'}))
        self.assertEqual({check['check']: check for check in self.console.doctor()}['Settings']['fix'], '/config set effort high')
        _, text = admin.run(self.console, 'doctor', [])
        self.assertIn('→ /ollama restart', text); self.assertIn('! note', text)

    def test_a_missing_config_is_fine_and_the_queue_names_projects(self):
        """Task 169: plh creates config.json with the defaults; the queue shows project names and short times."""
        (self.data / 'config.json').unlink()
        self.assertTrue({check['check']: check for check in self.console.doctor()}['Settings']['ok'])
        _, text = admin.run(self.console, 'queue', [])
        self.assertIn('Demo', text); self.assertIn('10:00', text); self.assertIn('✗ Failed', text)

    def test_the_command_line_prints_tables_and_raw_json(self):
        run = lambda *args: subprocess.run([sys.executable, '-m', 'harness.admin', *args, '--data', str(self.data)], capture_output=True, text=True, timeout=30)
        table = run('gate', '2')
        self.assertEqual(table.returncode, 0, table.stderr); self.assertIn('✗ Blocked', table.stdout); self.assertIn('── Gate', table.stdout); self.assertIn('rm -rf /', table.stdout)
        raw = run('gate', '2', '--json')
        self.assertEqual([event['id'] for event in json.loads(raw.stdout)], [3, 2])
        self.assertEqual(run('help').returncode, 0)
        unknown = run('nonsense'); self.assertNotEqual(unknown.returncode, 0); self.assertIn('Unknown command', unknown.stderr)

    def test_completions_offer_the_words_each_command_takes(self):
        """Task 171, T_Wayfinding: Tab completes model names, settings, guide topics and request ids."""
        words = lambda command: [value for value, _ in admin.completions(self.console, command)]
        self.assertIn('set silence_seconds', words('config')); self.assertIn('set effort', words('config'))
        self.assertIn('phone', words('guide')); self.assertEqual(len(words('guide')), len(admin.guide_topics()))
        self.assertIn('a' * 8, words('job')); self.assertIn('failed', words('queue'))
        self.assertIn('blocked', words('gate')); self.assertIn('set num_parallel', words('ollama'))
        self.assertTrue({'use', 'check', 'pull', 'remove'} <= {word.strip() for word in words('models')}, 'without Ollama, the subcommands')
        with patch('harness.admin.Console.models', return_value={'models': [{'id': 'qwen3:8b'}]}):
            levels = [value for value, _ in admin.completions(self.console, 'models') if value.startswith('use qwen3:8b ')]
        self.assertEqual(levels, ['use qwen3:8b off', 'use qwen3:8b low', 'use qwen3:8b medium', 'use qwen3:8b high'], 'task 177: the four levels Ollama knows')
        self.assertEqual(admin.completions(self.console, 'status'), [])
        run = subprocess.run([sys.executable, '-m', 'harness.admin', 'guide', '--complete', '--data', str(self.data)], capture_output=True, text=True, timeout=30)
        self.assertEqual(run.returncode, 0, run.stderr); self.assertIn(['phone', 'How do I use it from my phone or another device?'], json.loads(run.stdout))

    def test_every_command_is_listed_in_the_console_guide(self):
        guide = Path('harness/CONSOLE.md').read_text()
        for name in admin.COMMANDS:
            self.assertIn(f'`/{name}', guide, f'/{name} is documented in harness/CONSOLE.md')



class GuideTest(unittest.TestCase):
    """Task 167: "a readme or tutorial so that the pi harness can answer questions about how to use this tool"."""
    def test_the_guide_answers_by_topic_and_lists_its_questions(self):
        console = admin.Console(tempfile.mkdtemp())
        value, text = admin.run(console, 'guide', ['phone'])
        self.assertIn('Open on Phone', text); self.assertNotIn('How do I start it?', text, 'a question about it wins over a passing mention')
        _, text = admin.run(console, 'guide', ['model'])
        self.assertIn('/models use', text)
        _, text = admin.run(console, 'guide', ['zebra'])
        self.assertIn('Nothing in the guide matches “zebra”', text); self.assertIn('How do I open the workbench in the browser?', text, 'then the list of questions')
        _, text = admin.run(console, 'guide', [])
        self.assertIn('── Guide', text); self.assertIn('/guide phone', text)
        guide = Path('harness/GUIDE.md').read_text()
        for name in admin.COMMANDS:
            if name not in ('job',): self.assertIn(f'/{name}', guide, f'/{name} is in the guide')


class AdminChangeTest(unittest.TestCase):
    """Task 160: a change shows what it will do and runs only with yes; it is backed up, logged and can be undone."""
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.data = (Path(self.temp.name) / 'data').resolve(); self.data.mkdir()
        (self.data / 'config.json').write_text(json.dumps({'effort': 'high'}))
        self.console = admin.Console(self.data, web_port=None)

    def saved(self):
        return json.loads((self.data / 'config.json').read_text())

    def test_a_setting_changes_only_with_yes_and_is_backed_up_logged_and_undone(self):
        preview, _ = admin.run(self.console, 'config', ['set', 'effort', 'low'])
        self.assertTrue(preview['confirm']); self.assertEqual(preview['title'], 'Change effort?')
        self.assertIn('high → low', preview['detail']); self.assertEqual(self.saved()['effort'], 'high', 'nothing changes without yes')
        done, text = admin.run(self.console, 'config', ['set', 'effort', 'low'], yes=True)
        self.assertEqual(self.saved()['effort'], 'low'); self.assertIn('✓ effort is low. /undo goes back to high.', text)
        backups = list((self.data / 'backups').glob('*-config.json')); self.assertEqual(len(backups), 1)
        self.assertEqual(json.loads(backups[0].read_text())['effort'], 'high', 'the backup is the file before the change')
        log = [json.loads(line) for line in (self.data / 'admin-log.jsonl').read_text().splitlines()]
        self.assertEqual((log[-1]['command'], log[-1]['before'], log[-1]['after'], log[-1]['by']), ('config set effort low', 'high', 'low', 'person'))
        preview, _ = admin.run(self.console, 'undo', []); self.assertIn('config set effort low', preview['detail'])
        admin.run(self.console, 'undo', [], yes=True)
        self.assertEqual(self.saved()['effort'], 'high', '/undo restores the file')
        with self.assertRaisesRegex(ValueError, 'Nothing to undo'): admin.run(self.console, 'undo', [])
        (self.data / 'config.json').unlink()
        admin.run(self.console, 'config', ['set', 'effort', 'low'], yes=True); admin.run(self.console, 'undo', [], yes=True)
        self.assertFalse((self.data / 'config.json').exists(), 'a file the change created is set aside by undo')
        self.assertEqual(len(list((self.data / 'backups').glob('*-config.json.undone'))), 1, 'never deleted')

    def test_bad_values_are_refused_with_a_reason(self):
        for args, reason in [(['effort', 'turbo'], 'one of'), (['web_port', '99999'], 'port'), (['model', 'x'], 'pinned'),
                             (['colour', 'red'], 'Unknown setting'), (['remote_hosts', '["https://x"]'], 'bare names'), (['auto_update', 'maybe'], 'true or false')]:
            with self.assertRaisesRegex(ValueError, reason, msg=args): admin.run(self.console, 'config', ['set', *args], yes=True)
        self.assertEqual(self.saved(), {'effort': 'high'})

    def test_a_model_switch_needs_ollama_to_know_the_model(self):
        with self.assertRaisesRegex(ValueError, 'Ollama does not answer'): admin.run(self.console, 'models', ['use', 'qwen3:8b'], yes=True)

    def test_the_command_line_asks_before_changing(self):
        run = lambda *args: subprocess.run([sys.executable, '-m', 'harness.admin', *args, '--data', str(self.data)], capture_output=True, text=True, timeout=30)
        asked = run('config', 'set', 'effort', 'low')
        self.assertEqual(asked.returncode, 3, 'exit 3: a confirmation is needed'); self.assertIn('Run again with --yes', asked.stdout)
        self.assertEqual(self.saved()['effort'], 'high')
        self.assertEqual(run('config', 'set', 'effort', 'low', '--yes').returncode, 0); self.assertEqual(self.saved()['effort'], 'low')




class PublishAuditConsoleTest(unittest.TestCase):
    def test_audit_previews_before_running_commands_and_targets_the_project_folder(self):
        with tempfile.TemporaryDirectory() as directory:
            data=Path(directory)/'data';store=DocumentStore(data);project=store.create_project('Game')
            root=store.project_path(project);console=admin.Console(data)
            result={'ready':False,'task':'tasks/002-ready-to-publish.md','checks':[{'key':'types','passed':False,'exit_code':1,'command':'tsc -p .','output':'Type mismatch'}]}
            with patch('harness.audit.run',return_value=result) as run:
                preview,_=admin.build(console,'audit',[str(root)])
                self.assertTrue(preview['confirm']);run.assert_not_called()
                value,shape=admin.build(console,'audit',[str(root)],yes=True)
                self.assertFalse(value['ready']);self.assertEqual(run.call_args.args[0],root)
                self.assertIn('Type mismatch',str(shape))


if __name__ == '__main__':
    unittest.main()
