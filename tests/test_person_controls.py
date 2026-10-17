"""Task 261: only the person's controls approve, accept, change the phase or turn on Run on its own.

The page carries a per-run secret (a meta tag in the served index.html); the person-only routes refuse a request
without it, so a local process (a test the model wrote) cannot act as the person by posting to the workbench."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:
    from tests import isolation  # noqa: F401
import http.client
import http.server
import json
import re
import tempfile
import threading
import unittest
from pathlib import Path
from harness.web_chat import WebChat, WebHandler

HOST = 'mini.example.ts.net'
USER = 'me@example.com'


class PersonRoutesTest(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory(); self.addCleanup(directory.cleanup)
        root = Path(directory.name)
        self.chat = WebChat(root / 'chats', 9, 0, data_root=root / 'data'); self.addCleanup(self.chat.close)
        class Handler(WebHandler): pass
        Handler.chat = self.chat
        Handler.log_message = lambda *args: None
        self.handler = Handler
        self.server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        threading.Thread(target=self.server.serve_forever, daemon=True).start()
        self.addCleanup(self.server.server_close); self.addCleanup(self.server.shutdown)
        self.local = {'Host': f'127.0.0.1:{self.server.server_port}'}
        self.project = self.chat.documents.create_project('Counter', None, 'empty')

    def call(self, path, body=None, headers=None):
        connection = http.client.HTTPConnection('127.0.0.1', self.server.server_port, timeout=5)
        self.addCleanup(connection.close)
        connection.request('GET' if body is None else 'POST', path, body=None if body is None else json.dumps(body),
                           headers={'Content-Type': 'application/json', **self.local, **(headers or {})})
        response = connection.getresponse(); raw = response.read()
        return response.status, raw

    def secret(self, headers=None):
        status, page = self.call('/', headers=headers)
        self.assertEqual(status, 200)
        match = re.search(rb'<meta name="pi-person" content="([^"]+)">', page)
        self.assertIsNotNone(match, 'the served page carries the secret')
        return match[1].decode()

    def test_the_served_page_carries_one_secret_for_this_run_also_on_the_phone(self):
        secret = self.secret()
        self.assertGreaterEqual(len(secret), 32)
        self.assertEqual(self.secret(), secret, 'one secret per run')
        self.handler.remote_hosts = frozenset({HOST}); self.handler.remote_users = frozenset({USER})
        self.assertEqual(self.secret({'Host': HOST, 'Tailscale-User-Login': USER}), secret, 'the phone gets it with the page')
        self.assertNotIn(secret.encode(), self.call('/api/config')[1], 'no API answer repeats it')
        self.assertNotIn(secret.encode(), Path('index.html').read_bytes(), 'it is never written into the repository')

    def test_person_routes_refuse_a_request_without_the_page_secret(self):
        conversation = self.chat.project_chat(self.project)
        routes = [('/api/phase', {'project': self.project, 'phase': 'planning'}),
                  ('/api/phase/build', {'project': self.project}),
                  ('/api/plan/wait', {'project': self.project}),
                  ('/api/auto', {'enabled': True, 'confirmed': True}),
                  (f"/api/conversations/{conversation['id']}/check-in/accept", {'index': 0}),
                  (f"/api/conversations/{conversation['id']}/check-in/stop", {'index': 0}),
                  ('/api/jobs/create', {'project': self.project, 'message': 'Choice: Who uses it? → Only me'})]
        for path, body in routes:
            for headers in ({}, {'X-Pi-Person': 'guessed'}):
                with self.subTest(path=path, headers=headers):
                    status, raw = self.call(path, body, headers)
                    self.assertEqual(status, 403, raw)
                    self.assertIn(b'Reload the page', raw)
        status, raw = self.call('/api/auto')
        self.assertFalse(json.loads(raw)['enabled'], 'Run on its own stayed off')

    def test_the_page_secret_opens_the_person_routes(self):
        secret = self.secret()
        status, raw = self.call('/api/auto', {'enabled': True, 'confirmed': True}, {'X-Pi-Person': secret})
        self.assertEqual(status, 200, raw); self.assertTrue(json.loads(raw)['enabled'])
        status, raw = self.call('/api/auto', {'enabled': False}, {'X-Pi-Person': secret})
        self.assertEqual(status, 200, raw)

    def test_reads_and_plain_messages_need_no_secret(self):
        self.assertEqual(self.call('/api/auto')[0], 200)
        self.assertEqual(self.call('/api/jobs/create', {'message': 'Hello'})[0], 400, 'checked further, not refused (no project: no Pi starts)')



if __name__ == '__main__':
    unittest.main()
