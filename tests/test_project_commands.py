"""Task 154: rename, move, locate, remove from the list and trash a project. The project's id never changes, so its
chat, comments, Activity and Gate history stay with it."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:  # run as tests.<module> from the repository root
    from tests import isolation  # noqa: F401
import shutil
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from harness import documents
from harness.web_chat import ProjectBusy, WebChat


class ProjectCommandsTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.chat = WebChat(self.root / 'chats', 1, 2, data_root=self.root / 'data'); self.addCleanup(self.chat.close)
        self.store = self.chat.documents
        self.code = self.root / 'code'; self.code.mkdir()
        self.project = self.store.create_project('Japanese study app', str(self.code))
        self.conversation = self.chat.project_chat(self.project)
        self.page = f'projects/{self.project}/ROADMAP.md'
        self.comment = self.store.comment(self.page, 'Shorter.', 'Describe what we are building.')
        # The Mac Trash is the Finder's; tests use a folder instead.
        self.trash = self.root / 'Trash'; self.trash.mkdir()
        trash = patch.object(documents, 'to_trash', lambda path: shutil.move(str(path), str(self.trash / Path(path).name)))
        trash.start(); self.addCleanup(trash.stop)

    def listed(self):
        return {item['id']: item for item in self.chat.workspace()['projects']}

    def test_rename_renames_the_folder_and_keeps_the_id(self):
        result = self.chat.project_command('rename', self.project, {'name': 'Japanese flashcards'})
        self.assertEqual(result['project'], self.project, 'the address /p/<id> does not change')
        self.assertTrue((self.code / 'Japanese flashcards' / 'ROADMAP.md').is_file()); self.assertFalse((self.code / 'Japanese study app').exists())
        self.assertEqual(self.listed()[self.project]['name'], 'Japanese flashcards')
        self.assertEqual(self.store.get(self.page)['comments'][0]['text'], 'Shorter.', 'comments stay')
        self.assertEqual(self.chat.project_chat(self.project)['id'], self.conversation['id'], 'the chat stays')
        self.assertEqual(self.chat.store.get(self.conversation['id'])['title'], 'Japanese flashcards', 'the chat is named after the project')
        (self.code / 'Taken').mkdir()
        with self.assertRaisesRegex(ValueError, 'already exists'): self.store.rename_project(self.project, 'Taken')
        with self.assertRaisesRegex(ValueError, 'name'): self.store.rename_project(self.project, '///')

    def test_a_project_in_the_data_folder_keeps_its_id_too(self):
        inside = self.store.create_project('Notes')
        self.assertEqual(inside, 'Notes')
        self.store.rename_project(inside, 'Journal')
        listed = self.listed()
        self.assertEqual(listed[inside]['name'], 'Journal'); self.assertNotIn('Journal', listed, 'not listed twice')
        self.assertTrue((self.store.project_path(inside) / 'ROADMAP.md').is_file())

    def test_move_moves_the_folder_and_keeps_the_id(self):
        learning = self.code / 'learning'; learning.mkdir()
        result = self.store.move_project(self.project, str(learning))
        self.assertEqual(result['project'], self.project)
        self.assertTrue((learning / 'Japanese study app' / 'ROADMAP.md').is_file())
        self.assertEqual(Path(self.listed()[self.project]['path']), (learning / 'Japanese study app').resolve())
        self.assertEqual(self.store.get(self.page)['comments'][0]['text'], 'Shorter.')
        with self.assertRaisesRegex(ValueError, 'inside itself'): self.store.move_project(self.project, str(learning / 'Japanese study app' / 'tasks'))
        with self.assertRaisesRegex(ValueError, 'already'): self.store.move_project(self.project, str(learning))
        with self.assertRaisesRegex(ValueError, 'folder'): self.store.move_project(self.project, 'relative/path')

    def test_remove_from_list_keeps_the_folder_and_adding_it_again_brings_the_chat_back(self):
        folder = self.store.project_path(self.project)
        self.store.forget(self.project)
        self.assertNotIn(self.project, self.listed()); self.assertTrue(folder.is_dir(), 'the folder is never touched')
        again = self.store.register(str(folder))
        self.assertEqual(again, self.project, 'Add Existing Folder… brings the same project back')
        self.assertEqual(self.chat.project_chat(again)['id'], self.conversation['id'])
        inside = self.store.create_project('Scratch'); self.store.forget(inside)
        self.assertNotIn(inside, self.listed(), 'a project in the data folder can be removed too')

    def test_trash_moves_the_folder_to_the_trash_and_put_back_brings_it_back(self):
        summary = self.store.project_summary(self.project)
        self.assertEqual((summary['files'], summary['folders']), (3, 1), 'ROADMAP.md, first task, publication audit; tasks/')
        self.store.trash_project(self.project)
        self.assertTrue((self.trash / 'Japanese study app' / 'ROADMAP.md').is_file()); self.assertFalse((self.code / 'Japanese study app').exists())
        self.assertNotIn(self.project, self.listed())
        shutil.move(str(self.trash / 'Japanese study app'), str(self.code / 'Japanese study app'))  # Put Back
        self.assertEqual(self.store.register(str(self.code / 'Japanese study app')), self.project)
        self.assertEqual(self.store.get(self.page)['comments'][0]['text'], 'Shorter.', 'comments come back')

    def test_locate_points_a_missing_project_at_its_new_folder(self):
        moved = self.root / 'elsewhere'; shutil.move(str(self.code / 'Japanese study app'), str(moved))
        self.assertTrue(self.listed()[self.project]['missing'])
        with self.assertRaisesRegex(ValueError, 'missing'): self.store.rename_project(self.project, 'Other')
        self.store.locate_project(self.project, str(moved))
        self.assertNotIn('missing', self.listed()[self.project]); self.assertEqual(self.store.get(self.page)['comments'][0]['text'], 'Shorter.')
        with self.assertRaisesRegex(ValueError, 'not missing'): self.store.locate_project(self.project, str(self.code))

    def test_commands_wait_while_pi_works_in_the_project(self):
        self.chat.switching = 'hold'  # the queue waits (as during a model switch), so the request stays queued until cancelled
        job = self.chat.enqueue({'project': self.project, 'message': 'Working'})
        with self.assertRaises(ProjectBusy) as refused: self.chat.project_command('rename', self.project, {'name': 'Other'})
        self.assertEqual(refused.exception.job, job['id']); self.assertEqual(str(refused.exception), 'Pi is answering about this project.')
        for command in ['move', 'trash']:
            with self.assertRaises(ProjectBusy): self.chat.project_command(command, self.project, {'parent': str(self.root)})
        self.assertTrue((self.code / 'Japanese study app').is_dir())
        self.chat.queue.cancel(job['id'])
        self.chat.switching = None
        self.assertEqual(self.chat.project_command('rename', self.project, {'name': 'Other'})['name'], 'Other')


class RenamedSessionsTest(unittest.TestCase):
    """Task 262 (review P0-3): Pi 1.1.0 works in the folder its session header names, not in the process cwd. A renamed or
    moved project's chat session is migrated: the header names the new folder, a backup copy stays beside it."""
    def setUp(self):
        import json, os, sys
        self.json = json
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        executable = self.root / 'pi'; executable.write_text('#!' + sys.executable + '\n' + Path('tests/fixtures/fake-pi.py').read_text()); executable.chmod(0o755)
        path = patch.dict(os.environ, {'PATH': str(self.root) + os.pathsep + os.environ['PATH']}); path.start(); self.addCleanup(path.stop)
        self.chat = WebChat(self.root / 'chats', 12345, 2, data_root=self.root / 'data'); self.addCleanup(self.chat.close)
        self.code = self.root / 'code'; self.code.mkdir()
        self.project = self.chat.documents.create_project('Flashcards', str(self.code))
        self.conversation = self.chat.project_chat(self.project)
        self.session = self.chat.store.folder(self.conversation['id']) / 'session.jsonl'
        self.message = '{"type":"message","id":"a1","parentId":null,"message":{"role":"user","content":[{"type":"text","text":"keep me"}]}}'

    def write_session(self, cwd):
        header = {'type': 'session', 'version': 3, 'id': '11111111-1111-4111-8111-111111111111', 'timestamp': '2026-10-18T00:00:00.000Z', 'cwd': str(cwd)}
        self.session.write_text(self.json.dumps(header) + '\n' + self.message + '\n')
        return self.session.read_text()

    def header(self):
        return self.json.loads(self.session.read_text().splitlines()[0])

    def backups(self):
        return sorted(self.session.parent.glob('session.jsonl.before-move-*'))

    def test_a_session_naming_another_folder_is_migrated_before_pi_starts(self):
        folder = self.chat.documents.project_path(self.project)
        original = self.write_session(self.code / 'Old name')  # renamed outside the harness, or before this fix
        self.chat.send(self.conversation['id'], {'message': 'Hello'}, lambda event: None)
        environment = self.json.loads(self.session.with_suffix('.environment.json').read_text())
        self.assertEqual(environment['session_cwd'], str(folder), 'Pi starts in the project folder, not the old one')
        self.assertEqual(self.header()['cwd'], str(folder))
        self.assertEqual(self.session.read_text().splitlines()[1], self.message, 'the conversation is kept')
        self.assertEqual([backup.read_text() for backup in self.backups()], [original], 'a backup copy, never a deletion')
        self.chat.send(self.conversation['id'], {'message': 'Again'}, lambda event: None)
        self.assertEqual(len(self.backups()), 1, 'a session that already matches is left alone')

    def test_rename_and_move_migrate_the_session_at_once(self):
        self.write_session(self.chat.documents.project_path(self.project))
        renamed = self.chat.project_command('rename', self.project, {'name': 'Kanji'})
        self.assertEqual(self.header()['cwd'], renamed['path'])
        self.assertEqual(self.session.read_text().splitlines()[1], self.message)
        self.assertEqual(len(self.backups()), 1)
        learning = self.code / 'learning'; learning.mkdir()
        moved = self.chat.project_command('move', self.project, {'parent': str(learning)})
        self.assertEqual(self.header()['cwd'], moved['path'])
        self.assertEqual(len(self.backups()), 2, 'each migration keeps its own backup')


if __name__ == '__main__':
    unittest.main()
