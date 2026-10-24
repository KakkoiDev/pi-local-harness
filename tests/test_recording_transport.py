"""Recording transport is project-scoped, person-only and bounded."""
try:
    import isolation
except ModuleNotFoundError:
    from tests import isolation
import http.server
import json
from pathlib import Path
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from harness.web_chat import WebChat, WebHandler

class RecordingTransportTest(unittest.TestCase):
    def setUp(self):
        temp=tempfile.TemporaryDirectory();self.addCleanup(temp.cleanup)
        self.chat=WebChat(Path(temp.name)/'chats',9,0,data_root=Path(temp.name)/'data');self.addCleanup(self.chat.close)
        self.project=self.chat.documents.create_project('Recording')
        class Handler(WebHandler):pass
        Handler.chat=self.chat;Handler.person_secret='test-person';Handler.log_message=lambda *args:None
        server=http.server.ThreadingHTTPServer(('127.0.0.1',0),Handler)
        threading.Thread(target=server.serve_forever,daemon=True).start();self.addCleanup(server.server_close);self.addCleanup(server.shutdown)
        self.base=f'http://127.0.0.1:{server.server_port}'

    def test_quiet_recording_defaults_global_stop_and_old_batches(self):
        project=self.project['id'] if isinstance(self.project,dict) else self.project
        self.assertTrue(self.chat.recording({'surface':'workstation'})['enabled'])
        old=self.chat.recording({'project':project})
        self.chat.recording({'surface':'workstation','action':'preferences','enabled':False})
        for surface in ('preview','workstation'):
            self.assertFalse(self.chat.recording({'surface':surface,'project':project})['enabled'])
        self.chat.recording({'surface':'workstation','action':'preferences','enabled':True})
        late=self.chat.recording({'project':project,'action':'append','generation':old['generation'],'run':old['run'],'flow':{'steps':[{'type':'focus','selectors':[['button']]}]}})
        self.assertIsNone(late['flow'])
        new=self.chat.documents.create_project('Later')
        self.chat.recording({'surface':'workstation','action':'preferences','enabled':False})
        self.assertFalse(self.chat.recording({'project':new})['enabled'])

    def request(self,body=None,person=True,path='/api/recordings'):
        request=urllib.request.Request(self.base+path,data=json.dumps(body).encode() if body is not None else None,headers={'Content-Type':'application/json',**({'X-Pi-Person':'test-person'} if person else {})})
        try:
            with urllib.request.urlopen(request,timeout=5) as response:return response.status,json.load(response)
        except urllib.error.HTTPError as error:
            with error:return error.code,json.load(error)

    def test_stop_all_is_person_only_preserves_history_and_invalidates_every_project(self):
        other=self.chat.documents.create_project('Other recording')
        self.request({'surface':'workstation','action':'enabled','enabled':True})
        batches=[]
        for project in (self.project,other):
            body={'project':project,'action':'append','generation':0,'run':self.chat.recording_run,'flow':{'steps':[{'type':'focus','selectors':[['input']]}]}}
            self.assertIsNotNone(self.request(body)[1]['flow']);batches.append(body)
        self.assertEqual(self.request({'surface':'workstation','action':'stop_all'},person=False)[0],403)
        self.assertEqual(self.request({'surface':'workstation','action':'stop_all'})[0],200)
        self.assertFalse(self.request({'surface':'workstation'})[1]['enabled'])
        for body in batches:
            state=self.request(path='/api/recordings?project='+body['project'])[1]
            self.assertFalse(state['enabled']);self.assertEqual(state['steps'],1)
            self.assertIsNone(self.request(body)[1]['flow'])
            self.request({'project':body['project'],'action':'enabled','enabled':True})
            self.assertIsNone(self.request(body)[1]['flow'],'old generations stay rejected after re-enable')

    def test_stop_all_storage_failure_is_not_reported_as_success(self):
        from unittest.mock import patch
        with patch.object(self.chat.recordings,'set_enabled',side_effect=OSError('Scratch recording disk unavailable')):
            status,result=self.request({'surface':'workstation','action':'stop_all'})
        self.assertEqual(status,500);self.assertIn('error',result)
        self.assertFalse(self.request({'surface':'workstation'})[1]['enabled'])
        self.assertEqual(self.request(path='/api/workspace')[0],200)

    def test_safe_focus_steps_are_persisted_in_one_flow_and_disable_rejects_late_batches(self):
        body={'project':self.project,'action':'append','generation':0,'run':self.chat.recording_run,'flow':{'steps':[{'type':'focus','selectors':[['input:nth-of-type(1)']],'value':'secret'}]}}
        status,first=self.request(body);self.assertEqual(status,200,first)
        self.assertNotIn('secret',json.dumps(first))
        status,next_flow=self.request({**body,'flow_id':first['flow']['id']});self.assertEqual(status,200,next_flow)
        self.assertEqual(len(next_flow['flow']['steps']),2)
        status,state=self.request(path='/api/recordings?project='+self.project)
        self.assertEqual(state['flows'],1);self.assertEqual(state['steps'],2)
        self.assertEqual(self.request({'project':self.project,'action':'enabled','enabled':False})[0],200)
        self.assertIsNone(self.request(body)[1]['flow'])
        self.assertEqual(self.request({'project':self.project,'action':'clear'})[0],200)
        self.assertEqual(self.request(path='/api/recordings?project='+self.project)[1]['steps'],0)

    def test_forged_project_missing_person_and_oversized_batches_are_refused(self):
        body={'project':self.project,'action':'append','generation':0,'run':self.chat.recording_run,'flow':{'steps':[]}}
        self.assertEqual(self.request(body,person=False)[0],403)
        self.assertEqual(self.request({**body,'project':'../outside'})[0],400)
        self.assertEqual(self.request({**body,'flow':{'steps':[],'padding':'x'*70000}})[0],400)

    def test_workstation_default_on_is_separate_and_outside_events_stay_outside_projects(self):
        base={'surface':'workstation'}
        status,state=self.request({**base,'action':'status'})
        self.assertEqual(status,200,state);self.assertTrue(state['enabled'])
        _,state=self.request({**base,'action':'enabled','enabled':True})
        body={**base,'action':'append','generation':state['generation'],'run':state['run'],'flow':{'steps':[{'type':'focus','selectors':[['button:nth-of-type(1)']]}]}}
        _,recorded=self.request(body);self.assertIsNotNone(recorded['flow'])
        _,inside=self.request({**base,'project':self.project,'action':'status'})
        self.assertTrue(inside['enabled']);self.assertEqual(inside['steps'],0)
        stopped=self.request({**base,'project':self.project,'action':'enabled','enabled':False})[1]
        self.assertTrue(stopped['ever_enabled'])
        self.assertIsNone(self.request(body)[1]['flow'])
        self.assertTrue(self.request(path='/api/recordings?project='+self.project)[1]['enabled'])

    def test_dismissing_the_recording_notice_is_host_persisted_without_enabling_capture(self):
        body={'surface':'workstation','action':'notice'}
        status,state=self.request(body)
        self.assertEqual(status,200,state)
        self.assertTrue(state['notice_seen']);self.assertTrue(state['enabled'])
        self.assertTrue(self.request({**body,'action':'status'})[1]['notice_seen'])

    def test_a_restarted_host_refuses_batches_from_its_previous_run(self):
        state=self.request(path='/api/recordings?project='+self.project)[1]
        body={'project':self.project,'action':'append','generation':state['generation'],'run':state['run'],'flow':{'steps':[{'type':'focus','selectors':[['button:nth-of-type(1)']]}]}}
        first=self.request(body)[1]['flow']
        self.chat.recording_run='new-host-run'
        self.assertIsNone(self.request({**body,'flow_id':first['id']})[1]['flow'])

    def test_preview_bridge_controls_refuse_other_windows_origins_and_sessions(self):
        import shutil
        import subprocess
        if not shutil.which('node'): self.skipTest('Node runs the bridge boundary')
        helper=Path('harness/recording-helper.mjs').read_text().replace("import { installRecorder } from './recorder-core.mjs';", 'const installRecorder = () => mock;').replace('__ORIGINS__', '["http://127.0.0.1:4000"]')
        prefix="""
import assert from 'node:assert/strict';
const listeners = {}, sent = [];
globalThis.parent = { postMessage: data => sent.push(data) };
globalThis.addEventListener = (type, handler) => { listeners[type] = handler; };
const mock = { enabled: false, setEnabled(value) { this.enabled = value; }, stop() {} };
"""
        suffix="""
const control = { type: 'pi-recording-control', session: sent[0].session, generation: 0, run: 'host', enabled: true };
const send = (origin, source, data) => listeners.message({ origin, source, data });
send('http://evil.example', parent, control); assert.equal(mock.enabled, false);
send('http://127.0.0.1:4000', {}, control); assert.equal(mock.enabled, false);
send('http://127.0.0.1:4000', parent, { ...control, session: 'stale' }); assert.equal(mock.enabled, false);
send('http://127.0.0.1:4000', parent, control); assert.equal(mock.enabled, true);
send('http://127.0.0.1:4000', parent, { type: 'pi-recording-probe', probe: 'new-document' });
assert.equal(sent.at(-1).probe, 'new-document');
console.log('Bridge boundary passed');
"""
        result=subprocess.run(['node','--input-type=module','-e',prefix+helper+suffix],capture_output=True,text=True,timeout=10)
        self.assertEqual(result.returncode,0,result.stderr)
        self.assertIn('Bridge boundary passed',result.stdout)

    def test_unavailable_recording_directory_does_not_prevent_workbench_startup(self):
        from unittest.mock import patch
        original=Path.mkdir
        def unavailable(path,*args,**kwargs):
            if path.name in ('.action-recordings','.ws-action-recordings'):raise OSError('Scratch recording disk unavailable')
            return original(path,*args,**kwargs)
        root=self.chat.documents.root.parent/'unavailable-recorder'
        with patch.object(Path,'mkdir',unavailable):
            chat=WebChat(root/'chats',9,0,data_root=root/'data')
            try:
                self.assertEqual(chat.workspace()['projects'],[])
                with self.assertRaises(OSError):chat.recording({'surface':'workstation'})
            finally:chat.close()
