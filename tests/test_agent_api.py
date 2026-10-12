"""Legacy demo endpoint regression, isolated from the user's running harness."""
import http.server
import json
import tempfile
import threading
import unittest
import urllib.request
from pathlib import Path
from unittest.mock import patch
from agent_api import AgentHandler

class TestAgentAPI(unittest.TestCase):
    def test_chat_endpoint_returns_success(self):
        with tempfile.TemporaryDirectory() as directory, patch('agent_api.LOG_FILE',str(Path(directory)/'session.log')):
            server=http.server.ThreadingHTTPServer(('127.0.0.1',0),AgentHandler)
            worker=threading.Thread(target=server.serve_forever,daemon=True);worker.start()
            try:
                request=urllib.request.Request(f'http://127.0.0.1:{server.server_port}/chat',data=json.dumps({'message':'Hello, Agent!'}).encode(),headers={'Content-Type':'application/json'})
                with urllib.request.urlopen(request,timeout=3) as response:
                    self.assertEqual(response.status,200)
                    self.assertIn('Hello, Agent!',json.load(response)['reply'])
            finally:
                server.shutdown();server.server_close();worker.join(timeout=3)
