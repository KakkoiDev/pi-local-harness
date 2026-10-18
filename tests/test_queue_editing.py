"""Task 325: the person reads, edits and removes the messages that wait for Pi.

The owner (2026-10-18): "I want to be able to read and update/remove queued messages to the agent". An edit replaces
the text in place and keeps its position; a removed message never runs and its attachments are released. Both are
atomic with the worker starting the next job, and a window that saw an older version is refused."""
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
import time
import unittest
from pathlib import Path
from harness.work_queue import WorkQueue, QueueRefusal
from harness.web_chat import WebChat, WebHandler

FILE = {'name': 'notes.txt', 'mime': 'text/plain', 'data': 'aGVsbG8='}
PICTURE = {'name': 'a.png', 'mime': 'image/png', 'data': 'iVBORw0KGgo='}


class QueueEditingTest(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory(); self.addCleanup(directory.cleanup)
        self.root = Path(directory.name); self.ran = []
        self.queue = WorkQueue(self.root / 'queue.json', lambda job, emit: self.ran.append(job['data']), start=False)

    def test_an_edit_replaces_the_text_in_place_and_keeps_its_position(self):
        first = self.queue.add('One', 'chat', {'message': 'first', 'control': 'continue'})  # a control is never joined
        second = self.queue.add('One', 'chat', {'message': 'Make it blue'})
        third = self.queue.add('Two', 'other', {'message': 'third'})
        self.assertEqual(second['version'], 1)
        edited = self.queue.edit(second['id'], 1, '  Make it red  ')
        self.assertEqual((edited['message'], edited['version']), ('Make it red', 2))
        self.assertTrue(edited['edited'])
        self.assertEqual([job['id'] for job in self.queue.list()], [first['id'], second['id'], third['id']], 'same place')
        while self.queue.run_one(): pass
        self.assertEqual([data['message'] for data in self.ran], ['first', 'Make it red', 'third'], 'Pi receives the edited text')
        reloaded = WorkQueue(self.root / 'queue.json', lambda job, emit: None, start=False)
        self.assertEqual(next(job for job in reloaded.list() if job['id'] == second['id'])['version'], 2, 'the version survives a restart')

    def test_an_edit_can_remove_attachments_and_releases_their_payload(self):
        job = self.queue.add('One', 'chat', {'message': 'see files', 'attachments': [FILE, PICTURE]})
        payload = self.queue.records / (job['id'] + '.attachments.json')
        self.assertTrue(payload.exists())
        edited = self.queue.edit(job['id'], 1, 'see the picture', [0])
        self.assertEqual(edited['files'], ['a.png'])
        self.assertEqual([item['name'] for item in json.loads(payload.read_text())], ['a.png'])
        edited = self.queue.edit(job['id'], 2, 'no files now', [0])
        self.assertEqual(edited['files'], []); self.assertFalse(payload.exists(), 'the last attachment released')
        self.queue.run_one()
        self.assertNotIn('attachments', self.ran[0]); self.assertEqual(self.ran[0]['message'], 'no files now')

    def test_an_edit_needs_words_or_an_attachment_and_only_plain_chat_is_editable(self):
        job = self.queue.add('One', 'chat', {'message': 'words'})
        with self.assertRaisesRegex(ValueError, 'use Remove'): self.queue.edit(job['id'], 1, '   ')
        with self.assertRaisesRegex(ValueError, 'no longer on this message'): self.queue.edit(job['id'], 1, 'x', [3])
        with self.assertRaisesRegex(ValueError, 'Reload the page'): self.queue.edit(job['id'], None, 'x')
        files = self.queue.add('One', 'chat2', {'message': 'files only', 'attachments': [FILE]})
        self.assertEqual(self.queue.edit(files['id'], 1, '')['message'], '', 'an attachment alone is a message')
        comment = self.queue.add('One', 'chat', {'message': '', 'document_comment': {'path': 'p/One/a.md', 'id': 'c1'}})
        answer = self.queue.add('One', 'chat', {'message': 'Choice: Who? → Me', 'choice_answer': {'id': 'q'}})
        for other in (comment, answer):
            with self.subTest(role=other['role']), self.assertRaisesRegex(ValueError, 'Only a chat message'): self.queue.edit(other['id'], 1, 'changed')
        self.assertEqual(self.queue.remove(comment['id'], 1)['status'], 'cancelled', 'every waiting request can be removed')

    def test_a_stale_version_is_refused_with_the_message_as_it_is_now(self):
        job = self.queue.add('One', 'chat', {'message': 'first words'})
        self.queue.edit(job['id'], 1, 'from the other window')
        with self.assertRaises(QueueRefusal) as refused: self.queue.edit(job['id'], 1, 'from this window')
        self.assertEqual(refused.exception.reason, 'changed'); self.assertIn('another window', str(refused.exception))
        self.assertEqual(refused.exception.job['message'], 'from the other window')
        with self.assertRaises(QueueRefusal): self.queue.remove(job['id'], 1)
        self.assertEqual(self.queue.list()[0]['status'], 'queued')

    def test_a_message_joined_to_the_waiting_one_makes_an_older_window_stale(self):
        job = self.queue.add('One', 'chat', {'message': 'one'})
        merged = self.queue.add('One', 'chat', {'message': 'two'})
        self.assertTrue(merged['merged']); self.assertEqual(merged['version'], 2)
        with self.assertRaises(QueueRefusal) as refused: self.queue.edit(job['id'], 1, 'only one')
        self.assertEqual(refused.exception.reason, 'changed')
        self.assertEqual(self.queue.list()[0]['message'], 'one\n\ntwo', 'the joined words are not overwritten')

    def test_a_removed_message_never_runs_and_its_attachments_are_released(self):
        job = self.queue.add('One', 'chat', {'message': 'never', 'attachments': [FILE]})
        later = self.queue.add('One', 'chat', {'message': 'later', 'control': 'continue'})
        payload = self.queue.records / (job['id'] + '.attachments.json')
        removed = self.queue.remove(job['id'], 1)
        self.assertEqual((removed['status'], removed['progress'], removed['files']), ('cancelled', 'Removed by you before it started', []))
        self.assertFalse(payload.exists())
        while self.queue.run_one(): pass
        self.assertEqual([data['message'] for data in self.ran], ['later'])
        follow = self.queue.add('One', 'chat', {'message': 'new words'})
        self.assertNotEqual(follow['id'], job['id'], 'a new message never joins a removed one')
        with self.assertRaises(QueueRefusal) as refused: self.queue.edit(job['id'], 2, 'too late')
        self.assertEqual(refused.exception.reason, 'removed')
        reloaded = WorkQueue(self.root / 'queue.json', lambda job, emit: self.ran.append(job['data']), start=False)
        while reloaded.run_one(): pass
        self.assertNotIn('never', [data['message'] for data in self.ran], 'not after a restart either')

    def test_an_edit_or_removal_is_refused_once_the_message_started(self):
        job = self.queue.add('One', 'chat', {'message': 'started'})
        with self.queue.condition: self.assertTrue(self.queue.claim(self.queue.jobs[0]))
        with self.assertRaises(QueueRefusal) as refused: self.queue.edit(job['id'], 1, 'edited')
        self.assertEqual(refused.exception.reason, 'started')
        self.assertEqual(str(refused.exception), 'Pi already started this message; your edit was not sent.')
        with self.assertRaisesRegex(QueueRefusal, 'Use Stop'): self.queue.remove(job['id'], 1)
        self.assertEqual(self.queue.jobs[0]['data']['message'], 'started')

    def test_editing_and_the_worker_starting_the_job_never_interleave(self):
        """The worker claims under the queue's lock: either the edit lands before the start (Pi gets the edit) or it is
        refused as started (Pi gets the original); never an edit that is accepted and then not what Pi received."""
        for attempt in range(40):
            with self.subTest(attempt=attempt):
                ran = []
                queue = WorkQueue(self.root / f'race-{attempt}' / 'queue.json', lambda job, emit: ran.append(job['data']['message']), start=False)
                job = queue.add('One', 'chat', {'message': 'original'}); outcome = {}
                def edit():
                    try: outcome['edit'] = queue.edit(job['id'], 1, 'edited')['message']
                    except QueueRefusal as error: outcome['edit'] = error.reason
                worker = threading.Thread(target=queue.run_one); editor = threading.Thread(target=edit)
                (worker.start(), editor.start()) if attempt % 2 else (editor.start(), worker.start())
                worker.join(); editor.join()
                self.assertEqual(ran, ['edited'] if outcome['edit'] == 'edited' else ['original'])
                self.assertIn(outcome['edit'], ('edited', 'started'))

    def test_removing_and_the_worker_starting_the_job_never_both_happen(self):
        for attempt in range(40):
            with self.subTest(attempt=attempt):
                ran = []
                queue = WorkQueue(self.root / f'remove-{attempt}' / 'queue.json', lambda job, emit: ran.append(job['id']), start=False)
                job = queue.add('One', 'chat', {'message': 'original'}); outcome = {}
                def remove():
                    try: outcome['remove'] = queue.remove(job['id'], 1)['status']
                    except QueueRefusal as error: outcome['remove'] = error.reason
                worker = threading.Thread(target=queue.run_one); remover = threading.Thread(target=remove)
                (worker.start(), remover.start()) if attempt % 2 else (remover.start(), worker.start())
                worker.join(); remover.join()
                self.assertEqual(ran, [] if outcome['remove'] == 'cancelled' else [job['id']])


class QueueRoutesTest(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory(); self.addCleanup(directory.cleanup)
        root = Path(directory.name); self.data = root / 'data'
        self.chat = WebChat(root / 'chats', 9, 0, data_root=self.data); self.addCleanup(self.chat.close)
        self.chat.queue.busy = lambda: True  # nothing starts: the messages stay waiting
        class Handler(WebHandler): pass
        Handler.chat = self.chat; Handler.log_message = lambda *args: None
        self.server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        threading.Thread(target=self.server.serve_forever, daemon=True).start()
        self.addCleanup(self.server.server_close); self.addCleanup(self.server.shutdown)
        self.local = {'Host': f'127.0.0.1:{self.server.server_port}'}
        self.project = self.chat.documents.create_project('Counter', None, 'empty')

    def call(self, path, body=None, person=True):
        connection = http.client.HTTPConnection('127.0.0.1', self.server.server_port, timeout=5); self.addCleanup(connection.close)
        headers = {'Content-Type': 'application/json', **self.local}
        if person: headers['X-Pi-Person'] = self.secret
        connection.request('GET' if body is None else 'POST', path, body=None if body is None else json.dumps(body), headers=headers)
        response = connection.getresponse(); return response.status, json.loads(response.read() or b'null')

    @property
    def secret(self):
        connection = http.client.HTTPConnection('127.0.0.1', self.server.server_port, timeout=5); self.addCleanup(connection.close)
        connection.request('GET', '/', headers=self.local); page = connection.getresponse().read()
        return re.search(rb'<meta name="pi-person" content="([^"]+)">', page)[1].decode()

    def decisions(self):
        path = self.data / 'decisions.jsonl'
        return [json.loads(line) for line in path.read_text().splitlines()] if path.exists() else []

    def test_edit_and_remove_are_the_persons_and_logged_without_the_text(self):
        status, job = self.call('/api/jobs/create', {'project': self.project, 'message': 'A secret plan for the counter', 'attachments': [FILE]})
        self.assertEqual(status, 200, job)
        for action in ('edit', 'remove'):
            with self.subTest(action=action):
                status, body = self.call(f"/api/jobs/{job['id']}/{action}", {'version': 1, 'message': 'x'}, person=False)
                self.assertEqual(status, 403, body); self.assertTrue(body['stale'])
        status, edited = self.call(f"/api/jobs/{job['id']}/edit", {'version': 1, 'message': 'A new plan', 'remove_files': [0]})
        self.assertEqual(status, 200, edited); self.assertEqual((edited['message'], edited['files'], edited['version']), ('A new plan', [], 2))
        status, workspace = self.call('/api/workspace')
        self.assertEqual(next(item for item in workspace['jobs'] if item['id'] == job['id'])['message'], 'A new plan', 'Activity reads the edit')
        status, refused = self.call(f"/api/jobs/{job['id']}/edit", {'version': 1, 'message': 'stale tab'})
        self.assertEqual(status, 409); self.assertEqual(refused['refused'], 'changed'); self.assertEqual(refused['job']['message'], 'A new plan')
        self.assertIn('another window', refused['error'])
        status, removed = self.call(f"/api/jobs/{job['id']}/remove", {'version': 2})
        self.assertEqual((status, removed['status']), (200, 'cancelled'))
        status, refused = self.call(f"/api/jobs/{job['id']}/edit", {'version': 3, 'message': 'late'})
        self.assertEqual((status, refused['refused']), (409, 'removed'))
        rows = [row for row in self.decisions() if row['kind'].startswith('queue_')]
        self.assertEqual([(row['kind'], row['who'], row['answer'], row['request']) for row in rows],
                         [('queue_edit', 'person', 'edited, 1 attachment removed', job['id']), ('queue_remove', 'person', 'removed', job['id'])])
        log = (self.data / 'decisions.jsonl').read_text()
        for words in ('secret plan', 'A new plan', 'stale tab'): self.assertNotIn(words, log)

    def test_a_started_message_answers_409_with_the_sentence_the_page_shows(self):
        status, job = self.call('/api/jobs/create', {'project': self.project, 'message': 'go'})
        with self.chat.queue.condition: self.chat.queue.jobs[-1].update(status='running')
        status, refused = self.call(f"/api/jobs/{job['id']}/edit", {'version': 1, 'message': 'changed'})
        self.assertEqual((status, refused['refused'], refused['error']), (409, 'started', 'Pi already started this message; your edit was not sent.'))
        with self.chat.queue.condition: self.chat.queue.jobs[-1].update(status='completed')

    def test_an_unknown_message_is_refused_plainly(self):
        status, refused = self.call('/api/jobs/' + '0' * 32 + '/remove', {'version': 1})
        self.assertEqual((status, refused['refused']), (409, 'gone'))


if __name__ == '__main__':
    unittest.main()
