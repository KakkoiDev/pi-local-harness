try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:  # run as tests.<module> from the repository root
    from tests import isolation  # noqa: F401
import base64
import json
import tempfile
import time
import unittest
from pathlib import Path
from harness.web_chat import ConversationStore, prepare_prompt

class WebChatTest(unittest.TestCase):
    def test_conversations_are_separate_persistent_and_manageable(self):
        with tempfile.TemporaryDirectory() as directory:
            store=ConversationStore(Path(directory))
            first=store.create();second=store.create()
            store.append(first['id'],{'role':'user','content':'one'})
            self.assertEqual(store.get(second['id'])['messages'],[])
            store.rename(first['id'],'A different title')
            loaded=ConversationStore(Path(directory)).get(first['id'])
            self.assertEqual(loaded['title'],'A different title')
            self.assertEqual(loaded['messages'][0]['content'],'one')
            store.delete(first['id'])
            self.assertEqual(len(store.list()),1)
            with self.assertRaises(ValueError):store.get('../outside')
    def test_uploads_attach_images_transcribe_audio_and_read_text(self):
        calls=[]
        def transcribe(path):
            calls.append(path.read_bytes());return 'こんにちは'
        def attachment(name,mime,content):
            return {'name':name,'mime':mime,'data':base64.b64encode(content).decode()}
        with tempfile.TemporaryDirectory() as directory:
            png=b'\x89PNG\r\n\x1a\n' + b'image'
            prompt,images,files=prepare_prompt('Explain',[
                attachment('../../photo.png','image/png',png),
                attachment('voice.wav','audio/wav',b'voice'),
                attachment('notes.txt','text/plain',b'<script>hello</script>')],Path(directory),transcribe)
            self.assertEqual(len(images),1)
            self.assertEqual(images[0]['data'],base64.b64encode(png).decode())
            self.assertIn('こんにちは',prompt);self.assertIn('<script>hello</script>',prompt)
            self.assertEqual(calls,[b'voice'])
            self.assertTrue(all(Path(file['path']).is_relative_to(Path(directory)) for file in files))
            self.assertTrue(all(Path(file['path']).exists() for file in files))
            calls.clear();prepare_prompt('text only',[],Path(directory),transcribe)
            self.assertEqual(calls,[])
    def test_unsupported_binary_and_invalid_base64_have_clear_errors(self):
        with tempfile.TemporaryDirectory() as directory:
            with self.assertRaisesRegex(ValueError,'Unsupported'):
                prepare_prompt('',[{'name':'thing.zip','mime':'application/zip','data':'YQ=='}],Path(directory),lambda _: '')
            with self.assertRaises(ValueError):
                prepare_prompt('',[{'name':'a.txt','mime':'text/plain','data':'invalid!'}],Path(directory),lambda _: '')

class ToolChecksTest(unittest.TestCase):
    def test_each_tool_call_carries_its_gate_checks(self):
        from harness.web_chat import with_checks
        jobs=[{'id':'job','tools':[{'id':'call-1','name':'bash','status':'done'},{'id':'call-2','name':'read','status':'running'}]},{'id':'old'}]
        events=[{'id':1,'tool_call':'call-1','phase':'gate','outcome':'ALLOW','reason':'Approved before execution.'},
                {'id':2,'tool_call':'other','phase':'gate','outcome':'BLOCK','reason':'no'},
                {'id':3,'tool_call':'call-1','phase':'audit','outcome':'SUCCESS','reason':'ok'}]
        result=with_checks(jobs,events)
        self.assertEqual(result[0]['tools'][0]['checks'],[{'event':1,'phase':'gate','outcome':'ALLOW','reason':'Approved before execution.'},{'event':3,'phase':'audit','outcome':'SUCCESS','reason':'ok'}])
        self.assertEqual(result[0]['tools'][1]['checks'],[])
        self.assertNotIn('tools',result[1])
        self.assertNotIn('checks',jobs[0]['tools'][0])

