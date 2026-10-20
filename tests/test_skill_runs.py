"""Frozen skill contracts do not grant permissions or verify themselves."""
try:
    import isolation
except ModuleNotFoundError:
    from tests import isolation
import concurrent.futures
import json
from pathlib import Path
import tempfile
import unittest
from harness.skill_runs import SkillRuns, inspect_skill
from harness.learning import Curator

class SkillRunsTest(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.root=Path(self.tmp.name);self.skill=self.root/'skill';self.skill.mkdir()
        (self.skill/'stages').mkdir()
        (self.skill/'SKILL.md').write_text('# Fixture skill\n')
        for name in ('01-work','02-check'):(self.skill/'stages'/f'{name}.md').write_text(f'# {name}\n')
        self.phase=True;self.allowed=True;self.passed=False;self.calls=[]
        def authorize(project,request,capabilities):
            self.calls.append((project,request,capabilities));return self.phase and self.allowed
        def validate(project,request,stage):return self.passed
        self.runs=SkillRuns(self.root/'data',authorize=authorize,validators={'fixture-v1':validate})
        self.contract=inspect_skill(self.skill,source='builtin:fixture',version='1',capabilities=['read','write'],validator='fixture-v1')
    def start(self):return self.runs.start('project-a','request-a',self.contract)
    def test_inspection_never_executes_checker(self):
        marker=self.root/'marker';(self.skill/'checks').mkdir()
        (self.skill/'checks'/'evil.sh').write_text(f'touch {marker}')
        inspect_skill(self.skill,source='builtin:fixture',version='1',capabilities=['read'],validator='fixture-v1')
        self.assertFalse(marker.exists())
    def test_stage_cannot_advance_without_host_validator(self):
        run=self.start()
        with self.assertRaises(ValueError):self.runs.advance(run['id'],'project-a','request-a',self.contract,expected_stage=0)
        self.assertEqual(self.runs.resume(run['id'],'project-a','request-a',self.contract)['next'],0)
    def test_restart_and_completion_collect_only_observed_skill_evidence(self):
        run=self.start();self.passed=True
        self.runs.advance(run['id'],'project-a','request-a',self.contract,expected_stage=0)
        restarted=SkillRuns(self.root/'data',authorize=self.runs.authorize,validators=self.runs.validators)
        done=restarted.advance(run['id'],'project-a','request-a',self.contract,expected_stage=1)
        self.assertEqual(done['status'],'completed');self.assertEqual(len(done['receipts']),2)
        row=Curator(self.root/'data').retrieve('project-a')[0]
        self.assertEqual((row['status'],row['category']),('observed','skills'))
        self.assertIsNone(row['revision'])
        self.assertEqual(Curator(self.root/'data').evidence('project-a',row['id'])[0]['source'],'skill-runs/'+run['id'])
    def test_cross_project_and_request_refused(self):
        run=self.start()
        for project,request in [('project-b','request-a'),('project-a','request-b')]:
            with self.assertRaises(ValueError):self.runs.resume(run['id'],project,request,self.contract)
    def test_contract_change_refused_after_restart(self):
        run=self.start();(self.skill/'stages'/'01-work.md').write_text('changed')
        changed=inspect_skill(self.skill,source='builtin:fixture',version='1',capabilities=['read','write'],validator='fixture-v1')
        with self.assertRaises(ValueError):self.runs.resume(run['id'],'project-a','request-a',changed)
    def test_model_modified_contract_and_unknown_validator_refused(self):
        for changes in ({'validator':'agent-checker'},{'capabilities':['network']},{'stages':[]}):
            altered={**self.contract,**changes}
            with self.assertRaises(ValueError):self.runs.start('project-a','request-a',altered)
    def test_authority_rechecked_for_every_stage(self):
        run=self.start();self.passed=True;self.phase=False
        with self.assertRaises(ValueError):self.runs.advance(run['id'],'project-a','request-a',self.contract,expected_stage=0)
        self.assertEqual(self.runs.resume(run['id'],'project-a','request-a',self.contract)['next'],0)
    def test_unknown_validator_cannot_start(self):
        contract=inspect_skill(self.skill,source='builtin:fixture',version='1',capabilities=['read'],validator='unregistered')
        with self.assertRaises(ValueError):self.runs.start('project-a','request-a',contract)
    def test_validator_failure_and_exception_leave_run_resumable(self):
        run=self.start()
        def broken(*args):raise RuntimeError('private error')
        self.runs.validators['fixture-v1']=broken
        with self.assertRaisesRegex(ValueError,'Validation did not pass'):
            self.runs.advance(run['id'],'project-a','request-a',self.contract,expected_stage=0)
        self.assertEqual(self.runs.resume(run['id'],'project-a','request-a',self.contract)['next'],0)
    def test_cancel_is_terminal_and_does_not_learn(self):
        run=self.start();self.runs.cancel(run['id'],'project-a','request-a',self.contract)
        self.passed=True
        with self.assertRaises(ValueError):self.runs.advance(run['id'],'project-a','request-a',self.contract,expected_stage=0)
        self.assertEqual(Curator(self.root/'data').retrieve('project-a'),[])
    def test_parallel_completion_never_duplicates_receipts(self):
        run=self.start();self.passed=True
        def step(_):
            try:return self.runs.advance(run['id'],'project-a','request-a',self.contract,expected_stage=0)
            except ValueError:return None
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:list(pool.map(step,range(2)))
        state=self.runs.resume(run['id'],'project-a','request-a',self.contract)
        self.assertEqual(len(state['receipts']),1);self.assertEqual(state['status'],'running')
    def test_symlink_inventory_refused(self):
        (self.skill/'stages'/'03-link.md').symlink_to(self.skill/'SKILL.md')
        with self.assertRaises(ValueError):inspect_skill(self.skill,source='local',version='1',capabilities=[],validator='fixture-v1')
    def test_bounded_retrieval_is_metadata_not_instructions(self):
        run=self.start();self.passed=True
        for stage in range(2):self.runs.advance(run['id'],'project-a','request-a',self.contract,expected_stage=stage)
        packet=Curator(self.root/'data').context('project-a',budget=2048)
        self.assertLessEqual(len(packet),2048);self.assertIn('UNTRUSTED EVIDENCE DATA',packet)
        self.assertNotIn('Fixture skill',packet);self.assertNotIn('project-a',packet)
        self.assertEqual(Curator(self.root/'data').context('project-b'), '')
        self.assertEqual(Curator(self.root/'data').context('project-a',budget=20),'')

    def test_validator_cannot_mutate_contract_then_approve(self):
        run=self.start()
        def tamper(*args):
            (self.skill/'SKILL.md').write_text('changed during validation')
            return True
        self.runs.validators['fixture-v1']=tamper
        with self.assertRaises(ValueError):self.runs.advance(run['id'],'project-a','request-a',self.contract,expected_stage=0)
        # SQLite transaction rolled back, including any attempted receipt.
        with self.runs.brain.database() as db:
            state=json.loads(db.execute('SELECT body FROM skill_runs WHERE id=?',(run['id'],)).fetchone()['body'])
        self.assertEqual(state['receipts'],[])
    def test_permission_revocation_during_validation_rolls_back(self):
        run=self.start()
        def revoke(*args):self.allowed=False;return True
        self.runs.validators['fixture-v1']=revoke
        with self.assertRaises(ValueError):self.runs.advance(run['id'],'project-a','request-a',self.contract,expected_stage=0)
        self.assertEqual(self.runs.resume(run['id'],'project-a','request-a',self.contract)['receipts'],[])
    def test_truthy_non_boolean_validator_result_is_not_proof(self):
        run=self.start();self.runs.validators['fixture-v1']=lambda *args:1
        with self.assertRaises(ValueError):self.runs.advance(run['id'],'project-a','request-a',self.contract,expected_stage=0)
    def test_paused_learning_does_not_block_skill_completion(self):
        run=self.start();self.passed=True;self.runs.brain.pause(True)
        for stage in range(2):done=self.runs.advance(run['id'],'project-a','request-a',self.contract,expected_stage=stage)
        self.assertEqual(done['status'],'completed');self.assertEqual(self.runs.brain.retrieve('project-a'),[])
    def test_stage_order_is_numeric_and_ambiguous_numbers_are_refused(self):
        (self.skill/'stages'/'100-last.md').write_text('last')
        (self.skill/'stages'/'20-middle.md').write_text('middle')
        contract=inspect_skill(self.skill,source='local',version='1',capabilities=[],validator='fixture-v1')
        self.assertEqual(contract['stages'][-2:],['stages/20-middle.md','stages/100-last.md'])
        (self.skill/'stages'/'001-duplicate.md').write_text('duplicate')
        with self.assertRaises(ValueError):inspect_skill(self.skill,source='local',version='1',capabilities=[],validator='fixture-v1')
