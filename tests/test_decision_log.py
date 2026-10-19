"""Decision provenance records the judge, without copying private prompts or commands."""
try:
    import isolation
except ModuleNotFoundError:
    from tests import isolation
import json
from pathlib import Path
import tempfile
import unittest
from gate.engine import GateEngine
from gate.ledger import ProposalLedger
from gate.phases import Phases
from harness.decision_log import record
from bench import runner


class DecisionLogTest(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name).resolve();self.data=self.root/'data';self.data.mkdir()
        self.project=self.root/'project';self.project.mkdir();(self.project/'tasks').mkdir();(self.project/'ROADMAP.md').write_text('# Scratch\n')
    def rows(self):return [json.loads(x) for x in (self.data/'decisions.jsonl').read_text().splitlines()]
    def ledger(self):return ProposalLedger(GateEngine('',str(self.root/'audit.log')),events_file=self.data/'gate-events.jsonl')

    def test_gate_records_code_rule_outcomes_and_request_without_command_text(self):
        ledger=self.ledger();ledger.start_request('r',str(self.project),'private request text')
        allowed=ledger.propose('execute_command',{'command':'cat confidential.txt'},'admin',pi_tool='bash',cwd=str(self.project),request='r')
        ledger.complete(allowed['proposal_id'],'execute_command',{'command':'cat confidential.txt'},'private file content',0)
        ledger.propose('execute_command',{'command':'rm -rf /'},'standard',pi_tool='bash',cwd=str(self.project),request='r')
        # Task 261: an allowed call and its successful audit are not decisions (they stay in gate-events.jsonl); a refusal is.
        rows=self.rows();self.assertEqual([x['answer'] for x in rows],['BLOCK'])
        self.assertTrue(all(x['who']=='code' and x['request']=='r' and x['rule'] for x in rows))
        self.assertEqual(rows[-1]['rule'],'G-003')
        events=[json.loads(x) for x in (self.data/'gate-events.jsonl').read_text().splitlines()]
        self.assertEqual([x['outcome'] for x in events],['ALLOW','SUCCESS','BLOCK'])
        self.assertNotIn('confidential',str(rows));self.assertNotIn('private',str(rows))

    def test_phase_changes_record_person_and_automatic_code_separately(self):
        phases=Phases(self.data);phases.choose(self.project,'planning',actor='person')
        phases.choose(self.project,'implementation',actor='auto',planned=True)
        rows=self.rows();self.assertEqual([x['who'] for x in rows],['person','code'])
        self.assertEqual([x['answer'] for x in rows],['planning','implementation']);self.assertTrue(rows[1]['automatic'])

    def test_paperwork_logs_model_recommendation_person_answer_and_code_tick(self):
        paper=self.ledger().paperwork;paper.start('r',str(self.project),'private request text')
        choice={'question':'private question','options':[{'label':'private first'},{'label':'private second'}],'recommended':0}
        paper.choice_pending('r',choice);paper.decision('r',choice['question'],choice['options'][1]['label'])
        task=self.project/'tasks/001-fixture.md';task.write_text('# Fixture\n');item=paper.requests['r'];item['task']='tasks/001-fixture.md'
        paper.progress(item,'Red: private command failed')
        rows=self.rows();self.assertEqual([(x['who'],x['kind']) for x in rows],[('model','recommendation'),('person','question_answer'),('code','box_ticked')])
        self.assertEqual(rows[1]['answer'],{'option':1});self.assertNotIn('private',str(rows))

    def test_task_acceptance_and_completion_are_code_or_person_evidence(self):
        ledger=self.ledger();paper=ledger.paperwork
        paper.phases.choose(self.project,'implementation',actor='person',planned=True)
        paper.plan_state(self.project,{'tasks':['tasks/001-test.md'],'check_in':True,'verified':True,'index':0})
        paper.accept_task(self.project)
        rows=self.rows();self.assertEqual(rows[-1]['kind'],'task_acceptance');self.assertEqual(rows[-1]['who'],'person')

    def test_typed_code_answers_and_confirmed_values_keep_provenance(self):
        from harness.judgements import Judgements
        from unittest.mock import Mock
        paper=Mock();paper.data=self.data;paper.requests={'r':{'root':str(self.project)}}
        paper.confirmed_value.return_value=True
        classifier=Mock();judge=Judgements(paper,classifier)
        judge.decide('r','shell_risk',['private command','private path'],code_answer='dangerous')
        judge.decide('r','assumed_value',['private context','private statement'])
        rows=self.rows()
        self.assertEqual([(x['who'],x['answer']) for x in rows],[('code','dangerous'),('code',False)])
        self.assertTrue(all(x['rule'] for x in rows));self.assertNotIn('private',str(rows))
        classifier.ask.assert_not_called()

    def test_a_laya_abstention_is_logged_as_abstained_and_not_counted(self):
        from harness.judgements import Judgements
        from unittest.mock import Mock, patch
        paper=Mock();paper.data=self.data;paper.requests={'r':{'root':str(self.project)}};paper.waiting_choice.return_value=None
        with patch('harness.laya.shell_risk',return_value={'answer':None,'confidence':0.54,'abstained':True}):
            result=Judgements(paper,Mock()).decide('r','shell_risk',['private command','private path'])
        self.assertEqual(result['who'],'code','task 323: System 1 keeps the refusal; the person is never asked')
        rows=self.rows();self.assertEqual(len(rows),2);self.assertTrue(rows[0]['abstained']);self.assertEqual(rows[0]['answer'],'abstained')
        self.assertEqual((rows[1]['who'],rows[1]['answer'],rows[1]['rule']),('code','refused','judgement.keep_refusal'))
        self.assertEqual(runner.decision_counts(self.data/'decisions.jsonl'),{'code':1,'laya':0,'person':0,'model':0})

    def test_the_models_plan_layout_choices_are_logged_as_model_proposals(self):
        paper=self.ledger().paperwork;paper.phases.choose(self.project,'planning',actor='person');paper.start('r',str(self.project),'Plan it')
        paper.propose_plan('r',{'goal':'Count.','tasks':[{'title':'Counter','kind':'code','files':['app.py','tests/test_app.py'],'done_when':'Counts.','content':'Count.'},
                                                         {'title':'Notes','kind':'docs','files':['README.md'],'done_when':'Explained.','content':'Explain.'}]})
        proposals=[(x['kind'],x['answer']) for x in self.rows() if x['who']=='model']
        self.assertEqual(proposals,[('task_kind','code'),('task_files',2),('task_kind','docs'),('task_files',1)])
        self.assertTrue(all(x.get('proposal') for x in self.rows() if x['who']=='model'))
        self.assertNotIn('app.py',str(self.rows()),'file names stay out of the log')
        self.assertEqual(runner.decision_counts(self.data/'decisions.jsonl')['model'],4)

    def test_bench_counts_and_table_do_not_turn_missing_provenance_into_zero(self):
        self.assertIsNone(runner.decision_counts(self.data/'missing.jsonl'))
        for who in ['code','code','laya','person','model']:record(self.data,'r','example',who,'selected')
        counts=runner.decision_counts(self.data/'decisions.jsonl');self.assertEqual(counts,{'code':2,'laya':1,'person':1,'model':1})
        base={'model':'gemma4:e4b-mlx','prompt_level':'everyday','harness':'abc1234','mode':'harness','resolved':True,'verified':True,'seconds':60,'time':'2026-10-17T00:00:00Z'}
        table=runner.readme_table([base|{'decision_counts':counts},base])
        self.assertIn("Model’s share of decisions",table);self.assertIn('20.0% (1/5; 1/2 runs recorded)',table)
        table=runner.readme_table([base]);self.assertIn('Not recorded',table)