class RpcBridgeTest(unittest.TestCase):
    def test_real_subprocess_protocol_preserves_session_and_streams(self):
        import os
        import sys
        from unittest.mock import patch
        from harness.web_chat import WebChat
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);executable=root/'pi'
            executable.write_text('#!'+sys.executable+'\n'+Path('tests/fixtures/fake-pi.py').read_text());executable.chmod(0o755)
            chat=WebChat(root/'data',12345,3000,gate_token='shared-token');self.addCleanup(chat.close);conversation=chat.store.create();events=[]
            with patch.dict(os.environ,{'PATH':str(root)+os.pathsep+os.environ['PATH']}):
                chat.send(conversation['id'],{'message':'Hello'},events.append)
                chat.send(conversation['id'],{'message':'Continue'},events.append)
            saved=chat.store.get(conversation['id'])
            self.assertEqual(len(saved['messages']),4)
            self.assertEqual(saved['messages'][-1]['content'],'[CANARY] reply 2')
            self.assertTrue(any(event['type']=='message_update' for event in events))
            self.assertEqual(events[-1]['type'],'done');self.assertEqual(chat.active,{})
            request=json.loads((chat.store.folder(conversation['id'])/'session.request.json').read_text())
            self.assertEqual(request['message'],'Continue')
            environment=json.loads((chat.store.folder(conversation['id'])/'session.environment.json').read_text())
            self.assertEqual(environment['token'],'shared-token')
    def test_processes_pi_leaves_running_are_stopped_when_the_request_ends(self):
        import os
        import sys
        from unittest.mock import patch
        from harness.web_chat import WebChat
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);executable=root/'pi';pidfile=root/'leftover.pid'
            executable.write_text('#!'+sys.executable+'\n'+Path('tests/fixtures/fake-pi.py').read_text());executable.chmod(0o755)
            chat=WebChat(root/'data',12345,3000);self.addCleanup(chat.close);conversation=chat.store.create()
            with patch.dict(os.environ,{'PATH':str(root)+os.pathsep+os.environ['PATH'],'PI_FAKE_PIDFILE':str(pidfile),'PI_WEB_CWD':str(root)}):
                chat.send(conversation['id'],{'message':'Start a server TEST_SPAWN'},lambda event:None)
            leftover=int(pidfile.read_text())
            for _ in range(50):
                try:os.kill(leftover,0)
                except ProcessLookupError:break
                time.sleep(0.1)
            else:
                os.kill(leftover,9);self.fail('the server Pi started is still running after the request')
    def test_stop_terminates_process_and_releases_conversation(self):
        import os
        import sys
        import threading
        import time
        from unittest.mock import patch
        from harness.web_chat import WebChat
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);executable=root/'pi'
            executable.write_text('#!'+sys.executable+'\n'+Path('tests/fixtures/fake-pi.py').read_text());executable.chmod(0o755)
            chat=WebChat(root/'data',12345,3000);self.addCleanup(chat.close);conversation=chat.store.create();errors=[]
            def run():
                try:chat.send(conversation['id'],{'message':'TEST_WAIT'},lambda _:None)
                except ValueError as error:errors.append(str(error))
            with patch.dict(os.environ,{'PATH':str(root)+os.pathsep+os.environ['PATH']}):
                thread=threading.Thread(target=run);thread.start()
                deadline=time.monotonic()+5
                while time.monotonic()<deadline:
                    with chat.lock:ready=chat.active.get(conversation['id'],{}).get('process') is not None
                    if ready:break
                    time.sleep(.01)
                self.assertTrue(ready)
                self.assertTrue(chat.stop(conversation['id'])['stopped']);thread.join(timeout=6)
            self.assertFalse(thread.is_alive());self.assertTrue(errors);self.assertEqual(chat.active,{})

class SingleAgentTest(unittest.TestCase):
    def test_other_chat_cannot_start_while_an_agent_is_active(self):
        from harness.web_chat import WebChat
        import threading
        with tempfile.TemporaryDirectory() as directory:
            chat=WebChat(Path(directory),12345,3000);self.addCleanup(chat.close)
            first=chat.store.create();second=chat.store.create()
            chat.active[first['id']]={'process':None,'cancel':threading.Event()}
            with self.assertRaisesRegex(ValueError,'one agent'):
                chat.send(second['id'],{'message':'Hello'},lambda _:None)
            self.assertEqual(chat.store.get(second['id'])['messages'],[])

