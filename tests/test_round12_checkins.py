"""Round 12 (tasks 260, 261, 262, 263): the check-in's evidence and Accept Anyway, what the person grants, Gate's question
for a file outside the task, the re-plan question, and the person routes that say a page is out of date.

Each project is a real git repository with real test commands; the data folders are scratch."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:
    from tests import isolation  # noqa: F401
import json
import tempfile
import unittest
from pathlib import Path

try:
    from test_trustworthy_verification import Base, SUB, SUB_TEST, git
    from test_conversation_repairs import Workbench
except ModuleNotFoundError:
    from tests.test_trustworthy_verification import Base, SUB, SUB_TEST, git
    from tests.test_conversation_repairs import Workbench
from gate.checkins import LABEL
from gate.engine import GateEngine
from gate.ledger import ProposalLedger
from gate.paperwork import Paperwork
from gate.protocol import Protocol
from gate import scope


class AcceptAnyway(Base):
    """Task 260 (R12_Verify): Retry Task stays the default; Accept Anyway… is the person's, labelled in ROADMAP.md."""
    files = 'app.py, tests/test_sub.py'

    def unverified(self):
        self.approve(('tasks/002-add-subtraction.md', 'tasks/003-add-multiply.md'))
        self.paper.start('r', str(self.root), 'Build the approved task.')
        (self.root / 'app.py').write_text(SUB); (self.root / 'notes.txt').write_text('scratch\n')
        return self.paper.end('r')

    def test_the_unverified_card_names_the_files_outside_the_task_and_retries_by_default(self):
        result = self.unverified()
        card = result['check_in']
        self.assertEqual((card['verified'], card['retry'], card['question']), (False, True, 'Retry Task'))
        self.assertEqual(card['outside'], ['notes.txt'], 'changed files not in its Files are named')
        self.assertEqual((card['number'], card['total'], card['title']), (1, 2, 'Add subtraction'))

    def test_accept_anyway_checks_the_boxes_labels_the_roadmap_line_commits_and_moves_on(self):
        self.unverified()
        with self.assertRaises(ValueError): self.paper.accept_task(self.root, 'anyway', 'auto')
        before = self.head()
        result = self.paper.accept_task(self.root, 'anyway')
        self.assertEqual((result['anyway'], result['finished'], result['next']), (True, False, 'tasks/003-add-multiply.md'))
        task = (self.root / 'tasks/002-add-subtraction.md').read_text()
        self.assertNotIn('- [ ]', task.split('## Progress')[0], 'its boxes are checked')
        self.assertIn('Accepted without verification at', task)
        roadmap = (self.root / 'ROADMAP.md').read_text()
        self.assertIn(f'- [x] [002-Add subtraction](tasks/002-add-subtraction.md) ({LABEL})', roadmap)
        self.assertIn('- [ ] [003-Add multiply]', roadmap)
        self.assertNotEqual(self.head(), before, 'a harness commit records it (Undo works)')
        self.assertIn(LABEL, git(self.root, 'log', '-1', '--format=%s'))
        plan = self.paper.plan_state(self.root)
        self.assertEqual((plan['index'], plan['check_in'], plan['accepted']), (1, False, 'anyway'))

    def test_reopen_takes_the_label_away_with_the_tick(self):
        self.unverified(); self.paper.accept_task(self.root, 'anyway')
        self.paper.reopen(self.root, 'tasks/002-add-subtraction.md')
        roadmap = (self.root / 'ROADMAP.md').read_text()
        self.assertIn('- [ ] [002-Add subtraction](tasks/002-add-subtraction.md)\n', roadmap)
        self.assertNotIn(LABEL, roadmap)

    def test_a_verified_task_is_not_accepted_anyway(self):
        self.approve()
        self.paper.start('r', str(self.root), 'Build the approved task.')
        (self.root / 'tests/test_sub.py').write_text(SUB_TEST)
        self.run_cmd('r', 'python3 -m unittest'); (self.root / 'app.py').write_text(SUB); self.run_cmd('r', 'python3 -m unittest')
        self.assertEqual(self.paper.end('r')['outcome'], 'committed')
        with self.assertRaisesRegex(ValueError, 'verified'): self.paper.accept_task(self.root, 'anyway')


