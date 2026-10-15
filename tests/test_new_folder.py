"""Round 8 (Ph8_ChooseFolder): the folder browser's New Folder… makes one folder in the folder shown; nothing else."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:  # run as tests.<module> from the repository root
    from tests import isolation  # noqa: F401
import tempfile
import unittest
from pathlib import Path

from harness.documents import DocumentStore


class NewFolderTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve(); self.store = DocumentStore(self.root / 'data')

    def test_it_makes_the_folder_and_says_where(self):
        made = self.store.create_directory(str(self.root), 'code')
        self.assertEqual(made['path'], str(self.root / 'code')); self.assertTrue((self.root / 'code').is_dir())

    def test_it_never_reuses_or_escapes(self):
        (self.root / 'code').mkdir()
        for name in ('code', '', ' ', '.', '..', 'a/b', '../up', '.hidden'):
            with self.subTest(name=name), self.assertRaises(ValueError):
                self.store.create_directory(str(self.root), name)
        self.assertEqual(sorted(child.name for child in self.root.iterdir()), ['code', 'data'] if (self.root / 'data').exists() else ['code'])

    def test_the_parent_must_be_a_folder(self):
        with self.assertRaises(ValueError):
            self.store.create_directory(str(self.root / 'missing'), 'code')


if __name__ == '__main__':
    unittest.main()
