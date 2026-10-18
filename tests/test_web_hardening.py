"""Task 305: the workbench cannot be framed or sniffed, and a 500 never echoes the exception's text."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:  # run as tests.<module> from the repository root
    from tests import isolation  # noqa: F401
import contextlib
import http.server
import io
import json
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from pathlib import Path

from harness.web_chat import WebChat, WebHandler


class WebHardeningTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory(); self.addCleanup(self.directory.cleanup)
        root = Path(self.directory.name)
        self.chat = WebChat(root / 'chats', 9, 0, data_root=root / 'data'); self.addCleanup(self.chat.close)
        class Handler(WebHandler): pass
        Handler.chat = self.chat
        Handler.log_message = lambda *args: None
        self.server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        threading.Thread(target=self.server.serve_forever, daemon=True).start()
        self.addCleanup(self.server.server_close); self.addCleanup(self.server.shutdown)
        self.base = f'http://127.0.0.1:{self.server.server_port}'

    def get(self, path, body=None):
        request = urllib.request.Request(self.base + path, data=None if body is None else json.dumps(body).encode(), headers={'Content-Type': 'application/json'})
        try:
            with urllib.request.urlopen(request, timeout=5) as response: return response.status, response.headers, response.read()
        except urllib.error.HTTPError as error:
            with error: return error.code, error.headers, error.read()

    def test_pages_and_replies_cannot_be_framed_or_sniffed(self):
        for path in ('/', '/p/x/chat', '/api/config', '/js/chat.mjs', '/no-such-page'):
            status, headers, _ = self.get(path)
            self.assertIn(status, (200, 404), path)
            self.assertEqual(headers['X-Frame-Options'], 'DENY', path)
            self.assertIn("frame-ancestors 'none'", headers['Content-Security-Policy'], path)
            self.assertEqual(headers.get_all('X-Content-Type-Options'), ['nosniff'], f'{path}: once, on every reply')

    def test_an_internal_error_does_not_echo_the_exception_text(self):
        secret = '/Users/someone/secret-path token=abc123'
        def broken(): raise RuntimeError(secret)
        self.chat.workspace = broken
        self.chat.undo = lambda *args: broken()
        log = io.StringIO()
        with contextlib.redirect_stderr(log):
            status, headers, body = self.get('/api/workspace')
            post_status, _, post_body = self.get('/api/undo', {'project': 'x', 'commit': 'y'})
        self.assertEqual(status, 500)
        self.assertNotIn(b'secret-path', body); self.assertNotIn(b'RuntimeError', body)
        self.assertIn('Internal error', json.loads(body)['error'])
        self.assertIn(secret, log.getvalue(), 'the details go to the log')
        self.assertEqual(post_status, 500); self.assertNotIn(b'secret-path', post_body, 'POST too')


if __name__ == '__main__':
    unittest.main()
