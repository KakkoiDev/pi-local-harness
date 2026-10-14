try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:  # run as tests.<module> from the repository root
    from tests import isolation  # noqa: F401
import copy
import json
from pathlib import Path
import tempfile
import unittest
from gate.engine import GateEngine
from gate.ledger import ProposalLedger

class EnforcementTest(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.root=Path(self.temp.name)
        self.engine=GateEngine('',str(self.root/'audit.log'))
        self.ledger=ProposalLedger(self.engine,clock=lambda:100,limit=2)
    def tearDown(self): self.temp.cleanup()
    def test_original_is_immutable_and_drift_is_detected(self):
        args={'path':'one'}
        gate=self.ledger.propose('read_file',args,'standard')
        args['path']='two'
        result=self.ledger.complete(gate['proposal_id'],'read_file',{'path':'two'},'content',0)
        self.assertEqual(result.status,'DRIFT_DETECTED')
        self.assertEqual(result.proposal.args,{'path':'one'})
        with self.assertRaises(KeyError): self.ledger.complete(gate['proposal_id'],'read_file',{},'',0)
    def test_events_name_the_pi_tool_call(self):
        blocked=self.ledger.propose('execute_command',{'command':'rm -fr *'},'standard',tool_call_id='call-1')
        gate=self.ledger.propose('read_file',{'path':'one'},'standard',tool_call_id='call-2')
        self.ledger.complete(gate['proposal_id'],'read_file',{'path':'one'},'content',0)
        self.assertEqual([(event['tool_call'],event['phase'],event['outcome']) for event in self.ledger.recent_events()],
                         [('call-1','gate','BLOCK'),('call-2','gate','ALLOW'),('call-2','audit','SUCCESS')])
    def test_blocked_calls_have_no_audit_token(self):
        gate=self.ledger.propose('execute_command',{'command':'rm -fr *'},'standard')
        self.assertEqual(gate['outcome'],'BLOCK');self.assertNotIn('proposal_id',gate)
        self.assertIn('Recursive deletion',gate['reason'])
        self.assertEqual(self.ledger.pending,{})
        with self.assertRaises(KeyError): self.ledger.complete('invented','read_file',{},'',0)
    def test_failures_and_wrong_tool_cannot_pass(self):
        gate=self.ledger.propose('read_file',{},'standard')
        self.assertEqual(self.ledger.complete(gate['proposal_id'],'read_file',{},'error',1).status,'EXECUTION_FAILED')
        gate=self.ledger.propose('read_file',{},'standard')
        self.assertEqual(self.ledger.complete(gate['proposal_id'],'write_file',{},'',0).status,'DRIFT_DETECTED')
    def test_write_result_is_verified_on_disk(self):
        path=self.root/'result.txt'
        args={'path':str(path),'content':'expected'}
        gate=self.ledger.propose('write_file',args,'standard',pi_tool='write',cwd=str(self.root))
        path.write_text('wrong')
        result=self.ledger.complete(gate['proposal_id'],'write_file',args,'success',0)
        self.assertEqual(result.status,'POSTCONDITION_FAILED')
        gate=self.ledger.propose('write_file',args,'standard',pi_tool='write',cwd=str(self.root))
        path.write_text('expected')
        self.assertEqual(self.ledger.complete(gate['proposal_id'],'write_file',args,'success',0).status,'SUCCESS')
    def test_expiration_and_capacity(self):
        self.ledger.propose('read_file',{},'standard');self.ledger.propose('read_file',{},'standard')
        with self.assertRaises(ValueError):self.ledger.propose('read_file',{},'standard')
        self.ledger.clock=lambda:10000
        self.assertIn('proposal_id',self.ledger.propose('read_file',{},'standard'))

    def test_events_explain_precheck_and_postcheck_in_order(self):
        gate=self.ledger.propose('execute_command',{'command':'whoami'},'standard')
        self.ledger.complete(gate['proposal_id'],'execute_command',{'command':'whoami'},'developer',0)
        self.ledger.propose('execute_command',{'command':'rm -fr *'},'admin')
        events=self.ledger.recent_events()
        self.assertEqual([event['outcome'] for event in events],['ALLOW','SUCCESS','BLOCK'])
        self.assertEqual([event['phase'] for event in events],['gate','audit','gate'])
        self.assertIn('Recursive deletion',events[-1]['reason'])
        self.assertEqual(events[0]['proposal_id'],events[1]['proposal_id'])
        self.assertEqual(events[0]['args'],{'command':'whoami'})
        events[0]['outcome']='CHANGED'
        self.assertEqual(self.ledger.recent_events()[0]['outcome'],'ALLOW')
        self.assertTrue(all(event['timestamp'] for event in events))
    def test_event_feed_is_bounded_and_does_not_include_file_contents(self):
        self.ledger.limit=300
        for _ in range(205):self.ledger.propose('write_file',{'path':'a.txt','content':'private content'},'standard')
        events=self.ledger.recent_events()
        self.assertEqual(len(events),200)
        self.assertNotIn('private content',json.dumps(events))
