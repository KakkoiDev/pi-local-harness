"""Task 311: Gate-allowed test runs execute under sandbox-exec: writes only in the project, TMPDIR and the toolchain
caches, no network, no workbench data or secrets, a scrubbed environment; the person, never Pi, may widen the network."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:  # run as tests.<module> from the repository root
    from tests import isolation  # noqa: F401
import os
import socket
import subprocess
import sys
import tempfile
import textwrap
import unittest
from pathlib import Path

from gate import sandbox

HERE = Path(__file__).resolve().parents[1]


@unittest.skipUnless(sandbox.available(), 'sandbox-exec is macOS only (Linux: bubblewrap, noted in gate/sandbox.py)')
class SandboxedTestRunTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.base = Path(os.path.realpath(self.temp.name))
        self.data = self.base / 'data'; (self.data / 'chats').mkdir(parents=True)
        (self.data / 'chats' / '.gate-token-x').write_text('the-token')
        self.project = self.base / 'project'; (self.project / 'tests').mkdir(parents=True); (self.project / '.git').mkdir()
        self.outside = self.base / 'outside.txt'

    def run_tests(self, source, env=None, network=None):
        (self.project / 'tests' / 'test_probe.py').write_text(textwrap.dedent(source))
        command = sandbox.wrap(f'{sys.executable} -B -m unittest tests.test_probe', self.project, self.data, network)
        return subprocess.run(command, shell=True, cwd=self.project, capture_output=True, text=True, timeout=120,
                              env={**os.environ, 'PI_HARNESS_TOKEN': 'the-token', 'GITHUB_TOKEN': 'gh-secret', **(env or {})})

    def test_normal_tests_pass_and_write_inside_the_project_and_tmpdir(self):
        done = self.run_tests('''
            import os, tempfile, unittest, pathlib
            class Probe(unittest.TestCase):
                def test_inside(self):
                    pathlib.Path('result.txt').write_text('ok')
                    with tempfile.TemporaryDirectory() as folder: pathlib.Path(folder, 'x').write_text('ok')
                    self.assertEqual(sorted(pathlib.Path('tests').glob('test_*.py'))[0].name, 'test_probe.py')
        ''')
        self.assertEqual(done.returncode, 0, done.stderr)
        self.assertEqual((self.project / 'result.txt').read_text(), 'ok')

    def test_a_test_cannot_write_outside_the_project_or_into_git(self):
        done = self.run_tests(f'''
            import unittest, pathlib
            class Probe(unittest.TestCase):
                def test_outside(self): pathlib.Path({str(self.outside)!r}).write_text('escaped')
                def test_hooks(self): pathlib.Path('.git/config').write_text('[core]\\nfsmonitor = evil')
        ''')
        self.assertNotEqual(done.returncode, 0)
        self.assertFalse(self.outside.exists(), 'nothing written outside the project')
        self.assertFalse((self.project / '.git' / 'config').exists(), 'never in .git')
        self.assertIn('Operation not permitted', done.stderr)
        self.assertIn('Project ▸ Test Sandbox', sandbox.refusal(done.stderr, done.returncode))

    def test_a_test_cannot_open_a_network_socket(self):
        listener = socket.socket(); listener.bind(('127.0.0.1', 0)); listener.listen(); self.addCleanup(listener.close)
        port = listener.getsockname()[1]
        source = f'''
            import socket, unittest
            class Probe(unittest.TestCase):
                def test_connect(self): socket.create_connection(('127.0.0.1', {port}), timeout=2).close()
        '''
        self.assertNotEqual(self.run_tests(source).returncode, 0, 'no network, not even this computer')
        self.assertEqual(self.run_tests(source, network='local').returncode, 0, 'the person widened it to this computer')

    def test_a_test_cannot_read_the_token_or_the_workbench_data(self):
        done = self.run_tests(f'''
            import os, unittest, pathlib
            class Probe(unittest.TestCase):
                def test_environment(self):
                    self.assertNotIn('PI_HARNESS_TOKEN', os.environ); self.assertNotIn('GITHUB_TOKEN', os.environ)
                    self.assertFalse([key for key in os.environ if key.startswith('PI_')])
                def test_token_file(self):
                    with self.assertRaises(PermissionError): pathlib.Path({str(self.data / 'chats' / '.gate-token-x')!r}).read_text()
        ''', env={'PI_AGENT_DATA': str(self.data)})
        self.assertEqual(done.returncode, 0, done.stderr)

    def test_a_project_inside_the_data_folder_is_still_its_own(self):
        self.project = self.data / 'projects' / 'inside'; (self.project / 'tests').mkdir(parents=True)
        done = self.run_tests('''
            import unittest, pathlib
            class Probe(unittest.TestCase):
                def test_inside(self): pathlib.Path('result.txt').write_text('ok')
        ''')
        self.assertEqual(done.returncode, 0, done.stderr)


@unittest.skipUnless(sandbox.available(), 'sandbox-exec is macOS only')
class GateSandboxesAllowedTestRunsTest(unittest.TestCase):
    def test_gate_hands_back_the_sandboxed_command_and_says_what_it_refused(self):
        from unittest.mock import patch
        from gate.engine import GateEngine
        from gate.ledger import ProposalLedger
        with tempfile.TemporaryDirectory() as folder, patch('gate.phases.refusal', return_value=None):
            root = Path(os.path.realpath(folder)); (root / 'tasks').mkdir(); (root / 'ROADMAP.md').write_text('# Roadmap\n')
            data = root / 'data'; data.mkdir()
            ledger = ProposalLedger(GateEngine('', str(data / 'audit.log')), events_file=data / 'gate-events.jsonl')
            args = {'command': 'python3 -m unittest'}
            allowed = ledger.propose('execute_command', args, 'admin', cwd=str(root), request='r')
            self.assertEqual(allowed['outcome'], 'ALLOW')
            self.assertIn('sandbox-run.sh', allowed['command']); self.assertTrue(allowed['command'].endswith("'python3 -m unittest'"))
            self.assertEqual(allowed['sandbox'], 'none')
            event = ledger.complete(allowed['proposal_id'], 'execute_command', args, "PermissionError: [Errno 1] Operation not permitted: '/x'", 1)
            self.assertEqual(event.status, 'EXECUTION_FAILED', 'the allowed command is audited, not the wrapper: no drift')
            self.assertIn('Test Sandbox', ledger.last_sandbox_refusal(allowed['proposal_id']))
            self.assertIn('Test Sandbox', ledger.last_note(allowed['proposal_id']), 'Pi is told too')
            reading = ledger.propose('execute_command', {'command': 'ls'}, 'admin', cwd=str(root), request='r')
            self.assertNotIn('command', reading, 'only test runs execute project code')


class SandboxRouteTest(unittest.TestCase):
    def test_only_the_persons_page_can_widen_the_sandbox(self):
        import http.server, json, threading, urllib.error, urllib.request
        from harness.web_chat import WebChat, WebHandler
        with tempfile.TemporaryDirectory() as folder:
            chat = WebChat(Path(folder) / 'chats', 9, 0, data_root=Path(folder) / 'data'); self.addCleanup(chat.close)
            project = chat.documents.create_project('Sandboxed')
            class Handler(WebHandler): pass
            Handler.chat = chat; Handler.log_message = lambda *args: None
            server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
            threading.Thread(target=server.serve_forever, daemon=True).start(); self.addCleanup(server.server_close); self.addCleanup(server.shutdown)
            base = f'http://127.0.0.1:{server.server_port}'
            def post(headers):
                request = urllib.request.Request(base + '/api/projects/sandbox', json.dumps({'project': project, 'network': 'internet'}).encode(), {'Content-Type': 'application/json', **headers})
                try:
                    with urllib.request.urlopen(request, timeout=5) as response: return response.status, json.load(response)
                except urllib.error.HTTPError as error:
                    with error: return error.code, json.load(error)
            self.assertEqual(post({})[0], 403, 'a local process (a test Pi wrote) cannot widen it')
            self.assertEqual(sandbox.widened(chat.documents.root, chat.documents.project_path(project))['network'], 'none')
            self.assertEqual(post({'X-Pi-Person': WebHandler.person_secret}), (200, {'network': 'internet'}))
            with urllib.request.urlopen(base + '/api/project-sandbox?project=' + project, timeout=5) as response:
                self.assertEqual(json.load(response)['network'], 'internet')
            rows = [json.loads(line) for line in (chat.documents.root / 'decisions.jsonl').read_text().splitlines()]
            self.assertEqual([(row['kind'], row['who'], row['answer']) for row in rows if row['kind'] == 'sandbox_network'], [('sandbox_network', 'person', 'internet')])


class SandboxWideningTest(unittest.TestCase):
    def test_only_the_person_widens_and_the_choice_is_per_project(self):
        with tempfile.TemporaryDirectory() as folder:
            data, project = Path(folder) / 'data', Path(folder) / 'p'
            self.assertEqual(sandbox.widened(data, project), {'network': 'none'})
            with self.assertRaises(ValueError): sandbox.widen(data, project, 'internet', state='auto')
            with self.assertRaises(ValueError): sandbox.widen(data, project, 'everything')
            self.assertEqual(sandbox.widen(data, project, 'local'), {'network': 'local'})
            self.assertEqual(sandbox.widened(data, Path(folder) / 'other'), {'network': 'none'})
            self.assertIn('localhost', sandbox.profile(project, Path(folder) / 't', data, 'local'))
            self.assertEqual(sandbox.widen(data, project, 'none'), {'network': 'none'})

    def test_the_runner_keeps_only_harmless_variables(self):
        runner = (HERE / 'gate' / 'sandbox-run.sh').read_text()
        self.assertIn('/usr/bin/env -i', runner)
        kept = runner.split('for name in ', 1)[1].split('; do', 1)[0].split()
        self.assertFalse([name for name in kept if name.startswith('PI_') or 'TOKEN' in name or 'KEY' in name or 'SECRET' in name], kept)


if __name__ == '__main__':
    unittest.main()
