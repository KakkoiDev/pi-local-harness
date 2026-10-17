"""Project phases persist atomically and only authorised actors can move them (task 247)."""
try:
    import isolation  # noqa: F401
except ModuleNotFoundError:
    from tests import isolation  # noqa: F401
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from gate.phases import Phases


class PhaseTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / 'project'; self.root.mkdir()
        self.data = Path(self.temp.name) / 'data'
        self.phases = Phases(self.data)

    def test_default_and_restart_share_the_canonical_project(self):
        self.assertEqual(self.phases.get(self.root)['phase'], 'discussion')
        saved = self.phases.choose(self.root, 'planning', actor='person', action='/plan')
        self.assertEqual(saved['phase'], 'planning')
        self.assertEqual(Phases(self.data).get(self.root / '.') , saved)
        self.assertEqual(self.phases.get(self.root.parent / 'another')['phase'], 'discussion')
        self.assertEqual(saved['history'][-1]['actor'], 'person')
        self.assertEqual(saved['history'][-1]['action'], '/plan')
        self.assertTrue(saved['history'][-1]['at'])

    def test_model_cannot_choose_and_auto_only_starts_building(self):
        for actor in ['model', 'code', '', None]:
            with self.assertRaises(ValueError):
                self.phases.choose(self.root, 'planning', actor=actor)
        with self.assertRaises(ValueError):
            self.phases.choose(self.root, 'implementation', actor='auto', planned=True)
        self.phases.choose(self.root, 'planning', actor='person')
        built = self.phases.choose(self.root, 'implementation', actor='auto', planned=True)
        self.assertEqual(built['history'][-1]['actor'], 'auto')
        for phase in ['discussion', 'planning']:
            with self.assertRaises(ValueError):
                self.phases.choose(self.root, phase, actor='auto', planned=True)
        self.assertEqual(self.phases.get(self.root), built)

    def test_build_needs_tasks_and_unknown_phase_never_saves(self):
        for phase in ['implementation', 'check', 'Planning', '']:
            with self.assertRaises(ValueError):
                self.phases.choose(self.root, phase, actor='person')
        self.assertFalse(self.data.exists())
        self.phases.choose(self.root, 'implementation', actor='person', planned=True)
        self.assertEqual(self.phases.get(self.root)['phase'], 'implementation')

    def test_failed_atomic_save_keeps_the_previous_phase_and_history(self):
        before = self.phases.choose(self.root, 'planning', actor='person')
        with patch.object(Path, 'replace', side_effect=OSError('disk full')):
            with self.assertRaises(OSError):
                self.phases.choose(self.root, 'implementation', actor='person', planned=True)
        self.assertEqual(Phases(self.data).get(self.root), before)

    def test_reselecting_current_phase_does_not_duplicate_history(self):
        before = self.phases.choose(self.root, 'planning', actor='person')
        self.assertEqual(self.phases.choose(self.root, 'planning', actor='person'), before)


class PhasePermissionTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve(); (self.root / 'tasks').mkdir()
        self.task = '# 001: Count\nFiles: app.py, tests/\n'

    def check(self, phase, tool, args, **extra):
        from gate.phases import refusal
        return refusal(phase, self.root, tool, args, cwd=self.root, task=self.task, approved=True, **extra)

    def test_discussion_reads_but_never_writes_even_small_fixes(self):
        for tool, args in [('read_file', {'path': 'app.py'}), ('execute_command', {'command': 'rg -n count app.py'})]:
            self.assertIsNone(self.check('discussion', tool, args))
        for tool, args in [('write_file', {'path': 'README.md'}), ('write_file', {'path': 'ROADMAP.md'}),
                           ('execute_command', {'command': 'touch app.py'}), ('execute_command', {'command': 'pytest'})]:
            self.assertIn('Discussion', self.check('discussion', tool, args))

    def test_planning_is_exactly_the_project_plan_and_task_markdown(self):
        for path in ['ROADMAP.md', 'tasks/002-count.md']:
            self.assertIsNone(self.check('planning', 'write_file', {'path': path}, pi_tool='write'))
        for path in ['README.md', 'app.py', 'other/ROADMAP.md', 'tasks/script.py', '../ROADMAP.md']:
            self.assertIn('Planning', self.check('planning', 'write_file', {'path': path}, pi_tool='write'))
        self.assertIn('Planning', self.check('planning', 'write_file', {}, pi_tool='browser'))
        self.assertIn('Planning', self.check('planning', 'write_file', {}, pi_tool='music'))
        self.assertIsNone(self.check('planning', 'execute_command', {'command': 'cat app.py | head -n 20'}))

    def test_implementation_needs_approved_scope_not_the_models_claim(self):
        from gate.phases import refusal
        for path in ['app.py', 'tests/test_count.py']:
            self.assertIsNone(self.check('implementation', 'write_file', {'path': path}, pi_tool='write'))
        for path in ['admin.py', '../app.py', str(self.root.parent / 'app.py')]:
            self.assertIn('not part of task', self.check('implementation', 'write_file', {'path': path}, pi_tool='write'))
        self.assertIn('No approved task', refusal('implementation', self.root, 'write_file', {'path': 'app.py'}, cwd=self.root))
        self.assertIn('not part of task', refusal('implementation', self.root, 'write_file', {'path': 'app.py'}, cwd=self.root, task='# 001: No Files', approved=True))

    def test_plan_proposal_is_not_a_read_only_tool(self):
        self.assertIn('Discussion', self.check('discussion', 'read_file', {}, pi_tool='propose_plan'))
        self.assertIsNone(self.check('planning', 'read_file', {}, pi_tool='propose_plan'))
        self.assertIsNotNone(self.check('implementation', 'read_file', {}, pi_tool='propose_plan'))

    def test_symlink_never_expands_the_permission(self):
        outside = self.root.parent / ('phase-outside-' + self.root.name)
        (self.root / 'tasks' / 'outside.md').symlink_to(outside)
        self.assertIn('Planning', self.check('planning', 'write_file', {'path': 'tasks/outside.md'}, pi_tool='write'))

    def test_implementation_can_run_tests_but_cannot_hide_a_write_in_the_command(self):
        for command in ['python3 -m unittest', 'uv run pytest', 'node --test tests/test_count.mjs']:
            self.assertIsNone(self.check('implementation', 'execute_command', {'command': command}))
        for command in ['pytest; touch admin.py', 'node --test --import ./admin.mjs', 'pytest > admin.py']:
            self.assertIsNotNone(self.check('implementation', 'execute_command', {'command': command}))


