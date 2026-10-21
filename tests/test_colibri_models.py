"""Task 294: models served by Colibri (`coli serve`, OpenAI-compatible) beside Ollama's. plh connects to a server the
person starts on its own port (setting colibri_url); it never starts or stops Colibri. A stub Colibri and a stub
Ollama answer on random ports: no test reaches a real one."""
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

from harness import admin, model as models
from harness import settings
from harness.web_chat import WebChat, pi_command, readable_error

OLLAMA = {'gemma4:26b-mlx': ['completion', 'tools', 'thinking', 'vision'], 'qwen3:8b': ['completion', 'tools']}
# What `coli serve` lists: one served model per server; the id is its --model-id.
COLIBRI = [{'id': 'glm-5.3-colibri', 'object': 'model', 'input_modalities': ['text'], 'capabilities': ['chat', 'systemone']}]


class FakeOllama(BaseHTTPRequestHandler):
    calls = []
    def log_message(self, *args): pass
    def send(self, value):
        body = json.dumps(value).encode(); self.send_response(200); self.send_header('Content-Type', 'application/json'); self.end_headers(); self.wfile.write(body)
    def do_GET(self): self.send({'models': [{'name': name, 'size': 1} for name in OLLAMA]})
    def do_POST(self):
        data = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
        if self.path == '/api/show': self.send({'capabilities': OLLAMA[data['model']]}); return
        FakeOllama.calls.append((self.path, data)); self.send({'done': True})


class FakeColibri(BaseHTTPRequestHandler):
    served = COLIBRI
    calls = []
    def log_message(self, *args): pass
    def do_GET(self):
        FakeColibri.calls.append(self.path)
        if self.path != '/v1/models': self.send_response(404); self.end_headers(); return
        body = json.dumps({'object': 'list', 'data': FakeColibri.served}).encode()
        self.send_response(200); self.send_header('Content-Type', 'application/json'); self.end_headers(); self.wfile.write(body)
    def do_POST(self):
        FakeColibri.calls.append(self.path); self.send_response(404); self.end_headers()


def serve(handler):
    server = ThreadingHTTPServer(('127.0.0.1', 0), handler); threading.Thread(target=server.serve_forever, daemon=True).start()
    return server


CLOSED = 'http://127.0.0.1:9'  # nothing answers on the discard port


class Base(unittest.TestCase):
    def setUp(self):
        FakeOllama.calls = []; FakeColibri.calls = []; FakeColibri.served = COLIBRI
        self.ollama = serve(FakeOllama); self.addCleanup(self.ollama.shutdown)
        self.colibri = serve(FakeColibri); self.addCleanup(self.colibri.shutdown)
        self.urls(f'http://127.0.0.1:{self.ollama.server_port}', f'http://127.0.0.1:{self.colibri.server_port}')
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.data = Path(self.temp.name) / 'data'
        self.chat = WebChat(Path(self.temp.name) / 'chats', 1, 2, data_root=self.data); self.addCleanup(self.chat.close)

    def urls(self, ollama, colibri):
        patcher = patch.dict(os.environ, {'PI_OLLAMA_URL': ollama, 'PI_COLIBRI_URL': colibri}); patcher.start(); self.addCleanup(patcher.stop)


class Discovery(Base):
    def test_colibri_models_are_listed_beside_ollamas_with_their_provider(self):
        listed = self.chat.model_list()
        by = {(item['provider'], item['id']): item for item in listed['models']}
        self.assertIn(('ollama', 'gemma4:26b-mlx'), by)
        self.assertIn(('colibri', 'glm-5.3-colibri'), by)
        glm = by[('colibri', 'glm-5.3-colibri')]
        self.assertEqual((glm['tools'], glm['vision'], glm['family']), (True, False, 'known'))
        self.assertEqual(listed['unavailable'], {})
        self.assertIn('/v1/models', FakeColibri.calls)

    def test_tool_support_comes_from_the_family_as_colibri_documents_it(self):
        for name, tools, family in [('glm-5.2-colibri', True, 'known'), ('deepseek-v4-flash', True, 'known'), ('kimi-k3', True, 'known'),
                                    ('qwen3.6-35b-a3b', True, 'known'), ('qwen36', True, 'known'), ('qwen3.8-27b', True, 'known'),
                                    ('olmoe-1b-7b', False, 'known'), ('inkling', False, 'known'), ('mystery-model', False, 'unknown')]:
            FakeColibri.served = [{'id': name, 'input_modalities': ['text', 'image'], 'capabilities': ['chat']}]
            item = models.colibri_models()[0]
            self.assertEqual((item['id'], item['tools'], item['family'], item['vision']), (name, tools, family, True), name)

    def test_colibri_not_running_leaves_ollamas_list_and_says_why(self):
        self.urls(f'http://127.0.0.1:{self.ollama.server_port}', CLOSED)
        listed = self.chat.model_list()
        self.assertEqual({item['provider'] for item in listed['models']}, {'ollama'})
        self.assertIn('colibri', listed['unavailable'])
        self.assertIn('127.0.0.1:9', listed['unavailable']['colibri'])

    def test_ollama_not_running_still_lists_colibri(self):
        self.urls(CLOSED, f'http://127.0.0.1:{self.colibri.server_port}')
        listed = self.chat.model_list()
        self.assertEqual([(item['provider'], item['id']) for item in listed['models']], [('colibri', 'glm-5.3-colibri')])
        self.assertIn('ollama', listed['unavailable'])

    def test_neither_running_is_still_the_503_for_ollama(self):
        self.urls(CLOSED, CLOSED)
        with self.assertRaises(OSError):
            self.chat.model_list()


