"""Typed decisions never generate text, download a model, or turn uncertainty into permission."""
try:
    import isolation
except ModuleNotFoundError:
    from tests import isolation
import math
import unittest
from harness.laya import Classifier


class FakeAgent:
    def __init__(self,answer,usage=None):self.answer=answer;self.usage=usage or {};self.calls=[]
    def predict(self,state,questions,**kwargs):
        self.calls.append((state,questions,kwargs))
        return {'answers':{'decision':self.answer},'usage':self.usage}


class LayaTest(unittest.TestCase):
    def test_loads_once_and_uses_answer_confidence_rather_than_entropy(self):
        agent=FakeAgent({'choice':'yes','answer_confidence':.97,'confidence':.15});loads=[]
        classifier=Classifier(loader=lambda:(loads.append(True) or agent))
        for _ in range(2):
            result=classifier.ask('choice',{'message':'yes'},'Is this an answer?',options=['yes','no'],min_confidence=.95)
            self.assertEqual(result,{'answer':'yes','confidence':.97,'abstained':False})
        self.assertEqual(loads,[True])
        self.assertEqual(agent.calls[0][1]['decision']['criteria'],['yes','no'])
        self.assertEqual(agent.calls[0][2],{'min_confidence':.95})

    def test_uncertain_invalid_and_truncated_answers_abstain(self):
        for confidence in [.2,None,math.nan,math.inf,-.1,1.1]:
            agent=FakeAgent({'choice':'yes','answer_confidence':confidence})
            self.assertTrue(Classifier(loader=lambda:agent).ask('choice','yes','Approve?',options=['yes','no'],min_confidence=.95)['abstained'])
        for answer,usage in [({'choice':'invented','answer_confidence':.99},{}),({'choice':'yes','answer_confidence':.99},{'truncated':True}),({'choice':'yes','answer_confidence':.99,'abstention':'abstained'}, {})]:
            agent=FakeAgent(answer,usage)
            self.assertTrue(Classifier(loader=lambda:agent).ask('choice','yes','Approve?',options=['yes','no'])['abstained'])

    def test_boolean_and_ordered_risk_have_typed_answers(self):
        agent=FakeAgent({'noul':.02,'answer_confidence':.98})
        self.assertEqual(Classifier(loader=lambda:agent).ask('noul','state','An assumption?')['answer'],False)
        agent=FakeAgent({'score':1.01,'probabilities':{'0':.01,'1':.98,'2':.01},'answer_confidence':.98})
        self.assertEqual(Classifier(loader=lambda:agent).ask('score','command','Risk?',options=['read_only','writes_in_project','dangerous'])['answer'],'writes_in_project')

    def test_unavailable_classifier_abstains_without_exposing_state(self):
        def unavailable():raise RuntimeError('private message or secret')
        result=Classifier(loader=unavailable).ask('noul','private state','A question?')
        self.assertTrue(result['abstained']);self.assertIsNone(result['answer'])
        self.assertNotIn('private',str(result))

    def test_invalid_typed_questions_do_not_load_the_model(self):
        def load():self.fail('Invalid questions must be rejected before loading.')
        classifier=Classifier(loader=load)
        for kind,options,threshold in [('text',None,.9),('choice',['yes','yes'],.9),('choice',['yes'],.9),('score',[],.9),('noul',None,math.nan),('noul',None,1.1)]:
            with self.assertRaises(ValueError):classifier.ask(kind,'state','Question?',options=options,min_confidence=threshold)

class QuestionsTest(unittest.TestCase):
    def test_questions_have_their_own_types_thresholds_and_do_not_grant_permission(self):
        from harness import laya
        calls=[]
        def ask(*args,**kwargs):
            calls.append((args,kwargs));return {'answer':'implementation','confidence':.99,'abstained':False}
        from unittest.mock import patch
        with patch.object(laya,'ask',side_effect=ask):
            self.assertEqual(laya.phase_intent('build it')['answer'],'implementation')
            laya.waiting_reply('yes','Start building?')
            laya.assumed_value('request','reply')
            laya.applicable_guide('request',['python','browser'])
            laya.shell_risk('custom-command','/scratch/project')
        self.assertEqual([x[0][0] for x in calls],['choice','choice','noul','choice','score'])
        self.assertTrue(all(x[1]['min_confidence']>=.95 for x in calls))
        self.assertIn('none',calls[0][1]['options'])
        self.assertIn('something_else',calls[1][1]['options'])
        self.assertEqual(calls[-1][1]['options'],['read_only','writes_in_project','writes_elsewhere','dangerous'])

