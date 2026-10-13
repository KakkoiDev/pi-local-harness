import json
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
            def web_post(path,body,origin=None):
                headers={'Content-Type':'application/json'}
                if origin:headers['Origin']=origin
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
            with urllib.request.urlopen(web_base+'/api/project-files?project=HTTP%20project') as response:
                self.assertTrue(any(item['name']=='ROADMAP.md' for item in json.load(response)))
            with urllib.request.urlopen(f"http://127.0.0.1:{ports['web']}/index.html", timeout=3) as response:
                self.assertEqual(response.status,200)
        finally:
            process.terminate()
            process.wait(timeout=5)
            process.stdout.close()
            process.stderr.close()
            temporary.cleanup()
        self.assertEqual(process.returncode,0)
