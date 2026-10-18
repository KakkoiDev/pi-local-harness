"""Regression tests for the 2026-10-14 backend audit (task 150)."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:  # run as tests.<module> from the repository root
    from tests import isolation  # noqa: F401
import json
import os
import tempfile
import threading
import unittest
from pathlib import Path
from unittest.mock import patch

from harness.documents import DocumentStore
from harness.web_chat import WebChat

QUIET = {'PI_OLLAMA_URL': 'http://127.0.0.1:9'}


class AuditBackendTest(unittest.TestCase):
    def setUp(self):
        patcher = patch.dict(os.environ, QUIET); patcher.start(); self.addCleanup(patcher.stop)
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.chat = WebChat(self.root / 'chats', 1, 2, data_root=self.root / 'data'); self.addCleanup(self.chat.close)
        self.parent = self.root / 'code'; self.parent.mkdir()
        self.project = self.chat.documents.create_project('Demo', str(self.parent))

    def test_malformed_requests_are_refused_before_they_reach_the_queue(self):
        for bad in [{'document_comment': 'x'}, {'document_comment': {'path': 1, 'id': 'a'}}, {'attachments': [1]}, {'document': 3}]:
            with self.assertRaises(ValueError, msg=bad): self.chat.enqueue({'project': self.project, 'message': 'hi', **bad})
        self.assertEqual(self.chat.queue.list(), [])
        self.chat.enqueue({'project': self.project, 'message': 'hi', 'document_comment': None})
        self.assertEqual(len(self.chat.workspace()['jobs']), 1, 'null means no comment; the workspace still lists')

    def test_a_missing_project_folder_is_listed_not_fatal_and_can_be_removed(self):
        folder = self.root / 'drive'; folder.mkdir(); added = self.chat.documents.register(str(folder))
        folder.rmdir()
        listed = {item['id']: item for item in self.chat.workspace()['projects']}
        self.assertTrue(listed[added]['missing']); self.assertIsNone(listed[added]['chat'])
        self.chat.documents.forget(added)
        self.assertNotIn(added, {item['id'] for item in self.chat.workspace()['projects']})
        with self.assertRaises(ValueError): self.chat.documents.forget(self.project + '-unknown')

    def test_trashed_comments_go_to_the_trash_and_never_return_on_a_new_file(self):
        store = self.chat.documents; path = store.create_file(self.project, 'notes.md')['path']
        store.save(path, '# notes\n\nOld line.\n', store.get(path)['revision']); store.comment(path, 'Old secret', 'Old line.')
        store.delete(path)
        trash = self.root / 'data' / '.trash'
        self.assertEqual(len([item for item in trash.iterdir() if item.name.endswith('.comments')]), 1, 'kept beside the trashed file')
        again = store.create_file(self.project, 'notes.md')['path']
        self.assertEqual(store.comments(again), [])

    def test_an_answer_for_a_page_that_moved_fails_clearly(self):
        store = self.chat.documents; path = store.create_file(self.project, 'a.md')['path']
        store.save(path, '# a\n\nLine.\n', store.get(path)['revision']); entry = store.comment(path, 'Why?', 'Line.')
        store.move(path, 'b.md')
        with self.assertRaisesRegex(ValueError, 'moved or deleted'): store.agent_result(path, entry['id'], 'answer')
        with self.assertRaisesRegex(ValueError, 'moved or deleted'): store.mark_sent(path, entry['id'], 'chat')

    def test_the_first_read_of_an_old_comment_file_is_normalised(self):
        store = self.chat.documents; path = store.create_file(self.project, 'old.md')['path']
        store.save(path, '# old\n\nLine.\n', store.get(path)['revision'])
        legacy = store.sidecar(path).with_suffix('.json')
        legacy.write_text(json.dumps([{'id': 'c', 'anchor': 'Line.', 'text': 'q', 'created': '', 'resolved': False, 'agent_reply': 'a', 'replies': [{'text': 'r', 'created': '2'}]}]))
        first = store.comments(path)
        self.assertEqual([item['author'] for item in first[0]['replies']], ['you', 'pi'], 'authors set; with no send time the old answer goes last')
        self.assertIn('Person: q', store.comment_prompt(path, 'c'))

    def test_a_file_pi_is_answering_about_cannot_be_moved_or_trashed(self):
        store = self.chat.documents; path = store.create_file(self.project, 'docs/a.md')['path']
        store.save(path, '# a\n\nLine.\n', store.get(path)['revision']); entry = store.comment(path, 'Why?', 'Line.')
        self.chat.switching = 'hold'; self.addCleanup(setattr, self.chat, 'switching', None)  # the request stays queued
        self.chat.enqueue({'project': self.project, 'message': 'Comment', 'document_comment': {'path': path, 'id': entry['id']}})
        for target in (path, f'projects/{self.project}/docs'):
            with self.assertRaisesRegex(ValueError, 'Pi is working'): self.chat.ensure_idle_path(target)
        self.chat.ensure_idle_path(f'projects/{self.project}/other.md')

    def test_gate_protocol_survives_parallel_writes(self):
        from gate.protocol import Protocol
        protocol = Protocol(self.root / 'protocol.json'); errors = []
        def write(index):
            try:
                for step in range(50):
                    with protocol.lock: protocol.runs.setdefault(Path(f'/r{index}'), []).append((str(step), True))
                    protocol.save()
            except Exception as error: errors.append(error)
        threads = [threading.Thread(target=write, args=(index,)) for index in range(8)]
        for thread in threads: thread.start()
        for thread in threads: thread.join()
        self.assertEqual(errors, []); self.assertEqual(len(json.loads((self.root / 'protocol.json').read_text())), 8)

    def fake_pi(self):
        import sys
        executable = self.root / 'bin' / 'pi'; executable.parent.mkdir(exist_ok=True)
        executable.write_text('#!' + sys.executable + '\n' + Path('tests/fixtures/fake-pi.py').read_text()); executable.chmod(0o755)
        return patch.dict(os.environ, {'PATH': str(executable.parent) + os.pathsep + os.environ['PATH']})

    def test_a_web_request_survives_the_extensions_recovery_and_reports_a_refusal(self):
        conversation = self.chat.project_chat(self.project)
        with self.fake_pi():
            events = []; self.chat.send(conversation['id'], {'message': 'Think TEST_RECOVER'}, events.append)
            self.assertEqual(self.chat.store.get(conversation['id'])['messages'][-1]['content'], 'recovered answer')
            with self.assertRaisesRegex(ValueError, 'One agent is already working'): self.chat.send(conversation['id'], {'message': 'Hi TEST_REFUSED'}, events.append)

    def test_create_with_an_unslugged_name_leaves_no_stray_project(self):
        store = DocumentStore(self.root / 'plain'); page = store.create('foo!', 'Plan')
        self.assertTrue(page['path'].startswith(f"projects/{page['project']}/"))
        self.assertEqual([(item['id'], item['name']) for item in store.list_projects()], [(page['project'], 'foo')])


if __name__ == '__main__':
    unittest.main()
