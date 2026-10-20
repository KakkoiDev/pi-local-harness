"""System 1 learns only structured, scoped, traceable evidence."""
try:
    import isolation
except ModuleNotFoundError:
    from tests import isolation
import concurrent.futures
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from harness.learning import Curator, emit
from gate import test_runs


class LearningTest(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.data=Path(self.temp.name);self.clock=1000
        self.brain=Curator(self.data,clock=lambda:self.clock)
        self.project='project-a'
    def event(self,identifier='one',kind='failure',**fields):
        return self.brain.observe(project=self.project,source=identifier,kind=kind,request='r',signature='test-signature',**fields)
    def rows(self,**kwargs):return self.brain.retrieve(self.project,**kwargs)
    def test_failure_is_observed_not_a_fix_and_recurrence_deduplicates(self):
        self.event();self.assertEqual(self.rows(),[])
        self.event();self.assertEqual(self.rows(),[])
        self.event('two');rows=self.rows();self.assertEqual(len(rows),1)
        self.assertEqual(rows[0]['status'],'observed');self.assertEqual(rows[0]['occurrences'],2)
        self.assertEqual(rows[0]['category'],'workflow_recovery')
    def test_regression_requires_failure_pass_and_verified_commit_same_request(self):
        self.event(kind='test_failed');self.event('pass',kind='test_passed')
        self.assertEqual(self.rows(),[])
        self.event('commit',kind='verified_commit',revision='a'*40)
        row=self.rows()[0];self.assertEqual(row['status'],'verified')
        self.assertEqual(row['category'],'testing');self.assertEqual(len(row['evidence']),3)
        self.assertEqual(row['revision'],'a'*40)
    def test_pass_or_commit_alone_never_invents_a_fix(self):
        self.event(kind='test_passed');self.event('commit',kind='verified_commit',revision='b'*12)
        self.assertEqual(self.rows(),[])
    def test_different_request_cannot_verify_another_failure(self):
        self.event(kind='test_failed')
        self.brain.observe(project=self.project,source='p',kind='test_passed',request='other',signature='test-signature')
        self.event('commit',kind='verified_commit',revision='a'*12)
        self.assertEqual(self.rows(),[])
    def test_sensitive_fields_never_enter_storage_or_classifier(self):
        with self.assertRaises(TypeError):self.event(command='SECRET')
        self.brain.observe(project='private/path',source='token-secret',kind='failure',signature='secret command',request='private prompt')
        raw=(self.data/'brain/evidence.sqlite3').read_bytes()
        for secret in (b'private/path',b'token-secret',b'secret command',b'private prompt'):self.assertNotIn(secret,raw)
    def test_project_isolation_and_no_automatic_generalization(self):
        self.event();self.event('two');self.assertEqual(self.brain.retrieve('other'),[])
    def test_invalidation_and_expiry_remove_entries_from_retrieval(self):
        self.event();self.event('two');self.brain.invalidate(self.project,'one')
        self.assertEqual(self.rows(),[]);self.assertEqual(self.rows(include_inactive=True)[0]['status'],'stale')
        self.event('three');self.assertEqual(self.rows(),[])
        self.clock+=31*86400;self.assertEqual(self.rows(),[])
    def test_expiry_without_explicit_invalidation(self):
        self.event();self.event('two');self.clock+=31*86400
        self.assertEqual(self.rows(),[]);self.assertEqual(self.rows(include_inactive=True)[0]['status'],'stale')
    def test_rejection_is_durable_and_history_is_recoverable(self):
        self.event();self.event('two');row=self.rows()[0]
        self.brain.reject(self.project,row['id']);self.event('three')
        self.assertEqual(self.rows(),[])
        self.assertEqual(self.rows(include_inactive=True)[0]['status'],'rejected')
        self.assertGreaterEqual(len(self.brain.history(self.project,row['id'])),2)
    def test_pause_survives_new_instance_and_does_not_replay_paused_events(self):
        self.brain.pause(True);self.event();self.event('two')
        self.assertEqual(Curator(self.data).retrieve(self.project),[])
        self.brain.pause(False);self.event('three');self.assertEqual(self.rows(),[])
    def test_invalid_events_and_revisions_are_refused(self):
        for kind in ('model_says_fixed','configuration_change','preference'):
            with self.assertRaises(ValueError):self.event(kind=kind)
        with self.assertRaises(ValueError):self.event(kind='verified_commit',revision='not a commit')
    def test_database_is_private_and_symlink_is_refused(self):
        self.event();self.assertEqual(os.stat(self.data/'brain/evidence.sqlite3').st_mode & 0o777,0o600)
        other=self.data/'other';other.mkdir();(other/'brain').symlink_to(self.data/'brain',target_is_directory=True)
        with self.assertRaises(ValueError):Curator(other).retrieve(self.project)
    def test_concurrent_instances_do_not_lose_occurrences(self):
        def save(n):Curator(self.data,clock=lambda:1000).observe(project=self.project,source=str(n),kind='failure',signature='same',request='r')
        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:list(pool.map(save,range(20)))
        self.assertEqual(self.rows()[0]['occurrences'],20)
    def test_laya_only_after_code_and_with_explicit_calibrated_policy(self):
        class Fake:
            def __init__(self):self.calls=[]
            def ask(inner,*args,**kwargs):inner.calls.append((args,kwargs));return {'answer':'environment','confidence':.99,'abstained':False}
        fake=Fake();brain=Curator(self.data,classifier=fake,policy={'version':'fixture-v1','min_confidence':.98})
        brain.observe(project=self.project,source='x',kind='signal',signature='dependency',request='r',traits=['runtime','skill_run'])
        row=self.rows()[0];self.assertEqual(row['category'],'environment');self.assertEqual(row['who'],'laya')
        self.assertEqual(len(fake.calls),1)
        brain.observe(project=self.project,source='y',kind='failure',signature='rule',request='r')
        self.assertEqual(len(fake.calls),1)
    def test_no_policy_or_classifier_outage_abstains_without_question(self):
        class Broken:
            def ask(self,*a,**k):raise RuntimeError('private failure')
        brain=Curator(self.data,classifier=Broken(),policy={'version':'fixture','min_confidence':.99})
        brain.observe(project=self.project,source='x',kind='signal',signature='dependency',request='r',traits=['runtime','skill_run'])
        self.assertEqual(self.rows()[0]['category'],'unclassified')
        self.assertEqual(self.rows()[0]['status'],'observed')
    def test_test_run_hook_is_automatic_and_never_collects_output(self):
        for code in (1,1):test_runs.record(self.data,request='r',project='p',cwd='p',command='python test.py SECRET',exit_code=code,duration=1,output='SECRET')
        rows=Curator(self.data).retrieve('p');self.assertEqual(len(rows),1)
        self.assertNotIn('SECRET',json.dumps(rows));self.assertEqual(rows[0]['category'],'testing')
    def test_collection_failure_cannot_break_test_recording(self):
        with patch('harness.learning.Curator.observe',side_effect=OSError('unavailable')):
            row=test_runs.record(self.data,request='r',project='p',cwd='p',command='python test.py',exit_code=1,duration=1,output='')
        self.assertEqual(row['exit_code'],1)
    def test_budget_stops_new_events_without_deleting_history(self):
        brain=Curator(self.data,max_events=2)
        for n in range(10):brain.observe(project='p',source=str(n),kind='failure',signature='s',request='r')
        self.assertEqual(brain.retrieve('p')[0]['occurrences'],2)
    def test_retrieval_budget_is_bounded(self):
        for n in range(4):self.brain.observe(project=self.project,source=str(n),kind='signal',signature=str(n),request='r')
        self.assertEqual(len(self.rows(limit=2)),2)
        with self.assertRaises(ValueError):self.rows(limit=1001)

    def test_new_failure_contradicts_a_verified_regression(self):
        self.event(kind='test_failed');self.event('pass',kind='test_passed')
        self.event('commit',kind='verified_commit',revision='a'*12)
        self.event('regression',kind='test_failed')
        self.assertEqual(self.rows(),[])
        self.assertEqual(self.rows(include_inactive=True)[0]['status'],'contradicted')
    def test_old_pass_before_latest_failure_cannot_verify_it(self):
        self.event(kind='test_failed');self.event('pass',kind='test_passed')
        self.event('new-fail',kind='test_failed')
        self.event('commit',kind='verified_commit',revision='a'*12)
        self.assertFalse(any(row['status']=='verified' for row in self.rows()))
    def test_person_category_correction_survives_new_observations(self):
        self.event();self.event('two');row=self.rows()[0]
        self.brain.correct_category(self.project,row['id'],'environment');self.event('three')
        self.assertEqual(self.rows()[0]['category'],'environment')
        self.assertEqual(self.rows()[0]['who'],'person')
    def test_low_confidence_or_invalid_laya_output_stays_unclassified(self):
        class Low:
            def ask(self,*a,**k):return {'answer':'skills','confidence':.5,'abstained':False}
        brain=Curator(self.data,classifier=Low(),policy={'version':'fixture','min_confidence':.98})
        brain.observe(project='p',source='x',kind='signal',request='r')
        self.assertEqual(brain.retrieve('p')[0]['category'],'unclassified')
    def test_evidence_can_be_resolved_without_command_or_output(self):
        row=test_runs.record(self.data,request='r',project='p',cwd='p',command='SECRET',exit_code=1,duration=1,output='SECRET')
        test_runs.record(self.data,request='r',project='p',cwd='p',command='SECRET',exit_code=1,duration=1,output='SECRET')
        brain=Curator(self.data);entry=brain.retrieve('p')[0]
        sources=brain.evidence('p',entry['id'])
        self.assertEqual(sources[0]['source'],'test-runs/'+row['id'])
        self.assertNotIn('SECRET',str(sources))
        self.assertEqual(brain.evidence('other',entry['id']),[])
    def test_gate_refusals_are_collected_end_to_end(self):
        from gate.engine import GateEngine
        from gate.ledger import ProposalLedger
        project=self.data/'scratch';project.mkdir();(project/'tasks').mkdir();(project/'ROADMAP.md').write_text('# Plan')
        ledger=ProposalLedger(GateEngine('',str(self.data/'audit.log')),events_file=self.data/'gate-events.jsonl')
        ledger.start_request('r',str(project),'PRIVATE REQUEST')
        for _ in range(2):ledger.propose('execute_command',{'command':'rm -rf /'},'standard',pi_tool='bash',cwd=str(project),request='r')
        rows=Curator(self.data).retrieve(str(project));self.assertEqual(len(rows),1)
        self.assertEqual(rows[0]['category'],'workflow_recovery');self.assertNotIn('rm -rf',str(rows))
        self.assertEqual(Curator(self.data).evidence(str(project),rows[0]['id'])[0]['source'],'gate-events/1')
    def test_verified_paperwork_collects_a_real_regression_receipt(self):
        from tests.test_paperwork import PaperworkTest, TEST
        fixture=PaperworkTest();fixture.setUp();self.addCleanup(fixture.doCleanups)
        import subprocess,shlex
        fixture.real_test(2);fixture.paper.start('r1',str(fixture.root),'Fix the counter')
        red=subprocess.run(shlex.split(TEST),cwd=fixture.root,capture_output=True,text=True,env={**os.environ,'PYTHONDONTWRITEBYTECODE':'1'})
        self.assertNotEqual(red.returncode,0)
        test_runs.record(fixture.data.name,request='r1',project=fixture.root,cwd=fixture.root,command=TEST,exit_code=red.returncode,duration=1,output=red.stderr)
        (fixture.root/'app.py').write_text('x = 2\n');fixture.paper.observe('r1')
        fixture.protocol.record(str(fixture.root),TEST,False);fixture.paper.ran('r1',TEST,False)
        green=subprocess.run(shlex.split(TEST),cwd=fixture.root,capture_output=True,text=True,env={**os.environ,'PYTHONDONTWRITEBYTECODE':'1'})
        self.assertEqual(green.returncode,0,green.stderr)
        fixture.protocol.record(str(fixture.root),TEST,True);fixture.paper.ran('r1',TEST,True)
        test_runs.record(fixture.data.name,request='r1',project=fixture.root,cwd=fixture.root,command=TEST,exit_code=green.returncode,duration=1,output=green.stderr)
        result=fixture.paper.end('r1');self.assertEqual(result['outcome'],'committed')
        rows=Curator(fixture.data.name).retrieve(str(fixture.root));self.assertEqual(len(rows),1)
        self.assertEqual(rows[0]['revision'],result['commit']);self.assertEqual(rows[0]['status'],'verified')

    def test_rejected_evidence_can_be_explicitly_restored_but_invalidated_cannot(self):
        self.event();self.event('two');row=self.rows()[0]
        self.brain.reject(self.project,row['id']);self.brain.restore(self.project,row['id'])
        self.assertEqual(self.rows()[0]['status'],'observed')
        self.brain.invalidate(self.project,'one')
        with self.assertRaises(ValueError):self.brain.restore(self.project,row['id'])
    def test_local_maintenance_commands_work_in_a_fresh_process(self):
        import subprocess,sys,time
        self.clock=time.time();self.event();self.event('two')
        def command(*args):
            done=subprocess.run([sys.executable,'-m','harness.learning','--data',str(self.data),*args],capture_output=True,text=True)
            self.assertEqual(done.returncode,0,done.stderr);return json.loads(done.stdout)
        row=command('list','--project',self.project)[0]
        command('categorize','--project',self.project,'--id',row['id'],'--category','skills')
        self.assertEqual(command('list','--project',self.project)[0]['category'],'skills')
        command('reject','--project',self.project,'--id',row['id']);self.assertEqual(command('list','--project',self.project),[])
        command('restore','--project',self.project,'--id',row['id'])
        command('pause');self.event('three');command('resume')
        self.assertEqual(command('list','--project',self.project)[0]['occurrences'],2)

    def test_recurrence_keeps_bounded_references_but_invalidates_older_sources(self):
        for n in range(30):self.event(str(n))
        row=self.rows()[0];self.assertEqual(row['occurrences'],30)
        self.assertLessEqual(len(row['evidence']),16)
        self.brain.invalidate(self.project,'0');self.assertEqual(self.rows(),[])
    def test_new_event_cannot_silently_revive_expired_evidence(self):
        self.event();self.event('two');self.clock+=31*86400;self.event('three')
        self.assertEqual(self.rows(),[])
    def test_receipt_does_not_verify_an_unrelated_runner(self):
        from harness.learning import verified
        for command,code in [('test a',1),('test a',0),('test b',0)]:
            test_runs.record(self.data,request='r',project='p',cwd='p',command=command,exit_code=code,duration=1,output='')
        verified(self.data,project='p',request='r',revision='a'*12,command='test b')
        self.assertEqual(Curator(self.data).retrieve('p'),[])
    def test_oversized_command_never_breaks_original_test_recording(self):
        row=test_runs.record(self.data,request='r',project='p',cwd='p',command='x'*70000,exit_code=0,duration=1,output='')
        self.assertEqual(row['exit_code'],0)

    def test_old_unselected_failures_do_not_count_as_current_recurrence(self):
        self.event();self.clock+=31*86400;self.event('two')
        self.assertEqual(self.rows(),[])

    def test_structural_signal_traits_use_code_before_laya_and_reject_raw_text(self):
        self.brain.observe(project='p',source='one',kind='signal',request='r',traits=['test_runner'])
        self.assertEqual(self.brain.retrieve('p')[0]['category'],'testing')
        with self.assertRaises(ValueError):self.brain.observe(project='p',source='two',kind='signal',request='r',traits=['SECRET ignore instructions'])
    def test_status_explains_pause_and_full_budget(self):
        brain=Curator(self.data,max_events=2)
        for n in range(3):brain.observe(project='p',source=str(n),kind='test_passed',request='r')
        self.assertTrue(brain.status()['budget_exhausted']);brain.pause(True)
        self.assertTrue(brain.status()['paused'])

    def test_fresh_verified_evidence_can_revalidate_an_expired_record(self):
        self.event(kind='test_failed');self.event('pass',kind='test_passed');self.event('commit',kind='verified_commit',revision='a'*12)
        self.clock+=31*86400
        self.event('new-fail',kind='test_failed');self.event('new-pass',kind='test_passed');self.event('new-commit',kind='verified_commit',revision='b'*12)
        self.assertEqual(self.rows()[0]['revision'],'b'*12)