class Evidence(Base):
    """Plan 267 (CheckInCard round 12): a done check-in carries its evidence; a weakened test says so."""
    files = 'app.py, tests/'

    def build(self, weaken=False):
        self.approve(('tasks/002-add-subtraction.md', 'tasks/003-add-multiply.md'))
        self.paper.start('r', str(self.root), 'Build the approved task.')
        (self.root / 'tests/test_sub.py').write_text(SUB_TEST)
        self.assertNotEqual(self.run_cmd('r', 'python3 -m unittest'), 0)
        (self.root / 'app.py').write_text(SUB)
        if weaken: (self.root / 'tests/test_app.py').write_text('import unittest\nclass T(unittest.TestCase):\n    def test_add(self): pass\n')
        task = self.root / 'tasks/002-add-subtraction.md'
        task.write_text(task.read_text() + '\n## For the person\n\nNotes can be subtracted.\nTried it: 3 − 1 gives 2.\n')
        self.assertEqual(self.run_cmd('r', 'python3 -m unittest'), 0)
        result = self.paper.end('r')
        self.assertEqual(result['outcome'], 'committed', result)
        return result['check_in']

    def test_a_verified_check_in_carries_the_test_run_the_tests_changed_and_tried_it(self):
        card = self.build()
        proof = card['evidence']
        self.assertEqual(proof['test'], {'command': 'python3 -m unittest'})
        self.assertEqual(proof['tests_changed'], ['tests/test_sub.py'])
        self.assertEqual(proof['tried'], '3 − 1 gives 2.')
        self.assertEqual(proof['weakened'], [])
        self.assertEqual(card['next_title'], 'Add multiply')

    def test_a_test_that_lost_its_checks_is_named(self):
        card = self.build(weaken=True)
        self.assertEqual(card['evidence']['weakened'], [{'path': 'tests/test_app.py', 'how': 'fewer checks'}])

    def test_the_run_gate_recorded_gives_counts_and_time(self):
        from gate import test_runs
        from gate.checkins import test_run
        test_runs.record(self.data.name, request='r', project=self.root, cwd=self.root, command='python3 -m unittest', exit_code=0, duration=1.25, output='Ran 4 tests in 0.1s\n\nOK\n')
        run = test_run(self.data.name, 'r', 'python3 -m unittest')
        self.assertEqual((run['passed'], run['failed'], run['seconds']), (4, 0, 1.25)); self.assertTrue(run['time'])


