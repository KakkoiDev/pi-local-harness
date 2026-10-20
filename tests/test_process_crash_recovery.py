"""Headless process-death checks; synthetic files only, no service or model."""
try:
    import isolation
except ModuleNotFoundError:
    from tests import isolation
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from harness.markdown_records import read_record
from harness.work_queue import WorkQueue

WORKER=Path(__file__).parent/'fixtures'/'crash_queue.py'

class ProcessCrashRecoveryTest(unittest.TestCase):
    def crash(self, root, stage):
        run=subprocess.run([sys.executable,str(WORKER),str(root),stage],capture_output=True,text=True,timeout=20)
        self.assertEqual(run.returncode,79,run.stderr)

    def reopen(self,root):
        calls=[]
        queue=WorkQueue(root/'queue.json',lambda job,emit:calls.append(job['project']),start=False)
        return queue,calls

    def test_queued_inputs_survive_process_death_in_order(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);self.crash(root,'queued');queue,calls=self.reopen(root)
            self.assertEqual([j['status'] for j in queue.jobs],['queued','queued'])
            self.assertTrue(queue.run_one());self.assertTrue(queue.run_one());self.assertFalse(queue.run_one())
            self.assertEqual(calls,['one','two'])

    def test_claimed_work_is_interrupted_and_another_project_can_run(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);self.crash(root,'claimed');queue,calls=self.reopen(root)
            self.assertEqual([j['status'] for j in queue.jobs],['interrupted','queued'])
            self.assertTrue(queue.run_one());self.assertFalse(queue.run_one());self.assertEqual(calls,['two'])

    def test_effect_without_result_is_never_automatically_replayed(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);self.crash(root,'effect');queue,calls=self.reopen(root)
            self.assertEqual(queue.jobs[0]['status'],'interrupted')
            self.assertEqual((root/'effects.txt').read_text(),'effect\n')
            self.assertTrue(queue.run_one());self.assertFalse(queue.run_one());self.assertEqual(calls,['two'])
            self.assertEqual((root/'effects.txt').read_text(),'effect\n')

    def test_completed_work_stays_completed_after_process_death(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);self.crash(root,'completed');queue,calls=self.reopen(root)
            self.assertEqual(queue.jobs[0]['status'],'completed')
            self.assertTrue(queue.run_one());self.assertFalse(queue.run_one());self.assertEqual(calls,['two'])

    def test_death_before_record_replace_preserves_previous_record(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);self.crash(root,'before_replace')
            self.assertEqual(read_record(root/'record.md'),{'revision':1})

    def test_death_after_record_replace_keeps_new_record(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder);self.crash(root,'after_replace')
            self.assertEqual(read_record(root/'record.md'),{'revision':2})