class DownloadTest(unittest.TestCase):
    def test_checked_download_rejects_wrong_size_or_digest_and_keeps_existing_file(self):
        from harness import laya_setup
        import tempfile,hashlib,io
        from pathlib import Path
        from unittest.mock import patch
        with tempfile.TemporaryDirectory() as folder:
            target=Path(folder)/'wheel';target.write_bytes(b'previous')
            spec={'url':'https://example.invalid/wheel','size':3,'sha256':hashlib.sha256(b'new').hexdigest()}
            with patch.object(laya_setup.urllib.request,'urlopen',return_value=io.BytesIO(b'bad')):
                with self.assertRaises(ValueError):laya_setup.fetch(spec,target)
            self.assertEqual(target.read_bytes(),b'previous')
            with patch.object(laya_setup.urllib.request,'urlopen',return_value=io.BytesIO(b'bad')):
                with self.assertRaisesRegex(ValueError,'checksum'):laya_setup.fetch(spec,Path(folder)/'corrupt')
            self.assertFalse((Path(folder)/'corrupt').exists())
            self.assertFalse(list(Path(folder).glob('*.download-*')))
            with patch.object(laya_setup.urllib.request,'urlopen',return_value=io.BytesIO(b'new')):
                laya_setup.fetch(spec,Path(folder)/'fresh')
            self.assertEqual((Path(folder)/'fresh').read_bytes(),b'new')

    def test_setup_checks_budget_before_download_and_routes_laya(self):
        from harness import laya_setup,setup
        from unittest.mock import patch
        import tempfile
        from pathlib import Path
        with tempfile.TemporaryDirectory() as folder:
            with patch.object(laya_setup,'lock',return_value={'wheels':[{'name':'dependency','size':100_000_001}]}),patch.object(laya_setup,'fetch') as fetch:
                with self.assertRaisesRegex(ValueError,'100 MB'):laya_setup.install(Path(folder))
                fetch.assert_not_called()
            with patch.object(setup,'laya',return_value='Installed classifier.') as install:
                self.assertEqual(setup.main(['laya'],Path(folder)),0)
                install.assert_called_once_with(Path(folder))

class WorkerTest(unittest.TestCase):
    def test_worker_stays_offline_reuses_one_process_and_closes_its_owned_child(self):
        from harness.laya import Worker
        import tempfile,os
        from pathlib import Path
        with tempfile.TemporaryDirectory() as folder:
            home=Path(folder)/'toolchain/laya';(home/'runtime/bin').mkdir(parents=True);(home/'model').mkdir()
            (home/'model/model.safetensors').touch()
            python=home/'runtime/bin/python'
            python.write_text('''#!/usr/bin/env python3
import json,sys,os
assert os.environ['HF_HUB_OFFLINE']=='1'
assert os.environ['TRANSFORMERS_OFFLINE']=='1'
print(json.dumps({'ready':True}),flush=True)
for line in sys.stdin:
 print(json.dumps({'answers':{'decision':{'choice':'yes','answer_confidence':.99}}}),flush=True)
''');python.chmod(0o755)
            worker=Worker(folder);self.addCleanup(worker.close)
            first=worker.predict('state',{});process=worker.process
            self.assertEqual(worker.predict('state',{}),first)
            self.assertIs(worker.process,process)
            worker.close();self.assertIsNotNone(process.poll());self.assertIsNone(worker.process)

