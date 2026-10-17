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
        self.assertRegex(inside, r'^[0-9a-f]{32}$', 'task 262: a stable unique id, never the folder name')
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

    def test_commands_wait_while_terminal_pi_works(self):
        """Task 262 (review P2): terminal Pi holds <data>/.agent-lock while it works; it may be working in this folder."""
        import json, os
        lock = self.store.root / '.agent-lock'; lock.write_text(json.dumps({'pid': os.getppid(), 'token': 'terminal'}))
        for command, data in [('rename', {'name': 'Other'}), ('move', {'parent': str(self.root)}), ('trash', {})]:
            with self.assertRaisesRegex(ValueError, 'Pi is working in the terminal') as refused: self.chat.project_command(command, self.project, data)
            self.assertNotIsInstance(refused.exception, ProjectBusy, 'no workbench request to show')
        self.assertTrue((self.code / 'Japanese study app').is_dir())
        self.assertEqual(self.chat.project_command('summary', self.project, {})['project'], self.project, 'reading is fine')
        lock.unlink()
        self.assertEqual(self.chat.project_command('rename', self.project, {'name': 'Other'})['name'], 'Other')


class PreviewFollowsTest(unittest.TestCase):
    """Task 262 (review P0-3): the Preview kept serving the old folder after a rename (88 404s in the live log). The
    harness stops the app it started (by its process handle) and starts it again in the new folder."""
    def setUp(self):
        import sys
        from harness.preview import Previews
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.chat = WebChat(self.root / 'chats', 1, 2, data_root=self.root / 'data'); self.addCleanup(self.chat.close)
        self.chat.previews.close()
        # An app that only sleeps; its arguments name the folder it was started in.
        self.chat.previews = Previews(self.root / 'data' / '.previews', command=lambda folder, port: [sys.executable, '-c', 'import time; time.sleep(60)', str(folder)] if folder else None)
        self.code = self.root / 'code'; self.code.mkdir()
        self.project = self.chat.documents.create_project('Shop', str(self.code))
        trash = patch.object(documents, 'to_trash', lambda path: shutil.move(str(path), str(self.root / Path(path).name))); trash.start(); self.addCleanup(trash.stop)

    def app(self):
        return self.chat.previews.apps.get(self.project)

    def test_rename_and_move_restart_the_app_in_the_new_folder(self):
        self.chat.preview(self.project, 'start'); old = self.app().process
        renamed = self.chat.project_command('rename', self.project, {'name': 'Store'})
        self.assertIsNotNone(old.poll(), 'the old app was stopped')
        self.assertEqual(self.app().process.args[-1], renamed['path'], 'started again in the renamed folder')
        self.assertIn(self.chat.preview(self.project, 'status')['state'], ('starting', 'running'))
        before = self.app().process; learning = self.code / 'learning'; learning.mkdir()
        moved = self.chat.project_command('move', self.project, {'parent': str(learning)})
        self.assertIsNotNone(before.poll()); self.assertEqual(self.app().process.args[-1], moved['path'])

    def test_a_stopped_preview_stays_stopped_and_trash_stops_the_app(self):
        self.chat.project_command('rename', self.project, {'name': 'Store'})
        self.assertIsNone(self.app(), 'nothing was running: nothing starts')
        self.chat.preview(self.project, 'start'); running = self.app().process
        self.chat.project_command('trash', self.project, {})
        self.assertIsNotNone(running.poll(), 'the app of a trashed project stops'); self.assertIsNone(self.app())


