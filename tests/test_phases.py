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
        self.assertIn('Add a Files: line in Planning, then Start Building', refusal('implementation', self.root, 'write_file', {'path': 'app.py'}, cwd=self.root, task='# 001: No Files', approved=True))

    def test_refusals_say_what_did_not_happen(self):
        """Task 263: a refused command did not run and a refused plan was not proposed; neither was "Not written"."""
        for phase in ('discussion', 'planning'):
            said = self.check(phase, 'execute_command', {'command': 'touch app.py'}, pi_tool='bash')
            self.assertTrue(said.startswith('Not run:'), said)
        said = self.check('implementation', 'execute_command', {'command': 'touch app.py'}, pi_tool='bash')
        self.assertTrue(said.startswith('Not run:'), said); self.assertIn('001: Count', said)
        from gate.phases import refusal
        said = refusal('implementation', self.root, 'execute_command', {'command': 'touch app.py'}, cwd=self.root, pi_tool='bash')
        self.assertTrue(said.startswith('Not run:'), said)
        said = self.check('discussion', 'read_file', {}, pi_tool='propose_plan')
        self.assertTrue(said.startswith('Not proposed:'), said)
        self.assertTrue(self.check('discussion', 'write_file', {'path': 'app.py'}, pi_tool='write').startswith('Not written:'))

    def test_plan_proposal_is_not_a_read_only_tool(self):
        self.assertIn('Discussion', self.check('discussion', 'read_file', {}, pi_tool='propose_plan'))
        self.assertIsNone(self.check('planning', 'read_file', {}, pi_tool='propose_plan'))
        self.assertIsNotNone(self.check('implementation', 'read_file', {}, pi_tool='propose_plan'))

    def test_symlink_never_expands_the_permission(self):
        outside = self.root.parent / ('phase-outside-' + self.root.name)
        (self.root / 'tasks' / 'outside.md').symlink_to(outside)
        self.assertIn('Planning', self.check('planning', 'write_file', {'path': 'tasks/outside.md'}, pi_tool='write'))

    def test_implementation_can_run_tests_but_cannot_hide_a_write_in_the_command(self):
        for command in ['python3 -m unittest', 'uv run --offline pytest', 'node --test tests/test_count.mjs']:
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

    def test_unregistered_folder_still_starts_in_discussion(self):
        outside=tempfile.TemporaryDirectory();self.addCleanup(outside.cleanup);folder=Path(outside.name)
        result=self.ledger.propose('write_file',{'path':'app.py','content':'x=1'},'admin',cwd=str(folder),pi_tool='write')
        self.assertEqual(result.get('phase'),'discussion')
        # Task 263: the refusal says the folder is not a project and how to make it one, not "press ⇧⌘2" (no phase button there).
        self.assertIn('is not a project',result['reason']);self.assertIn('ROADMAP.md',result['reason']);self.assertNotIn('⇧⌘2',result['reason'])
        shell=self.ledger.propose('execute_command',{'command':'touch app.py'},'admin',cwd=str(folder),pi_tool='bash')
        self.assertIn('is not a project',shell['reason']);self.assertIn('Not run',shell['reason'])
        inside=self.propose('write_file',{'path':'app.py','content':'x=1'},pi_tool='write')
        self.assertNotIn('is not a project',inside['reason'],'a project in Discussion keeps the phase refusal')

    def test_publication_audit_only_runs_for_its_approved_task_and_project(self):
        paper=self.ledger.paperwork;task='tasks/002-ready-to-publish.md'
        (self.root/task).write_text('# 002: Ready to publish\nKind: code\nPlan approved: chosen 2026-10-17\n')
        paper.plan_state(self.root,{'tasks':[task],'approved':True,'index':0,'digest':paper.plan_digest(self.root,[task])})
        paper.phases.choose(self.root,'implementation',actor='person',planned=True)
        self.assertEqual(self.propose('read_file',{'command':'audit','args':''},'harness')['outcome'],'ALLOW')
        self.assertEqual(self.propose('read_file',{'command':'audit','args':str(self.root.parent)},'harness')['rule'],'G-015')

    def test_G015_is_checked_again_immediately_after_a_phase_change(self):
        first = self.propose('write_file', {'path': 'app.py', 'content': 'x=1\n'}, 'write')
        self.assertEqual(first.get('phase'), 'discussion')
        self.assertEqual(first.get('rule'), 'G-015')
        self.ledger.paperwork.phases.choose(self.root, 'planning', actor='person')
        self.assertEqual(self.propose('write_file', {'path': 'app.py', 'content': 'x=1\n'}, 'write')['phase'], 'planning')
        self.assertEqual(self.propose('write_file', {'path': 'tasks/002.md', 'content': '# Task\n'}, 'write')['outcome'], 'ALLOW')
        self.assertEqual(self.propose('execute_command', {'command': 'cat app.py'})['outcome'], 'ALLOW')
        self.assertEqual(self.propose('execute_command', {'command': 'python3 -c "print(1)"'})['phase'], 'planning')

    def test_harness_changes_are_writes_even_with_auto_on(self):
        from harness.autonomy import set_enabled
        set_enabled(self.data,True,confirmed=True)
        for args in [{'command':'config','args':'set effort low'}, {'command':'models','args':'pull x'}, {'command':'ollama','args':'restart'}, {'command':'audit','args':''}]:
            result=self.propose('read_file',args,'harness')
            self.assertEqual(result.get('phase'),'discussion',result)
            self.assertEqual(result.get('rule'),'G-015')
        self.assertEqual(self.propose('read_file',{'command':'config','args':''},'harness')['outcome'],'ALLOW')

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
            self.assertEqual(paper.start_building(root)['phase'],'implementation')
            self.assertTrue(paper.active_scope(root))
            self.assertIn('Plan approved: chosen',(root/task).read_text())
            self.assertEqual(paper.phase(root,'discussion',action='/discuss')['history'][-1]['action'],'/discuss')
            self.assertEqual(paper.start_building(root)['phase'],'implementation')