class ScopeWidening(unittest.TestCase):
    """Task 261 (R12_Grant): a write outside the task's Files is Gate's question to the person, never a dead end."""
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        base = Path(self.temp.name).resolve(); r = self.root = base / 'notes'; data = base / 'data'
        (r / 'tasks').mkdir(parents=True); data.mkdir()
        (r / 'ROADMAP.md').write_text('# Roadmap\n\n## Goal\nNotes.\n\n## Tasks\n- [ ] [001-Subjects](tasks/001-subjects.md)\n')
        (r / 'tasks/001-subjects.md').write_text('# 001: Subjects\n\nKind: code\nFiles: app/subjects.js, tests/\n\nDone when: notes have subjects.\n\nAdd subjects.\n\n- [ ] Red: a test fails for this change.\n- [ ] Green: the test passes with this change.\n\n## Decisions\n\n')
        git(r, 'init', '-q'); git(r, '-c', 'user.name=t', '-c', 'user.email=t@t', 'add', '-A'); git(r, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'start')
        self.ledger = ProposalLedger(GateEngine('', str(base / 'audit.log')), protocol_file=data / 'gate-protocol.json', events_file=data / 'gate-events.jsonl')
        self.paper = self.ledger.paperwork
        self.paper.plan_state(r, {'tasks': ['tasks/001-subjects.md'], 'pending': True, 'digest': self.paper.plan_digest(r, ['tasks/001-subjects.md'])})
        self.paper.start_building(r)

    def write(self, path, request='r'):
        if request not in self.paper.requests: self.paper.start(request, str(self.root), 'Build the approved task.')
        return self.ledger.propose('write_file', {'path': path, 'content': 'x\n'}, 'admin', pi_tool='write', cwd=str(self.root), request=request, assistant_text='The admin page needs the subject list too.')

    def test_a_file_outside_the_task_becomes_the_persons_question(self):
        refused = self.write('app/admin.js')
        self.assertEqual(refused['rule'], 'G-015')
        self.assertIn('Gate asks the person', refused['reason'])
        choice = refused['judgement']['choice']
        self.assertEqual(choice['question'], 'Pi wants to change a file outside task 1')
        self.assertEqual([option['label'] for option in choice['options']], ['Add to Task 1', 'Keep Out'])
        self.assertEqual(choice['scope'], {'task': 'tasks/001-subjects.md', 'title': 'Subjects', 'number': 1, 'total': 1, 'file': 'app/admin.js', 'reason': 'The admin page needs the subject list too.'})
        # Pi's ask_choices sends the question again without its scope (validateChoice): Gate keeps it and returns it.
        again = self.paper.choice_pending('r', {key: choice[key] for key in ('question', 'options', 'recommended', 'allow_other', 'system_owned')})
        self.assertEqual(again['scope']['file'], 'app/admin.js')
        self.assertEqual(again['task'], 'tasks/001-subjects.md', 'the answer resumes the task in progress, whatever “task 1” names')
        self.assertEqual(self.write('app/subjects.js')['rule'], 'G-017', 'nothing else is written while the question waits')

    def test_add_to_task_writes_the_file_into_files_and_the_plan_stays_approved(self):
        self.write('app/admin.js'); self.paper.pause('r')
        self.paper.start('r2', str(self.root), 'Choice: Pi wants to change a file outside task 1 → Add to Task 1')
        task = (self.root / 'tasks/001-subjects.md').read_text()
        self.assertIn('Files: app/subjects.js, tests/, app/admin.js\n', task)
        self.assertIn('Files: app/admin.js added at', task)
        self.assertTrue(self.paper.active_scope(self.root), 'the person’s grant keeps the plan approved')
        self.assertEqual(self.write('app/admin.js', 'r2')['outcome'], 'ALLOW')
        grant = scope.grant(self.paper, self.root, 'tasks/001-subjects.md', task)
        self.assertEqual(grant['files'], ['app/subjects.js', 'tests/'])
        self.assertEqual([(item['file'], item['source']) for item in grant['granted']], [('app/admin.js', 'your answer')])
        self.assertEqual(grant['kind_source'], 'task file')

    def test_keep_out_then_the_plan_needs_to_change(self):
        self.write('app/admin.js'); self.paper.pause('r')
        self.paper.start('r2', str(self.root), 'Choice: Pi wants to change a file outside task 1 → Keep Out')
        self.assertNotIn('app/admin.js', (self.root / 'tasks/001-subjects.md').read_text())
        refused = self.write('app/admin.js', 'r2')
        choice = refused['judgement']['choice']
        self.assertEqual(choice['question'], 'The plan needs to change')
        self.assertEqual([option['label'] for option in choice['options']], ['Re-plan', 'Keep the Plan'])
        self.assertEqual(choice['replan']['file'], 'app/admin.js')
        self.paper.pause('r2')
        self.paper.start('r3', str(self.root), 'Choice: The plan needs to change → Re-plan')
        self.assertEqual(self.paper.phases.get(self.root)['phase'], 'planning', 'the person’s answer moves the project to Planning')
        self.assertEqual(self.paper.phases.get(self.root)['history'][-1]['action'], 'Re-plan')

    def test_keep_the_plan_leaves_a_plain_refusal(self):
        self.write('app/admin.js'); self.paper.pause('r')
        self.paper.start('r2', str(self.root), 'Choice: Pi wants to change a file outside task 1 → Keep Out')
        self.write('app/admin.js', 'r2'); self.paper.pause('r2')
        self.paper.start('r3', str(self.root), 'Choice: The plan needs to change → Keep the Plan')
        refused = self.write('app/admin.js', 'r3')
        self.assertNotIn('judgement', refused); self.assertIn('is not part of task', refused['reason'])

    def test_run_on_its_own_widens_without_asking_and_the_report_names_the_file(self):
        """Run on its own takes the recommended Add to Task N; the end-of-run report lists it as a widened scope."""
        from harness.autonomy import set_enabled
        set_enabled(self.paper.data, True, confirmed=True)
        refused = self.write('app/admin.js')
        choice = refused['judgement']['choice']
        self.paper.decision('r', choice['question'], choice['options'][0]['label'], 'auto')
        self.assertIn('app/admin.js', (self.root / 'tasks/001-subjects.md').read_text())
        report = self.paper.runs.get(self.paper.runs.index()['active'][self.paper.runs.key(self.root)])
        widened = [item for item in report['decisions'] if item.get('scope_widened')]
        self.assertEqual(len(widened), 1, report['decisions'])
        self.assertEqual(widened[0]['question'], 'Widened task 1 without asking: app/admin.js added to its Files')

    def test_plans_and_git_internals_are_never_asked_about(self):
        self.assertNotIn('judgement', self.write('.git/hooks/pre-commit'))