class GateHistoryFollowsTest(unittest.TestCase):
    """Task 262: Gate's test-run history (gate-protocol.json) is keyed by the project's folder; it follows Rename and Move."""
    def test_runs_follow_rename_and_move(self):
        from gate.paperwork import Paperwork
        from gate.protocol import Protocol
        temp = tempfile.TemporaryDirectory(); self.addCleanup(temp.cleanup); root = Path(temp.name)
        store = documents.DocumentStore(root / 'data'); code = root / 'code'; code.mkdir()
        protocol = Protocol(root / 'data' / 'gate-protocol.json'); paperwork = Paperwork(protocol, data=root / 'data'); paperwork.projects = store
        project = store.create_project('Shop', str(code)); folder = store.project_path(project)
        (folder / 'app.py').write_text('print(1)\n')
        protocol.record(str(folder), 'python3 -m unittest', False)
        self.assertTrue(protocol.failed_run(folder))
        renamed = Path(store.rename_project(project, 'Store')['path'])
        self.assertTrue(protocol.failed_run(renamed), 'the failing run is still known after the rename')
        self.assertNotIn(folder, protocol.runs, 'no record left under the old folder')
        learning = code / 'learning'; learning.mkdir()
        moved = Path(store.move_project(project, str(learning))['path'])
        self.assertTrue(protocol.failed_run(moved))
        self.assertTrue(Protocol(root / 'data' / 'gate-protocol.json').failed_run(moved), 'saved: Gate finds it after a restart')


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


class ProjectIdsTest(unittest.TestCase):
    """Task 262 (review item 16): every project gets its own uuid; a new project never takes another one's id or chat."""
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.chat = WebChat(self.root / 'chats', 1, 2, data_root=self.root / 'data'); self.addCleanup(self.chat.close)
        self.store = self.chat.documents

    def test_a_new_project_with_a_renamed_projects_old_name_gets_its_own_id_and_chat(self):
        first = self.store.create_project('Notes'); chat = self.chat.project_chat(first)['id']
        self.chat.project_command('rename', first, {'name': 'Journal'})
        second = self.store.create_project('Notes')
        self.assertNotEqual(second, first)
        self.assertNotEqual(self.chat.project_chat(second)['id'], chat, 'not the renamed project\'s chat')
        self.assertEqual(self.store.project_path(first).name, 'Journal'); self.assertEqual(self.store.project_path(second).name, 'Notes')
        self.assertEqual(self.chat.project_chat(first)['id'], chat)

    def test_a_name_equal_to_another_projects_id_never_reuses_it(self):
        first = self.store.create_project('Notes')
        for parent in (None, str(self.root)):
            other = self.store.create_project(first, parent)
            self.assertNotEqual(other, first); self.assertNotEqual(self.store.project_path(other), self.store.project_path(first))

    def test_a_trashed_projects_folder_name_starts_a_new_project(self):
        first = self.store.create_project('Notes'); chat = self.chat.project_chat(first)['id']
        self.store.trash_project(first)
        again = self.store.create_project('Notes')
        self.assertNotEqual(again, first, 'New Project… is a new project, not Put Back')
        self.assertNotEqual(self.chat.project_chat(again)['id'], chat)

    def test_existing_folder_name_ids_keep_working_and_new_folders_get_uuids(self):
        import json
        from harness.documents import DocumentStore
        data = self.root / 'legacy'; (data / 'projects' / 'Legacy').mkdir(parents=True)
        (data / 'projects' / 'Renamed').mkdir()
        (data / '.projects.json').write_text(json.dumps({'Old': {'name': 'Renamed', 'path': str((data / 'projects' / 'Renamed').resolve())}}))
        store = DocumentStore(data)
        self.assertEqual(store.registry['Legacy']['path'], str((data / 'projects' / 'Legacy').resolve()), 'migrated under its folder name')
        self.assertTrue((store.project_path('Legacy')).is_dir()); self.assertTrue(store.project_path('Old').name == 'Renamed')
        ids = {item['id'] for item in store.list_projects()}
        self.assertEqual(ids, {'Legacy', 'Old'}, 'no project listed twice')
        (data / 'projects' / 'Old').mkdir()  # a new folder named like a registry key (Finder, or a later create)
        (data / 'projects' / 'Fresh').mkdir()
        listed = {item['name']: item['id'] for item in store.list_projects()}
        self.assertEqual(listed['Renamed'], 'Old')
        self.assertRegex(listed['Old'], r'^[0-9a-f]{32}$', 'the new folder named Old is its own project')
        self.assertRegex(listed['Fresh'], r'^[0-9a-f]{32}$')
        self.assertEqual({item['id'] for item in DocumentStore(data).list_projects()}, set(listed.values()), 'ids are stable across restarts')


if __name__ == '__main__':
    unittest.main()
