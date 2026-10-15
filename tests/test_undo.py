"""Plan 198, "Undo This Request…" (design/briefs/app-preview.md): each verified request is one commit made by the
harness; undoing it makes a new commit that reverses it. Only the harness's own commits, never while Pi works in the
project, never over the person's unsaved edits, and a conflict changes nothing and says why in plain words."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:  # run as tests.<module> from the repository root
    from tests import isolation  # noqa: F401
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from harness import undo
from harness.web_chat import ProjectBusy, WebChat, committed_commit


def git(root, *args, name='Person'):
    return subprocess.run(['git', '-C', str(root), '-c', f'user.name={name}', '-c', 'user.email=x@localhost', *args], capture_output=True, text=True, check=True).stdout


def commit(root, files, message, name='Pi Workbench'):
    for path, text in files.items(): (root / path).write_text(text)
    git(root, 'add', *files); git(root, 'commit', '-qm', message, name=name)
    return git(root, 'rev-parse', '--short=12', 'HEAD').strip()


class UndoTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name); git(self.root, 'init', '-q')
        commit(self.root, {'app.py': 'def total(a, b):\n    return a - b\n', 'notes.md': 'notes\n'}, 'Start', name='Person')
        self.request = commit(self.root, {'app.py': 'def total(a, b):\n    return a + b\n', 'test_app.py': 'assert True\n'}, 'Fix the total (task 001)')

    def test_the_preview_says_what_will_change_back(self):
        found = undo.preview(self.root, self.request)
        self.assertEqual(found['title'], 'Fix the total (task 001)')
        self.assertEqual({item['path']: (item['added'], item['removed']) for item in found['files']}, {'app.py': (1, 1), 'test_app.py': (1, 0)})
        self.assertFalse(found['undone'])

    def test_undo_makes_a_new_commit_that_reverses_the_request(self):
        result = undo.undo(self.root, self.request)
        self.assertEqual(result['outcome'], 'undone')
        self.assertIn('return a - b', (self.root / 'app.py').read_text()); self.assertFalse((self.root / 'test_app.py').exists())
        self.assertEqual(git(self.root, 'log', '-1', '--format=%an|%s').strip(), 'Pi Workbench|Undo: Fix the total (task 001)')
        self.assertEqual(git(self.root, 'rev-list', '--count', 'HEAD').strip(), '3', 'history is kept: nothing is rewritten')
        self.assertTrue(undo.preview(self.root, self.request)['undone'])
        self.assertEqual(undo.undo(self.root, self.request)['outcome'], 'already undone')

    def test_only_the_harness_own_commits(self):
        mine = commit(self.root, {'notes.md': 'my notes\n'}, 'My notes', name='Person')
        with self.assertRaisesRegex(ValueError, 'not a request Pi Workbench committed'): undo.undo(self.root, mine)
        with self.assertRaisesRegex(ValueError, 'not a request Pi Workbench committed'): undo.preview(self.root, 'deadbeef')

    def test_unsaved_edits_in_those_files_are_never_overwritten(self):
        (self.root / 'app.py').write_text('def total(a, b):\n    return a + b  # mine\n')
        result = undo.undo(self.root, self.request)
        self.assertEqual(result['outcome'], 'refused')
        self.assertIn('app.py', result['message']); self.assertIn('# mine', (self.root / 'app.py').read_text())

    def test_a_conflict_changes_nothing_and_says_which_files(self):
        commit(self.root, {'app.py': 'def total(a, b):\n    return round(a + b, 2)\n'}, 'Round the total (task 002)')
        head = git(self.root, 'rev-parse', 'HEAD')
        result = undo.undo(self.root, self.request)
        self.assertEqual(result['outcome'], 'conflict')
        self.assertIn('app.py', result['message']); self.assertIn('changed again', result['message'])
        self.assertEqual(git(self.root, 'rev-parse', 'HEAD'), head); self.assertEqual(git(self.root, 'status', '--porcelain'), '', 'nothing half-done')


class WorkbenchUndoTest(unittest.TestCase):
    def test_the_workbench_undoes_in_a_project_and_waits_while_pi_works_there(self):
        temp = tempfile.TemporaryDirectory(); self.addCleanup(temp.cleanup); root = Path(temp.name)
        chat = WebChat(root / 'chats', 1, 2, data_root=root / 'data'); self.addCleanup(chat.close)
        code = root / 'code'; code.mkdir()
        project = chat.documents.create_project('App', str(code)); folder = code / 'App'
        git(folder, 'init', '-q'); commit(folder, {'app.py': 'a\n'}, 'Start', name='Person')
        request = commit(folder, {'app.py': 'b\n'}, 'Change (task 001)')
        self.assertEqual(chat.undo(project, request, preview=True)['files'][0]['path'], 'app.py')
        with patch.object(chat.queue, 'list', return_value=[{'id': 'j' * 32, 'status': 'running', 'project': project}]):
            with self.assertRaises(ProjectBusy): chat.undo(project, request)
        self.assertEqual(chat.undo(project, request)['outcome'], 'undone')
        self.assertEqual((folder / 'app.py').read_text(), 'a\n')

    def test_the_answer_learns_its_commit_from_the_harness_note(self):
        self.assertEqual(committed_commit('Harness note: Fix the total (task 001) · committed as 0123456789ab'), '0123456789ab')
        self.assertIsNone(committed_commit('Harness note: Not verified.'))


if __name__ == '__main__':
    unittest.main()
