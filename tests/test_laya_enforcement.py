import copy
import json
from pathlib import Path
import tempfile
import unittest
from laya.engine import LayaEngine
from laya.ledger import ProposalLedger

class EnforcementTest(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.root=Path(self.temp.name)
        self.engine=LayaEngine('',str(self.root/'audit.log'))
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
