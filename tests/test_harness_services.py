try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:  # run as tests.<module> from the repository root
    from tests import isolation  # noqa: F401
import json
import re
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import urllib.request

ROOT = Path(__file__).resolve().parent.parent

class ServicesTest(unittest.TestCase):
    def test_ready_gate_and_shutdown(self):
        temporary = tempfile.TemporaryDirectory()
        process = subprocess.Popen([sys.executable, 'harness/services.py'], cwd=ROOT,
            env={**os.environ, 'PI_GATE_PORT': '0', 'PI_WEB_PORT': '0', 'PI_AGENT_DATA':str(Path(temporary.name)/'workspace'), 'PI_WEB_DATA':str(Path(temporary.name)/'web')},
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        try:
            line = process.stdout.readline()
            self.assertTrue(line, process.stderr.read() if process.poll() is not None else 'No readiness')
            ports = json.loads(line)
            base = f"http://127.0.0.1:{ports['gate']}"
            with urllib.request.urlopen(base + '/health', timeout=3) as response:
                self.assertTrue(json.load(response)['gate'])
            self.assertGreaterEqual(len(ports.get('token','')),32)
            def post(path, body, **headers):
                headers={'Content-Type':'application/json','X-Gate-Token':ports.get('token',''),**headers}
                request=urllib.request.Request(base+path,data=json.dumps(body).encode(),headers=headers)
                with urllib.request.urlopen(request,timeout=3) as response:
                    self.assertIsNone(response.headers.get('Access-Control-Allow-Origin'))
                    return json.load(response)
            project=Path(temporary.name)/'project';project.mkdir();(project/'README.md').write_text('# Rules\n')
            chosen=post('/context',{'cwd':str(project),'text':'read the rules','request':'terminal-test'})
            self.assertIn('README.md',chosen['included']);self.assertEqual(chosen['reasons']['README.md'],'Project rules')
            (project/'README.md').write_text('# Changed rules\n')
            self.assertIn('Changed rules',post('/context',{'cwd':str(project),'text':'read the rules'})['text'])
            # A web page must not reach Gate: no CORS, no foreign Origin/Host, no missing or wrong token.
            probe={'tool_name':'read_file','args':{'path':'x'}}
            for headers in [{'Origin':'https://evil.example'},{'Origin':base},{'X-Gate-Token':''},{'X-Gate-Token':'wrong'},{'Host':'evil.example:'+str(ports['gate'])}]:
                with self.assertRaises(urllib.error.HTTPError,msg=headers) as denied:post('/gatekeep',probe,**headers)
                self.assertEqual(denied.exception.code,403,headers);denied.exception.close()
            preflight=urllib.request.Request(base+'/gatekeep',method='OPTIONS',headers={'Origin':'https://evil.example','Access-Control-Request-Method':'POST'})
            with self.assertRaises(urllib.error.HTTPError) as denied:urllib.request.urlopen(preflight,timeout=3)
            self.assertIsNone(denied.exception.headers.get('Access-Control-Allow-Origin'));denied.exception.close()
            for auth in ['standard','admin']:
                self.assertEqual(post('/gatekeep',{'tool_name':'execute_command','args':{'cmd':'echo hi'},'auth_level':auth})['outcome'],'ALLOW')
            blocked=post('/gatekeep',{'tool_name':'execute_command','args':{'command':'rm -fr *'},'auth_level':'admin'})
            self.assertEqual(blocked['outcome'],'BLOCK')
            self.assertIn('Recursive deletion',blocked['reason'])
            self.assertNotIn('proposal_id',blocked)
            gate=post('/gatekeep',{'tool_name':'read_file','args':{'path':'original'}})
            audit=post('/audit',{'proposal_id':gate['proposal_id'],'tool_name':'read_file','args':{'path':'changed'},'exit_code':0})
            self.assertEqual(audit['status'],'DRIFT_DETECTED')
            with self.assertRaises(urllib.error.HTTPError) as error:
                post('/audit',{'proposal_id':gate['proposal_id'],'tool_name':'read_file','args':{},'exit_code':0})
            self.assertEqual(error.exception.code,409)
            error.exception.close()
            # The Gate audit log defaults to PI_AGENT_DATA/gate-audit.log.
            self.assertIn('DRIFT_DETECTED',(Path(temporary.name)/'workspace'/'gate-audit.log').read_text())
            web_base=f"http://127.0.0.1:{ports['web']}"
            def web_post(path,body,origin=None,person=False):
                headers={'Content-Type':'application/json'}
                if origin:headers['Origin']=origin
                if person:  # task 261: the person's controls carry the served page's secret
                    with urllib.request.urlopen(web_base+'/',timeout=3) as response:headers['X-Pi-Person']=re.search(r'<meta name="pi-person" content="([^"]+)">',response.read().decode())[1]
                request=urllib.request.Request(web_base+path,data=json.dumps(body).encode(),headers=headers)
                with urllib.request.urlopen(request,timeout=3) as response:return json.load(response)
            with urllib.request.urlopen(web_base+'/api/gate') as response:
                activity=json.load(response)
                self.assertTrue(any(event['outcome']=='BLOCK' for event in activity['events']))
                self.assertTrue(any(event['outcome']=='DRIFT_DETECTED' for event in activity['events']))
                self.assertEqual(activity['gate_port'],ports['gate'])
            gate=post('/gatekeep',{'tool_name':'read_file','args':{'path':'seen'},'tool_call_id':'call-9'})
            post('/audit',{'proposal_id':gate['proposal_id'],'tool_name':'read_file','args':{'path':'seen'},'exit_code':0})
            with urllib.request.urlopen(web_base+'/api/gate') as response:
                self.assertEqual([(event['phase'],event['outcome']) for event in json.load(response)['events'] if event['tool_call']=='call-9'],[('gate','ALLOW'),('audit','SUCCESS')])
            created=web_post('/api/projects/create',{'name':'HTTP project'})
            conversation={'id':created['chat']}
            renamed=web_post('/api/conversations/'+conversation['id']+'/rename',{'title':'Japanese audio'})
            self.assertEqual(renamed['title'],'Japanese audio')
            with urllib.request.urlopen(web_base+'/api/conversations') as response:
                self.assertEqual(len(json.load(response)),1)
            for invalid in [{'project':created['project'],'message':42},{'project':created['project'],'message':'Hello','document_comment':{'path':'x','id':'bad'}}]:
                with self.assertRaises(urllib.error.HTTPError) as malformed:web_post('/api/jobs/create',invalid)
                self.assertEqual(malformed.exception.code,400);malformed.exception.close()
            with self.assertRaises(urllib.error.HTTPError) as rejected:
                web_post('/api/projects/create',{'name':'Untrusted'},origin='https://untrusted.example')
            self.assertEqual(rejected.exception.code,403);rejected.exception.close()
            with self.assertRaises(urllib.error.HTTPError) as hidden:
                urllib.request.urlopen(web_base+'/session.log')
            self.assertEqual(hidden.exception.code,404);hidden.exception.close()
            with urllib.request.urlopen(web_base+'/api/project-files?project='+created['project']) as response:
                self.assertTrue(any(item['name']=='ROADMAP.md' for item in json.load(response)))
            plain=Path(temporary.name)/'plain';plain.mkdir()
            registered=web_post('/api/projects/register',{'path':str(plain)})
            selection=post('/phase',{'cwd':temporary.name})
            self.assertTrue(any(Path(item['path'])==plain.resolve() for item in selection['projects']))
            self.assertEqual(post('/phase',{'cwd':str(plain)})['phase'],'discussion')
            blocked=post('/gatekeep',{'tool_name':'write_file','pi_tool':'write','args':{'path':str(plain/'app.py'),'content':'x=1'},'cwd':temporary.name,'auth_level':'admin'})
            self.assertEqual(blocked.get('phase'),'discussion')
            self.assertEqual(web_post('/api/phase',{'project':registered['project'],'phase':'planning'},person=True)['phase'],'planning')
            self.assertEqual(post('/phase',{'cwd':str(plain)})['phase'],'planning')
            # Task 260: the person's recovery for a falsely completed task (the UI control still needs design).
            (plain/'tasks').mkdir();(plain/'ROADMAP.md').write_text('# Roadmap\n\n## Goal\nA clock.\n\n## Tasks\n- [x] [001-Clock](tasks/001-clock.md)\n')
            (plain/'tasks/001-clock.md').write_text('# 001: Clock\n\nKind: code\nFiles: app.py\n\nDone when: it ticks.\n\n- [x] Red: a test fails for this change.\n')
            for args in (['init','-q'],['add','-A'],['-c','user.name=t','-c','user.email=t@t','commit','-qm','false completion']):subprocess.run(['git','-C',str(plain),*args],check=True,capture_output=True)
            with self.assertRaises(urllib.error.HTTPError) as anyone:web_post('/api/tasks/reopen',{'project':registered['project'],'task':'tasks/001-clock.md'})
            self.assertEqual(anyone.exception.code,403);anyone.exception.close()  # task 261: only the person's page may reopen
            with self.assertRaises(urllib.error.HTTPError) as refused:web_post('/api/tasks/reopen',{'project':registered['project'],'task':'../outside.md'},person=True)
            self.assertEqual(refused.exception.code,400);refused.exception.close()
            reopened=web_post('/api/tasks/reopen',{'project':registered['project'],'task':'tasks/001-clock.md'},person=True)
            self.assertEqual(reopened['task'],'tasks/001-clock.md');self.assertTrue(reopened['commit'])
            self.assertIn('- [ ] [001-Clock]',(plain/'ROADMAP.md').read_text());self.assertIn('- [ ] Red:',(plain/'tasks/001-clock.md').read_text())
            # Task 261: Gate's token alone cannot act as the person; the ready line's person secret (terminal Pi) can.
            with self.assertRaises(urllib.error.HTTPError) as denied:post('/phase',{'cwd':str(plain),'phase':'discussion'})
            self.assertEqual(denied.exception.code,403);denied.exception.close()
            self.assertEqual(post('/phase',{'cwd':str(plain),'phase':'discussion'},**{'X-Pi-Person':ports['person']})['phase'],'discussion')
            with urllib.request.urlopen(web_base+'/',timeout=3) as response:self.assertIn(f'content="{ports["person"]}"',response.read().decode())
            with urllib.request.urlopen(f"http://127.0.0.1:{ports['web']}/index.html", timeout=3) as response:
                self.assertEqual(response.status,200)
        finally:
            process.terminate()
            process.wait(timeout=5)
            process.stdout.close()
            process.stderr.close()
            temporary.cleanup()
        self.assertEqual(process.returncode,0)


class ServerBacklogTest(unittest.TestCase):
    def test_a_page_load_does_not_overflow_the_listen_backlog(self):
        """Task 154: the default backlog of 5 made macOS reset connections while a page loaded its modules."""
        from harness.services import Server
        self.assertGreaterEqual(Server.request_queue_size, 64)

class TailnetRecoveryTest(unittest.TestCase):
    def test_a_lost_serve_session_restarts_and_shutdown_stops_only_its_child(self):
        import time
        from unittest.mock import patch
        from harness.services import tailscale_serve
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);fake=root/'tailscale';count=root/'starts';pid=root/'pid'
            fake.write_text('#!'+sys.executable+'\n'+f'''from pathlib import Path
import os,time
count=Path({str(count)!r});n=int(count.read_text())+1 if count.exists() else 1
temporary=count.with_suffix('.tmp');temporary.write_text(str(n));temporary.replace(count);Path({str(pid)!r}).write_text(str(os.getpid()))
print('Available within your tailnet',flush=True)
time.sleep(.2 if n==1 else 30)
''');fake.chmod(0o755)
            with patch.dict(os.environ,{'PI_TAILSCALE':str(fake)}):
                process,problem=tailscale_serve(5000,settle=1)
                self.assertIsNone(problem)
                try:
                    deadline=time.monotonic()+4
                    while time.monotonic()<deadline and (not count.exists() or int(count.read_text())<2):time.sleep(.05)
                    self.assertGreaterEqual(int(count.read_text()),2,'Serve reconnects after its first session exits')
                    self.assertIsNone(process.poll())
                    child=int(pid.read_text())
                finally:process.terminate();process.wait(timeout=5)
                with self.assertRaises(ProcessLookupError):os.kill(child,0)
                starts=count.read_text();time.sleep(.3);self.assertEqual(count.read_text(),starts,'closing sharing cannot restart it')

    def test_closing_during_reconnection_stops_the_late_replacement(self):
        import threading
        from unittest.mock import Mock
        from harness.services import ServeProcess
        entered=threading.Event();release=threading.Event()
        old=Mock();old.poll.return_value=1
        replacement=Mock();replacement.poll.return_value=None
        def restart(_stopped):
            entered.set();release.wait(2)
            return replacement,None
        process=ServeProcess(old,restart)
        try:
            self.assertTrue(entered.wait(2))
            process.terminate();release.set();process.wait(timeout=3)
            replacement.terminate.assert_called_once()
            replacement.wait.assert_called_once()
            self.assertIsNotNone(process.poll())
        finally:release.set();process.terminate();process.wait(timeout=3)

    def test_shutdown_cancels_a_reconnection_waiting_for_readiness(self):
        import threading,time
        from unittest.mock import patch
        from harness.services import _tailscale_start
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);fake=root/'tailscale';pid=root/'pid'
            fake.write_text('#!'+sys.executable+'\n'+f"import os,time\nfrom pathlib import Path\nPath({str(pid)!r}).write_text(str(os.getpid()))\ntime.sleep(30)\n");fake.chmod(0o755)
            stopped=threading.Event();result=[]
            with patch.dict(os.environ,{'PI_TAILSCALE':str(fake)}):
                thread=threading.Thread(target=lambda:result.append(_tailscale_start(5000,settle=10,stopped=stopped)))
                thread.start()
                try:
                    deadline=time.monotonic()+2
                    while not pid.exists() and time.monotonic()<deadline:time.sleep(.02)
                    self.assertTrue(pid.exists())
                    child=int(pid.read_text());stopped.set();thread.join(3)
                    self.assertFalse(thread.is_alive(),'shutdown does not wait for the readiness timeout')
                    with self.assertRaises(ProcessLookupError):os.kill(child,0)
                    self.assertEqual(result,[(None,None)])
                finally:stopped.set();thread.join(3)
