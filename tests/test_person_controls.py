"""Task 261: only the person's controls approve, accept, change the phase or turn on Run on its own.

The page carries a per-run secret (a meta tag in the served index.html); the person-only routes refuse a request
without it, so a local process (a test the model wrote) cannot act as the person by posting to the workbench."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:
    from tests import isolation  # noqa: F401
import http.client
import http.server
import json
import re
import tempfile
import threading
import unittest
from pathlib import Path
from harness.web_chat import WebChat, WebHandler

HOST = 'mini.example.ts.net'
USER = 'me@example.com'


class PersonRoutesTest(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory(); self.addCleanup(directory.cleanup)
        root = Path(directory.name)
        self.chat = WebChat(root / 'chats', 9, 0, data_root=root / 'data'); self.addCleanup(self.chat.close)
        class Handler(WebHandler): pass
        Handler.chat = self.chat
        Handler.log_message = lambda *args: None
        self.handler = Handler
        self.server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        threading.Thread(target=self.server.serve_forever, daemon=True).start()
        self.addCleanup(self.server.server_close); self.addCleanup(self.server.shutdown)
        self.local = {'Host': f'127.0.0.1:{self.server.server_port}'}
        self.project = self.chat.documents.create_project('Counter', None, 'empty')

    def call(self, path, body=None, headers=None):
        connection = http.client.HTTPConnection('127.0.0.1', self.server.server_port, timeout=5)
        self.addCleanup(connection.close)
        connection.request('GET' if body is None else 'POST', path, body=None if body is None else json.dumps(body),
                           headers={'Content-Type': 'application/json', **self.local, **(headers or {})})
        response = connection.getresponse(); raw = response.read()
        return response.status, raw

    def secret(self, headers=None):
        status, page = self.call('/', headers=headers)
        self.assertEqual(status, 200)
        match = re.search(rb'<meta name="pi-person" content="([^"]+)">', page)
        self.assertIsNotNone(match, 'the served page carries the secret')
        return match[1].decode()

    def test_the_served_page_carries_one_secret_for_this_run_also_on_the_phone(self):
        secret = self.secret()
        self.assertGreaterEqual(len(secret), 32)
        self.assertEqual(self.secret(), secret, 'one secret per run')
        self.handler.remote_hosts = frozenset({HOST}); self.handler.remote_users = frozenset({USER})
        self.assertEqual(self.secret({'Host': HOST, 'Tailscale-User-Login': USER}), secret, 'the phone gets it with the page')
        self.assertNotIn(secret.encode(), self.call('/api/config')[1], 'no API answer repeats it')
        self.assertNotIn(secret.encode(), Path('index.html').read_bytes(), 'it is never written into the repository')

    def test_person_routes_refuse_a_request_without_the_page_secret(self):
        conversation = self.chat.project_chat(self.project)
        routes = [('/api/phase', {'project': self.project, 'phase': 'planning'}),
                  ('/api/phase/build', {'project': self.project}),
                  ('/api/plan/wait', {'project': self.project}),
                  ('/api/auto', {'enabled': True, 'confirmed': True}),
                  (f"/api/conversations/{conversation['id']}/check-in/accept", {'index': 0}),
                  (f"/api/conversations/{conversation['id']}/check-in/stop", {'index': 0}),
                  ('/api/jobs/create', {'project': self.project, 'message': 'Choice: Who uses it? → Only me'})]
        for path, body in routes:
            for headers in ({}, {'X-Pi-Person': 'guessed'}):
                with self.subTest(path=path, headers=headers):
                    status, raw = self.call(path, body, headers)
                    self.assertEqual(status, 403, raw)
                    self.assertIn(b'Reload the page', raw)
        status, raw = self.call('/api/auto')
        self.assertFalse(json.loads(raw)['enabled'], 'Run on its own stayed off')

    def test_the_page_secret_opens_the_person_routes(self):
        secret = self.secret()
        status, raw = self.call('/api/auto', {'enabled': True, 'confirmed': True}, {'X-Pi-Person': secret})
        self.assertEqual(status, 200, raw); self.assertTrue(json.loads(raw)['enabled'])
        status, raw = self.call('/api/auto', {'enabled': False}, {'X-Pi-Person': secret})
        self.assertEqual(status, 200, raw)

    def test_reads_and_plain_messages_need_no_secret(self):
        self.assertEqual(self.call('/api/auto')[0], 200)
        self.assertEqual(self.call('/api/jobs/create', {'message': 'Hello'})[0], 400, 'checked further, not refused (no project: no Pi starts)')


class GateRoutesTest(unittest.TestCase):
    """Gate's routes come from Pi's extension. Run on its own is checked on the server, and a person's action needs the
    person secret, which the workbench page and the terminal's own Pi hold; workbench Pi workers do not."""
    def setUp(self):
        from agent_api import AgentHandler
        from gate.engine import GateEngine
        from gate.ledger import ProposalLedger
        temp = tempfile.TemporaryDirectory(); self.addCleanup(temp.cleanup)
        base = Path(temp.name).resolve(); self.data = base / 'data'; self.data.mkdir()
        self.root = base / 'project'; (self.root / 'tasks').mkdir(parents=True)
        (self.root / 'ROADMAP.md').write_text('# Roadmap\n\n## Goal\nCount clicks.\n\n## Tasks\n')
        self.ledger = ProposalLedger(GateEngine('', str(base / 'audit.log')), events_file=self.data / 'gate-events.jsonl')
        ledger = self.ledger
        class Handler(AgentHandler):
            token = 'gate-token'; person_secret = 'person-secret'
            def __init__(self, *args):
                self.ledger = ledger; super().__init__(*args)
            def log_message(self, *args): pass
        self.server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        threading.Thread(target=self.server.serve_forever, daemon=True).start()
        self.addCleanup(self.server.server_close); self.addCleanup(self.server.shutdown)
        paper = ledger.paperwork
        paper.phases.choose(self.root, 'planning', actor='person')
        paper.start('r', str(self.root), 'Plan the counter')
        paper.propose_plan('r', {'goal': 'Count clicks.', 'tasks': [{'title': 'Counter', 'files': ['app.py'], 'done_when': 'Counts clicks.', 'content': 'Check a click.'}]})

    def call(self, path, body, person=False):
        connection = http.client.HTTPConnection('127.0.0.1', self.server.server_port, timeout=5)
        self.addCleanup(connection.close)
        headers = {'Content-Type': 'application/json', 'Host': f'127.0.0.1:{self.server.server_port}', 'X-Gate-Token': 'gate-token'}
        if person: headers['X-Pi-Person'] = 'person-secret'
        connection.request('POST', path, body=json.dumps(body), headers=headers)
        response = connection.getresponse(); return response.status, json.loads(response.read() or b'{}')

    def auto(self, value):
        from harness.autonomy import set_enabled
        set_enabled(self.data, value, confirmed=True)

    def test_a_leaked_gate_token_cannot_approve_or_change_the_phase_as_the_person(self):
        for path, body in [('/plan/approve', {'request': 'r', 'state': 'chosen'}), ('/plan/approve', {'request': 'r'}),
                           ('/phase', {'cwd': str(self.root), 'phase': 'implementation'}), ('/phase', {'cwd': str(self.root), 'phase': 'discussion'}),
                           ('/phase/build', {'cwd': str(self.root)}), ('/decision', {'request': 'r', 'question': 'Q', 'answer': 'A'}),
                           ('/decision', {'request': 'r', 'question': 'Q', 'answer': 'A', 'state': 'given'})]:
            with self.subTest(path=path, body=body):
                status, value = self.call(path, body)
                self.assertEqual(status, 403, value); self.assertIn('person', value['error'])
        self.assertTrue(self.ledger.paperwork.plan_state(self.root)['pending'], 'the plan still waits for the person')
        self.assertEqual(self.ledger.paperwork.phases.get(self.root)['phase'], 'planning')
        self.assertEqual(self.call('/phase', {'cwd': str(self.root)})[0], 200, 'reading the phase needs no secret')

    def test_automatic_answers_need_run_on_its_own_switched_on_on_the_server(self):
        for path, body in [('/plan/approve', {'request': 'r', 'state': 'auto'}), ('/decision', {'request': 'r', 'question': 'Q', 'answer': 'A', 'state': 'auto'})]:
            with self.subTest(path=path):
                status, value = self.call(path, body)
                self.assertEqual(status, 403, value); self.assertIn('Run on its own is off', value['error'])
        self.assertTrue(self.ledger.paperwork.plan_state(self.root)['pending'])
        self.auto(True)
        status, value = self.call('/plan/approve', {'request': 'r', 'state': 'auto'})
        self.assertEqual(status, 200, value); self.assertTrue(value['approved'])

    def test_check_in_acceptance_is_the_persons_or_run_on_its_own(self):
        self.assertEqual(self.call('/plan/approve', {'request': 'r', 'state': 'chosen'}, person=True)[0], 200)
        paper = self.ledger.paperwork
        plan = paper.plan_state(self.root); plan.update(check_in=True, verified=True); paper.plan_state(self.root, plan)
        for body in [{'cwd': str(self.root)}, {'cwd': str(self.root), 'action': 'stop'}]:
            self.assertEqual(self.call('/phase/accept', body)[0], 403, body)
        status, value = self.call('/phase/accept', {'cwd': str(self.root), 'state': 'auto'})
        self.assertEqual(status, 403, value)
        self.assertTrue(paper.plan_state(self.root)['check_in'], 'still waiting for the person')
        self.auto(True)
        status, value = self.call('/phase/accept', {'cwd': str(self.root), 'state': 'auto'})
        self.assertEqual(status, 200, value); self.assertFalse(paper.plan_state(self.root)['check_in'])

    def test_the_person_secret_opens_the_persons_actions(self):
        status, value = self.call('/plan/approve', {'request': 'r', 'state': 'chosen'}, person=True)
        self.assertEqual(status, 200, value)
        rows = [json.loads(line) for line in (self.data / 'decisions.jsonl').read_text().splitlines()]
        self.assertEqual([row['who'] for row in rows if row['kind'] == 'plan_approval'], ['person'])
        status, value = self.call('/phase', {'cwd': str(self.root), 'phase': 'discussion'}, person=True)
        self.assertEqual((status, value['phase']), (200, 'discussion'))


