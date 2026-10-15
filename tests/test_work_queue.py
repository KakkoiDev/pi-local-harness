try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:  # run as tests.<module> from the repository root
    from tests import isolation  # noqa: F401
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

    def test_chat_messages_sent_while_waiting_join_one_request(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);queue=WorkQueue(root/'queue.json',lambda job,emit:None,start=False)
            first=queue.add('p','chat-1',{'message':'Fix the header'})
            second=queue.add('p','chat-1',{'message':'and the footer','attachments':[{'name':'a.txt','data':'eA=='}]})
            self.assertEqual(second['id'],first['id']);self.assertTrue(second['merged'])
            self.assertEqual(queue.list()[0]['message'],'Fix the header\n\nand the footer');self.assertEqual(queue.list()[0]['files'],['a.txt'])
            self.assertEqual(len(queue.list()),1)
            other=queue.add('p','chat-2',{'message':'Another chat'});comment=queue.add('p','chat-1',{'message':'Comment','document_comment':{'path':'x','id':'c'}})
            self.assertNotEqual(other['id'],first['id']);self.assertNotEqual(comment['id'],first['id']);self.assertEqual(len(queue.list()),3)
            self.assertEqual(WorkQueue(root/'queue.json',lambda job,emit:None,start=False).list()[0]['message'],'Fix the header\n\nand the footer','kept across a restart')

    def test_joining_after_a_restart_keeps_the_earlier_attachments_and_payloads_are_removed(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);path=root/'queue.json'
            WorkQueue(path,lambda job,emit:None,start=False).add('p','chat',{'message':'one','attachments':[{'name':'A.txt','data':'QQ=='}]})
            restarted=WorkQueue(path,lambda job,emit:None,start=False)
            self.assertEqual(restarted.list()[0]['files'],['A.txt'])
            restarted.add('p','chat',{'message':'two','attachments':[{'name':'B.txt','data':'Qg=='}]})
            seen=[];WorkQueue(path,lambda job,emit:seen.append(job['data']),start=False).run_one()
            self.assertEqual([item['name'] for item in seen[0]['attachments']],['A.txt','B.txt'])
            self.assertEqual(list((root/'activity').glob('*.attachments.json')),[],'the payload is deleted once the job ends')

    def test_a_failing_job_record_does_not_stop_the_worker(self):
        with tempfile.TemporaryDirectory() as directory:
            ran=[];queue=WorkQueue(Path(directory)/'queue.json',lambda job,emit:ran.append(job['id']),start=False)
            first=queue.add('p','a',{'message':'first'});second=queue.add('p','b',{'message':'second'})
            original=queue.save;calls=[0]
            def flaky(current=None):
                calls[0]+=1
                if calls[0]==1:raise OSError('disk hiccup')
                return original(current)
            queue.save=flaky;queue.closed=False
            import threading
            worker=threading.Thread(target=queue.run,daemon=True);worker.start()
            for _ in range(50):
                if second['id'] in ran:break
                import time;time.sleep(0.1)
            queue.close();self.assertIn(second['id'],ran,'the worker kept going after an error')

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
            for message in ['first','second','third']:queue.add('One','chat-'+message,{'message':message}) # one chat each: messages to one waiting chat join (test above)
            calls=[];restored=WorkQueue(path,lambda job,emit:calls.append(job['data']['message']),start=False)
            for _ in range(3):restored.run_one()
            self.assertEqual(calls,['first','second','third'])


class RetryTest(unittest.TestCase):
    """Plan 184 part 3 (A_Retry): a request that genuinely stopped is queued again, with the person's note; its record stays."""
    def test_ask_pi_to_retry_queues_the_request_again_with_a_note(self):
        import tempfile
        from pathlib import Path
        from harness.work_queue import WorkQueue
        with tempfile.TemporaryDirectory() as directory:
            def execute(job, emit): raise ValueError('Pi exited unexpectedly: boom')
            queue = WorkQueue(Path(directory) / 'queue.json', execute, start=False)
            first = queue.add('p1', 'c1', {'message': 'Run the backup script', 'worker': True})
            queue.run_one()
            failed = next(job for job in queue.list() if job['id'] == first['id'])
            self.assertEqual(failed['status'], 'failed')
            again = queue.retry(first['id'], 'The drive is mounted now.')
            self.assertEqual(again['status'], 'queued'); self.assertNotEqual(again['id'], first['id'])
            self.assertEqual(again['message'], 'Run the backup script\n\nNote from the person: The drive is mounted now.')
            self.assertEqual(again['retry_of'], first['id'])
            self.assertEqual(next(job for job in queue.list() if job['id'] == first['id'])['status'], 'failed', 'the failed run stays in its record')
            self.assertEqual(queue.retry(first['id'], '')['message'], 'Run the backup script', 'the note is optional')
            with self.assertRaisesRegex(ValueError, 'only for a request that stopped'): queue.retry(again['id'], '')
            self.assertEqual(queue.public({**queue.jobs[0], 'progress': 'x'})['retry_of'] if 'retry_of' in queue.jobs[0] else None, None)
            queue.update(queue.jobs[-1], {'type': 'extension_ui_request', 'method': 'notify', 'message': 'Harness settled'})
            self.assertNotEqual(queue.jobs[-1]['progress'], 'Harness settled', 'the harness signal is not a phase')
