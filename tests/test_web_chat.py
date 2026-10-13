import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
import base64
import json
import tempfile
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
