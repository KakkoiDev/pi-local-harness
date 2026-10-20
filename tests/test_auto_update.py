try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:  # run as tests.<module> from the repository root
    from tests import isolation  # noqa: F401
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
        # Task 263: plh does not update under a running workbench; a free, closed port keeps the person's own workbench
        # (port 3000) from changing what these tests see.
        import socket
        with socket.socket() as probe: probe.bind(('127.0.0.1', 0)); closed = probe.getsockname()[1]
        config = json.loads((self.data / 'config.json').read_text()); config['web_port'] = closed
        (self.data / 'config.json').write_text(json.dumps(config))

    def tearDown(self):
        self.temp.cleanup()

    def commit(self, text):
        (self.source / 'README.md').write_text(text)
        git(self.source, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qam', 'change')

    def launch(self):
        return subprocess.run([str(self.prefix / 'bin/plh')], env=self.env, capture_output=True, text=True, check=True)

    def installed(self):
        return (self.package / 'README.md').read_text().splitlines()[0]

    def backups(self):
        return sorted(self.package.parent.glob('pi-local-harness.before-*'))

    def test_the_installed_copy_can_start_its_services(self):
        # 2026-10-15: kit/ (the project starters) and messages/ (the Japanese text) were not installed, so plh stopped at
        # "No module named 'new_project'". Import what services.py imports, from the installed copy alone.
        for name in ('harness/music.mjs', 'harness/music/score.mjs', 'harness/music/package-lock.json', 'harness/music_artifacts.py', 'kit/new_project.py', 'messages/ja.json', 'gate/test_runs.py', 'kit/starters.json', 'harness/audit.py', 'harness/choices.mjs', 'harness/planning.mjs', 'harness/web-search.mjs', 'harness/web_search.py', 'harness/terminal-planning.mjs', 'js/plan-cards.mjs', 'js/updates-window.mjs', 'harness/web_updates.py', 'harness/terminal-preview.py', 'harness/terminal-bridge.js', 'design/app-icons/manifest.webmanifest', 'design/app-icons/pi-192.png', 'harness/autonomy.py', 'gate/planning.py', 'harness/guides/planning.md', 'kit/publish_audit.py', 'kit/publish-audit.md', 'harness/laya.py', 'harness/laya_setup.py', 'harness/judgements.py', 'kit/laya-lock.json', 'harness/decision_log.py', 'harness/decisions.mjs', 'harness/theme.py', 'harness/theme_fonts.py', 'harness/theme-helper.js', 'harness/theme.mjs', 'js/theme-panel.mjs', 'js/theme-colors.mjs', 'harness/blocks.mjs', 'kit/blocks/index.json', 'kit/blocks/texts.json', 'kit/blocks/check.py', 'kit/blocks/add.py', 'kit/blocks/accounts/LogIn.md', 'kit/blocks/accounts/LogIn.html', 'kit/vendor/basecoat-1.0.2/js/chart.min.js', 'harness/tool_repair.py', 'harness/tool_repair_proxy.py', 'harness/tool_repairs.py', 'harness/tool-repair.mjs', 'harness/terse.mjs', 'harness/recordings.py', 'harness/learning.py', 'harness/skill_runs.py', 'harness/vendor/test_core_recording/flows.py', 'harness/vendor/test_core_recording/recorder.mjs', 'harness/vendor/test_core_recording/LICENSE'):
            self.assertTrue((self.package / name).is_file(), name)
        # Plan 266 item 7: the designer's App Blocks catalogue (4 MB with its demo) stays in the checkout; Pi uses kit/blocks.
        self.assertFalse((self.package / 'design/app-blocks').exists())
        self.assertTrue((self.package / 'design/components.css').is_file())
        started = subprocess.run([sys.executable, '-c', 'import harness.web_chat, harness.services, harness.laya, harness.laya_setup, harness.judgements, harness.decision_log, harness.theme, harness.theme_fonts, harness.recordings, harness.learning, harness.skill_runs'], cwd=self.package,
                                 env={**self.env, 'PYTHONPATH': str(self.package)}, capture_output=True, text=True)
        self.assertEqual(started.returncode, 0, started.stderr[-800:])

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

    def test_no_update_while_a_workbench_answers_on_its_port(self):
        """Task 263 (review P2): the package was swapped under a running workbench, which then served new pages with an
        old backend. A second launch explains the existing instance without starting another Pi."""
        from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
        import threading
        class Workbench(BaseHTTPRequestHandler):
            def do_GET(self):
                body = b'{"language": "en"}' if self.path == '/api/settings' else b'{}'
                self.send_response(200); self.send_header('Content-Type', 'application/json'); self.end_headers(); self.wfile.write(body)
            def log_message(self, *args): pass
        server = ThreadingHTTPServer(('127.0.0.1', 0), Workbench); self.addCleanup(server.server_close)
        threading.Thread(target=server.serve_forever, daemon=True).start(); self.addCleanup(server.shutdown)
        config = json.loads((self.data / 'config.json').read_text()); config['web_port'] = server.server_port
        (self.data / 'config.json').write_text(json.dumps(config))
        self.commit('marker-while-running\n')
        before = self.backups()
        result = self.launch()
        self.assertEqual(self.installed(), '# Pi WorkStation', 'the running package is left as it is')
        self.assertEqual(self.backups(), before)
        self.assertIn('already running', result.stderr); self.assertIn(str(server.server_port), result.stderr)
        self.assertNotIn('extension', result.stdout, 'a second Pi must not start duplicate services')

    def test_already_running_is_reported_even_with_auto_update_off(self):
        from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
        import threading
        class Workbench(BaseHTTPRequestHandler):
            def do_GET(self):
                self.send_response(200);self.end_headers();self.wfile.write(b'{}')
            def log_message(self,*args):pass
        server=ThreadingHTTPServer(('127.0.0.1',0),Workbench);self.addCleanup(server.server_close)
        threading.Thread(target=server.serve_forever,daemon=True).start();self.addCleanup(server.shutdown)
        config=json.loads((self.data/'config.json').read_text());config.update(web_port=server.server_port,auto_update=False)
        (self.data/'config.json').write_text(json.dumps(config))
        result=self.launch()
        self.assertIn('already running',result.stderr)
        self.assertIn(f'http://127.0.0.1:{server.server_port}',result.stderr)
        self.assertNotIn('extension',result.stdout)

    def test_uncommitted_edits_are_not_installed(self):
        self.commit('marker-committed\n')
        (self.source / 'README.md').write_text('marker-half-done\n')
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
        self.assertEqual(self.installed(), '# Pi WorkStation')

    def test_missing_checkout_still_starts_the_installed_build(self):
        self.commit('marker-unreached\n')
        self.source.rename(self.root / 'moved')
        result = self.launch()
        self.assertIn('extension', result.stdout)
        self.assertIn('PLH: not updated', result.stderr)

    def test_only_the_three_newest_backups_are_kept(self):
        trash=self.root/'Trash'
        self.env['PI_TRASH_DIR']=str(trash)
        for index in range(5):
            self.commit(f'marker-{index}\n')
            self.launch()
        self.assertEqual(len(self.backups()), 3)
        self.assertGreaterEqual(len(list(trash.glob('pi-local-harness.before-*'))),2)


if __name__ == '__main__':
    unittest.main()