class PhaseApprovalReviewTest(unittest.TestCase):
    def test_phase_endpoint_cannot_approve_a_pending_plan_even_with_start_building_label(self):
        from gate.paperwork import Paperwork
        from gate.protocol import Protocol
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder).resolve();(root/'tasks').mkdir();(root/'ROADMAP.md').write_text('# Plan')
            task='tasks/001.md';file=root/task;file.write_text('# Count\nFiles: app.py\nDone when: Clicks count.\n')
            paper=Paperwork(Protocol());paper.phases.choose(root,'planning',actor='person')
            paper.plan_state(root,{'tasks':[task],'pending':True,'digest':paper.plan_digest(root,[task])})
            for action in ['phase button','Start Building','/build']:
                with self.assertRaises(ValueError):paper.phase(root,'implementation',action=action)
                self.assertNotIn('Plan approved:',file.read_text())
                self.assertTrue(paper.plan_state(root)['pending'])
                self.assertEqual(paper.phases.get(root)['phase'],'planning')


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


class RegisteredPhaseTest(unittest.TestCase):
    def setUp(self):
        from harness.documents import DocumentStore
        from gate.engine import GateEngine
        from gate.ledger import ProposalLedger
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.home=Path(self.temp.name).resolve();self.root=self.home/'app';self.root.mkdir()
        self.store=DocumentStore(self.home/'data');self.project=self.store.register(str(self.root))
        self.ledger=ProposalLedger(GateEngine('','/dev/null'),events_file=self.store.root/'events.jsonl')
        self.ledger.paperwork.projects=self.store

    def test_absolute_target_from_outside_project_obeys_target_phase_without_plan_files(self):
        for phase in ['discussion','planning']:
            if phase=='planning':self.ledger.paperwork.phases.choose(self.root,phase,actor='person')
            for tool in ['write','edit']:
                result=self.ledger.propose('write_file',{'path':str(self.root/'app.py'),'content':'x=1'},'admin',pi_tool=tool,cwd=str(self.home))
                self.assertEqual(result.get('phase'),phase,result)
                self.assertEqual(result.get('rule'),'G-015')
        result=self.ledger.propose('write_file',{'path':str(self.root/'ROADMAP.md'),'content':'# Plan'},'admin',pi_tool='write',cwd=str(self.home))
        self.assertEqual(result['outcome'],'ALLOW')

    def test_registered_folder_has_controls_before_plan_exists_and_after_plan_is_broken(self):
        paper=self.ledger.paperwork
        self.assertEqual(paper.phase(self.root)['phase'],'discussion')
        self.assertEqual(paper.phase(self.root,'planning')['phase'],'planning')
        (self.root/'ROADMAP.md').write_text('# Plan')
        self.assertEqual(paper.phase(self.root)['phase'],'planning')
        result=self.ledger.propose('execute_command',{'command':'touch app.py'},'admin',cwd=str(self.root))
        self.assertEqual(result.get('phase'),'planning')

    def test_absolute_target_in_another_project_does_not_use_cwd_permission(self):
        other=self.home/'other';other.mkdir();self.store.register(str(other))
        self.ledger.paperwork.phases.choose(self.root,'planning',actor='person')
        result=self.ledger.propose('write_file',{'path':str(other/'ROADMAP.md'),'content':'# Plan'},'admin',pi_tool='write',cwd=str(self.root))
        self.assertEqual(result.get('phase'),'discussion')

    def test_phase_and_approved_plan_follow_stable_registration_after_rename(self):
        paper=self.ledger.paperwork
        (self.root/'tasks').mkdir();(self.root/'ROADMAP.md').write_text('# Plan')
        task='tasks/001.md';(self.root/task).write_text('# Count\nPlan approved: chosen fixture\nFiles: app.py\n')
        paper.plan_state(self.root,{'tasks':[task],'approved':True,'index':0,'digest':paper.plan_digest(self.root,[task])})
        paper.phases.choose(self.root,'implementation',actor='person',planned=True)
        saved=paper.phases.get(self.root)
        self.store.rename_project(self.project,'renamed')
        moved=self.store.project_path(self.project)
        self.assertEqual(paper.phases.get(moved),saved)
        self.assertTrue(paper.active_scope(moved))
        self.assertEqual(paper.project_root(moved/'app.py'),moved)

    def test_old_path_based_records_migrate_before_a_move(self):
        from gate.paperwork import Paperwork
        from gate.protocol import Protocol
        legacy=Paperwork(Protocol(),data=self.store.root)
        legacy.phases.choose(self.root,'planning',actor='person')
        legacy.plan_state(self.root,{'pending':True,'tasks':[]})
        legacy.save_choice(self.root,{'pending':True,'question':'Which?'})
        paper=self.ledger.paperwork
        self.store.rename_project(self.project,'renamed')
        moved=self.store.project_path(self.project)
        self.assertEqual(paper.phases.get(moved)['phase'],'planning')
        self.assertTrue(paper.plan_state(moved)['pending'])
        self.assertEqual(paper.waiting_choice(moved)['question'],'Which?')

    def test_unregistered_legacy_project_is_found_from_absolute_target(self):
        other=self.home/'legacy';other.mkdir();(other/'tasks').mkdir();(other/'ROADMAP.md').write_text('# Plan')
        result=self.ledger.propose('write_file',{'path':str(other/'app.py'),'content':'x=1'},'admin',pi_tool='write',cwd=str(self.home))
        self.assertEqual(result.get('phase'),'discussion')

    def test_shell_from_home_cannot_write_into_a_registered_project(self):
        result=self.ledger.propose('execute_command',{'command':'touch '+str(self.root/'app.py')},'admin',pi_tool='bash',cwd=str(self.home))
        self.assertEqual(result.get('phase'),'discussion')
        self.assertEqual(result.get('rule'),'G-015')


