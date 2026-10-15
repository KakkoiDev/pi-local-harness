"""Plan 198, round 7 (P_NewProject, P_NewProjectStatic): New Project… makes a Web app, an App with no server, or an
empty folder. The two apps are the kit's starters; every new project starts with a repository, because the harness
commits each verified request."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:  # run as tests.<module> from the repository root
    from tests import isolation  # noqa: F401
import subprocess
import tempfile
import unittest
from pathlib import Path

from harness.documents import DocumentStore


def log(folder):
    return subprocess.run(['git', '-C', str(folder), 'log', '--format=%an|%s'], capture_output=True, text=True).stdout.splitlines()


class ProjectKindsTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name); self.code = self.root / 'code'; self.code.mkdir()
        self.store = DocumentStore(self.root / 'data')

    def test_a_web_app_is_the_server_starter_with_its_roadmap_in_the_first_commit(self):
        self.store.create_project('Class Notes', str(self.code), kind='web')
        folder = self.code / 'Class-Notes' if (self.code / 'Class-Notes').exists() else next(self.code.iterdir())
        for name in ('app/main.py', 'static/htmx.min.js', 'ROADMAP.md', 'tasks/001-first-task.md'):
            self.assertTrue((folder / name).is_file(), name)
        self.assertEqual(log(folder), ['Pi Workbench|Start from the Pi Workbench starter'])
        self.assertEqual(subprocess.run(['git', '-C', str(folder), 'status', '--porcelain'], capture_output=True, text=True).stdout, '', 'the roadmap is in the first commit')

    def test_an_app_with_no_server_is_the_static_starter(self):
        self.store.create_project('Flashcards', str(self.code), kind='static')
        folder = next(self.code.iterdir())
        self.assertTrue((folder / 'js/store.mjs').is_file()); self.assertFalse((folder / 'app').exists())
        self.assertTrue((folder / 'ROADMAP.md').is_file())

    def test_an_empty_folder_is_as_today_plus_a_repository(self):
        self.store.create_project('Ideas', str(self.code), kind='empty')
        folder = next(self.code.iterdir())
        self.assertEqual(sorted(path.name for path in folder.iterdir() if path.name != '.git'), ['ROADMAP.md', 'tasks'])
        self.assertEqual(log(folder), ['Pi Workbench|Start the project'])

    def test_an_unknown_kind_is_refused(self):
        with self.assertRaises(ValueError): self.store.create_project('X', str(self.code), kind='game')


if __name__ == '__main__':
    unittest.main()