class LadderTest(unittest.TestCase):
    def test_code_stops_the_ladder_and_laya_uncertainty_records_one_choice(self):
        from harness.judgements import Judgements
        from unittest.mock import Mock
        paperwork=Mock();classifier=Mock();judge=Judgements(paperwork,classifier)
        result=judge.decide('r','shell_risk',['custom-tool','/scratch'],code_answer='dangerous')
        self.assertEqual(result['who'],'code');classifier.ask.assert_not_called();paperwork.choice_pending.assert_not_called()
        classifier.ask.return_value={'answer':None,'confidence':.4,'abstained':True}
        result=judge.decide('r','shell_risk',['custom-tool','/scratch'])
        self.assertTrue(result['abstained']);self.assertEqual(result['who'],'person')
        choice=paperwork.choice_pending.call_args.args[1]
        self.assertEqual(choice['recommended'],0);self.assertTrue(choice['allow_other']);self.assertGreaterEqual(len(choice['options']),2)
        self.assertNotIn('custom-tool',str(choice),'Do not echo a possibly secret command into a choice or log.')

    def test_phase_and_waiting_answers_are_advisory_even_at_full_confidence(self):
        from harness.judgements import Judgements
        from unittest.mock import Mock
        paperwork=Mock();classifier=Mock();judge=Judgements(paperwork,classifier)
        for kind,args,answer in [('phase_intent',['Build it'],'implementation'),('waiting_reply',['yes','Approve?'],'yes')]:
            classifier.ask.return_value={'answer':answer,'confidence':1.,'abstained':False}
            result=judge.decide('r',kind,args)
            self.assertTrue(result['advisory']);self.assertEqual(result['answer'],answer)
        paperwork.phases.choose.assert_not_called();paperwork.approve_plan.assert_not_called();paperwork.accept_task.assert_not_called()

class GateIntegrationTest(unittest.TestCase):
    def test_unknown_shell_uses_laya_but_never_bypasses_phase_or_code_refusals(self):
        import tempfile
        from pathlib import Path
        from unittest.mock import Mock
        from gate.engine import GateEngine
        from gate.ledger import ProposalLedger
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);(root/'tasks').mkdir();(root/'ROADMAP.md').write_text('# Scratch\n')
            ledger=ProposalLedger(GateEngine('',str(root/'audit.log')))
            ledger.start_request('r',str(root),'Explain the project')
            ledger.judgements=Mock()
            ledger.judgements.decide.return_value={'answer':'read_only','confidence':1.,'abstained':False,'advisory':True,'who':'laya'}
            result=ledger.propose('execute_command',{'command':'unknown-command'},'admin',pi_tool='bash',cwd=str(root),request='r')
            self.assertNotEqual(result['outcome'],'ALLOW')
            ledger.judgements.decide.assert_called_once_with('r','shell_risk',['unknown-command',root.resolve()])
            ledger.judgements.reset_mock()
            ledger.propose('execute_command',{'command':'cat README.md'},'admin',pi_tool='bash',cwd=str(root),request='r')
            ledger.propose('execute_command',{'command':'rm -rf /'},'standard',pi_tool='bash',cwd=str(root),request='r')
            ledger.judgements.decide.assert_not_called()

class RequestInterpretationTest(unittest.TestCase):
    def test_natural_language_phase_and_waiting_replies_only_return_advice(self):
        from gate.ledger import ProposalLedger
        from unittest.mock import Mock
        ledger=ProposalLedger.__new__(ProposalLedger);ledger.paperwork=Mock();ledger.judgements=Mock()
        ledger.paperwork.requests={'r':{'root':'/scratch','text':'Switch to planning'}}
        ledger.paperwork.waiting_choice.return_value=None
        ledger.request_advice('r')
        ledger.judgements.decide.assert_called_once_with('r','phase_intent',['Switch to planning'])
        ledger.paperwork.phases.choose.assert_not_called()
        ledger.judgements.reset_mock();ledger.paperwork.requests['r']['text']='yes'
        ledger.paperwork.waiting_choice.return_value={'question':'Approve the plan?'}
        ledger.request_advice('r')
        ledger.judgements.decide.assert_called_once_with('r','waiting_reply',['yes','Approve the plan?'])
        ledger.paperwork.approve_plan.assert_not_called()

