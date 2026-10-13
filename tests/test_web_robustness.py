"""Malformed input gets an HTTP error, never a dropped connection; one bad chat file cannot hide the workspace."""
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