class GitHooksTest(unittest.TestCase):
    """A hook planted in .git/hooks never runs with the harness's commits (task 261)."""
    def setUp(self):
        import subprocess
        temp = tempfile.TemporaryDirectory(); self.addCleanup(temp.cleanup)
        self.root = Path(temp.name).resolve(); self.marker = self.root.parent / (self.root.name + '-hook-ran')
        self.addCleanup(lambda: self.marker.unlink(missing_ok=True))
        git = lambda *args: subprocess.run(['git', '-C', str(self.root), *args], check=True, capture_output=True)
        git('init', '-q'); git('config', 'user.name', 'Person'); git('config', 'user.email', 'person@localhost')
        (self.root / 'app.py').write_text('x = 1\n' + ''.join(f'# line {n}\n' for n in range(10)) + 'y = 1\n'); git('add', '.'); git('-c', 'core.hooksPath=/dev/null', 'commit', '-q', '-m', 'start')
        for name in ('pre-commit', 'commit-msg', 'post-commit', 'prepare-commit-msg'):
            hook = self.root / '.git/hooks' / name; hook.write_text(f'#!/bin/sh\necho {name} >> "{self.marker}"\n'); hook.chmod(0o755)

    def test_paperwork_commits_without_running_hooks(self):
        from gate.paperwork import Paperwork
        (self.root / 'app.py').write_text('x = 2\n')
        saved = Paperwork(None).commit(self.root, ['app.py'], 'Change x (task 001)')
        self.assertIn('commit', saved, saved)
        self.assertFalse(self.marker.exists(), self.marker.read_text() if self.marker.exists() else '')

    def test_a_plan_cannot_grant_git_internals(self):
        from gate.engine import GateEngine
        from gate.ledger import ProposalLedger
        (self.root / 'tasks').mkdir(); (self.root / 'ROADMAP.md').write_text('# Roadmap\n\n## Goal\nCount.\n')
        paper = ProposalLedger(GateEngine('', str(self.root.parent / (self.root.name + '-audit.log')))).paperwork
        paper.phases.choose(self.root, 'planning', actor='person'); paper.start('r', str(self.root), 'Plan it')
        for files in (['.git/hooks/pre-commit'], ['app.py', '.git/'], ['lib/.git/config']):
            with self.subTest(files=files), self.assertRaisesRegex(ValueError, r'\.git/'):
                paper.propose_plan('r', {'goal': 'Count.', 'tasks': [{'title': 'Hook', 'files': files, 'done_when': 'Runs.', 'content': 'Add it.'}]})

    def test_undo_and_saved_edits_commit_without_running_hooks(self):
        from gate.paperwork import Paperwork
        from harness import undo
        (self.root / 'app.py').write_text((self.root / 'app.py').read_text().replace('x = 1', 'x = 2'))
        saved = Paperwork(None).commit(self.root, ['app.py'], 'Change x (task 001)')
        (self.root / 'app.py').write_text((self.root / 'app.py').read_text().replace('y = 1', 'y = 5'))  # the person's unsaved edit
        result = undo.undo(self.root, saved['commit'], save_first=True)
        self.assertEqual(result['outcome'], 'undone', result)
        self.assertFalse(self.marker.exists(), self.marker.read_text() if self.marker.exists() else '')


