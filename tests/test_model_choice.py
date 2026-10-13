"""Task 147: the person chooses the model and thinking level; one model stays in Ollama's memory."""
import json
import os
import tempfile
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from unittest.mock import patch

from harness import model as models
from harness.web_chat import WebChat, pi_command

CAPABILITIES = {'gemma4:26b-mlx': ['completion', 'tools', 'thinking', 'vision'], 'qwen3:8b': ['completion', 'tools'], 'tiny:1b': ['completion']}


class FakeOllama(BaseHTTPRequestHandler):
    calls = []
    def log_message(self, *args): pass
    def send(self, value):
        body = json.dumps(value).encode(); self.send_response(200); self.send_header('Content-Type', 'application/json'); self.end_headers(); self.wfile.write(body)
    def do_GET(self):
        self.send({'models': [{'name': name, 'size': 1} for name in CAPABILITIES]})
    def do_POST(self):
        data = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
        if self.path == '/api/show': self.send({'capabilities': CAPABILITIES[data['model']]}); return
        FakeOllama.calls.append((self.path, data)); self.send({'done': True})


class ModelChoiceTest(unittest.TestCase):
    def setUp(self):
        FakeOllama.calls = []
        self.server = ThreadingHTTPServer(('127.0.0.1', 0), FakeOllama); threading.Thread(target=self.server.serve_forever, daemon=True).start()
        self.addCleanup(self.server.shutdown)
        patcher = patch.dict(os.environ, {'PI_OLLAMA_URL': f'http://127.0.0.1:{self.server.server_port}'}); patcher.start(); self.addCleanup(patcher.stop)
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.chat = WebChat(Path(self.temp.name) / 'chats', 1, 2, data_root=Path(self.temp.name) / 'data'); self.addCleanup(self.chat.close)

    def test_local_models_list_what_pi_needs(self):
        listed = {item['id']: item for item in self.chat.model_list()['models']}
        self.assertEqual((listed['qwen3:8b']['tools'], listed['qwen3:8b']['thinking']), (True, False))
        self.assertFalse(listed['tiny:1b']['tools'])

    def test_switching_unloads_the_old_model_then_loads_the_new_one(self):
        choice = self.chat.choose_model('qwen3:8b')
        self.assertEqual(FakeOllama.calls, [('/api/generate', {'model': 'gemma4:26b-mlx', 'keep_alive': 0}), ('/api/generate', {'model': 'qwen3:8b', 'keep_alive': '30m'})])
        self.assertEqual((choice['model'], choice['thinking'], choice['effort']), ('qwen3:8b', False, 'off'), 'a model without thinking runs with thinking off')
        self.assertEqual(json.loads((Path(self.temp.name) / 'data/model.json').read_text())['model'], 'qwen3:8b')
        self.assertIn('qwen3:8b', pi_command(None, self.chat.choice()))

    def test_models_without_tools_or_unknown_are_refused(self):
        for name in ['tiny:1b', 'missing:1b']:
            with self.assertRaises(ValueError): self.chat.choose_model(name)
        self.assertEqual(FakeOllama.calls, [])

    def test_thinking_level_is_kept_and_used(self):
        self.assertEqual(self.chat.choose_effort('low')['effort'], 'low')
        command = pi_command(None, self.chat.choice()); self.assertEqual(command[command.index('--thinking') + 1], 'low')
        with self.assertRaises(ValueError): self.chat.choose_effort('extreme')


if __name__ == '__main__':
    unittest.main()