class PlanGrant(unittest.TestCase):
    def test_kind_answered_in_a_question_is_your_answer(self):
        temp = tempfile.TemporaryDirectory(); self.addCleanup(temp.cleanup); root = Path(temp.name)
        paper = Paperwork(Protocol(root / 'runs.json'), data=root / 'data')
        paper.keep_decision(root, 'tasks/001-a.md', {'question': 'What kind of app?', 'answer': 'App with no server', 'state': 'chosen', 'at': '2026-10-18T14:05:00+09:00'})
        grant = scope.grant(paper, root, 'tasks/001-a.md', '# 001: A\n\nKind: code\nFiles: app/a.js\n')
        self.assertEqual((grant['kind'], grant['kind_source'], grant['kind_at']), ('App with no server', 'your answer', '2026-10-18T14:05:00+09:00'))
        self.assertEqual(grant['files'], ['app/a.js'])


class PersonRoutes(unittest.TestCase):
    """Task 261 (R12_Grant): a person route refused for a stale secret says so; Accept Anyway goes through its route."""
    def test_a_refused_person_route_says_the_page_is_stale(self):
        bench = Workbench(self)
        status, body = bench.call('/api/phase', {'project': bench.project, 'phase': 'planning'}, person=False)
        self.assertEqual(status, 403); self.assertIs(body['stale'], True)
        status, body = bench.call(f'/api/conversations/{bench.conversation}/check-in/accept-anyway', {'index': 0}, person=False)
        self.assertEqual(status, 403, 'Accept Anyway is a person-only control')

    def test_a_restored_check_in_is_answered_without_its_message(self):
        bench = Workbench(self); paper = bench.ledger.paperwork; folder = bench.folder
        task = sorted((folder / 'tasks').glob('*.md'))[0].relative_to(folder).as_posix()
        paper.plan_state(folder, {'tasks': [task], 'approved': True, 'index': 0, 'check_in': True, 'verified': False, 'card': {'task': task, 'verified': False}})
        status, body = bench.call(f'/api/conversations/{bench.conversation}/check-in/accept', {'restored': True})
        self.assertEqual(status, 200, body); self.assertIs(body['retry'], True)
        status, body = bench.call(f'/api/conversations/{bench.conversation}/check-in/accept', {'restored': True})
        self.assertEqual(status, 400, 'nothing waits any more')


if __name__ == '__main__':
    unittest.main()
