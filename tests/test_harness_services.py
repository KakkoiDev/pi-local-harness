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
            env={**os.environ, 'PI_LAYA_PORT': '0', 'PI_WEB_PORT': '0', 'PI_AGENT_DATA':str(Path(temporary.name)/'workspace'), 'PI_WEB_DATA':str(Path(temporary.name)/'web'), 'PI_HARNESS_LOG_FILE':str(Path(temporary.name)/'audit.log')},
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        try:
            line = process.stdout.readline()
            self.assertTrue(line, process.stderr.read() if process.poll() is not None else 'No readiness')
            ports = json.loads(line)
            base = f"http://127.0.0.1:{ports['laya']}"
            with urllib.request.urlopen(base + '/health', timeout=3) as response:
                self.assertTrue(json.load(response)['laya'])
            for auth, expected in [('standard', 'ALLOW'), ('admin', 'ALLOW')]:
                request = urllib.request.Request(base + '/gatekeep', data=json.dumps({
                    'tool_name': 'execute_command', 'args': {'cmd':'echo hi'}, 'auth_level':auth,
                }).encode(), headers={'Content-Type':'application/json'})
                with urllib.request.urlopen(request, timeout=3) as response:
                    self.assertEqual(json.load(response)['outcome'],expected)
            def post(path, body):
                request=urllib.request.Request(base+path,data=json.dumps(body).encode(),headers={'Content-Type':'application/json'})
                with urllib.request.urlopen(request,timeout=3) as response:return json.load(response)
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
            web_base=f"http://127.0.0.1:{ports['web']}"
            def web_post(path,body,origin=None):
                headers={'Content-Type':'application/json'}
                if origin:headers['Origin']=origin
                request=urllib.request.Request(web_base+path,data=json.dumps(body).encode(),headers=headers)
                with urllib.request.urlopen(request,timeout=3) as response:return json.load(response)
            with urllib.request.urlopen(web_base+'/api/laya') as response:
                activity=json.load(response)
                self.assertTrue(any(event['outcome']=='BLOCK' for event in activity['events']))
                self.assertTrue(any(event['outcome']=='DRIFT_DETECTED' for event in activity['events']))
                self.assertEqual(activity['laya_port'],ports['laya'])
            created=web_post('/api/projects/create',{'name':'HTTP project'})
            conversation={'id':created['chat']}
            renamed=web_post('/api/conversations/'+conversation['id']+'/rename',{'title':'Japanese audio'})
            self.assertEqual(renamed['title'],'Japanese audio')
            with urllib.request.urlopen(web_base+'/api/conversations') as response:
                self.assertEqual(len(json.load(response)),1)
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