class PhaseGateTest(unittest.TestCase):
    """G-015: the persisted phase, never request wording, controls the next tool call."""
    def setUp(self):
        from gate.engine import GateEngine
        from gate.ledger import ProposalLedger
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve(); (self.root / 'tasks').mkdir()
        (self.root / 'ROADMAP.md').write_text('# Counter\n\n## Goal\nCount clicks.\n')
        self.task = 'tasks/001-count.md'
        (self.root / self.task).write_text('# 001: Count\n\nPlan approved: chosen 2026-10-17\nFiles: app.py, tests/\n- [ ] Count\nDone when: Clicks are counted.\n')
        self.data = self.root / 'data'; self.data.mkdir()
        self.ledger = ProposalLedger(GateEngine('', str(self.data / 'audit.log')), events_file=self.data / 'gate-events.jsonl')

    def propose(self, tool, args, pi_tool=None):
        return self.ledger.propose(tool, args, 'admin', cwd=str(self.root), pi_tool=pi_tool)

    def test_G015_is_checked_again_immediately_after_a_phase_change(self):
        first = self.propose('write_file', {'path': 'app.py', 'content': 'x=1\n'}, 'write')
        self.assertEqual(first.get('phase'), 'discussion')
        self.assertEqual(first.get('rule'), 'G-015')
        self.ledger.paperwork.phases.choose(self.root, 'planning', actor='person')
        self.assertEqual(self.propose('write_file', {'path': 'app.py', 'content': 'x=1\n'}, 'write')['phase'], 'planning')
        self.assertEqual(self.propose('write_file', {'path': 'tasks/002.md', 'content': '# Task\n'}, 'write')['outcome'], 'ALLOW')
        self.assertEqual(self.propose('execute_command', {'command': 'cat app.py'})['outcome'], 'ALLOW')
        self.assertEqual(self.propose('execute_command', {'command': 'python3 -c "print(1)"'})['phase'], 'planning')

    def test_G015_uses_only_the_recorded_approved_task_scope(self):
        paper = self.ledger.paperwork
        paper.plan_state(self.root, {'tasks': [self.task], 'approved': True, 'index': 0,
                                    'digest': paper.plan_digest(self.root, [self.task])})
        paper.phases.choose(self.root, 'implementation', actor='person', planned=True)
        self.assertEqual(self.propose('write_file', {'path': 'app.py', 'content': 'x=1\n'}, 'write')['outcome'], 'ALLOW')
        self.assertEqual(self.propose('write_file', {'path': 'admin.py', 'content': 'x=1\n'}, 'write')['phase'], 'implementation')
        task = self.root / self.task; task.write_text(task.read_text().replace('Files: app.py, tests/', 'Files: admin.py'))
        changed = self.propose('write_file', {'path': 'admin.py', 'content': 'x=1\n'}, 'write')
        self.assertEqual(changed['rule'], 'G-015')
        self.assertIn('No approved task', changed['reason'])



class PhaseControlTest(unittest.TestCase):
    def test_person_can_set_planning_and_build_only_a_real_pending_plan(self):
        from gate.paperwork import Paperwork
        from gate.protocol import Protocol
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder).resolve();(root/'tasks').mkdir()
            (root/'ROADMAP.md').write_text('# Plan\n## Goal\nCount clicks.\n')
            task='tasks/001-count.md';(root/task).write_text('# 001: Count\nFiles: app.py\nDone when: Clicks count.\n')
            paper=Paperwork(Protocol())
            self.assertEqual(paper.phase(root)['phase'],'discussion')
            with self.assertRaises(ValueError):paper.phase(root,'implementation')
            self.assertEqual(paper.phase(root,'planning',action='/plan')['phase'],'planning')
            paper.plan_state(root,{'tasks':[task],'pending':True,'digest':paper.plan_digest(root,[task])})
            self.assertEqual(paper.phase(root)['tasks'][0]['path'],task)
            self.assertEqual(paper.phase(root,'implementation',action='Start Building')['phase'],'implementation')
            self.assertTrue(paper.active_scope(root))
            self.assertIn('Plan approved: chosen',(root/task).read_text())
            self.assertEqual(paper.phase(root,'discussion',action='/discuss')['history'][-1]['action'],'/discuss')


class DiscussionPaperworkTest(unittest.TestCase):
    def test_choice_is_recorded_without_writing_the_discussed_project(self):
        from gate.paperwork import Paperwork
        from gate.protocol import Protocol
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder).resolve()/'project';root.mkdir();(root/'tasks').mkdir()
            (root/'ROADMAP.md').write_text('# Plan\n## Goal\nDiscuss.\n')
            paper=Paperwork(Protocol(),data=root.parent/'data')
            paper.start('discuss',str(root),'Discuss the options')
            before={str(p.relative_to(root)):p.read_bytes() for p in root.rglob('*') if p.is_file()}
            choice={'question':'Who uses it?','options':[{'label':'Me'},{'label':'Team'}],'recommended':0}
            paper.choice_pending('discuss',choice)
            answer=paper.decision('discuss','Who uses it?','Me')
            self.assertIsNone(answer['task'])
            self.assertEqual(paper.waiting_choice(root),None)
            self.assertEqual(before,{str(p.relative_to(root)):p.read_bytes() for p in root.rglob('*') if p.is_file()})
            saved=__import__('json').loads(paper.choice_file(root).read_text())
            self.assertEqual(saved['answer'],'Me')
