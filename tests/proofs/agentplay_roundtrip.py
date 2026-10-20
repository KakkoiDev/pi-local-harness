"""Opt-in Agentplay 0.2.1 proof using synthetic data and an isolated local store.

AGENTPLAY_PROOF_PACKAGE=/approved/extracted/wheel python3 tests/proofs/agentplay_roundtrip.py
No discovery CLI, personal log access, downloads or replay execution.
"""
import argparse
import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import tempfile
import threading
import unittest
from unittest.mock import patch
import urllib.request

sys.path.insert(0,str(Path(__file__).resolve().parents[2]))
package=Path(os.environ.get('AGENTPLAY_PROOF_PACKAGE',''))
if not package.is_absolute() or not (package/'agentplay/__init__.py').is_file():
    raise RuntimeError('Select the explicitly approved, already unpacked Agentplay package.')
sys.path.insert(0,str(package))
import agentplay
from agentplay import builder, cli, server, store
from harness.run_evidence import normalize
if agentplay.__version__!='0.2.1':raise RuntimeError('This proof is pinned to Agentplay 0.2.1.')


def fixture():
    def envelope(source,event):return dict(project='selected',request='request',source=source,event=event)
    records=[
        envelope('pi',dict(type='tool_execution_start',toolCallId='read',toolName='read',args={'path':'SECRET-private-file'})),
        envelope('pi',dict(type='tool_execution_end',toolCallId='read',isError=False)),
        envelope('gate',dict(phase='gate',outcome='BLOCK',tool_call='write',tool='write',args={'path':'SECRET-private-file'})),
        envelope('pi',dict(type='tool_execution_start',toolCallId='shell',toolName='bash',args={'command':'SECRET-not-a-command-to-execute'})),
        envelope('pi',dict(type='tool_execution_end',toolCallId='shell',isError=True)),
        dict(project='other',request='request',source='pi',event=dict(type='tool_execution_start',toolCallId='other',toolName='read')),
    ]
    report=normalize(records,project='selected',request='request')
    b=builder.MapBuilder()
    # These timestamps belong to the synthetic fixture, not to an inferred real run.
    for index,call in enumerate(report['calls']):
        if call['state']=='blocked':
            event=dict(kind='error',source='tool',**{'class':'gate_blocked'},agent='main',err=True)
        else:
            event=dict(kind='tool',tool=call['tool'],agent='main',err=call['state']=='failed')
        b.add(event,1792454400+index)
    doc=b.finish(session=dict(id='synthetic-workstation-proof',agentTool='pi-workstation-proof',startedAt='2026-10-20T00:00:00Z',cliVersion='proof'))
    doc['workstationProof']=dict(synthetic=True,gateRefusalsAreNotToolCalls=True,provenance=report)
    return doc,report

class AgentplayProof(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)
        env=patch.dict(os.environ,{'AGENTPLAY_HOME':str(self.root/'store'),'AGENTPLAY_NO_NETWORK':'1','DO_NOT_TRACK':'1'})
        env.start();self.addCleanup(env.stop)
    def test_counts_preserve_refusal_without_counting_it_as_execution(self):
        doc,report=fixture()
        self.assertEqual(doc['schema'],'agentplay/v1')
        self.assertEqual(doc['totals']['calls'],2)
        self.assertEqual([c['state'] for c in report['calls']],['succeeded','blocked','failed'])
        self.assertEqual(len([e for e in doc['events'] if e['kind']=='tool']),2)
        self.assertEqual(len([e for e in doc['events'] if e.get('class')=='gate_blocked']),1)
        self.assertNotIn('SECRET',json.dumps(doc))
    def test_explicit_import_does_not_discover_or_connect(self):
        doc,_=fixture();path=self.root/'fixture.json';path.write_text(json.dumps(doc))
        with patch.object(cli.discover.Homes,'default',side_effect=AssertionError('discovery forbidden')), patch('socket.create_connection',side_effect=AssertionError('network forbidden')):
            self.assertEqual(cli.cmd_import(argparse.Namespace(files=[str(path)],title=None)),0)
        saved=store.Store().get(doc['session']['id'])
        self.assertEqual(saved,doc)
    def test_bundled_viewer_and_read_only_api_use_selected_map_only(self):
        doc,_=fixture();st=store.Store();st.put(doc,dict(builder.summary(doc),sessionId=doc['session']['id']));st.save_index()
        httpd=server.serve(0,store=st);thread=threading.Thread(target=httpd.serve_forever,daemon=True);thread.start()
        self.addCleanup(httpd.server_close);self.addCleanup(httpd.shutdown)
        url=f'http://127.0.0.1:{httpd.server_address[1]}'
        connect=socket.create_connection
        def local_only(address,*args,**kwargs):
            if address[0]!='127.0.0.1':raise AssertionError('outbound network forbidden')
            return connect(address,*args,**kwargs)
        with patch('socket.create_connection',side_effect=local_only):
            with urllib.request.urlopen(url+'/api/map-doc?id=synthetic-workstation-proof') as reply:body=json.load(reply)
            self.assertEqual(body,doc)
            with urllib.request.urlopen(url+'/api/status') as reply:status=json.load(reply)
            self.assertEqual(status['mapCount'],1)
            with urllib.request.urlopen(url+'/') as reply:self.assertIn('<html',reply.read().decode())

    @unittest.skipUnless(os.environ.get('PI_PLAYWRIGHT') and os.environ.get('PI_TEST_CHROME'),'Explicit installed browser required')
    def test_real_viewer_renders_the_imported_session(self):
        doc,_=fixture();st=store.Store();st.put(doc,dict(builder.summary(doc),sessionId=doc['session']['id']));st.save_index()
        httpd=server.serve(0,store=st);threading.Thread(target=httpd.serve_forever,daemon=True).start()
        self.addCleanup(httpd.server_close);self.addCleanup(httpd.shutdown)
        script = r"""
const {chromium}=require(process.env.PI_PLAYWRIGHT+'/playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.PI_TEST_CHROME,headless:true});
 try {
  const page=await browser.newPage();const failures=[];
  page.on('pageerror',error=>failures.push(error.message));
  await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
  await page.goto(process.argv[1]);
  await page.getByText('pi-workstation-proof',{exact:false}).first().waitFor({timeout:15000});
  if(failures.length)throw Error(failures.join('\n'));
  console.log('Imported session rendered without page errors.');
 } finally {await browser.close();}
})().catch(error=>{console.error(error.message);process.exit(1)});
"""
        result=subprocess.run(['node','-e',script,f'http://127.0.0.1:{httpd.server_address[1]}'],capture_output=True,text=True,timeout=30)
        self.assertEqual(result.returncode,0,result.stdout+result.stderr)

if __name__=='__main__':unittest.main()
