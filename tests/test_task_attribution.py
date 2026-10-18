"""Task 324 (live 2026-10-19, project "Habit Tracker"): the paperwork belongs to the right task.

Live: Start Building ticked the planning task and stamped the plan into the task files but committed nothing, so a later
request's commit swept the approval in. Then, in Implementation, "Continue task 1: …" named tasks/001 (the done planning
task, "task 1" by number), the model ran a capability test that already passed and wrote nothing, and the harness wrote
"Green" into task 001, ticked it, committed "Plan this app (task 001, plan)" and showed "Done". Task 003, the approved
task in progress, got no check-in.

Each project here is a scratch Project Start project (the workbench's first planning task, the publication audit, one
capability test that passes) in a real git repository; the data folder is scratch."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:
    from tests import isolation  # noqa: F401
import subprocess
import tempfile
import unittest
from pathlib import Path

from gate.paperwork import Paperwork
from gate.protocol import Protocol
from kit.new_project import initial_plan
from kit.publish_audit import ensure_task

CAP_TEST = 'python3 -m unittest tests.test_cap_database'
PLANNED = ['tasks/003-data-model-and-database-schema.md', 'tasks/004-habit-list-screen.md',
           'tasks/005-daily-check-off.md', 'tasks/006-streaks.md']
CONTINUE = 'Continue task 1: add the habits and daily_logs tables and their functions to app/db.py, with a test in tests/.'


def git(root, *args):
    return subprocess.run(['git', '-C', str(root), *args], capture_output=True, text=True, check=True).stdout


class HabitTracker(unittest.TestCase):
    """Project Start → Planning → Start Building, as the live session did it."""

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.data = tempfile.TemporaryDirectory(); self.addCleanup(self.data.cleanup)
        self.root = Path(self.temp.name).resolve() / 'Habit Tracker'
        (self.root / 'tasks').mkdir(parents=True); (self.root / 'app').mkdir(); (self.root / 'tests').mkdir()
        for name, text in initial_plan('Habit Tracker').items(): (self.root / name).write_text(text)
        ensure_task(self.root)
        (self.root / 'app/__init__.py').write_text(''); (self.root / 'tests/__init__.py').write_text('')
        (self.root / 'app/db.py').write_text('def connect():\n    return "db"\n')
        (self.root / 'tests/test_cap_database.py').write_text(
            'import unittest\nfrom app import db\n\n\nclass Cap(unittest.TestCase):\n    def test_connect(self):\n        self.assertEqual(db.connect(), "db")\n')
        git(self.root, 'init', '-q'); git(self.root, 'add', '-A')
        git(self.root, '-c', 'user.name=Pi Workbench', '-c', 'user.email=pi-workbench@localhost', 'commit', '-qm', 'Start from Project Start')
        self.protocol = Protocol(Path(self.data.name) / 'runs.json')
        self.paper = Paperwork(self.protocol, data=self.data.name, identity=('Pi Workbench', 'pi-workbench@localhost'))

    def head(self):
        return git(self.root, 'rev-parse', 'HEAD').strip()

    def status(self):
        return git(self.root, 'status', '--porcelain', '--untracked-files=all').splitlines()

    def plan(self):
        self.paper.phases.choose(self.root, 'planning', actor='person')
        self.paper.start('plan', str(self.root), 'Plan the habit tracker app')
        files = ['app/db.py', 'tests/test_db.py']
        self.paper.propose_plan('plan', {'goal': 'Track daily habits.', 'tasks': [
            {'kind': 'code', 'title': title, 'done_when': f'{title} works.', 'content': f'Build {title.lower()}.', 'files': files}
            for title in ('Data model and database schema', 'Habit list screen', 'Daily check-off', 'Streaks')]})
        self.paper.end('plan')
        self.assertEqual(self.paper.plan_state(self.root)['tasks'], [*PLANNED, 'tasks/002-ready-to-publish.md'])

    def build(self):
        self.plan()
        self.paper.start_building(self.root, selected=[*PLANNED, 'tasks/002-ready-to-publish.md'], request='plan')

    def only_runs_a_passing_test(self, request='later', text=CONTINUE):
        """The fake model: writes nothing, runs a capability test that already passed, and says it is done."""
        self.paper.start(request, str(self.root), text)
        self.protocol.record(str(self.root), CAP_TEST, True)
        self.paper.ran(request, CAP_TEST, True)
        self.assertIsNone(self.paper.observe(request))
        return self.paper.end(request)


class StartBuildingCommitsItsPaperwork(HabitTracker):
    def test_start_building_commits_the_approval_and_leaves_nothing_behind(self):
        self.build()
        self.assertEqual(self.status(), [], 'no approval paperwork is left for a later request to sweep in')
        subject = git(self.root, 'log', '-1', '--format=%s').strip()
        self.assertEqual(subject, 'Plan approved: 5 tasks')
        committed = git(self.root, 'show', '--name-only', '--format=', 'HEAD').split()
        for path in ['ROADMAP.md', 'tasks/001-first-task.md', 'tasks/002-ready-to-publish.md', *PLANNED]: self.assertIn(path, committed)
        self.assertIn('- [x] [001-Plan this app]', git(self.root, 'show', 'HEAD:ROADMAP.md'))
        self.assertIn('Plan approved: chosen', git(self.root, 'show', f'HEAD:{PLANNED[0]}'))
        self.assertEqual(git(self.root, 'log', '-1', '--format=%an').strip(), 'Pi Workbench')

    def test_no_commit_ever_names_a_code_task_a_plan(self):
        self.build()
        self.only_runs_a_passing_test()
        subjects = git(self.root, 'log', '--format=%s').splitlines()
        self.assertFalse([subject for subject in subjects if ', plan)' in subject], subjects)

    def test_a_plan_proposal_is_named_as_one_and_a_plan_files_commit_carries_the_tasks_own_kind(self):
        """The live planning commit was "Data model and database schema (task 003, plan)"; a request that changes only a
        task's plan file is committed with the task's Kind in the title."""
        self.plan()
        self.assertEqual(git(self.root, 'log', '-1', '--format=%s').strip(), 'Plan proposed: 5 tasks')
        (self.root / 'tasks/007-old-idea.md').write_text('# 007: Old idea\n\nKind: code\n\n- [ ] Try it\n\nDone when: Tried.\n')
        git(self.root, 'add', '-A'); git(self.root, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'old idea')
        self.paper.start('edit', str(self.root), 'Reword task 7')
        task = self.root / 'tasks/007-old-idea.md'; task.write_text(task.read_text().replace('Tried.', 'Tried twice.'))
        result = self.paper.end('edit')
        self.assertEqual(result['outcome'], 'committed', result)
        self.assertEqual(git(self.root, 'log', '-1', '--format=%s').strip(), 'Old idea (task 007, code)')


class TheTaskInProgressGetsTheWork(HabitTracker):
    def test_a_passing_old_test_and_no_change_is_not_verified_for_the_task_in_progress(self):
        self.build()
        first = (self.root / 'tasks/001-first-task.md').read_text(); head = self.head()
        result = self.only_runs_a_passing_test()
        self.assertEqual(result['outcome'], 'not verified', result)
        self.assertEqual(result['task'], PLANNED[0])
        card = result['check_in']
        self.assertEqual((card['task'], card['verified'], card['retry'], card['question'], card['number'], card['total']),
                         (PLANNED[0], False, True, 'Retry Task', 1, 5))
        self.assertIn('already passed', result['reason'])
        self.assertEqual((self.root / 'tasks/001-first-task.md').read_text(), first, 'the done planning task is untouched')
        self.assertEqual(self.head(), head, 'nothing is committed')
        self.assertEqual(self.status(), [], 'and nothing is left behind')
        plan = self.paper.plan_state(self.root)
        self.assertEqual((plan['check_in'], plan['verified'], plan['index']), (True, False, 0))

    def test_a_named_planning_task_or_a_task_outside_the_plan_is_never_the_requests_task(self):
        self.build()
        (self.root / 'tasks/007-old-idea.md').write_text('# 007: Old idea\n\nKind: code\n\n- [ ] Try it\n\nDone when: Tried.\n')
        git(self.root, 'add', '-A'); git(self.root, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'old idea')
        for request, text in (('one', 'Continue task 1, please.'), ('seven', 'Work on task 7 now.'), ('path', 'Look at tasks/001-first-task.md')):
            self.paper.start(request, str(self.root), text)
            item = self.paper.requests[request]
            self.assertIsNone(item['task'], text); self.assertEqual(item.get('candidate'), PLANNED[0], text)
            self.paper.pause(request)

    def test_a_test_run_is_recorded_on_the_task_in_progress_and_real_work_is_verified(self):
        self.build()
        first = (self.root / 'tasks/001-first-task.md').read_text()
        self.paper.start('work', str(self.root), CONTINUE)
        (self.root / 'tests/test_db.py').write_text(
            'import unittest\nfrom app import db\n\n\nclass Habits(unittest.TestCase):\n    def test_habits(self):\n        self.assertEqual(db.habits(), [])\n')
        test = 'python3 -m unittest tests.test_db'
        self.protocol.record(str(self.root), test, False); self.paper.ran('work', test, False)
        self.assertIn(f'Red: `{test}` failed', (self.root / PLANNED[0]).read_text())
        (self.root / 'app/db.py').write_text('def connect():\n    return "db"\n\n\ndef habits():\n    return []\n')
        self.paper.observe('work')
        self.protocol.record(str(self.root), test, True); self.paper.ran('work', test, True)
        result = self.paper.end('work')
        self.assertEqual(result['outcome'], 'committed', result)
        self.assertEqual(result['check_in']['task'], PLANNED[0])
        self.assertEqual((self.root / 'tasks/001-first-task.md').read_text(), first)
        committed = set(git(self.root, 'show', '--name-only', '--format=', 'HEAD').split())
        self.assertEqual(committed, {'app/db.py', 'tests/test_db.py', PLANNED[0], 'ROADMAP.md'})
        self.assertEqual(git(self.root, 'log', '-1', '--format=%s').strip(), 'Data model and database schema (task 003)')

    def test_a_question_that_runs_nothing_still_raises_no_check_in(self):
        self.build()
        self.paper.start('ask', str(self.root), 'What does app/db.py do?')
        result = self.paper.end('ask')
        self.assertEqual(result['outcome'], 'nothing changed')
        self.assertFalse(self.paper.plan_state(self.root)['check_in'])


class RunOnItsOwn(HabitTracker):
    def setUp(self):
        super().setUp()
        from harness.autonomy import set_enabled
        set_enabled(self.data.name, True, confirmed=True)

    def test_the_same_flow_under_run_on_its_own(self):
        self.plan()
        self.paper.start('auto', str(self.root), 'Plan the habit tracker app')
        self.paper.approve_plan('auto', 'auto')
        self.paper.pause('auto')
        self.assertEqual(self.status(), [], 'the automatic approval is committed too')
        self.assertEqual(git(self.root, 'log', '-1', '--format=%s').strip(), 'Plan approved: 5 tasks')
        first = (self.root / 'tasks/001-first-task.md').read_text(); head = self.head()
        result = self.only_runs_a_passing_test()
        self.assertEqual((result['outcome'], result['task'], result['check_in']['task']), ('not verified', PLANNED[0], PLANNED[0]))
        self.assertEqual((self.root / 'tasks/001-first-task.md').read_text(), first)
        self.assertEqual(self.head(), head)
        with self.assertRaises(ValueError): self.paper.accept_task(self.root, 'accept', 'auto')  # waits for the person
        self.assertIn('report', result)


if __name__ == '__main__':
    unittest.main()