class AssumptionIntegrationTest(unittest.TestCase):
    def test_unstated_value_is_checked_after_code_and_before_a_write(self):
        import tempfile
        from pathlib import Path
        from unittest.mock import Mock
        from gate.engine import GateEngine
        from gate.ledger import ProposalLedger
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder).resolve();(root/'tasks').mkdir();(root/'ROADMAP.md').write_text('# Scratch\n')
            ledger=ProposalLedger(GateEngine('',str(root/'audit.log')))
            ledger.start_request('r',str(root),'Make a pong game.')
            ledger.paperwork.phases.choose(root,'implementation',actor='person',planned=True)
            ledger.paperwork.active_scope=lambda root:'# Task\nFiles: app.py\n'
            ledger.judgements=Mock();ledger.judgements.decide.return_value={'answer':True,'confidence':.99,'abstained':False,'who':'laya'}
            result=ledger.propose('write_file',{'path':'app.py','content':'speed=500\n'},'admin',pi_tool='write',cwd=str(root),request='r',assistant_text='The ball speed will be 500.')
            self.assertEqual(result.get('rule'),'G-016');self.assertNotIn('proposal_id',result)
            ledger.judgements.decide.assert_called_once_with('r','assumed_value',['Make a pong game.','The ball speed will be 500.'])
            ledger.judgements.reset_mock()
            result=ledger.propose('write_file',{'path':'app.py','content':'speed=500\n'},'admin',pi_tool='write',cwd=str(root),request='r',assistant_text='I am editing the requested file.')
            self.assertEqual(result['outcome'],'ALLOW');ledger.judgements.decide.assert_not_called()

class IsolationTest(unittest.TestCase):
    def test_default_runtime_can_be_isolated_from_the_persons_installed_model(self):
        from unittest.mock import patch
        with patch.dict('os.environ',{'PI_LAYA_DATA':'/scratch/isolated-classifier'}),patch('harness.laya.Worker') as worker:
            Classifier().ask('noul','synthetic','An assumption?')
            worker.assert_called_once_with('/scratch/isolated-classifier')

class DecisionRecordTest(unittest.TestCase):
    def test_laya_records_confidence_and_abstention_without_raw_state(self):
        import tempfile,json
        from pathlib import Path
        from unittest.mock import Mock
        from harness.judgements import Judgements
        with tempfile.TemporaryDirectory() as folder:
            paperwork=Mock();paperwork.data=folder;paperwork.requests={};paperwork.waiting_choice.return_value=None
            classifier=Mock();classifier.ask.return_value={'answer':None,'confidence':.6,'abstained':True}
            Judgements(paperwork,classifier).decide('r','shell_risk',['private-command-value','/scratch'])
            row=json.loads((Path(folder)/'decisions.jsonl').read_text())
            self.assertEqual(row['who'],'laya');self.assertEqual(row['confidence'],.6);self.assertEqual(row['answer'],'abstained');self.assertEqual(row['request'],'r')
            self.assertNotIn('private-command-value',str(row))

class ConfirmedValueTest(unittest.TestCase):
    def test_a_persons_exact_value_confirmation_stops_repeated_classification(self):
        from harness.judgements import Judgements
        from unittest.mock import Mock
        paperwork=Mock();paperwork.requests={'r':{'root':'/scratch'}};paperwork.confirmed_value.return_value=True
        classifier=Mock()
        result=Judgements(paperwork,classifier).decide('r','assumed_value',['request','The speed is 500.'])
        self.assertEqual(result['who'],'code');self.assertIs(result['answer'],False)
        classifier.ask.assert_not_called()

class ConfirmationEvidenceTest(unittest.TestCase):
    def test_only_server_owned_exact_chosen_evidence_confirms_a_value(self):
        import tempfile
        from pathlib import Path
        from gate.engine import GateEngine
        from gate.ledger import ProposalLedger
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder).resolve();(root/'tasks').mkdir();(root/'ROADMAP.md').write_text('# Scratch\n')
            ledger=ProposalLedger(GateEngine('',str(root/'audit.log')));paper=ledger.paperwork
            ledger.start_request('r',str(root),'Make a game.')
            choice={'question':'Check this value?','options':[{'label':'Ask before using the value'},{'label':'Continue with the stated value'}],'recommended':0,'judgement':{'kind':'assumed_value','digest':'exact'}}
            paper.choice_pending('r',choice)
            paper.decision('r',choice['question'],'Continue with the stated value')
            self.assertFalse(paper.confirmed_value(root,'exact'),'Client-supplied evidence is discarded.')
            paper.choice_pending('r',choice,system=True)
            paper.choice_pending('r',{k:v for k,v in choice.items() if k!='judgement'})
            paper.decision('r',choice['question'],'Continue with the stated value')
            self.assertTrue(paper.confirmed_value(root,'exact'))
            self.assertFalse(paper.confirmed_value(root,'changed'))
            paper.choice_pending('r',choice,system=True)
            paper.decision('r',choice['question'],'Continue with the stated value',state='auto')
            self.assertFalse(paper.confirmed_value(root,'exact'))
