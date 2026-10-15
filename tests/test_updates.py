"""Updates (the person, 2026-10-15: "I want to make it easy for the user to update the app when a new version comes
out"): the installed Pi Workbench asks its source (the GitHub clone it was installed from) whether a new version is
there, says what changed, and updates only when it is a plain fast-forward."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:  # run as tests.<module> from the repository root
    from tests import isolation  # noqa: F401
import subprocess
import tempfile
import unittest
from pathlib import Path

from harness import updates


def git(root, *args):
    return subprocess.run(['git', '-C', str(root), '-c', 'user.name=Dev', '-c', 'user.email=d@x', *args], capture_output=True, text=True, check=True).stdout


class UpdatesTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup); root = Path(self.temp.name)
        self.origin = root / 'origin.git'; git(root, 'init', '-q', '--bare', '-b', 'main', str(self.origin))
        self.dev = root / 'dev'; git(root, 'clone', '-q', str(self.origin), str(self.dev))
        (self.dev / 'a.txt').write_text('1\n'); git(self.dev, 'add', '-A'); git(self.dev, 'commit', '-qm', 'First'); git(self.dev, 'push', '-q', 'origin', 'HEAD:main')
        self.source = root / 'source'; git(root, 'clone', '-q', str(self.origin), str(self.source))

    def release(self, subject, text='2\n'):
        (self.dev / 'a.txt').write_text(text); git(self.dev, 'commit', '-qam', subject); git(self.dev, 'push', '-q', 'origin', 'HEAD:main')

    def test_up_to_date(self):
        self.assertEqual(updates.check(self.source)['state'], 'current')

    def test_a_new_version_says_what_changed_and_updates_by_fast_forward(self):
        self.release('feat: the Preview on the phone (task 210)')
        found = updates.check(self.source)
        self.assertEqual((found['state'], found['behind']), ('available', 1))
        self.assertEqual(found['changes'], ['the Preview on the phone'], 'in plain words: no "feat:", no task number')
        done = updates.apply(self.source)
        self.assertEqual(done['state'], 'updated'); self.assertEqual(git(self.source, 'rev-parse', 'HEAD'), git(self.dev, 'rev-parse', 'HEAD'))
        self.assertEqual(updates.check(self.source)['state'], 'current')

    def test_local_changes_or_own_commits_are_never_overwritten(self):
        self.release('fix: a typo')
        (self.source / 'a.txt').write_text('mine\n')
        self.assertEqual(updates.apply(self.source)['state'], 'blocked')
        self.assertIn('not saved', updates.check(self.source)['why'])
        self.assertEqual((self.source / 'a.txt').read_text(), 'mine\n', 'untouched')
        git(self.source, 'checkout', '-q', '--', 'a.txt'); (self.source / 'b.txt').write_text('x'); git(self.source, 'add', '-A'); git(self.source, 'commit', '-qm', 'Mine')
        found = updates.check(self.source)
        self.assertEqual(found['state'], 'blocked'); self.assertIn('its own changes', found['why'])

    def test_a_folder_that_is_not_a_clone_says_so(self):
        plain = Path(self.temp.name) / 'plain'; plain.mkdir()
        self.assertEqual(updates.check(plain)['state'], 'unknown')


if __name__ == '__main__':
    unittest.main()
