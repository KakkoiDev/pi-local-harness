import json
import os
from pathlib import Path
import subprocess
import sys
import unittest
import urllib.request

ROOT = Path(__file__).resolve().parent.parent

class ServicesTest(unittest.TestCase):
    def test_ready_gate_and_shutdown(self):
        process = subprocess.Popen([sys.executable, 'harness/services.py'], cwd=ROOT,
            env={**os.environ, 'PI_LAYA_PORT': '0', 'PI_WEB_PORT': '0'},
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        try:
            line = process.stdout.readline()
            self.assertTrue(line, process.stderr.read() if process.poll() is not None else 'No readiness')
            ports = json.loads(line)
            base = f"http://127.0.0.1:{ports['laya']}"
            with urllib.request.urlopen(base + '/health', timeout=3) as response:
                self.assertTrue(json.load(response)['laya'])
            for auth, expected in [('standard', 'BLOCK'), ('admin', 'ALLOW')]:
                request = urllib.request.Request(base + '/gatekeep', data=json.dumps({
                    'tool_name': 'execute_command', 'args': {'cmd':'echo hi'}, 'auth_level':auth,
                }).encode(), headers={'Content-Type':'application/json'})
                with urllib.request.urlopen(request, timeout=3) as response:
                    self.assertEqual(json.load(response)['outcome'],expected)
            with urllib.request.urlopen(f"http://127.0.0.1:{ports['web']}/index.html", timeout=3) as response:
                self.assertEqual(response.status,200)
        finally:
            process.terminate()
            process.wait(timeout=5)
            process.stdout.close()
            process.stderr.close()
        self.assertEqual(process.returncode,0)
