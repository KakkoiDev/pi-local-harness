"""Malformed input gets an HTTP error, never a dropped connection; one bad chat file cannot hide the workspace."""
import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
import base64
import http.server
import json
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from pathlib import Path
from harness.web_chat import WebChat, WebHandler, prepare_prompt

class WebRobustnessTest(unittest.TestCase):
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

    def request(self, path, body=None):
        data = None if body is None else json.dumps(body).encode()
        request = urllib.request.Request(self.base + path, data=data, headers={'Content-Type': 'application/json'})
        try:
            with urllib.request.urlopen(request, timeout=5) as response: return response.status, json.load(response)
        except urllib.error.HTTPError as error:
            with error: return error.code, json.load(error)

    def test_wrongly_typed_fields_get_json_errors(self):
        project = self.chat.documents.create_project('Typed')
        for path, body in [('/api/documents/save', {'path': 5, 'markdown': '', 'revision': ''}),
                           ('/api/documents/comment', {'path': ['x'], 'text': 'hi'}),
                           ('/api/projects/register', {'path': 7}),
                           ('/api/jobs/create', {'project': project, 'message': 'go', 'document_comment': 'not-an-object'})]:
            status, value = self.request(path, body)
            self.assertIn(status, (400, 500), path); self.assertIn('error', value, path)

    def test_corrupt_conversation_does_not_hide_workspace(self):
        self.chat.documents.create_project('Visible')
        broken = self.chat.store.root / ('f' * 32); broken.mkdir(); (broken / 'conversation.json').write_text('{truncated')
        status, value = self.request('/api/workspace')
        self.assertEqual(status, 200, value)
        self.assertEqual([item['name'] for item in value['projects']], ['Visible'])

    def test_webp_requires_webp_signature(self):
        wav = b'RIFF\x00\x00\x00\x00WAVEfmt '
        attachment = {'name': 'a.webp', 'mime': 'image/webp', 'data': base64.b64encode(wav).decode()}
        with tempfile.TemporaryDirectory() as directory, self.assertRaisesRegex(ValueError, 'does not match'):
            prepare_prompt('', [attachment], Path(directory), lambda _: '')
        webp = b'RIFF\x00\x00\x00\x00WEBPVP8 '
        prompt, images, _ = prepare_prompt('', [{**attachment, 'data': base64.b64encode(webp).decode()}], Path(self.directory.name) / 'up', lambda _: '')
        self.assertEqual(len(images), 1)

    def test_concurrent_polls_create_one_chat_per_project(self):
        self.chat.documents.create_project('Race')
        stale = self.chat.store.list()
        first = self.chat.project_chat('Race', stale)
        second = self.chat.project_chat('Race', stale)
        self.assertEqual(first['id'], second['id'])
        self.assertEqual(len(self.chat.store.list()), 1)

    def test_app_paths_serve_the_workbench_and_unknown_paths_do_not(self):
        """Task 106: /projects and /p/<project>/<view>[/<file>] are the app; anything else stays 404."""
        import urllib.error
        for path in ['/projects', '/activity', '/gate', '/p/abc/chat', '/p/abc/work/tasks/001-first%20task.md', '/p/abc/activity', '/p/abc/gate', '/js/router.mjs', '/js/files-window.mjs']:
            with urllib.request.urlopen(self.base + path, timeout=5) as response:
                self.assertEqual(response.status, 200, path)
        with urllib.request.urlopen(self.base + '/p/abc/work/x.md', timeout=5) as response:
            self.assertIn('<title>Pi Workbench</title>', response.read().decode())
        for path in ['/p', '/p/abc', '/p/abc/other', '/api/nothing', '/js/missing.mjs', '/projects/x']:
            with self.assertRaises(urllib.error.HTTPError, msg=path) as caught: urllib.request.urlopen(self.base + path, timeout=5)
            self.assertEqual(caught.exception.code, 404, path)

    def test_design_files_and_fonts_are_served_with_their_types(self):
        import harness.web_chat as web
        from unittest import mock
        fake = Path(self.directory.name) / 'root'; (fake / 'fonts').mkdir(parents=True)
        for name in ['SourceSerif4-Variable', 'SourceSerif4-Italic-Variable', 'IBMPlexMono-Regular', 'IBMPlexMono-Medium']:
            (fake / 'fonts' / f'{name}.woff2').write_bytes(b'wOF2')
        expected = {'/design/tokens.css': 'text/css', '/design/components.css': 'text/css', '/design/icons.mjs': 'text/javascript',
                    '/fonts/SourceSerif4-Variable.woff2': 'font/woff2',
                    '/fonts/SourceSerif4-Italic-Variable.woff2': 'font/woff2', '/fonts/IBMPlexMono-Regular.woff2': 'font/woff2',
                    '/fonts/IBMPlexMono-Medium.woff2': 'font/woff2'}
        for path in expected:
            if not path.startswith('/fonts/'):
                source = path[1:]
                (fake / source).parent.mkdir(parents=True, exist_ok=True); (fake / source).write_bytes((web.ROOT / source).read_bytes())
        with mock.patch.object(web, 'ROOT', fake):
            for path, mime in expected.items():
                with urllib.request.urlopen(self.base + path, timeout=5) as response:
                    self.assertEqual(response.status, 200, path)
                    self.assertEqual(response.headers['Content-Type'].split(';')[0], mime, path)
