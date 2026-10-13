"""Smoke test the installed pi runtime without making an LLM request."""
import json
import os
from pathlib import Path
import selectors
import subprocess
import tempfile
import time
import unittest

ROOT = Path(__file__).resolve().parent.parent

class PiStartupTest(unittest.TestCase):
    def test_real_pi_extension_loads_and_exposes_vision(self):
        with tempfile.TemporaryDirectory(prefix='pi-startup-') as directory:
            Path(directory, 'AGENTS.md').write_text('Start every response with [CANARY].')
            process = subprocess.Popen(['python3', str(ROOT / 'plh.py'), '--mode', 'rpc', '--no-session'], cwd=ROOT,
                env={**os.environ, 'PI_CODING_AGENT_DIR':directory, 'PI_AGENT_DATA':str(Path(directory)/'workspace'), 'PI_LAYA_PORT':'0', 'PI_WEB_PORT':'0', 'PI_WEB_DATA':str(Path(directory)/'web')},
                stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            try:
                process.stdin.write(json.dumps({'id':'state','type':'get_state'})+'\n')
                process.stdin.flush()
                selector=selectors.DefaultSelector()
                selector.register(process.stdout,selectors.EVENT_READ)
                lines=[]; state=None; deadline=time.monotonic()+20
                while time.monotonic()<deadline:
                    if not selector.select(timeout=1):
                        if process.poll() is not None: break
                        continue
                    line=process.stdout.readline()
                    if not line: break
                    lines.append(line)
                    event=json.loads(line)
                    if event.get('id')=='state': state=event;break
                selector.close()
                if state is None:process.terminate();process.wait(timeout=10)
                self.assertIsNotNone(state, ''.join(lines)+(process.stderr.read() if process.poll() is not None else ''))
                self.assertTrue(state['success'],state)
                self.assertEqual(state['data']['model']['id'],'gemma4:26b-mlx')
                self.assertIn('image',state['data']['model']['input'])
                self.assertEqual(state['data']['thinkingLevel'], 'high')
                self.assertTrue(any('Laya:' in line and 'Web:' in line for line in lines),lines)
            finally:
                process.terminate()
                process.wait(timeout=10)
                errors=process.stderr.read()
                process.stdin.close();process.stdout.close();process.stderr.close()
            self.assertNotIn('Failed to load extension',errors)

class WebPiCommandTest(unittest.TestCase):
    def test_web_chat_command_is_accepted_by_installed_pi(self):
        from harness.web_chat import pi_command
        with tempfile.TemporaryDirectory(prefix='pi-web-') as directory:
            command=pi_command(Path(directory)/'session.jsonl')
            completed=subprocess.run(command,input=json.dumps({'id':'state','type':'get_state'})+'\n',cwd=directory,capture_output=True,text=True,timeout=30,
                env={**os.environ,'PI_CODING_AGENT_DIR':directory,'PI_AGENT_DATA':str(Path(directory)/'workspace'),'PI_HARNESS_SHARED_PORT':'9','PI_HARNESS_TOKEN':'unused'})
            states=[json.loads(line) for line in completed.stdout.splitlines() if line.startswith('{') and '"state"' in line]
            self.assertTrue(states and states[0]['success'],completed.stdout[-2000:]+completed.stderr[-2000:])
            self.assertNotIn('Unknown option',completed.stderr)
