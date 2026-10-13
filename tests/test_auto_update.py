import json
import os
from pathlib import Path
import subprocess
import shutil
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parent.parent


def git(directory, *args):
    return subprocess.run(['git', '-C', str(directory), *args], capture_output=True, text=True, check=True).stdout.strip()


class AutoUpdateTest(unittest.TestCase):
    """An installed plh follows the checkout it was installed from: committed HEAD only."""

    def setUp(self):
        # No background git (fsmonitor daemon, auto gc or maintenance) may write into .git while tearDown deletes it: that made this test fail now and then.
        from unittest.mock import patch
        quiet = {'GIT_CONFIG_COUNT': '3', 'GIT_CONFIG_KEY_0': 'core.fsmonitor', 'GIT_CONFIG_VALUE_0': 'false', 'GIT_CONFIG_KEY_1': 'gc.auto', 'GIT_CONFIG_VALUE_1': '0', 'GIT_CONFIG_KEY_2': 'maintenance.auto', 'GIT_CONFIG_VALUE_2': 'false'}
        patcher = patch.dict(os.environ, quiet); patcher.start(); self.addCleanup(patcher.stop)
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name).resolve()
        self.source = self.root / 'checkout'
        self.source.mkdir()
        # The working tree's tracked files, so the code under test is the code being changed.
        for name in git(ROOT, 'ls-files').splitlines():
            if (ROOT / name).is_file():
                (self.source / name).parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(ROOT / name, self.source / name)
        git(self.source, 'init', '-q')
        git(self.source, '-c', 'user.name=t', '-c', 'user.email=t@t', 'add', '-A')
        git(self.source, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'base')
        self.prefix, self.agent, self.data = self.root / 'prefix', self.root / 'agent', self.root / 'data'
        fake = self.root / 'bin/pi'
        fake.parent.mkdir()
        fake.write_text('#!' + sys.executable + '\nimport json,sys\nprint(json.dumps({"extension":sys.argv[sys.argv.index("--extension")+1]}))\n')
        fake.chmod(0o755)
        self.env = {**os.environ, 'PATH': str(fake.parent) + os.pathsep + os.environ['PATH'], 'PI_AGENT_DATA': str(self.data)}
        self.env.pop('PLH_UPDATED', None)
        subprocess.run([sys.executable, str(self.source / 'harness/install.py'), '--prefix', str(self.prefix), '--agent-dir', str(self.agent), '--data-dir', str(self.data)],
                       env=self.env, capture_output=True, text=True, check=True)
        self.package = self.prefix / 'share/pi-local-harness'

    def tearDown(self):
        self.temp.cleanup()

    def commit(self, text):
        (self.source / 'readme.md').write_text(text)
        git(self.source, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qam', 'change')

    def launch(self):
        return subprocess.run([str(self.prefix / 'bin/plh')], env=self.env, capture_output=True, text=True, check=True)

    def installed(self):
        return (self.package / 'readme.md').read_text().splitlines()[0]

    def backups(self):
        return sorted(self.package.parent.glob('pi-local-harness.before-*'))

    def test_install_records_its_source_and_commit(self):
        record = json.loads((self.package / 'install.json').read_text())
        self.assertEqual(Path(record['source']), self.source)
        self.assertEqual(record['commit'], git(self.source, 'rev-parse', 'HEAD'))

    def test_launch_installs_a_new_commit_before_starting_pi(self):
        self.commit('marker-new-build\n')
        result = self.launch()
        self.assertEqual(self.installed(), 'marker-new-build')
        self.assertEqual(json.loads((self.package / 'install.json').read_text())['commit'], git(self.source, 'rev-parse', 'HEAD'))
        self.assertIn('PLH: updated', result.stderr)
        self.assertEqual(json.loads(result.stdout)['extension'], str(self.package / '.pi/extensions/local-harness.ts'))

    def test_uncommitted_edits_are_not_installed(self):
        self.commit('marker-committed\n')
        (self.source / 'readme.md').write_text('marker-half-done\n')
        self.launch()
        self.assertEqual(self.installed(), 'marker-committed')

    def test_same_commit_does_not_reinstall(self):
        before = self.backups()
        result = self.launch()
        self.assertEqual(self.backups(), before)
        self.assertNotIn('PLH: updated', result.stderr)

    def test_auto_update_false_keeps_the_installed_build(self):
        config = json.loads((self.data / 'config.json').read_text())
        (self.data / 'config.json').write_text(json.dumps({**config, 'auto_update': False}))
        self.commit('marker-skipped\n')
        self.launch()
        self.assertEqual(self.installed(), '# Pi local harness')

    def test_missing_checkout_still_starts_the_installed_build(self):
        self.commit('marker-unreached\n')
        self.source.rename(self.root / 'moved')
        result = self.launch()
        self.assertIn('extension', result.stdout)
        self.assertIn('PLH: not updated', result.stderr)

    def test_only_the_three_newest_backups_are_kept(self):
        for index in range(5):
            self.commit(f'marker-{index}\n')
            self.launch()
        self.assertEqual(len(self.backups()), 3)


if __name__ == '__main__':
    unittest.main()
