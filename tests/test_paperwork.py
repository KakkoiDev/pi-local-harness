"""Plan 184 part 4: the harness does the paperwork. Pi only writes content; Gate makes the task at the first file change
(or reuses the one the request names), ticks the progress from the test runs it saw, and at the end, when the change is
verified, marks the task and roadmap done and commits locally only what the request changed."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:  # run as tests.<module> from the repository root
    from tests import isolation  # noqa: F401
import subprocess
import tempfile
import unittest
from pathlib import Path

from gate.paperwork import Paperwork
from gate.protocol import Protocol


def git(root, *args):
    return subprocess.run(['git', '-C', str(root), *args], capture_output=True, text=True, check=True).stdout


class PaperworkTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.data = tempfile.TemporaryDirectory(); self.addCleanup(self.data.cleanup)
        self.root = Path(self.temp.name).resolve()
        (self.root / 'tasks').mkdir()
        (self.root / 'ROADMAP.md').write_text('# Roadmap\n\n## Goal\nShow the queue and report hangs.\n\n## Tasks\n- [x] [001-First task](tasks/001-first-task.md)\n- [ ] [002-Add the badge](tasks/002-add-the-badge.md)\n')
        (self.root / 'tasks/001-first-task.md').write_text('# 001: First task\n\nKind: code\n\n- [x] Done\n\nDone when: Setup is ready.\n')
        (self.root / 'tasks/002-add-the-badge.md').write_text('# 002: Add the badge\n\nKind: code\n\n- [ ] Show the count\n\nDone when: The badge shows the count.\n')
        (self.root / 'app.py').write_text('x = 1\n'); (self.root / 'notes.txt').write_text('mine\n')
        git(self.root, 'init', '-q'); git(self.root, '-c', 'user.name=t', '-c', 'user.email=t@t', 'add', '-A'); git(self.root, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'start')
        self.protocol = Protocol(Path(self.data.name) / 'runs.json')
        self.paper = Paperwork(self.protocol, data=self.data.name, identity=('Pi Workbench', 'harness@localhost'))

    def test_a_new_request_gets_its_task_at_the_first_change_and_is_committed_when_verified(self):
        (self.root / 'notes.txt').write_text('mine, changed before the request\n')  # the person's own edit: never committed by the harness
        self.paper.start('r1', str(self.root), 'Fix the stuck detection so a hang is reported.\nMore detail here.')
        self.assertIsNone(self.paper.observe('r1'), 'nothing changed yet: no task')
        (self.root / 'app.py').write_text('x = 2\n')
        note = self.paper.observe('r1')
        self.assertIn('tasks/003-fix-the-stuck-detection-so.md', note)
        task = (self.root / 'tasks/003-fix-the-stuck-detection-so.md').read_text()
        self.assertIn('# 003: Fix the stuck detection so a hang is reported', task); self.assertIn('Kind: code', task)
        self.assertIn('“Fix the stuck detection so a hang is reported.\nMore detail here.”', task)
        self.assertIn('## Progress (kept by the harness)', task)
        self.assertIn('- [ ] [003-Fix the stuck detection so a hang is reported](tasks/003-fix-the-stuck-detection-so.md)', (self.root / 'ROADMAP.md').read_text())
        self.assertIsNone(self.paper.observe('r1'), 'told once')
        self.protocol.record(str(self.root), 'python3 -m unittest', False); self.paper.ran('r1', 'python3 -m unittest', False)
        self.protocol.record(str(self.root), 'python3 -m unittest', True); self.paper.ran('r1', 'python3 -m unittest', True)
        task = (self.root / 'tasks/003-fix-the-stuck-detection-so.md').read_text()
        self.assertRegex(task, r'- \[x\] Red: `python3 -m unittest` failed at \d\d:\d\d'); self.assertRegex(task, r'- \[x\] Green: `python3 -m unittest` passed at \d\d:\d\d')
        result = self.paper.end('r1')
        self.assertEqual(result['outcome'], 'committed')
        self.assertEqual(result['commit'], git(self.root, 'rev-parse', '--short=12', 'HEAD').strip(), 'the commit, so the request can be undone')
        self.assertIn('- [x] [003-', (self.root / 'ROADMAP.md').read_text())
        self.assertRegex((self.root / 'tasks/003-fix-the-stuck-detection-so.md').read_text(), r'- \[x\] Done at \d\d:\d\d: verified and committed')
        committed = git(self.root, 'show', '--name-only', '--format=%s%n%an', 'HEAD').split('\n')
        self.assertEqual(committed[0], 'Fix the stuck detection so a hang is reported (task 003)'); self.assertEqual(committed[1], 'Pi Workbench')
        self.assertEqual(sorted(filter(None, committed[2:])), ['ROADMAP.md', 'app.py', 'tasks/003-fix-the-stuck-detection-so.md', 'tasks/004-ready-to-publish.md'])
        self.assertIn('notes.txt', git(self.root, 'status', '--porcelain'), "the person's own edit stays uncommitted")

    def test_a_request_that_names_a_task_uses_it(self):
        self.paper.start('r2', str(self.root), 'Yes, do tasks 2 right now.')
        (self.root / 'app.py').write_text('x = 3\n')
        self.assertIn('tasks/002-add-the-badge.md', self.paper.observe('r2'))
        self.assertFalse((self.root / 'tasks/003-yes-do-tasks-2-right.md').exists())
        self.protocol.record(str(self.root), 'python3 -m unittest', False); self.paper.ran('r2', 'python3 -m unittest', False)
        self.protocol.record(str(self.root), 'python3 -m unittest', True); self.paper.ran('r2', 'python3 -m unittest', True)
        self.assertEqual(self.paper.end('r2')['outcome'], 'committed')
        self.assertIn('- [ ] [002-Add the badge]', (self.root / 'ROADMAP.md').read_text(), 'its own boxes are still open: the roadmap line stays open')

    def test_unverified_work_is_committed_marked_and_left_open(self):
        """2026-10-15 (the person: "do recommended"): every change can be undone the same way, so an unverified one is
        committed too, marked; its task and roadmap line stay open."""
        self.paper.start('r3', str(self.root), 'Rewrite app')
        (self.root / 'app.py').write_text('x = 4\n'); self.paper.observe('r3')
        result = self.paper.end('r3')
        self.assertEqual(result['outcome'], 'not verified')
        self.assertIn('Not verified at', (self.root / 'tasks/003-rewrite-app.md').read_text())
        subject, body = git(self.root, 'log', '-1', '--format=%s%n%b').split('\n', 1)
        self.assertEqual(subject, 'Rewrite app (task 003, not verified)')
        self.assertIn('Not verified: no test passed on the final code (Green)', body)
        self.assertEqual(result['commit'], git(self.root, 'rev-parse', '--short=12', 'HEAD').strip(), 'Undo This Request works on it too')
        self.assertIn('- [ ] [003-Rewrite app]', (self.root / 'ROADMAP.md').read_text(), 'the roadmap line stays open')

    def test_documentation_only_is_kind_docs_and_needs_no_tests(self):
        self.paper.start('r4', str(self.root), 'Document the queue')
        (self.root / 'QUEUE.md').write_text('# Queue\n'); self.paper.observe('r4')
        self.assertEqual(self.paper.end('r4')['outcome'], 'committed')
        self.assertIn('Kind: docs', (self.root / 'tasks/003-document-the-queue.md').read_text())

    def test_the_harness_proves_red_itself_whatever_order_pi_worked_in(self):
        """Strategy 1 (bench, 2026-10-15): feature-slugify was solved but not verified because Pi wrote its test after the code.
        The harness now proves it: without the change the tests fail, with it they pass."""
        (self.root / 'tests').mkdir()
        self.paper.start('r6', str(self.root), 'Make x three')
        (self.root / 'app.py').write_text('x = 3\n'); self.paper.observe('r6')  # the code first
        (self.root / 'tests/__init__.py').write_text(''); (self.root / 'tests/test_app.py').write_text('import unittest\nimport app\n\n\nclass A(unittest.TestCase):\n    def test_x(self):\n        self.assertEqual(app.x, 3)\n')
        self.protocol.record(str(self.root), 'python3 -m unittest discover -s tests -t .', True); self.paper.ran('r6', 'python3 -m unittest discover -s tests -t .', True)  # then the test, passing
        result = self.paper.end('r6')
        self.assertEqual(result['outcome'], 'committed', result)
        task = (self.root / 'tasks/003-make-x-three.md').read_text()
        self.assertIn('Red (proved by the harness): without the change, `python3 -m unittest discover -s tests -t .` fails', task)
        self.assertEqual((self.root / 'app.py').read_text(), 'x = 3\n', 'the change is back in place')

    def test_tests_that_pass_without_the_change_do_not_verify_it(self):
        (self.root / 'tests').mkdir(); (self.root / 'tests/__init__.py').write_text('')
        (self.root / 'tests/test_any.py').write_text('import unittest\n\n\nclass A(unittest.TestCase):\n    def test_true(self):\n        self.assertTrue(True)\n')
        self.paper.start('r7', str(self.root), 'Make x seven')
        (self.root / 'app.py').write_text('x = 7\n'); self.paper.observe('r7')
        self.protocol.record(str(self.root), 'python3 -m unittest discover -s tests -t .', True); self.paper.ran('r7', 'python3 -m unittest discover -s tests -t .', True)
        result = self.paper.end('r7')
        self.assertEqual(result['outcome'], 'not verified'); self.assertIn('pass without the change', result['reason'])
        self.assertEqual((self.root / 'app.py').read_text(), 'x = 7\n')

    def test_outside_a_project_nothing_happens(self):
        with tempfile.TemporaryDirectory() as other:
            self.paper.start('r5', other, 'Anything'); (Path(other) / 'a.py').write_text('1')
            self.assertIsNone(self.paper.observe('r5')); self.assertIsNone(self.paper.end('r5'))


    def test_short_title_names_the_file_and_keeps_the_whole_request(self):
        request='I want to make a very basic and minimal pong game. white paddles and white ball.'
        self.paper.start('short',str(self.root),request)
        (self.root/'app.py').write_text('x = 3\n'); self.paper.observe('short')
        name='tasks/003-very-basic-and-minimal-pong.md'
        text=(self.root/name).read_text()
        self.assertIn('# 003: Very basic and minimal pong game',text)
        self.assertIn(request,text)
        self.assertIn(f'[003-Very basic and minimal pong game]({name})',(self.root/'ROADMAP.md').read_text())


    def test_a_short_title_does_not_shorten_the_request_body(self):
        request=('Please make a clock. '+('Keep this detail. '*60)).rstrip()
        self.paper.start('long',str(self.root),request)
        (self.root/'app.py').write_text('x = 3\n'); self.paper.observe('long')
        self.assertIn(request,(self.root/'tasks/003-clock.md').read_text())


class LedgerTest(PaperworkTest):
    """Through Gate: tool calls carry the request; the audit writes runs into the task and passes the task note to Pi."""
    def test_gate_runs_the_paperwork_for_a_request(self):
        from gate.engine import GateEngine
        from gate.ledger import ProposalLedger
        ledger = ProposalLedger(GateEngine('', '/dev/null'), protocol_file=Path(self.data.name) / 'runs.json', events_file=Path(self.data.name) / 'events.jsonl')
        ledger.paperwork.identity = ('Pi Workbench', 'harness@localhost')
        ledger.start_request('r9', str(self.root), 'Speed up the app')
        write = ledger.propose('write_file', {'path': 'app.py', 'content': 'x = 9\n'}, 'admin', pi_tool='write', cwd=str(self.root), request='r9')
        (self.root / 'app.py').write_text('x = 9\n')
        audit = ledger.complete(write['proposal_id'], 'write_file', {'path': 'app.py', 'content': 'x = 9\n'}, 'ok', 0)
        self.assertIn("This request's task is tasks/003-speed-up-the-app.md", ledger.last_note(write['proposal_id']))
        for passed in (False, True):
            run = ledger.propose('execute_command', {'command': 'python3 -m unittest'}, 'admin', cwd=str(self.root), request='r9')
            ledger.complete(run['proposal_id'], 'execute_command', {'command': 'python3 -m unittest'}, 'ok' if passed else 'FAILED', 0 if passed else 1)
        commit = ledger.propose('execute_command', {'command': 'git commit -m x'}, 'admin', cwd=str(self.root), request='r9')
        self.assertEqual((commit['outcome'], commit['rule']), ('REVISE', 'G-013'), 'Pi does not commit: the harness does')
        self.assertEqual(ledger.end_request('r9')['outcome'], 'committed')
        self.assertIn('Speed up the app (task 003)', git(self.root, 'log', '--format=%s', '-1'))


class ShortTitleTest(unittest.TestCase):
    def test_request_openings_and_details_do_not_become_the_title(self):
        from gate.paperwork import short_title
        cases = {
            'I want to make a very basic and minimal pong game. white pales…': 'Very basic and minimal pong game',
            'I would like to create a useful clock. Add seconds.': 'Useful clock',
            'Can you please make a clock? With seconds.': 'Clock',
            'Please create a clock\nUse seconds.': 'Clock',
            'Fix app.mjs so it starts. More details.': 'Fix app.mjs so it starts',
            '時計を作る。秒も表示する。': '時計を作る',
            '': 'Request',
        }
        for request, title in cases.items():
            with self.subTest(request=request): self.assertEqual(short_title(request),title)

    def test_long_titles_end_at_a_word_boundary(self):
        from gate.paperwork import short_title
        self.assertEqual(short_title('Please create a clock with alarms for every working day and holidays'), 'Clock with alarms for every working day and…')
        self.assertLessEqual(len(short_title('word '*30)),48)
        self.assertEqual(short_title('x'*60),'…')


if __name__ == '__main__':
    unittest.main()


class StarterSampleTest(unittest.TestCase):
    def project(self, kind):
        from kit.new_project import new_project
        temporary=tempfile.TemporaryDirectory();self.addCleanup(temporary.cleanup)
        root=Path(temporary.name)/'app'
        new_project(root,static=kind=='static',tui=kind=='tui',files={'ROADMAP.md':'# Plan\n\n## Goal\nBuild a game.\n\n## Tasks\n', 'tasks/.keep':''})
        paper=Paperwork(Protocol(Path(temporary.name)/'runs.json'))
        return root,paper

    def test_first_code_request_reasks_once_about_unchanged_samples_in_each_starter(self):
        for kind,main,sample in [('static','js/app.mjs','js/logic/notes.mjs'),('web','app/main.py','app/logic/notes.py'),('tui','app/tui.py','app/logic/notes.py')]:
            with self.subTest(kind=kind):
                root,paper=self.project(kind);before=git(root,'rev-parse','HEAD')
                paper.start('first',str(root),'Build a pong game')
                with (root/main).open('a') as file:file.write('\n# changed\n' if main.endswith('.py') else '\n// changed\n')
                paper.observe('first');result=paper.end('first')
                self.assertEqual(result['outcome'],'continue')
                self.assertIn(sample,result['instruction']);self.assertIn('messages/en.json',result['instruction'])
                self.assertIn('Keep the skeleton',result['instruction'])
                self.assertEqual(git(root,'rev-parse','HEAD'),before,'no commit before cleanup can run')
                self.assertIn('first',paper.requests,'the recovery still owns the request')
                self.assertNotEqual(paper.end('first')['outcome'],'continue','one cleanup wake-up')
                paper.start('later',str(root),'Polish the game')
                with (root/main).open('a') as file:file.write('\n# polish\n' if main.endswith('.py') else '\n// polish\n')
                paper.observe('later');self.assertNotEqual(paper.end('later')['outcome'],'continue','only the first code request')

    def test_documentation_does_not_use_up_the_first_code_review_and_stop_skips_the_wake(self):
        root,paper=self.project('static')
        paper.start('docs',str(root),'Write instructions');(root/'HELP.md').write_text('Read this.\n');paper.observe('docs')
        self.assertEqual(paper.end('docs')['outcome'],'committed')
        paper.start('code',str(root),'Build a game');(root/'js/app.mjs').write_text('export const game=1;\n');paper.observe('code')
        self.assertEqual(paper.end('code')['outcome'],'continue')
        self.assertNotEqual(paper.end('code',review=False)['outcome'],'continue')

    def test_replaced_sample_and_names_need_no_cleanup(self):
        import json
        root,paper=self.project('static');paper.start('game',str(root),'Build a game')
        for name in ['js/logic/notes.mjs','tests/notes.test.mjs']:(root/name).unlink()
        (root/'js/app.mjs').write_text('export const game=1;\n');(root/'index.html').write_text('<h1>Pong</h1>');(root/'README.md').write_text('# Pong\nA game.\n')
        for path in (root/'messages').glob('*.json'):path.write_text(json.dumps({'app.name':'Pong'}))
        (root/'manifest.webmanifest').write_text(json.dumps({'name':'Pong','short_name':'Pong'}))
        paper.observe('game');self.assertNotEqual(paper.end('game')['outcome'],'continue')
        for name in ['js/store.mjs','js/i18n.mjs','sw.js','tests/i18n.test.mjs','tests/files.test.mjs','tsconfig.json']:
            self.assertTrue((root/name).is_file(),name)

    def test_stopping_first_request_does_not_queue_sample_cleanup(self):
        root,paper=self.project('web');paper.start('stop',str(root),'Build a game')
        (root/'app/main.py').write_text('x=1\n');paper.observe('stop')
        self.assertNotEqual(paper.end('stop',review=False)['outcome'],'continue')
