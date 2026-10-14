"""Task 161: can the model answer two requests at once? Measured once per model, Ollama version and parallel setting
(plan 156 § 7), stored in <data>/model-capabilities.json, shown by /models and re-checked by /models check."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:  # run as tests.<module> from the repository root
    from tests import isolation  # noqa: F401
import http.server
import json
import os
import tempfile
import threading
import time
import unittest
from pathlib import Path
from unittest.mock import patch

from harness import admin, capability, model as models


class FakeOllama(http.server.ThreadingHTTPServer):
    """/api/tags, /api/version, /api/ps, /api/show and a streaming /api/generate, one request at a time or several."""
    daemon_threads = True

    def __init__(self, parallel, version='0.40.3'):
        self.parallel, self.version, self.serial = parallel, version, threading.Lock()
        super().__init__(('127.0.0.1', 0), Handler)


class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, *args): pass

    def reply(self, value):
        body = json.dumps(value).encode(); self.send_response(200); self.send_header('Content-Length', str(len(body))); self.end_headers(); self.wfile.write(body)

    def do_GET(self):
        if self.path == '/api/tags': self.reply({'models': [{'name': 'fast:1b', 'size': 1, 'digest': 'abc123'}]})
        elif self.path == '/api/version': self.reply({'version': self.server.version})
        elif self.path == '/api/ps': self.reply({'models': []})

    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
        if self.path == '/api/show': self.reply({'capabilities': ['completion', 'tools']}); return
        if self.path == '/api/pull':
            self.send_response(200); self.end_headers()
            for status in ['pulling manifest', 'verifying sha256 digest', 'success']: self.wfile.write(json.dumps({'status': status}).encode() + b'\n')
            return
        tokens = body.get('options', {}).get('num_predict', 8)
        lock = threading.Lock() if self.server.parallel else self.server.serial  # serialized: one generation at a time
        with lock:
            self.send_response(200); self.end_headers()
            for _ in range(tokens):
                self.wfile.write(b'{"response":"x"}\n'); self.wfile.flush(); time.sleep(0.01)
            self.wfile.write(json.dumps({'done': True, 'eval_count': tokens}).encode() + b'\n')


class CapabilityTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.data = (Path(self.temp.name) / 'data').resolve(); self.data.mkdir()

    def serve(self, parallel, version='0.40.3'):
        server = FakeOllama(parallel, version); threading.Thread(target=server.serve_forever, daemon=True).start()
        self.addCleanup(server.shutdown)
        environment = patch.dict(os.environ, {'PI_OLLAMA_URL': f'http://127.0.0.1:{server.server_port}', 'OLLAMA_NUM_PARALLEL': '2'}); environment.start(); self.addCleanup(environment.stop)
        return server

    def test_a_serial_model_measures_one_at_a_time_and_is_stored_with_its_key(self):
        self.serve(parallel=False)
        result = capability.check(self.data, 'fast:1b', tokens=20)
        self.assertEqual(result['verdict'], 'one at a time'); self.assertLess(result['overlap'], 0.05)
        stored = json.loads((self.data / 'model-capabilities.json').read_text())['fast:1b']
        self.assertEqual((stored['digest'], stored['ollama'], stored['num_parallel']), ('abc123', '0.40.3', '2'))
        self.assertEqual(capability.known(self.data, 'fast:1b'), 'one at a time')

    def test_a_parallel_model_measures_parallel(self):
        self.serve(parallel=True)
        self.assertEqual(capability.check(self.data, 'fast:1b', tokens=20)['verdict'], 'parallel')

    def test_a_new_ollama_version_makes_the_result_unknown_until_checked_again(self):
        server = self.serve(parallel=False)
        capability.check(self.data, 'fast:1b', tokens=10)
        self.assertEqual(capability.known(self.data, 'fast:1b'), 'one at a time')
        server.version = '0.41.0'  # a release that may fix the MLX runner
        self.assertEqual(capability.known(self.data, 'fast:1b'), 'unknown')
        self.assertEqual(capability.missing(self.data), ['fast:1b'], 'what a check would measure')
        with patch.dict(os.environ, {'OLLAMA_NUM_PARALLEL': '4'}): self.assertEqual(capability.known(self.data, 'fast:1b'), 'unknown', 'a new parallel setting too')

    def test_the_console_shows_and_checks_it(self):
        self.serve(parallel=False)
        console = admin.Console(self.data); models.save(self.data, model='fast:1b')  # /models check with no name checks the chosen model
        value, text = admin.run(console, 'models', [])
        self.assertNotIn('one at a time', text, 'unknown says nothing'); self.assertEqual(value['models'][0]['at_once'], 'unknown')
        value, text = admin.run(console, 'models', ['check', 'fast:1b'])
        self.assertIn('one at a time', text); self.assertIn('overlap', text)
        self.assertEqual(admin.run(console, 'models', [])[0]['models'][0]['at_once'], 'one at a time')
        value, text = admin.run(console, 'models', ['check'])
        self.assertIn('already measured', text, 'a stored result is kept; --force measures again')
        self.assertIn('one at a time', admin.run(console, 'models', ['check', '--force'])[1])


    def test_the_workbench_measures_an_unknown_model_once_while_idle_and_holds_the_queue(self):
        """The person: "do it the first time ever the model is loaded (missing data)"."""
        from harness.web_chat import WebChat
        self.serve(parallel=False); models.save(self.data, model='fast:1b')
        chat = WebChat(self.data / 'chats', 1, 2, data_root=self.data); self.addCleanup(chat.close)
        held = []
        original = capability.check
        def watched(*args, **options):
            held.append(chat.busy()); return original(*args, tokens=8)
        with patch.object(capability, 'check', watched):
            self.assertTrue(chat.measure_if_unknown('fast:1b'))
            self.assertEqual(held, [True], 'the queue waits while it measures')
            self.assertFalse(chat.busy())
            self.assertFalse(chat.measure_if_unknown('fast:1b'), 'measured once: the stored result matches')
        self.assertEqual(chat.model_list()['models'][0]['at_once'], 'one at a time', 'the model menu can show it')
        chat.active['x'] = {'process': None, 'cancel': threading.Event()}
        (self.data / 'model-capabilities.json').unlink()
        self.assertFalse(chat.measure_if_unknown('fast:1b'), 'never while Pi works')


if __name__ == '__main__':
    unittest.main()
