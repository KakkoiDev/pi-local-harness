try:
 import isolation
except ModuleNotFoundError:
 from tests import isolation
import os
from pathlib import Path
import socket
import subprocess
import sys
import tempfile
import unittest

class StartupCollision(unittest.TestCase):
 def test_an_occupied_gate_port_has_a_plain_error_without_a_traceback(self):
  with tempfile.TemporaryDirectory() as directory, socket.socket() as occupied, socket.socket() as web:
   occupied.bind(('127.0.0.1',0));occupied.listen()
   web.bind(('127.0.0.1',0));web_port=web.getsockname()[1];web.close()
   env={**os.environ,'PI_AGENT_DATA':directory,'PI_GATE_PORT':str(occupied.getsockname()[1]),'PI_WEB_PORT':str(web_port),'PI_TAILSCALE':'false'}
   result=subprocess.run([sys.executable,str(Path(__file__).resolve().parents[1]/'harness/services.py')],env=env,capture_output=True,text=True,timeout=15)
   self.assertNotEqual(result.returncode,0)
   self.assertNotIn('Traceback',result.stderr)
   self.assertIn('already in use',result.stderr)
   self.assertIn('another',result.stderr.lower())
   self.assertIn(str(occupied.getsockname()[1]),result.stderr)