class Round11LifecycleTest(unittest.TestCase):
    def setUp(self):
        from gate.paperwork import Paperwork
        from gate.protocol import Protocol
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name).resolve();(self.root/'tasks').mkdir();(self.root/'ROADMAP.md').write_text('# Plan\n## Goal\nCount.\n')
        self.tasks=['tasks/001.md','tasks/002.md']
        for path in self.tasks:(self.root/path).write_text('# Count\nKind: code\nFiles: app.py\n- [ ] Works\nDone when: Counts.\n')
        self.paper=Paperwork(Protocol());self.paper.phases.choose(self.root,'planning',actor='person')
        self.paper.plan_state(self.root,{'tasks':self.tasks,'pending':True,'digest':self.paper.plan_digest(self.root,self.tasks)})

    def test_text_yes_never_approves_or_accepts(self):
        self.paper.start('yes',str(self.root),'yes')
        self.assertTrue(self.paper.plan_state(self.root)['pending'])
        self.assertEqual(self.paper.phases.get(self.root)['phase'],'planning')

    def test_review_selection_keeps_unchecked_tasks_waiting_and_last_acceptance_is_explicit(self):
        self.paper.start_building(self.root,selected=[self.tasks[1]])
        plan=self.paper.plan_state(self.root)
        self.assertEqual(plan['tasks'],[self.tasks[1]])
        self.assertEqual(plan['waiting'],[self.tasks[0]])
        self.assertFalse(self.paper.phase(self.root)['pending'])
        self.assertNotIn('Plan approved:',(self.root/self.tasks[0]).read_text())
        plan.update(check_in=True,verified=True);self.paper.plan_state(self.root,plan)
        self.paper.accept_task(self.root,action='stop')
        self.assertTrue(self.paper.plan_state(self.root)['check_in'])
        self.assertFalse(self.paper.plan_state(self.root)['finished'])
        result=self.paper.accept_task(self.root)
        self.assertTrue(result['finished'])
        self.assertEqual(self.paper.phases.get(self.root)['phase'],'implementation')
        self.paper.phase(self.root,'discussion')
        self.assertEqual([task['path'] for task in self.paper.phase(self.root)['tasks']],[self.tasks[0]])

    def test_empty_or_foreign_selection_cannot_approve(self):
        for selected in [[],['tasks/outside.md']]:
            with self.assertRaises(ValueError):self.paper.start_building(self.root,selected=selected)
        self.assertTrue(self.paper.plan_state(self.root)['pending'])

    def test_only_the_person_can_accept_an_unverified_task_without_changing_its_evidence(self):
        self.paper.start_building(self.root)
        plan=self.paper.plan_state(self.root);plan.update(check_in=True,verified=False);self.paper.plan_state(self.root,plan)
        with self.assertRaises(ValueError):self.paper.accept_task(self.root,state='auto')
        self.paper.accept_task(self.root)
        self.assertFalse(self.paper.plan_state(self.root)['verified'])

    def test_system_one_lays_out_tasks_from_content_and_ignores_model_tick_claims(self):
        self.paper.start('layout',str(self.root),'Plan a counter')
        value=self.paper.propose_plan('layout',{'goal':'A counter','tasks':[{'title':'Count clicks','kind':'code','files':['app.py','tests/'],'done_when':'A click increments the count.','content':'Check a click. Implement the handler.'}]})
        text=(self.root/value['tasks'][0]['path']).read_text()
        self.assertIn('- [ ] Red:',text);self.assertIn('- [ ] Green:',text)
        self.assertIn('Files: app.py, tests/',text)

    def test_propose_plan_keeps_roadmap_lines_when_no_heading_follows_the_goal(self):
        """Task 263 (review P2): the Goal section ran to the end of the file and its task lines were erased."""
        (self.root/'ROADMAP.md').write_text('# Counter\n\n## Goal\nOld goal.\n\n- [x] [001-Old work](tasks/001-old.md)\n* [ ] [002-Still open](tasks/002-open.md)\n')
        (self.root/'tasks/001-old.md').write_text('# 001: Old work\n\nKind: docs\nFiles: README.md\n\nDone when: It was done.\n\n- [x] Done\n')
        (self.root/'tasks/002-open.md').write_text('# 002: Still open\n\nKind: code\nFiles: app.py\n\nDone when: It is open.\n\n- [ ] Red: a test fails for this change.\n- [ ] Green: the test passes with this change.\n')
        self.paper.start('keep',str(self.root),'Plan a counter')
        self.paper.propose_plan('keep',{'goal':'A better counter','tasks':[{'title':'Count clicks','kind':'code','files':['app.py'],'done_when':'A click counts.','content':'Check a click.'}]})
        roadmap=(self.root/'ROADMAP.md').read_text()
        self.assertIn('- [x] [001-Old work](tasks/001-old.md)',roadmap)
        self.assertIn('* [ ] [002-Still open](tasks/002-open.md)',roadmap)
        self.assertIn('A better counter',roadmap);self.assertNotIn('Old goal.',roadmap)

    def test_music_reads_and_scoped_outputs_obey_phase(self):
        from gate.phases import refusal
        args={'action':'create','name':'robot'}
        self.assertIsNone(refusal('discussion',self.root,'write_file',{'action':'template'},cwd=str(self.root),pi_tool='music'))
        # Task 291: a new composition is a new revision folder under assets/music/, allowed in every phase.
        self.assertIsNone(refusal('discussion',self.root,'write_file',args,cwd=str(self.root),pi_tool='music'))
        self.assertIsNone(refusal('implementation',self.root,'write_file',args,cwd=str(self.root),pi_tool='music',task='Files: assets/music/robot/\n',approved=True))
        self.assertIsNone(refusal('implementation',self.root,'write_file',args,cwd=str(self.root),pi_tool='music',task='Files: app.py\n',approved=True))
        (self.root/'assets/music/robot').mkdir(parents=True)
        self.assertIsNotNone(refusal('discussion',self.root,'write_file',args,cwd=str(self.root),pi_tool='music'))

    def test_model_cannot_tick_task_boxes_even_inside_planning(self):
        from gate.engine import GateEngine
        from gate.ledger import ProposalLedger
        ledger=ProposalLedger(GateEngine('','/dev/null'))
        ledger.paperwork=self.paper
        path=self.root/self.tasks[0]
        result=ledger.propose('write_file',{'path':str(path),'oldText':'- [ ] Works','newText':'- [x] Works'},'admin',pi_tool='edit',cwd=str(self.root))
        self.assertEqual(result.get('rule'),'G-010')

    def test_model_cannot_create_its_own_task_layout(self):
        from gate.engine import GateEngine
        from gate.ledger import ProposalLedger
        ledger=ProposalLedger(GateEngine('','/dev/null'));ledger.paperwork=self.paper
        result=ledger.propose('write_file',{'path':str(self.root/'tasks/003.md'),'content':'# Pretend\n- [x] I judged this done\n'},'admin',pi_tool='write',cwd=str(self.root))
        self.assertEqual(result.get('rule'),'G-010')
