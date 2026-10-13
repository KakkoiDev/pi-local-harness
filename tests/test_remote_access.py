"""Phone access through `tailscale serve` and voice input transcribed into the prompt box.

Remote requests arrive from tailscale serve on loopback with the tailnet Host and the
Tailscale-User-Login header; only configured hosts and logins are trusted."""
import base64
import http.client
import http.server
import json
import tempfile
import threading
import unittest
from pathlib import Path
from harness.web_chat import WebChat, WebHandler

HOST = 'mini.example.ts.net'
USER = 'me@example.com'

class RemoteAccessTest(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory(); self.addCleanup(directory.cleanup)
        root = Path(directory.name)
        self.chat = WebChat(root / 'chats', 9, 0, data_root=root / 'data'); self.addCleanup(self.chat.close)
        self.heard = []
        def speech(path):
            self.heard.append(Path(path).read_bytes()); return 'hello from the phone'
        class Handler(WebHandler): pass
        Handler.chat = self.chat
        Handler.speech = staticmethod(speech)
        Handler.log_message = lambda *args: None
        self.handler = Handler
        self.server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        threading.Thread(target=self.server.serve_forever, daemon=True).start()
        self.addCleanup(self.server.server_close); self.addCleanup(self.server.shutdown)

    def call(self, path, headers, body=None):
        connection = http.client.HTTPConnection('127.0.0.1', self.server.server_port, timeout=5)
        self.addCleanup(connection.close)
        data = None if body is None else json.dumps(body)
        connection.request('GET' if body is None else 'POST', path, body=data, headers={'Content-Type': 'application/json', **headers})
        response = connection.getresponse()
        return response.status, json.loads(response.read() or b'{}')

    def remote(self, **extra):
        return {'Host': HOST, 'Tailscale-User-Login': USER, **extra}

    def test_remote_host_is_rejected_until_configured(self):
        status, value = self.call('/api/config', self.remote())
        self.assertEqual(status, 403)
        self.assertIn(f'Host {HOST}', value['error']); self.assertIn(f'login {USER}', value['error'])

    def test_configured_host_and_login_are_trusted(self):
        self.handler.remote_hosts = frozenset({HOST}); self.handler.remote_users = frozenset({USER})
        self.assertEqual(self.call('/api/config', self.remote())[0], 200)
        self.assertEqual(self.call('/api/config', {**self.remote(), 'Host': HOST + ':443'})[0], 200)
        self.assertEqual(self.call('/api/config', self.remote(**{'Tailscale-User-Login': 'other@example.com'}))[0], 403)
        self.assertEqual(self.call('/api/config', {'Host': HOST})[0], 403)
        self.assertEqual(self.call('/api/config', {**self.remote(), 'Host': 'other.example.ts.net'})[0], 403)

    def test_remote_posts_need_the_https_tailnet_origin(self):
        self.handler.remote_hosts = frozenset({HOST}); self.handler.remote_users = frozenset({USER})
        audio = {'mime': 'audio/webm', 'data': base64.b64encode(b'voice').decode()}
        self.assertEqual(self.call('/api/transcribe', self.remote(Origin=f'https://{HOST}'), audio)[0], 200)
        self.assertEqual(self.call('/api/transcribe', self.remote(Origin='https://evil.example'), audio)[0], 403)
        self.assertEqual(self.call('/api/transcribe', self.remote(Origin=f'http://{HOST}'), audio)[0], 403)

    def test_transcribe_returns_text_for_the_prompt_box(self):
        local = {'Host': f'127.0.0.1:{self.server.server_port}'}
        status, value = self.call('/api/transcribe', local, {'mime': 'audio/mp4', 'data': base64.b64encode(b'voice').decode()})
        self.assertEqual((status, value), (200, {'text': 'hello from the phone'}))
        self.assertEqual(self.heard, [b'voice'])
        self.assertEqual(self.call('/api/transcribe', local, {'mime': 'text/plain', 'data': 'eA=='})[0], 400)
        self.assertEqual(self.call('/api/transcribe', local, {'mime': 'audio/webm', 'data': ''})[0], 400)

    def test_no_speech_is_a_clear_error(self):
        def silent(path): raise RuntimeError('No speech was recognized in this audio file')
        self.handler.speech = staticmethod(silent)
        status, value = self.call('/api/transcribe', {'Host': f'127.0.0.1:{self.server.server_port}'},
                                  {'mime': 'audio/webm', 'data': base64.b64encode(b'x').decode()})
        self.assertEqual(status, 400); self.assertIn('No speech', value['error'])

class RemoteConfigTest(unittest.TestCase):
    def test_plh_validates_and_exports_remote_settings(self):
        from plh import configuration, environment
        with tempfile.TemporaryDirectory() as directory:
            Path(directory, 'config.json').write_text(json.dumps({'remote_hosts': [HOST], 'remote_users': [USER]}))
            env = environment(configuration(directory))
            self.assertEqual((env['PI_WEB_REMOTE_HOSTS'], env['PI_WEB_REMOTE_USERS']), (HOST, USER))
            for bad in [{'remote_hosts': HOST}, {'remote_hosts': ['https://' + HOST]}, {'remote_hosts': [HOST]}]:
                Path(directory, 'config.json').write_text(json.dumps(bad))
                with self.assertRaisesRegex(ValueError, 'remote_'): configuration(directory)

if __name__ == '__main__':
    unittest.main()
