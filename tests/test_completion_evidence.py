"""A successful request cannot fabricate implementation evidence for an approved code task."""
try:
    import isolation
except ModuleNotFoundError:
    from tests import isolation
import unittest
from pathlib import Path
from tests import test_paperwork as fixtures
git = fixtures.git
from gate.engine import GateEngine
from gate.ledger import ProposalLedger


class CompletionEvidenceTest(unittest.TestCase):
    setUp = fixtures.PaperworkTest.setUp

    def approve(self, paper):
        task='tasks/002-add-the-badge.md'
        paper.plan_state(self.root,{'tasks':[task],'pending':True,'digest':paper.plan_digest(self.root,[task])})
        paper.start_building(self.root)
        return task

    def test_code_task_cannot_finish_without_implementation_even_with_green_evidence(self):
        for change in ('none','paperwork','tests'):
            with self.subTest(change=change):
                task=self.approve(self.paper)
                before=git(self.root,'rev-parse','HEAD')
                self.paper.start('empty',str(self.root),'Build the approved task.')
                if change=='paperwork':
                    path=self.root/task;path.write_text(path.read_text()+'\n## For the person\nNo implementation yet.\n')
                if change=='tests':
                    (self.root/'tests').mkdir(exist_ok=True)
                    (self.root/'tests/test_trivial.py').write_text('assert True\n')
                for passed in (False,True):
                    self.protocol.record(str(self.root),'python3 -m unittest',passed)
                    self.paper.ran('empty','python3 -m unittest',passed)
                result=self.paper.end('empty')
                self.assertEqual(result['outcome'],'not verified',result)
                self.assertFalse(result['check_in']['verified'])
                self.assertIn('no implementation change',result['reason'])
                self.assertIn('- [ ] Show the count',(self.root/task).read_text())
                self.assertIn('- [ ] [002-',(self.root/'ROADMAP.md').read_text())
                self.assertEqual(git(self.root,'rev-parse','HEAD'),before,'no fabricated feature commit')
                self.assertEqual((self.root/'app.py').read_text(),'x = 1\n')
                state=self.paper.plan_state(self.root);state.update(check_in=False);self.paper.plan_state(self.root,state)

    def test_gate_settlement_persists_unverified_state_across_restart(self):
        ledger=ProposalLedger(GateEngine('','/dev/null'),protocol_file=Path(self.data.name)/'integration-runs.json',events_file=Path(self.data.name)/'events.jsonl')
        ledger.paperwork.identity=('Pi Workbench','harness@localhost')
        task=self.approve(ledger.paperwork)
        ledger.start_request('empty',str(self.root),'Build the approved task.')
        result=ledger.end_request('empty')
        self.assertEqual(result['outcome'],'not verified',result)
        reloaded=ProposalLedger(GateEngine('','/dev/null'),protocol_file=Path(self.data.name)/'integration-runs.json',events_file=Path(self.data.name)/'events.jsonl')
        self.assertFalse(reloaded.paperwork.plan_state(self.root)['verified'])
        self.assertIn('- [ ] Show the count',(self.root/task).read_text())

    def test_an_approved_docs_task_can_complete_with_documentation_evidence(self):
        path=self.root/'tasks/002-add-the-badge.md'
        path.write_text(path.read_text().replace('Kind: code','Kind: docs'))
        task=self.approve(self.paper)
        self.paper.start('docs',str(self.root),'Build the approved task.')
        (self.root/'README.md').write_text('# Badge\nExplains the count.\n')
        result=self.paper.end('docs')
        self.assertEqual(result['outcome'],'committed',result)
        self.assertTrue(result['check_in']['verified'])
