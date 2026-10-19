"""Task 327 (journey J03, the coordinator's decision): New Project's folder is a slug of the name, never an existing
folder; the project keeps the name as typed."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:  # run as tests.<module> from the repository root
    from tests import isolation  # noqa: F401
import tempfile
import unittest
from pathlib import Path

from harness.documents import DocumentStore
from harness.folder_name import folder_slug, free_folder


class FolderSlugTest(unittest.TestCase):
    def test_a_name_becomes_lowercase_words_joined_by_hyphens(self):
        for name, folder in [('Habit Tracker', 'habit-tracker'), ('  Pong!! v2 ', 'pong-v2'), ('My_App', 'my-app'), ('Café Notes', 'cafe-notes'),
                             ('Ｆｕｌｌ Width', 'full-width'), ('家計簿 アプリ', '家計簿-アプリ'), ('ガイド', 'ガイド')]:
            self.assertEqual(folder_slug(name), folder, name)

    def test_nothing_usable_is_refused(self):
        for name in ['', '   ', '!!!', '..']:
            with self.assertRaises(ValueError): folder_slug(name)

    def test_an_existing_folder_is_never_used(self):
        with tempfile.TemporaryDirectory() as directory:
            parent = Path(directory)
            self.assertEqual(free_folder(parent, 'Habit Tracker'), parent / 'habit-tracker')
            (parent / 'habit-tracker').mkdir(); (parent / 'habit-tracker-2').write_text('a file')
            self.assertEqual(free_folder(parent, 'Habit Tracker'), parent / 'habit-tracker-3')


class NewProjectFolderTest(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory(); self.addCleanup(temp.cleanup)
        self.parent = Path(temp.name).resolve() / 'code'; self.parent.mkdir()
        self.store = DocumentStore(Path(temp.name) / 'data')

    def test_the_folder_is_a_slug_and_the_name_stays(self):
        self.assertEqual(self.store.new_project_folder('Habit Tracker', str(self.parent)), str(self.parent / 'habit-tracker'))
        project = self.store.create_project('Habit Tracker', str(self.parent))
        entry = next(item for item in self.store.list_projects() if item['id'] == project)
        self.assertEqual((entry['name'], entry['path']), ('Habit Tracker', str(self.parent / 'habit-tracker')))
        self.assertTrue((self.parent / 'habit-tracker' / 'ROADMAP.md').is_file())

    def test_in_the_data_folder_the_name_stays_too(self):
        project = self.store.create_project('Habit Tracker')  # <data>/projects: discovered under its folder's name first
        entry = next(item for item in self.store.list_projects() if item['id'] == project)
        self.assertEqual((entry['name'], Path(entry['path']).name), ('Habit Tracker', 'habit-tracker'))

    def test_a_second_project_of_the_same_name_gets_its_own_folder(self):
        (self.parent / 'habit-tracker').mkdir(); (self.parent / 'habit-tracker' / 'mine.txt').write_text('keep')
        project = self.store.create_project('Habit Tracker', str(self.parent))
        self.assertEqual(self.store.project_path(project), self.parent / 'habit-tracker-2')
        self.assertEqual(sorted(path.name for path in (self.parent / 'habit-tracker').iterdir()), ['mine.txt'], 'never overwritten')

    def test_rename_keeps_the_name_and_slugs_the_folder_and_undo_gives_both_back(self):
        project = self.store.create_project('Rename me', str(self.parent))
        renamed = self.store.rename_project(project, 'Habit Tracker')
        self.assertEqual((renamed['name'], renamed['path'], renamed['previous']), ('Habit Tracker', str(self.parent / 'habit-tracker'), 'Rename me'))
        undone = self.store.rename_project(project, renamed['previous'])
        self.assertEqual((undone['name'], undone['path']), ('Rename me', str(self.parent / 'rename-me')))


if __name__ == '__main__':
    unittest.main()