class Choice(Base):
    def test_choosing_a_colibri_model_saves_the_provider_and_never_touches_ollama(self):
        choice = self.chat.choose_model('glm-5.3-colibri', 'colibri')
        self.assertEqual((choice['provider'], choice['model']), ('colibri', 'glm-5.3-colibri'))
        saved = json.loads(models.choice_path(self.data).read_text())
        self.assertEqual((saved['provider'], saved['model']), ('colibri', 'glm-5.3-colibri'))
        self.assertEqual(FakeOllama.calls, [], 'no keep_alive unload or load in Ollama')
        self.assertEqual(self.chat.choice()['provider'], 'colibri')

    def test_the_provider_is_found_when_the_request_names_only_the_model(self):
        self.assertEqual(self.chat.choose_model('glm-5.3-colibri')['provider'], 'colibri')
        self.assertEqual(self.chat.choose_model('qwen3:8b')['provider'], 'ollama')

    def test_going_back_to_an_ollama_model_saves_ollama(self):
        self.chat.choose_model('glm-5.3-colibri', 'colibri')
        choice = self.chat.choose_model('qwen3:8b')
        self.assertEqual((choice['provider'], choice['model']), ('ollama', 'qwen3:8b'))

    def test_an_old_choice_file_without_a_provider_means_ollama(self):
        models.choice_path(self.data).parent.mkdir(parents=True, exist_ok=True)
        models.choice_path(self.data).write_text(json.dumps({'model': 'qwen3:8b', 'effort': 'high'}))
        self.assertEqual(models.current(self.data)['provider'], 'ollama')
        models.save(self.data, model='gemma4:26b-mlx')
        self.assertEqual(json.loads(models.choice_path(self.data).read_text())['provider'], 'ollama')

    def test_a_colibri_model_without_tools_is_refused_and_says_why(self):
        FakeColibri.served = [{'id': 'olmoe-1b-7b', 'input_modalities': ['text'], 'capabilities': ['chat']}]
        with self.assertRaises(ValueError) as refused:
            self.chat.choose_model('olmoe-1b-7b', 'colibri')
        self.assertIn('cannot use tools', str(refused.exception))
        self.assertFalse(models.choice_path(self.data).exists())

    def test_a_model_colibri_does_not_serve_is_refused(self):
        with self.assertRaises(ValueError) as refused:
            self.chat.choose_model('kimi-k3', 'colibri')
        self.assertIn('Colibri', str(refused.exception))

    def test_an_unknown_provider_is_refused(self):
        with self.assertRaises(ValueError):
            self.chat.choose_model('glm-5.3-colibri', 'cloud')

    def test_colibri_stopped_since_it_was_chosen_falls_back_to_the_default_on_ollama(self):
        self.chat.choose_model('glm-5.3-colibri', 'colibri')
        FakeColibri.served = []
        self.chat._colibri, self.chat._colibri_at = {}, -1e9  # a fresh workbench: nothing cached
        choice = self.chat.choice()
        self.assertEqual((choice['provider'], choice['model'], choice['missing']), ('ollama', models.MODEL, 'glm-5.3-colibri'))


class Launch(Base):
    def test_pi_runs_with_the_chosen_provider(self):
        command = pi_command(None, {'provider': 'colibri', 'model': 'glm-5.3-colibri', 'effort': 'off'})
        at = command.index('--provider')
        self.assertEqual(command[at:at + 4], ['--provider', 'colibri', '--model', 'glm-5.3-colibri'])
        self.assertEqual(pi_command(None, {'model': 'qwen3:8b', 'effort': 'high'})[at + 1], 'ollama', 'old choices still mean Ollama')

    def test_a_connection_error_to_colibri_names_colibri(self):
        url = models.colibri_url()
        text = readable_error(f'Connection error: connect ECONNREFUSED {url.split("://")[1]}')
        self.assertIn('Colibri', text)
        self.assertIn('coli serve', text)
        self.assertIn('Ollama', readable_error('Connection error: connect ECONNREFUSED 127.0.0.1:11434'))

    def test_the_colibri_address_is_a_setting_never_gates_port(self):
        self.assertEqual(settings.SETTINGS['colibri_url'][0], 'PI_COLIBRI_URL')
        self.assertEqual(settings.SETTINGS['colibri_url'][1], 'http://127.0.0.1:8100')
        self.assertNotEqual(settings.SETTINGS['colibri_url'][1].rsplit(':', 1)[1], str(settings.SETTINGS['gate_port'][1]))
        with patch.dict(os.environ, {}, clear=False):
            os.environ.pop('PI_COLIBRI_URL', None)
            self.assertEqual(models.colibri_url(), 'http://127.0.0.1:8100')


class Terminal(Base):
    def test_models_lists_colibris_models_and_which_is_chosen(self):
        self.chat.choose_model('glm-5.3-colibri', 'colibri')
        value, text = admin.run(admin.Console(self.data), 'models', [])
        self.assertEqual([item['id'] for item in value['colibri']['models']], ['glm-5.3-colibri'])
        self.assertTrue(value['colibri']['models'][0]['chosen'])
        self.assertFalse(any(item['chosen'] for item in value['models']), 'the Ollama model is not marked chosen')
        self.assertIn('Colibri at', str(text)); self.assertIn('● glm-5.3-colibri', str(text))

    def test_models_says_colibri_is_not_running_and_how_to_start_it(self):
        self.urls(f'http://127.0.0.1:{self.ollama.server_port}', CLOSED)
        value, text = admin.run(admin.Console(self.data), 'models', [])
        self.assertFalse(value['colibri']['running'])
        self.assertIn('Colibri: not running at http://127.0.0.1:9', str(text))
        self.assertIn('gemma4:26b-mlx', str(text), 'Ollama models are still listed')


if __name__ == '__main__':
    unittest.main()