class ModelDecisionsTest(unittest.TestCase):
    """Decisions are recorded by the harness when the person (or Run on its own) answers; the model cannot write them."""
    def setUp(self):
        from gate.engine import GateEngine
        from gate.ledger import ProposalLedger
        temp = tempfile.TemporaryDirectory(); self.addCleanup(temp.cleanup)
        base = Path(temp.name).resolve(); self.data = base / 'data'; self.data.mkdir()
        self.root = base / 'project'; (self.root / 'tasks').mkdir(parents=True)
        (self.root / 'ROADMAP.md').write_text('# Roadmap\n\n## Goal\nCount clicks.\n\n## Tasks\n- [ ] [001-Counter](tasks/001-counter.md)\n')
        self.task = self.root / 'tasks/001-counter.md'
        self.task.write_text('# 001: Counter\n\nKind: code\nFiles: app.py\n\nDone when: Counts clicks.\n\n- [ ] Red: a test fails.\n\n## Decisions\n\n')
        self.ledger = ProposalLedger(GateEngine('', str(base / 'audit.log')), events_file=self.data / 'gate-events.jsonl')
        self.paper = self.ledger.paperwork
        self.paper.phases.choose(self.root, 'planning', actor='person'); self.paper.start('r', str(self.root), 'Plan the counter')

    def write(self, path, content, pi_tool='write'):
        args = {'path': str(path), 'content': content} if pi_tool == 'write' else {'path': str(path), 'edits': [{'oldText': content[0], 'newText': content[1]}]}
        return self.ledger.propose('write_file', args, 'admin', pi_tool=pi_tool, cwd=str(self.root), request='r')

    def test_propose_plan_refuses_decisions_written_by_the_model(self):
        for content in ['Use blue.\n\n## Decisions\n- Colour: Blue', 'Colour: Blue (chosen 2026-10-18T10:00:00+09:00)', 'Size: big (auto)', 'Who: me (given)']:
            with self.subTest(content=content), self.assertRaisesRegex(ValueError, 'harness records'):
                self.paper.propose_plan('r', {'goal': 'Count clicks.', 'tasks': [{'title': 'Counter', 'files': ['app.py'], 'done_when': 'Counts.', 'content': content}]})
        with self.assertRaisesRegex(ValueError, 'harness records'):
            self.paper.propose_plan('r', {'goal': 'Count clicks (chosen by you).', 'tasks': [{'title': 'Counter', 'files': ['app.py'], 'done_when': 'Counts.', 'content': 'Count.'}]})

    def test_a_system_question_of_an_ended_request_never_blocks_the_next_requests_writes(self):
        # Task 324 (live: a "Which guide should Pi use?" that was never shown blocked every write with G-017).
        question = {'question': 'Pi wants to change a file outside task 1', 'options': [{'label': 'Add to Task 1'}, {'label': 'Keep Out'}], 'recommended': 0, 'allow_other': True, 'system_owned': True}
        self.paper.choice_pending('r', question, system=True)
        self.assertEqual(self.write(self.task, self.task.read_text() + 'x\n').get('rule'), 'G-017', 'its own request waits')
        self.paper.end('r', review=False); self.paper.start('next', str(self.root), 'Go on')
        result = self.ledger.propose('write_file', {'path': str(self.task), 'content': self.task.read_text() + 'y\n'}, 'admin', pi_tool='write', cwd=str(self.root), request='next')
        self.assertNotEqual(result.get('rule'), 'G-017', result)
        self.assertIsNone(self.paper.waiting_choice(self.root), 'settled: its request ended')
        guide = {'question': 'Which guide should Pi use?', 'options': [{'label': 'Continue without a guide'}, {'label': 'Use the planning guide'}], 'recommended': 0, 'allow_other': True, 'system_owned': True, 'judgement': {'kind': 'applicable_guide', 'digest': 'x'}}
        self.paper.choice_pending('next', guide, system=True)
        result = self.ledger.propose('write_file', {'path': str(self.task), 'content': self.task.read_text() + 'z\n'}, 'admin', pi_tool='write', cwd=str(self.root), request='next')
        self.assertNotEqual(result.get('rule'), 'G-017', 'a judgement System 1 decides itself never blocks')

    def test_gate_refuses_plan_writes_that_add_decisions(self):
        for content in [self.task.read_text() + '- Colour: Blue (chosen 2026-10-18T10:00:00+09:00)\n', self.task.read_text() + '- Size: big (auto)\n']:
            result = self.write(self.task, content)
            self.assertEqual(result.get('rule'), 'G-017', result)
        result = self.write(self.task, ('## Decisions\n', '## Decisions\n\n- Colour: Blue (given)\n'), pi_tool='edit')
        self.assertEqual(result.get('rule'), 'G-017', result)
        result = self.write(self.root / 'tasks/002-other.md', '# 002: Other\n\nDone when: Done.\n\n## Decisions\n\n- Who: me\n')
        self.assertEqual(result.get('rule'), 'G-017', result)
        self.assertEqual(self.write(self.task, self.task.read_text().replace('Counts clicks.', 'Counts every click.'))['outcome'], 'ALLOW', 'other plan edits still pass')

    def test_g017_and_the_plan_card_read_only_recorded_decisions(self):
        self.task.write_text(self.task.read_text() + '- Colour: Blue (chosen 2026-10-18T10:00:00+09:00)\n')  # written by the model before this task
        plan = self.paper.propose_plan('r')
        self.assertEqual(plan['tasks'][0]['decisions'], '', 'the card shows what the harness recorded, not the file')
        self.paper.approve_plan('r')
        refused = self.write(self.root / 'app.py', 'x = 1\n')
        self.assertEqual(refused.get('rule'), 'G-017', refused); self.assertIn('not recorded', refused['reason'])
        self.paper.decision('r', 'Colour', 'Blue')
        allowed = self.write(self.root / 'app.py', 'x = 1\n'); self.assertEqual(allowed['outcome'], 'ALLOW', allowed)
        self.paper.phases.choose(self.root, 'planning', actor='person'); self.paper.start('r2', str(self.root), 'Plan more')
        self.assertIn('- Colour: Blue (chosen)', self.paper.propose_plan('r2')['tasks'][0]['decisions'])


if __name__ == '__main__':
    unittest.main()
