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

    def test_a_test_file_left_by_an_unverified_attempt_is_the_retrys_and_is_committed(self):
        """Task 327 (journey J13): the first attempt wrote only tests/test_chart.py and ended not verified with nothing
        committed; after Retry Task the next request's commit includes it (it never stays untracked)."""
        task=self.approve(self.paper)
        self.paper.start('first',str(self.root),'Build the approved task.')
        (self.root/'tests').mkdir(exist_ok=True);(self.root/'tests/test_badge.py').write_text('assert True\n')
        self.assertEqual(self.paper.end('first')['outcome'],'not verified')
        self.assertEqual(self.paper.plan_state(self.root)['left'],{task:['tests/test_badge.py']})
        self.paper.accept_task(self.root)  # Retry Task
        self.paper.start('retry',str(self.root),'Continue the approved task.')
        self.assertIn('tests/test_badge.py',self.paper.changes(self.paper.requests['retry']))
        (self.root/'app.py').write_text('x = 2\n')
        self.paper.end('retry')
        self.assertIn('tests/test_badge.py',git(self.root,'ls-files'),'committed with the retry, verified or not')

    def publish_task(self):
        from kit.publish_audit import ensure_task
        task=ensure_task(self.root)
        self.paper.plan_state(self.root,{'tasks':[task],'pending':True,'digest':self.paper.plan_digest(self.root,[task])})
        self.paper.start_building(self.root)
        return task

    def test_ready_to_publish_has_a_scope_and_the_harness_runs_its_audit_when_its_request_ends(self):
        """Task 327 (journey J13): the web workbench has no /audit, so System 1 runs it (harness/audit.py's run, the same
        code) when the Ready to publish task's request ends; its writes are in scope (its Files: line)."""
        from unittest.mock import patch
        from harness.audit import LABELS
        task=self.publish_task()
        self.assertRegex((self.root/task).read_text(),r'(?m)^Files: README\.md, manifest\.webmanifest, app/, static/, js/, messages/, tests/$')
        self.paper.start('publish',str(self.root),'Continue the next approved task.')
        (self.root/'README.md').write_text('# Counter\n\nCounts clicks.\n')
        calls=[]
        def run(root,data,request=None,project=None):
            calls.append(request);path=root/task;path.write_text(path.read_text().replace('- [ ]','- [x]'))
            return {'checks':[{'key':key,'passed':True} for key in LABELS]}
        with patch('harness.audit.run',run),patch('harness.audit.verified',lambda root,data,task:bool(calls)):
            result=self.paper.end('publish')
        self.assertEqual(calls,['publish'],'run once, by the harness')
        self.assertEqual(result['outcome'],'committed',result);self.assertTrue(result['check_in']['verified'])
        self.assertIn('README.md',git(self.root,'show','--name-only','--format=','HEAD'))

    def test_a_failed_publication_check_is_named_on_the_check_in(self):
        from unittest.mock import patch
        task=self.publish_task()
        self.paper.start('publish',str(self.root),'Continue the next approved task.')
        (self.root/'README.md').write_text('# A Pi Workbench project\n')
        failed=lambda root,data,request=None,project=None:{'checks':[{'key':'tests','passed':True},{'key':'description','passed':False}]}
        with patch('harness.audit.run',failed),patch('harness.audit.verified',lambda root,data,task:False):
            result=self.paper.end('publish')
        self.assertEqual(result['outcome'],'not verified')
        self.assertTrue(result['reason'].startswith('publication checks failed: The README and the manifest describe this app.'),result['reason'])
        self.assertEqual(result['check_in']['question'],'Retry Task')

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
