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
    def test_tool_calls_are_kept_on_the_task(self):
        with tempfile.TemporaryDirectory() as directory:
            def execute(job,emit):
                emit({'type':'tool_execution_start','toolCallId':'call-1','toolName':'bash','args':{'command':'ls'}})
                emit({'type':'tool_execution_end','toolCallId':'call-1','toolName':'bash','isError':False})
                emit({'type':'tool_execution_start','toolCallId':'call-2','toolName':'read','args':{'path':'x'}})
                emit({'type':'tool_execution_end','toolCallId':'call-2','toolName':'read','isError':True})
            queue=WorkQueue(Path(directory)/'queue.json',execute,start=False)
            queue.add('One','chat',{'message':'work'});queue.run_one()
            self.assertEqual(queue.list()[0]['tools'],[{'id':'call-1','name':'bash','detail':'ls','status':'done'},{'id':'call-2','name':'read','detail':'x','status':'failed'}])
            self.assertEqual(WorkQueue(Path(directory)/'queue.json',execute,start=False).list()[0]['tools'][1]['status'],'failed')
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

    def test_tasks_are_saved_as_markdown_with_document_and_chat_links(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);queue=WorkQueue(root/'queue.json',lambda job,emit:None,start=False)
            task=queue.add('Project','chat-id',{'message':'Improve the introduction','document':'projects/Project/ROADMAP.md'})
            records=list((root/'activity').glob('*.md'));self.assertEqual(len(records),1)
            text=records[0].read_text();self.assertIn('Improve the introduction',text);self.assertIn('ROADMAP.md',text);self.assertIn('chat-id',text)
            queue.run_one();self.assertIn('completed',records[0].read_text())
            restored=WorkQueue(root/'queue.json',lambda job,emit:None,start=False)
            self.assertEqual(restored.list()[0]['status'],'completed');self.assertIn('record',restored.list()[0])

    def test_legacy_queue_migrates_and_queued_attachments_survive_restart(self):
        import json
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);path=root/'queue.json'
            legacy={'id':'a'*32,'project':'One','chat':'chat','created':'2026-10-13T00:00:00+09:00','status':'queued','progress':'Waiting','text':'','thinking':'','data':{'message':'Hello 日本語','attachments':[{'name':'audio.wav','mime':'audio/wav','data':'YQ=='}]}}
            path.write_text(json.dumps([legacy]));calls=[]
            queue=WorkQueue(path,lambda job,emit:calls.append(job['data']),start=False)
            self.assertFalse(path.exists());self.assertTrue(list(root.glob('queue.json.before-markdown-*')))
            self.assertNotIn('YQ==',(root/'activity'/('a'*32+'.md')).read_text())
            restored=WorkQueue(path,lambda job,emit:calls.append(job['data']),start=False);restored.run_one()
            self.assertEqual(calls[0]['attachments'][0]['data'],'YQ==')
            self.assertEqual(restored.list()[0]['status'],'completed')
    def test_same_second_tasks_preserve_fifo_after_restart(self):
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory)/'queue.json';queue=WorkQueue(path,lambda job,emit:None,start=False)
            for message in ['first','second','third']:queue.add('One','chat',{'message':message})
            calls=[];restored=WorkQueue(path,lambda job,emit:calls.append(job['data']['message']),start=False)
            for _ in range(3):restored.run_one()
            self.assertEqual(calls,['first','second','third'])
