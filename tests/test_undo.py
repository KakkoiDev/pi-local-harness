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


class DoneRowTest(unittest.TestCase):
    """Round 7 (DoneRow, P_Undo*): what the row and the alerts say."""
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name); git(self.root, 'init', '-q')
        commit(self.root, {'app.py': 'notes = []\n', 'notes.md': 'x\n'}, 'Start', name='Person')
        (self.root / 'tasks').mkdir()
        task = '# 002: Delete a note\n\nKind: code\n\n## For the person\n\nAdded a Delete button to each note. It asks first.\nTried it: deleting one note keeps the others.\n\n## Progress (kept by the harness)\n'
        self.request = commit(self.root, {'app.py': 'notes = []\ndef delete(): pass\n', 'tasks/002-delete-a-note.md': task}, 'Delete a note (task 002)')

    def test_the_row_has_the_plain_words_the_files_and_the_time(self):
        found = undo.preview(self.root, self.request)
        self.assertEqual(found['person'], ['Added a Delete button to each note. It asks first.', 'Tried it: deleting one note keeps the others.'])
        self.assertEqual(found['name'], 'Delete a note', 'the web drops "(task 002)": Activity shows the task')
        self.assertRegex(found['time'], r'^\d\d:\d\d$')
        self.assertEqual(len(found['files']), 2)

    def test_an_incomplete_plan_is_visible_and_never_verified(self):
        other=commit(self.root,{'notes.md':'z\n'},'Game (task 004, plan incomplete)\n\nPlan incomplete (G-014): ROADMAP.md: write the Goal in one or two sentences.')
        found=undo.preview(self.root,other)
        self.assertFalse(found['verified']);self.assertEqual(found['name'],'Game')
        self.assertIn('Plan incomplete (G-014)',found['person'][0]);self.assertTrue(found['plan_incomplete'])

    def test_an_unverified_request_says_so_and_why(self):
        other = commit(self.root, {'notes.md': 'z\n'}, 'Bold notes (task 004, not verified)\n\nNot verified: no test passed on the final code (Green).')
        found = undo.preview(self.root, other)
        self.assertFalse(found['verified']); self.assertEqual(found['name'], 'Bold notes')
        self.assertEqual(undo.preview(self.root, self.request)['verified'], True)

    def test_without_plain_words_the_row_uses_the_request_name(self):
        other = commit(self.root, {'notes.md': 'y\n'}, 'Fix the notes (task 003)')
        self.assertEqual(undo.preview(self.root, other)['person'], ['Fix the notes'])

    def test_a_conflict_names_the_later_request(self):
        commit(self.root, {'app.py': 'notes = sorted([])\ndef delete(): pass\n'}, 'Show the newest note first (task 003)')
        result = undo.undo(self.root, self.request)
        self.assertEqual(result['outcome'], 'conflict')
        self.assertEqual(result['later']['name'], 'Show the newest note first'); self.assertRegex(result['later']['time'], r'^\d\d:\d\d$')
        self.assertIn('in “Show the newest note first”', result['message'])

    def test_save_them_then_undo(self):
        temp = tempfile.TemporaryDirectory(); self.addCleanup(temp.cleanup); root = Path(temp.name); git(root, 'init', '-q')
        lines = [f'line {n}' for n in range(20)]
        commit(root, {'a.txt': '\n'.join(lines) + '\n'}, 'Start', name='Person')
        request = commit(root, {'a.txt': '\n'.join(['changed 0', *lines[1:]]) + '\n'}, 'Change the first line (task 001)')
        (root / 'a.txt').write_text('\n'.join(['changed 0', *lines[1:19], 'mine']) + '\n')
        self.assertEqual(undo.undo(root, request)['outcome'], 'refused', 'unsaved edits in a file the request changed')
        result = undo.undo(root, request, save_first=True)
        self.assertEqual(result['outcome'], 'undone', result)
        subjects = git(root, 'log', '--format=%s').splitlines()
        self.assertEqual(subjects[0], 'Undo: Change the first line (task 001)'); self.assertRegex(subjects[1], r'^Your edits · \d\d:\d\d$')
        self.assertEqual((root / 'a.txt').read_text().splitlines()[0], 'line 0'); self.assertEqual((root / 'a.txt').read_text().splitlines()[-1], 'mine', 'the edits stay')

    def test_undoing_an_undo_is_a_redo(self):
        undone = undo.undo(self.root, self.request)
        self.assertEqual(undo.preview(self.root, undone['commit'])['undo_of'], self.request)
        self.assertEqual(undo.preview(self.root, undone['commit'])['person'][0], 'Added a Delete button to each note. It asks first.', 'the undo row quotes the request in plain words')
        redone = undo.undo(self.root, undone['commit'])
        self.assertEqual(redone['outcome'], 'undone')
        self.assertEqual(git(self.root, 'log', '-1', '--format=%s').strip(), 'Redo: Delete a note (task 002)')
        self.assertIn('def delete', (self.root / 'app.py').read_text())
        self.assertEqual(undo.preview(self.root, redone['commit'])['person'][0], 'Added a Delete button to each note. It asks first.', 'a redo quotes the request too')


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
        undone = chat.undo(project, request, preview=True)
        self.assertTrue(undone['undone']); self.assertRegex(undone['undone_at'], r'^\d\d:\d\d$')
        rows = [message for message in chat.store.get(chat.project_chat(project)['id'])['messages'] if message.get('role') == 'change']
        self.assertEqual(len(rows), 1, 'the undo is its own row in the chat, after a reload too')
        self.assertEqual(chat.undo(project, rows[0]['commit'], preview=True)['undo_of'], request)

    def test_the_answer_learns_its_commit_from_the_harness_note(self):
        self.assertEqual(committed_commit('Harness note: Fix the total (task 001) · committed as 0123456789ab'), '0123456789ab')
        self.assertIsNone(committed_commit('Harness note: Not verified.'))


if __name__ == '__main__':
    unittest.main()
