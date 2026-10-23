try:
    import isolation  # noqa: F401
except ModuleNotFoundError:
    from tests import isolation  # noqa: F401
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from gate.engine import GateEngine
from gate.ledger import ProposalLedger


class TestRunLogTest(unittest.TestCase):
    def test_unavailable_runner_keeps_exit_code_without_learning_false_test_failure(self):
        from gate.test_runs import record,read
        with tempfile.TemporaryDirectory() as directory,patch('harness.learning.emit') as emit:
            for code in (126,127):
                record(directory,request='r',project='p',cwd=directory,command='pytest',
                       exit_code=code,duration=0,output='runner unavailable')
            self.assertEqual([row['exit_code'] for row in read(directory)],[126,127])
            emit.assert_not_called()

    def test_counts_from_runner_summaries(self):
        from gate.test_runs import counts
        cases = [
            ('ℹ tests 5\nℹ pass 3\nℹ fail 1\nℹ skipped 1\n', {'pass': 3, 'fail': 1, 'skipped': 1}),
            ('TAP version 13\n# tests 5\n# pass 3\n# fail 1\n# skipped 1\n', {'pass': 3, 'fail': 1, 'skipped': 1}),
            ('Ran 5 tests in 0.003s\n\nOK (skipped=1)\n', {'pass': 4, 'fail': 0, 'skipped': 1}),
            ('Ran 5 tests in 0.003s\n\nFAILED (failures=1, errors=1, skipped=1)\n', {'pass': 2, 'fail': 2, 'skipped': 1}),
            ('================ 3 passed, 1 failed, 1 skipped in 0.23s ================', {'pass': 3, 'fail': 1, 'skipped': 1}),
            ('================ 3 passed in 0.23s ================', {'pass': 3, 'fail': 0, 'skipped': 0}),
            ('src/app.ts(1,1): error TS2304: Cannot find name x.', {}),
        ]
        for output, expected in cases:
            with self.subTest(output=output): self.assertEqual(counts(output), expected)

    @patch('gate.phases.refusal', return_value=None)  # test the audit recorder; phase permission has its own integration tests
    def test_audited_tests_are_logged_once_with_bounded_output(self, _permission):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder); (root/'tasks').mkdir(); (root/'ROADMAP.md').write_text('# Roadmap\n')
            data=root/'data'; data.mkdir(); clock=[10]
            ledger=ProposalLedger(GateEngine('', str(data/'audit.log')),clock=lambda:clock[0],events_file=data/'gate-events.jsonl')
            command='node --test tests/app.test.mjs'; args={'command':command}
            proposal=ledger.propose('execute_command',args,'admin',cwd=str(root),request='request-one')
            clock[0]=12.5
            output='\n'.join([f'line {n}' for n in range(250)]+['ℹ pass 3','ℹ fail 1','ℹ skipped 0'])
            ledger.complete(proposal['proposal_id'],'execute_command',args,output,1)
            rows=[json.loads(line) for line in (data/'test-runs.jsonl').read_text().splitlines()]
            self.assertEqual(len(rows),1); row=rows[0]
            self.assertEqual({key:row[key] for key in ('request','project','cwd','command','exit_code','duration','counts')},
                             {'request':'request-one','project':str(root.resolve()),'cwd':str(root),'command':command,'exit_code':1,'duration':2.5,'counts':{'pass':3,'fail':1,'skipped':0}})
            self.assertTrue(row['time']); self.assertEqual(row['output_file'],f"test-runs/{row['id']}.txt")
            saved=(data/row['output_file']).read_text().splitlines()
            self.assertEqual(len(saved),200); self.assertEqual(saved[0],'line 53'); self.assertNotIn('line 53',json.dumps(row))
            for command in ('python3 -m unittest','pytest','uv run pytest','npx tsc','python3 tests/browser/run.py all'):
                args={'command':command}; proposal=ledger.propose('execute_command',args,'admin',cwd=str(root))
                ledger.complete(proposal['proposal_id'],'execute_command',args,'',0)
            self.assertEqual(len((data/'test-runs.jsonl').read_text().splitlines()),6)
            for command,executed in [('pwd','pwd'),('node --test','pwd')]:
                proposal=ledger.propose('execute_command',{'command':command},'admin',cwd=str(root))
                ledger.complete(proposal['proposal_id'],'execute_command',{'command':executed},'',0)
            self.assertEqual(len((data/'test-runs.jsonl').read_text().splitlines()),6,'ordinary commands and drift are not test evidence')

    def test_activity_joins_test_runs_by_request_without_changing_jobs(self):
        from harness.web_chat import with_checks
        jobs=[{'id':'one'},{'id':'two'}]; runs=[{'request':'one','command':'node --test'},{'request':'other','command':'pytest'}]
        result=with_checks(jobs,[],runs)
        self.assertEqual(result[0]['test_runs'],runs[:1]); self.assertEqual(result[1]['test_runs'],[])
        self.assertNotIn('test_runs',jobs[0])
