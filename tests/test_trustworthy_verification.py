"""Task 260: verification cannot be faked and check-ins never strand the plan.

Adapted from the reviewer's repros (docs/reviews/2026-10-18-claude-review.md, P0-1 and items 6, 7, 10, 11, 12). Each
project here is a real git repository with real test commands; only the data folder is scratch."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:
    from tests import isolation  # noqa: F401
import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path

from gate.paperwork import Paperwork, implementation_paths
from gate.protocol import Protocol, test_invocation


def git(root, *args):
    return subprocess.run(['git', '-C', str(root), *args], capture_output=True, text=True, check=True).stdout


APP = 'def add(a, b):\n    return a + b\n'
SUB = APP + 'def sub(a, b):\n    return a - b\n'
OLD_TEST = 'import unittest\nfrom app import add\nclass T(unittest.TestCase):\n    def test_add(self): self.assertEqual(add(1, 2), 3)\n'
SUB_TEST = 'import unittest\nfrom app import sub\nclass T(unittest.TestCase):\n    def test_sub(self): self.assertEqual(sub(3, 1), 2)\n'
ENV = {'PYTHONDONTWRITEBYTECODE': '1', 'PATH': os.environ.get('PATH', '/usr/bin:/bin')}


class Base(unittest.TestCase):
    kind = 'code'
    files = 'app.py, tests/'

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.data = tempfile.TemporaryDirectory(); self.addCleanup(self.data.cleanup)
        r = self.root = Path(self.temp.name).resolve()
        (r / 'tasks').mkdir(); (r / 'tests').mkdir()
        (r / 'ROADMAP.md').write_text('# Roadmap\n\n## Goal\nA calculator.\n\n## Tasks\n- [ ] [002-Add subtraction](tasks/002-add-subtraction.md)\n- [ ] [003-Add multiply](tasks/003-add-multiply.md)\n')
        (r / 'tasks/002-add-subtraction.md').write_text(f'# 002: Add subtraction\n\nKind: {self.kind}\nFiles: {self.files}\n\nDone when: sub(3, 1) returns 2.\n\nAdd sub().\n\n- [ ] Red: a test fails for this change.\n- [ ] Green: the test passes with this change.\n\n## Decisions\n\n')
        (r / 'tasks/003-add-multiply.md').write_text('# 003: Add multiply\n\nKind: code\nFiles: app.py, tests/\n\nDone when: mul works.\n\nAdd mul().\n\n- [ ] Red: a test fails for this change.\n- [ ] Green: the test passes with this change.\n\n## Decisions\n\n')
        (r / 'app.py').write_text(APP); (r / 'tests/__init__.py').write_text('')
        (r / 'tests/test_app.py').write_text(OLD_TEST)
        (r / '.gitignore').write_text('__pycache__/\n')
        git(r, 'init', '-q'); git(r, '-c', 'user.name=t', '-c', 'user.email=t@t', 'add', '-A'); git(r, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'start')
        self.protocol = Protocol(Path(self.data.name) / 'runs.json')
        self.paper = Paperwork(self.protocol, data=self.data.name, identity=('Pi Workbench', 'harness@localhost'))

    def approve(self, tasks=('tasks/002-add-subtraction.md',)):
        self.paper.plan_state(self.root, {'tasks': list(tasks), 'pending': True, 'digest': self.paper.plan_digest(self.root, list(tasks))})
        self.paper.start_building(self.root)

    def run_cmd(self, request, command):
        """What Gate does for an allowed test command: run it, record it with its output."""
        done = subprocess.run(command, shell=True, cwd=self.root, capture_output=True, text=True, env=ENV)
        output = done.stdout + done.stderr
        self.protocol.record(str(self.root), command, done.returncode == 0, output)
        if test_invocation(command, output): self.paper.ran(request, command, done.returncode == 0)
        self.paper.observe(request)
        return done.returncode

    def head(self):
        return git(self.root, 'rev-parse', 'HEAD')

    def committed_files(self):
        return git(self.root, 'show', '--name-only', '--format=', 'HEAD').split()


class RedMustBeReal(Base):
    def test_stale_red_from_an_earlier_request_and_a_comment_edit_is_not_verified(self):
        self.paper.start('old', str(self.root), 'Explain the tests')
        self.run_cmd('old', 'python3 -m unittest nonexistent_module')
        self.paper.end('old')
        self.approve()
        self.paper.start('r', str(self.root), 'Build the approved task.')
        (self.root / 'app.py').write_text(APP + '# subtraction comes later\n')
        (self.root / 'tests/test_more.py').write_text(OLD_TEST.replace('test_add', 'test_add_again'))
        self.assertEqual(self.run_cmd('r', 'python3 -m unittest'), 0)
        result = self.paper.end('r')
        self.assertEqual(result['outcome'], 'not verified', result)

    def test_in_request_bogus_red_and_help_as_green_is_not_verified(self):
        self.approve()
        self.paper.start('r', str(self.root), 'Build the approved task.')
        self.run_cmd('r', 'python3 -m unittest nonexistent_module')
        (self.root / 'app.py').write_text(APP + '\n')
        self.assertEqual(self.run_cmd('r', 'python3 -m unittest --help'), 0)
        result = self.paper.end('r')
        self.assertEqual(result['outcome'], 'not verified', result)
        self.assertNotIn('- [x] Green:', (self.root / 'tasks/002-add-subtraction.md').read_text(), '--help is not Green')

    def test_a_weakened_test_after_a_real_red_is_not_verified(self):
        self.approve()
        self.paper.start('r', str(self.root), 'Build the approved task.')
        (self.root / 'tests/test_sub.py').write_text(SUB_TEST)
        self.assertNotEqual(self.run_cmd('r', 'python3 -m unittest'), 0)
        (self.root / 'tests/test_sub.py').write_text('import unittest\nclass T(unittest.TestCase):\n    def test_sub(self): self.assertTrue(True)\n')
        (self.root / 'app.py').write_text(APP.replace('a + b', 'a+b'))
        self.assertEqual(self.run_cmd('r', 'python3 -m unittest'), 0)
        result = self.paper.end('r')
        self.assertEqual(result['outcome'], 'not verified', result)

    def test_a_real_red_then_green_is_verified_and_clears_the_runs(self):
        self.approve()
        self.paper.start('r', str(self.root), 'Build the approved task.')
        (self.root / 'tests/test_sub.py').write_text(SUB_TEST)
        self.assertNotEqual(self.run_cmd('r', 'python3 -m unittest'), 0)
        (self.root / 'app.py').write_text(SUB)
        self.assertEqual(self.run_cmd('r', 'python3 -m unittest'), 0)
        result = self.paper.end('r')
        self.assertEqual(result['outcome'], 'committed', result)
        self.assertFalse(self.protocol.failed_run(self.root), 'a harness commit clears the recorded runs: no stale Red')
        self.assertEqual(json.loads((Path(self.data.name) / 'runs.json').read_text()).get(str(self.root), []), [])

    def test_runs_that_ran_no_test_are_not_test_runs(self):
        self.assertFalse(test_invocation('python3 -m unittest --help'))
        self.assertFalse(test_invocation('pytest --version'))
        self.assertFalse(test_invocation('npm test -- -h'))
        self.assertFalse(test_invocation('pytest --collect-only'))
        self.assertFalse(test_invocation('python3 -m unittest', '\n----------------------------------------------------------------------\nRan 0 tests in 0.000s\n\nOK\n'))
        self.assertFalse(test_invocation('pytest', '============ no tests ran in 0.01s ============'))
        self.assertFalse(test_invocation('node --test', 'ℹ tests 0\nℹ pass 0\nℹ fail 0\n'))
        self.assertTrue(test_invocation('python3 -m unittest', 'Ran 3 tests in 0.1s\n\nOK\n'))
        self.assertTrue(test_invocation('python3 -m unittest'))
        (self.root / 'app.py').write_text(APP + '\n')
        self.protocol.record(str(self.root), 'python3 -m unittest --help', True, 'usage: python3 -m unittest')
        self.protocol.record(str(self.root), 'python3 -m unittest', True, 'Ran 0 tests in 0.000s\n\nOK\n')
        self.assertFalse(self.protocol.verification(self.root)[2], 'neither run is Green')


class TestNaming(Base):
    def test_common_test_names_are_not_implementation(self):
        for path in ['src/app.test.ts', 'src/app.spec.js', 'pkg/x_test.go', 'src/__tests__/a.js', 'spec/app_spec.rb',
                     'tests.py', 'test.py', 'src/test-utils.js', 'test/a.js', 'lib/foo_spec.rb', 'conftest.py']:
            with self.subTest(path=path):
                self.assertEqual(implementation_paths([path]), [], f'{path} counted as implementation')
        self.assertEqual(implementation_paths(['src/app.ts', 'latest.py', 'contest.py']), ['src/app.ts', 'latest.py', 'contest.py'])

    def test_a_file_a_test_generated_outside_the_scope_is_not_the_implementation(self):
        (self.root / 'tests/test_out.py').write_text('import unittest, pathlib\nclass T(unittest.TestCase):\n    def test_w(self): pathlib.Path("report.json").write_text("{}")\n')
        git(self.root, 'add', '-A'); git(self.root, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'reporting test')
        self.approve()
        self.paper.start('r', str(self.root), 'Build the approved task.')
        self.run_cmd('r', 'python3 -m unittest nonexistent_module')
        self.assertEqual(self.run_cmd('r', 'python3 -m unittest'), 0)
        result = self.paper.end('r')
        self.assertEqual(result['outcome'], 'not verified', result)
        self.assertIn('report.json', result['reason'])


class Scope(Base):
    def test_changes_outside_the_files_scope_are_not_verified_and_not_committed(self):
        self.approve()
        self.paper.start('r', str(self.root), 'Build the approved task.')
        (self.root / 'tests/test_sub.py').write_text(SUB_TEST.replace('from app import', 'from other import'))
        self.assertNotEqual(self.run_cmd('r', 'python3 -m unittest'), 0)
        (self.root / 'other.py').write_text('def sub(a, b):\n    return a - b\n')
        self.assertEqual(self.run_cmd('r', 'python3 -m unittest'), 0)
        result = self.paper.end('r')
        self.assertEqual(result['outcome'], 'not verified', result)
        self.assertIn('other.py', result['reason'])
        self.assertNotIn('other.py', self.committed_files(), 'out-of-scope files stay out of the task commit')
        self.assertIn('?? other.py', git(self.root, 'status', '--porcelain'))


class Docs(Base):
    kind = 'docs'
    files = 'README.md'

    def test_a_docs_task_with_no_change_is_not_verified(self):
        self.approve()
        self.paper.start('r', str(self.root), 'Build the approved task.')
        result = self.paper.end('r')
        self.assertEqual(result['outcome'], 'not verified', result)
        self.assertFalse(result['check_in']['verified'])

    def test_a_docs_task_with_only_paperwork_or_out_of_scope_changes_is_not_verified(self):
        self.approve()
        self.paper.start('r', str(self.root), 'Build the approved task.')
        (self.root / 'NOTES.md').write_text('# Notes\n')
        self.paper.observe('r')
        result = self.paper.end('r')
        self.assertEqual(result['outcome'], 'not verified', result)

    def test_a_docs_task_with_its_file_changed_is_verified(self):
        self.approve()
        self.paper.start('r', str(self.root), 'Build the approved task.')
        (self.root / 'README.md').write_text('# Calculator\n')
        self.paper.observe('r')
        result = self.paper.end('r')
        self.assertEqual(result['outcome'], 'committed', result)
        self.assertTrue(result['check_in']['verified'])


class Chore(Base):
    kind = 'chore'

    def test_a_chore_task_with_no_change_is_not_verified(self):
        self.approve()
        self.paper.start('r', str(self.root), 'Build the approved task.')
        result = self.paper.end('r')
        self.assertNotEqual(result.get('check_in', {}).get('verified'), True, result)


class QuestionsDoNotDerail(Base):
    def test_naming_a_later_planned_task_does_not_relabel_or_complete_it(self):
        self.approve(('tasks/002-add-subtraction.md', 'tasks/003-add-multiply.md'))
        before = self.head()
        self.paper.start('r', str(self.root), 'Look at task 3 first')
        result = self.paper.end('r')
        text = (self.root / 'tasks/003-add-multiply.md').read_text()
        self.assertIn('Kind: code', text, result)
        self.assertNotIn('Done at', text)
        self.assertTrue(self.paper.active_scope(self.root), 'the approved plan still grants scope')
        self.assertEqual(self.head(), before, 'no commit')

    def test_a_plain_question_in_implementation_does_not_end_the_active_task(self):
        self.approve(('tasks/002-add-subtraction.md', 'tasks/003-add-multiply.md'))
        self.paper.start('q', str(self.root), 'What does sub return for negative numbers?')
        result = self.paper.end('q')
        self.assertEqual(result['outcome'], 'nothing changed', result)
        self.assertNotIn('check_in', result)
        plan = self.paper.plan_state(self.root)
        self.assertFalse(plan.get('check_in')); self.assertEqual(plan.get('index'), 0)
        self.assertTrue(self.paper.active_scope(self.root))

    def test_a_choice_never_creates_a_task(self):
        self.paper.phases.choose(self.root, 'planning', actor='person')
        names = sorted(p.name for p in (self.root / 'tasks').glob('*.md'))
        self.paper.start('c', str(self.root), 'Should division round down?')
        self.paper.choice_pending('c', {'question': 'Round down?', 'options': [{'label': 'Yes'}, {'label': 'No'}], 'recommended': 0})
        self.assertEqual(sorted(p.name for p in (self.root / 'tasks').glob('*.md')), names)
        self.assertNotIn('004', (self.root / 'ROADMAP.md').read_text())

    def test_a_request_outside_the_plan_with_no_content_change_makes_no_task_or_commit(self):
        before = self.head()
        self.paper.start('r', str(self.root), 'Do task 2 later; first tell me about it.')
        result = self.paper.end('r')
        self.assertEqual(result['outcome'], 'nothing changed', result)
        self.assertEqual(self.head(), before)
        self.assertIn('Kind: code', (self.root / 'tasks/002-add-subtraction.md').read_text())


class PausedChoice(Base):
    def test_code_written_before_a_choice_pause_belongs_to_the_resumed_request(self):
        self.approve()
        self.paper.start('r1', str(self.root), 'Build the approved task.')
        (self.root / 'tests/test_sub.py').write_text(SUB_TEST)
        self.run_cmd('r1', 'python3 -m unittest')
        (self.root / 'app.py').write_text(SUB)
        self.run_cmd('r1', 'python3 -m unittest')
        self.paper.choice_pending('r1', {'question': 'Allow negatives?', 'options': [{'label': 'Yes'}, {'label': 'No'}], 'recommended': 0})
        self.paper.pause('r1')
        self.paper.start('r2', str(self.root), 'Choice: Allow negatives? → Yes')
        self.run_cmd('r2', 'python3 -m unittest')
        result = self.paper.end('r2')
        self.assertEqual(result['outcome'], 'committed', result)
        self.assertIn('app.py', self.committed_files())
        self.assertEqual(git(self.root, 'status', '--porcelain'), '')


class CheckIns(Base):
    def finish_task(self):
        self.approve(('tasks/002-add-subtraction.md', 'tasks/003-add-multiply.md'))
        self.paper.start('r', str(self.root), 'Build the approved task.')
        (self.root / 'tests/test_sub.py').write_text(SUB_TEST)
        self.run_cmd('r', 'python3 -m unittest')
        (self.root / 'app.py').write_text(SUB)
        self.run_cmd('r', 'python3 -m unittest')
        return self.paper.end('r')

    def test_a_pending_check_in_survives_in_phase_and_can_be_accepted_from_any_phase(self):
        result = self.finish_task()
        self.assertTrue(result['check_in']['verified'])
        shown = self.paper.phase(self.root)
        self.assertEqual(shown['check_in']['task'], 'tasks/002-add-subtraction.md')
        self.assertEqual(shown['check_in']['next'], 'tasks/003-add-multiply.md')
        self.paper.phase(self.root, 'discussion')
        self.assertEqual(self.paper.phase(self.root, 'implementation')['phase'], 'implementation', 'Implementation can be chosen during a check-in')
        self.paper.phase(self.root, 'discussion')
        accepted = self.paper.accept_task(self.root)
        self.assertEqual(accepted['next'], 'tasks/003-add-multiply.md')
        self.assertNotIn('check_in', self.paper.phase(self.root))

    def test_accepting_an_unverified_check_in_retries_the_task_it_names(self):
        self.approve(('tasks/002-add-subtraction.md', 'tasks/003-add-multiply.md'))
        self.paper.start('r', str(self.root), 'Build the approved task.')
        result = self.paper.end('r')
        card = result['check_in']
        self.assertFalse(card['verified']); self.assertEqual(card['next'], 'tasks/002-add-subtraction.md')
        self.assertTrue(card['retry']); self.assertEqual(card['question'], 'Retry Task')
        accepted = self.paper.accept_task(self.root)
        self.assertEqual(accepted['next'], 'tasks/002-add-subtraction.md'); self.assertTrue(accepted['retry'])
        self.paper.start('next', str(self.root), 'Continue the approved task.')
        self.assertEqual(self.paper.requests['next']['task'], card['next'])
        self.assertIn('- [ ] [003-', (self.root / 'ROADMAP.md').read_text())


class RedProofInACopy(Base):
    def test_the_red_proof_never_touches_the_live_tree(self):
        log = Path(self.data.name) / 'seen.jsonl'
        probe = (f'import unittest, os, json, pathlib\nfrom app import sub\nclass T(unittest.TestCase):\n'
                 f'    def test_sub(self):\n'
                 f'        with open({str(log)!r}, "a") as f: f.write(json.dumps([os.getcwd(), pathlib.Path({str(self.root / "app.py")!r}).read_text()]) + "\\n")\n'
                 f'        self.assertEqual(sub(3, 1), 2)\n')
        self.approve()
        self.paper.start('r', str(self.root), 'Build the approved task.')
        (self.root / 'app.py').write_text(SUB)
        (self.root / 'tests/test_sub.py').write_text(probe)
        self.assertEqual(self.run_cmd('r', 'python3 -m unittest'), 0)
        log.write_text('')
        result = self.paper.end('r')
        self.assertEqual(result['outcome'], 'committed', result)
        seen = [json.loads(line) for line in log.read_text().splitlines()]
        self.assertTrue(seen, 'the proof ran the test')
        for cwd, live in seen:
            self.assertNotEqual(Path(cwd).resolve(), self.root, 'the proof runs in a copy')
            self.assertEqual(live, SUB, 'the live app.py kept the change during the proof')


class Reopen(Base):
    def test_the_person_can_reopen_a_falsely_completed_task(self):
        self.approve(('tasks/002-add-subtraction.md', 'tasks/003-add-multiply.md'))
        task = self.root / 'tasks/002-add-subtraction.md'
        # A false completion from an earlier build: boxes ticked, roadmap ticked, plan moved on.
        task.write_text(task.read_text().replace('- [ ]', '- [x]') + '\n## Progress (kept by the harness)\n- [x] Done at 10:00: verified and committed\n')
        roadmap = self.root / 'ROADMAP.md'; roadmap.write_text(roadmap.read_text().replace('- [ ] [002-', '- [x] [002-'))
        git(self.root, 'add', '-A'); git(self.root, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'false completion')
        plan = self.paper.plan_state(self.root); plan.update(index=1, check_in=False); self.paper.plan_state(self.root, plan)
        result = self.paper.reopen(self.root, 'tasks/002-add-subtraction.md')
        self.assertEqual(result['task'], 'tasks/002-add-subtraction.md'); self.assertTrue(result['commit'])
        text = task.read_text()
        self.assertIn('- [ ] Red:', text); self.assertIn('- [ ] Green:', text); self.assertIn('Reopened at', text)
        self.assertIn('- [ ] [002-', roadmap.read_text())
        self.assertEqual(self.paper.plan_state(self.root)['index'], 0)
        self.assertIn('Add subtraction', self.paper.active_scope(self.root))
        self.assertEqual(git(self.root, 'status', '--porcelain'), '')
        with self.assertRaises(ValueError): self.paper.reopen(self.root, '../outside.md')
        with self.assertRaises(ValueError): self.paper.reopen(self.root, 'tasks/999-missing.md')


if __name__ == '__main__':
    unittest.main()
