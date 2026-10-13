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

class TailscaleServeTest(unittest.TestCase):
    """plh's services start `tailscale serve <web port>` in the foreground and stop it on exit."""
    def start(self, tailscale):
        import os, subprocess, sys
        directory = tempfile.TemporaryDirectory(); self.addCleanup(directory.cleanup)
        root = Path(directory.name)
        env = {**os.environ, 'PI_GATE_PORT': '0', 'PI_WEB_PORT': '0', 'PI_AGENT_DATA': str(root / 'data'), 'PI_WEB_DATA': str(root / 'web'),
               'PI_WEB_REMOTE_HOSTS': HOST, 'PI_WEB_REMOTE_USERS': USER, 'PI_TAILSCALE': tailscale}
        process = subprocess.Popen([sys.executable, 'harness/services.py'], cwd=Path(__file__).resolve().parent.parent, env=env,
                                   stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        self.addCleanup(lambda: (process.poll() is None and process.kill(), process.wait(), process.stdout.close(), process.stderr.close()))
        line = process.stdout.readline()
        self.assertTrue(line, process.stderr.read() if process.poll() is not None else 'No readiness')
        return process, json.loads(line), root

    def config(self, ready):
        connection = http.client.HTTPConnection('127.0.0.1', ready['web'], timeout=10); self.addCleanup(connection.close)
        connection.request('GET', '/api/config'); return json.loads(connection.getresponse().read())

    def fake(self, body):
        directory = tempfile.TemporaryDirectory(); self.addCleanup(directory.cleanup)
        path = Path(directory.name, 'tailscale'); path.write_text('#!/bin/sh\n' + body); path.chmod(0o755)
        return path

    def test_serve_runs_with_the_web_port_and_stops_with_services(self):
        import os, signal, time
        record = Path(tempfile.mkdtemp()) / 'args'
        process, ready, _ = self.start(str(self.fake(f'echo "$$ $@" > {record}\nexec sleep 60\n')))
        self.assertEqual(ready['remote'], f'https://{HOST}')
        self.assertEqual(self.config(ready)['phoneUrl'], f'https://{HOST}')
        for _ in range(50):
            if record.exists() and record.read_text().endswith('\n'): break
            time.sleep(0.1)
        pid, *args = record.read_text().split()
        self.assertEqual(args, ['serve', str(ready['web'])])
        process.send_signal(signal.SIGTERM); process.wait(timeout=10)
        for _ in range(50):
            try: os.kill(int(pid), 0)
            except ProcessLookupError: break
            time.sleep(0.1)
        else: self.fail('tailscale serve still running after services stopped')

    def test_failure_is_reported_and_the_web_still_starts(self):
        _, ready, _ = self.start(str(self.fake('echo "Serve is not enabled on your tailnet" >&2\nexit 1\n')))
        self.assertNotIn('remote', ready); self.assertIn('Serve is not enabled', ready['remote_error'])
        self.assertIsNone(self.config(ready)['phoneUrl'])
        _, ready, _ = self.start('/nonexistent/tailscale')
        self.assertIn('tailscale', ready['remote_error']); self.assertTrue(ready['web'])

    def test_serve_that_waits_for_enabling_is_reported_and_stopped(self):
        """Real tailscale 1.9x prints the enable link on stdout and waits (seen 2026-10-13 on the mini)."""
        import os, time
        record = Path(tempfile.mkdtemp()) / 'pid'
        body = (f'echo $$ > {record}\necho "Serve is not enabled on your tailnet."\necho "To enable, visit:"\necho\n'
                'echo "         https://login.tailscale.com/f/serve?node=abc123"\nexec sleep 60\n')
        _, ready, _ = self.start(str(self.fake(body)))
        self.assertNotIn('remote', ready)
        self.assertIn('not enabled', ready['remote_error'])
        self.assertIn('https://login.tailscale.com/f/serve?node=abc123', ready['remote_error'])
        self.assertIsNone(self.config(ready)['phoneUrl'])
        pid = int(record.read_text())
        for _ in range(50):
            try: os.kill(pid, 0)
            except ProcessLookupError: break
            time.sleep(0.1)
        else: self.fail('a serve waiting to be enabled is left running')

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


class TranscriptTextTest(unittest.TestCase):
    """Task 142: only the words said reach the prompt box, not the transcriber's progress lines."""
    def test_progress_lines_are_not_text(self):
        import os, sys
        from unittest.mock import patch
        from harness.web_chat import transcribe
        with tempfile.TemporaryDirectory() as directory:
            fake = Path(directory) / 'uv'
            fake.write_text('#!/bin/sh\necho "Detected language: English"\necho \'{"text": "Test, 日本語"}\'\n'); fake.chmod(0o755)
            with patch.dict(os.environ, {'PATH': directory + os.pathsep + os.environ['PATH']}):
                self.assertEqual(transcribe(Path(directory) / 'audio.webm'), 'Test, 日本語')
