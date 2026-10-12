import tempfile
import unittest
from pathlib import Path
from harness.work_queue import WorkQueue

class QueueTest(unittest.TestCase):
    def test_fifo_isolated_project_tasks_and_failure_continue(self):
        with tempfile.TemporaryDirectory() as directory:
            calls=[]
            def execute(job,emit):
                calls.append((job['project'],job['chat'],job['data']['message']))
                emit({'type':'tool_execution_start','toolName':'read'})
                if job['project']=='One':raise ValueError('a clear failure')
            queue=WorkQueue(Path(directory)/'queue.json',execute,start=False)
            queue.add('One','chat-one',{'message':'first'});queue.add('Two','chat-two',{'message':'second'})
            queue.run_one();queue.run_one()
            self.assertEqual(calls,[('One','chat-one','first'),('Two','chat-two','second')])
            self.assertEqual([job['status'] for job in queue.list()],['failed','completed'])
    def test_busy_cancellation_and_restart_do_not_repeat_side_effects(self):
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory)/'queue.json';calls=[]
            queue=WorkQueue(path,lambda job,emit:calls.append(job['id']),busy=lambda:True,start=False)
            task=queue.add('One','chat',{'message':'wait'})
            self.assertFalse(queue.run_one());self.assertEqual(calls,[])
            queue.cancel(task['id']);self.assertFalse(queue.run_one())
            task=queue.add('One','chat',{'message':'interrupted'})
            queue.jobs[-1]['status']='running';queue.save()
            restored=WorkQueue(path,lambda job,emit:calls.append(job['id']),start=False)
            self.assertEqual(restored.list()[-1]['status'],'interrupted');self.assertFalse(restored.run_one())
            self.assertNotIn('data',restored.list()[-1])
