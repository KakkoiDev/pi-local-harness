"""Task 147: the person chooses the model and thinking level; one model stays in Ollama's memory."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:  # run as tests.<module> from the repository root
    from tests import isolation  # noqa: F401
import json
import os
import tempfile
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from unittest.mock import patch

from harness import model as models
from harness.web_chat import WebChat, pi_command, readable_error

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

    def test_no_job_starts_while_a_model_loads(self):
        started = threading.Event(); release = threading.Event(); original = models.switch
        def slow(previous, model, url=None): started.set(); release.wait(5); original(previous, model, url)
        with patch.object(models, 'switch', slow):
            worker = threading.Thread(target=self.chat.choose_model, args=('qwen3:8b',)); worker.start()
            started.wait(5); self.assertTrue(self.chat.busy(), 'the queue waits while the new model loads')
            with self.assertRaisesRegex(ValueError, 'Already switching'): self.chat.choose_model('gemma4:26b-mlx')
            release.set(); worker.join(5)
        self.assertFalse(self.chat.busy())

    def test_an_unreachable_ollama_is_asked_at_most_once_a_minute(self):
        with patch.dict(os.environ, {'PI_OLLAMA_URL': 'http://127.0.0.1:9'}), patch.object(models, 'local_models', side_effect=OSError('down')) as listing:
            self.chat._capabilities = {}; self.chat._capabilities_at = -1e9
            for _ in range(5): self.chat.choice()
            self.assertEqual(listing.call_count, 1)

    def test_a_chosen_model_that_was_removed_falls_back_to_the_default(self):
        models.save(Path(self.temp.name) / 'data', model='qwen3.8:27b-mlx')  # chosen, then removed from Ollama
        choice = self.chat.choice()
        self.assertEqual((choice['model'], choice['missing']), (models.MODEL, 'qwen3.8:27b-mlx'))
        self.assertIn(models.MODEL, pi_command(None, choice), 'Pi runs the default, not a model Ollama cannot find')

    def test_with_ollama_unreachable_the_choice_is_kept(self):
        models.save(Path(self.temp.name) / 'data', model='qwen3:8b')
        with patch.object(models, 'local_models', side_effect=OSError('down')):
            self.chat._capabilities = {}; self.chat._capabilities_at = -1e9
            self.assertEqual((self.chat.choice()['model'], self.chat.choice()['missing']), ('qwen3:8b', None))

    def test_ollamas_missing_model_error_reads_as_a_sentence(self):
        raw = '404: {"message":"model \'qwen3.8:27b-mlx\' not found","type":"not_found_error"}'
        self.assertEqual(readable_error(raw), 'The model “qwen3.8:27b-mlx” is not installed in Ollama. Choose another model in the menu bar, or pull it with `ollama pull qwen3.8:27b-mlx`.')
        self.assertEqual(readable_error('Something else'), 'Something else')

    def test_thinking_level_is_kept_and_used(self):
        self.assertEqual(self.chat.choose_effort('low')['effort'], 'low')
        command = pi_command(None, self.chat.choice()); self.assertEqual(command[command.index('--thinking') + 1], 'low')
        with self.assertRaises(ValueError): self.chat.choose_effort('extreme')




class FourLevelsTest(unittest.TestCase):
    """Task 177 (round 7, item 12): Ollama knows Off, Low, Medium and High. A saved Minimal reads as Low and Extra High or
    Max as High, which is how they already ran (task 175); the menu and the completion offer the four."""
    def test_saved_levels_read_as_the_four(self):
        with tempfile.TemporaryDirectory() as data:
            for saved, shown in [('minimal', 'low'), ('xhigh', 'high'), ('max', 'high'), ('medium', 'medium'), ('off', 'off')]:
                Path(data, 'model.json').write_text(json.dumps({'model': 'gemma4:26b-mlx', 'effort': saved}))
                self.assertEqual(models.current(data)['effort'], shown, saved)
        self.assertEqual(models.LEVELS, ('off', 'low', 'medium', 'high'))


if __name__ == '__main__':
    unittest.main()