class ProjectContextTest(unittest.TestCase):
    def test_each_project_resumes_own_session_and_refreshes_roadmap(self):
        import os, sys
        from unittest.mock import patch
        from harness.web_chat import WebChat
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);executable=root/'pi'
            executable.write_text('#!'+sys.executable+'\n'+Path('tests/fixtures/fake-pi.py').read_text());executable.chmod(0o755)
            chat=WebChat(root/'chats',12345,3000,data_root=root/'workspace');self.addCleanup(chat.close)
            first=chat.documents.create_project('First');second=chat.documents.create_project('Second')
            one=chat.project_chat(first);two=chat.project_chat(second)
            self.assertEqual(one['id'],chat.project_chat(first)['id']);self.assertNotEqual(one['id'],two['id'])
            with patch.dict(os.environ,{'PATH':str(root)+os.pathsep+os.environ['PATH']}):
                chat.send(one['id'],{'message':'First history'},lambda _:None)
                chat.send(two['id'],{'message':'Second history'},lambda _:None)
                roadmap=chat.documents.project_path(first)/'ROADMAP.md';roadmap.write_text('# Fresh roadmap unique marker')
                chat.send(one['id'],{'message':'Continue first'},lambda _:None)
            request=json.loads((chat.store.folder(one['id'])/'session.request.json').read_text())
            self.assertEqual(request['message'],'Continue first','the message is what was typed; context goes to the system prompt (task 114)')
            capture=json.loads((chat.store.folder(one['id'])/'session.environment.json').read_text())
            self.assertIn('Fresh roadmap unique marker',capture['context']);self.assertNotIn('Second',capture['context'])
            self.assertEqual(chat.store.get(one['id'])['messages'][-1]['content'],'[CANARY] reply 2')
            self.assertEqual(chat.store.get(two['id'])['messages'][-1]['content'],'[CANARY] reply 1')
            capture=json.loads((chat.store.folder(one['id'])/'session.environment.json').read_text())
            self.assertEqual(Path(capture['cwd']),chat.documents.project_path(first))

    def test_context_preview_is_what_the_request_sends(self):
        """Task 133: GET /api/context-preview runs the same selection as the request."""
        import os, sys
        from unittest.mock import patch
        from harness.web_chat import WebChat
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);executable=root/'pi'
            executable.write_text('#!'+sys.executable+'\n'+Path('tests/fixtures/fake-pi.py').read_text());executable.chmod(0o755)
            chat=WebChat(root/'chats',12345,3000,data_root=root/'workspace');self.addCleanup(chat.close)
            project=chat.documents.create_project('Preview');conversation=chat.project_chat(project)
            (chat.documents.project_path(project)/'notes.md').write_text('# Notes marker\n')
            path=f'projects/{project}/ROADMAP.md';entry=chat.documents.comment(path,'See notes.md please.','Describe what we are building.')
            for request in [{'message':'Read notes.md'},{'message':'','document_comment':{'path':path,'id':entry['id']}},{'message':'Whole file?','document':path}]:
                preview=chat.context_preview(project,request)
                events=[]
                with patch.dict(os.environ,{'PATH':str(root)+os.pathsep+os.environ['PATH']}):chat.send(conversation['id'],request,events.append)
                sent=next(event for event in events if event.get('type')=='context')
                self.assertEqual(preview['items'][0]['path'],'ROADMAP.md',request)
                self.assertEqual(sorted(item['path'] for item in preview['items'] if item.get('path')),sorted(sent['included']),request)
                self.assertEqual(preview['tokens'],sent['chars']//4,request)
            self.assertIn('notes.md',[item.get('path') for item in chat.context_preview(project,{'message':'','document_comment':{'path':path,'id':entry['id']}})['items']],'the thread\'s words count')
            with self.assertRaisesRegex(ValueError,'another project'):chat.context_preview(chat.documents.create_project('Other'),{'document':path})


class AlsoReadTest(unittest.TestCase):
    def test_files_read_beyond_the_context_are_kept_with_the_answer(self):
        """Task 136: "Also read:" lists files Pi opened with its read tool that were not in its context, inside the project, once."""
        import os, sys
        from unittest.mock import patch
        from harness.web_chat import WebChat
        from harness.work_queue import WorkQueue
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);executable=root/'pi'
            executable.write_text('#!'+sys.executable+'\n'+Path('tests/fixtures/fake-pi.py').read_text());executable.chmod(0o755)
            chat=WebChat(root/'chats',12345,3000,data_root=root/'workspace');self.addCleanup(chat.close)
            project=chat.documents.create_project('Reads');conversation=chat.project_chat(project)
            old=time.time()-7200
            for file in chat.documents.project_path(project).rglob('*'):os.utime(file,(old,old))  # not "changed in the last hour", so not in the context
            path=f'projects/{project}/ROADMAP.md';entry=chat.documents.comment(path,'Check it TEST_READ','Describe what we are building.')
            events=[]
            with patch.dict(os.environ,{'PATH':str(root)+os.pathsep+os.environ['PATH']}):
                chat.send(conversation['id'],{'message':'Look around TEST_READ'},events.append)
                chat.send(conversation['id'],{'message':'','document_comment':{'path':path,'id':entry['id']}},events.append)
            self.assertEqual(chat.store.get(conversation['id'])['messages'][-1]['also_read'],['tasks/001-first-task.md'],'not ROADMAP.md (in the context), not outside the project, once')
            answer=[reply for reply in chat.documents.get(path)['comments'][0]['replies'] if reply['author']=='pi'][-1]
            self.assertEqual(answer['also_read'],['tasks/001-first-task.md'])
            self.assertEqual([event['files'] for event in events if event.get('type')=='also_read'],[['tasks/001-first-task.md']]*2)
            queue=WorkQueue(root/'queue',lambda job,emit:None);self.addCleanup(queue.close)
            job={'id':'0'*32,'project':project,'chat':conversation['id'],'data':{'message':'x'},'created':'','status':'running','progress':'','text':'','thinking':''};queue.update(job,{'type':'also_read','files':['tasks/001-first-task.md']})
            self.assertEqual(job['also_read'],['tasks/001-first-task.md'],'the job keeps it for Activity and whole-file answers')


class LongRequestTest(unittest.TestCase):
    """Task 165: "agents might take long to answer and are guided by the gate ... so long running tasks should be ok".
    No limit on a request's total time; it fails only when Pi has sent nothing for the silence limit."""
    def setUp(self):
        import os, sys
        from unittest.mock import patch
        from harness import web_chat
        from harness.web_chat import WebChat
        temp = tempfile.TemporaryDirectory(); self.addCleanup(temp.cleanup); root = Path(temp.name)
        executable = root / 'pi'; executable.write_text('#!' + sys.executable + '\n' + Path('tests/fixtures/fake-pi.py').read_text()); executable.chmod(0o755)
        for patcher in [patch.dict(os.environ, {'PATH': str(root) + os.pathsep + os.environ['PATH']}), patch.object(web_chat, 'SILENCE', 1.5)]:
            patcher.start(); self.addCleanup(patcher.stop)
        self.chat = WebChat(root / 'chats', 12345, 3000, data_root=root / 'workspace'); self.addCleanup(self.chat.close)
        self.conversation = self.chat.project_chat(self.chat.documents.create_project('Long'))

    def test_work_that_keeps_reporting_runs_past_the_silence_limit(self):
        started = time.monotonic()
        self.chat.send(self.conversation['id'], {'message': 'Long work TEST_TICK'}, lambda event: None)
        self.assertGreater(time.monotonic() - started, 2.5, 'longer than the silence limit')
        self.assertTrue(self.chat.store.get(self.conversation['id'])['messages'][-1]['content'].startswith('[CANARY]'))

    def test_a_silent_pi_fails_with_a_clear_message(self):
        with self.assertRaisesRegex(ValueError, 'Pi sent nothing for 1.5 seconds'):
            self.chat.send(self.conversation['id'], {'message': 'Silent TEST_WAIT'}, lambda event: None)


class DocumentContextTest(unittest.TestCase):
    """Task 115: comment and whole-file requests run on their own; the project chat holds only chat."""
    def test_comment_and_document_requests_leave_the_chat_alone(self):
        import os, sys
        from unittest.mock import patch
        from harness.web_chat import WebChat
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);executable=root/'pi'
            executable.write_text('#!'+sys.executable+'\n'+Path('tests/fixtures/fake-pi.py').read_text());executable.chmod(0o755)
            chat=WebChat(root/'chats',12345,3000,data_root=root/'workspace');self.addCleanup(chat.close)
            project=chat.documents.create_project('Docs');conversation=chat.project_chat(project)
            path=f'projects/{project}/ROADMAP.md';entry=chat.documents.comment(path,'Shorter, please.','Describe what we are building.')
            chat.documents.agent_result(path,entry['id'],'Earlier answer marker')
            with patch.dict(os.environ,{'PATH':str(root)+os.pathsep+os.environ['PATH']}):
                chat.send(conversation['id'],{'message':'Plain chat'},lambda _:None)
                before=chat.store.get(conversation['id'])['messages']
                events=[];chat.send(conversation['id'],{'message':'Comment: Shorter, please.','document_comment':{'path':path,'id':entry['id']}},events.append)
                comment_env=json.loads((chat.store.folder(conversation['id'])/'session.environment.json').read_text())
                comment_request=json.loads((chat.store.folder(conversation['id'])/'session.request.json').read_text())
                chat.send(conversation['id'],{'message':'Is the plan complete?','document':path},events.append)
                document_env=json.loads((chat.store.folder(conversation['id'])/'session.environment.json').read_text())
            self.assertEqual(chat.store.get(conversation['id'])['messages'],before,'the chat holds only chat')
            self.assertFalse(comment_env['session']);self.assertFalse(document_env['session'],'one-off Pi requests, no session')
            self.assertIn('Earlier answer marker',comment_request['message'],'the whole thread, Pi\'s answers included')
            self.assertIn('Describe what we are building.',comment_env['context'],'the page is in the context')
            self.assertTrue(any(event.get('type')=='message_update' for event in events),'the answer still streams to the job')
            self.assertEqual(next(item for item in chat.documents.get(path)['comments'] if item['id']==entry['id'])['agent_reply'],'[CANARY] reply 1')
