"""Task 331: a project's packages, from its lock file, installed once with the person's approval (harness/packages.py).

Never downloads: `uv` and `npm` are stand-ins on PATH that record their arguments and succeed or fail."""
import isolation  # noqa: F401
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
from unittest import mock

from harness import packages

FIXTURE = Path(__file__).parent / 'fixtures' / 'packages' / 'uv.lock'
ROOT = Path(__file__).resolve().parents[1]


def stub(folder, name, body):
    path = Path(folder) / name
    path.write_text('#!/bin/sh\n[ -n "$STUB_LOG" ] && echo "$@" >> "$STUB_LOG"\n' + body, encoding='utf-8'); path.chmod(0o755)
    return path


class Stubbed(unittest.TestCase):
    """A scratch project and a bin folder first on PATH; downloads allowed (the stand-ins never reach the network)."""
    def setUp(self):
        self.scratch = Path(tempfile.mkdtemp(prefix='pi-packages-')); self.addCleanup(shutil.rmtree, self.scratch, True)
        self.bin = self.scratch / 'bin'; self.bin.mkdir(); self.log = self.scratch / 'calls.log'
        self.project = self.scratch / 'Habit Tracker'; self.project.mkdir()
        environment = {'PATH': f'{self.bin}:{os.environ["PATH"]}', 'STUB_LOG': str(self.log), 'PI_NO_DOWNLOADS': ''}
        patcher = mock.patch.dict(os.environ, environment); patcher.start(); self.addCleanup(patcher.stop)

    def calls(self):
        return self.log.read_text(encoding='utf-8').splitlines() if self.log.exists() else []


class LockTest(unittest.TestCase):
    def test_the_packages_this_computer_installs_and_the_wheel_for_this_platform(self):
        facts = packages.uv_lock(FIXTURE.read_text(encoding='utf-8'), system='darwin', machine='arm64', python=(3, 14))
        self.assertEqual(facts['names'], ['native', 'plain', 'speedup', 'tool'], 'markers and extras followed; the project itself and unused packages are not counted')
        self.assertEqual(facts['bytes'], 2000 + 1000 + 700 + 500, 'cp314 wheel for macOS arm64, the py3 wheel, the universal2 abi3 wheel, an sdist when there is no wheel')
        linux = packages.uv_lock(FIXTURE.read_text(encoding='utf-8'), system='linux', machine='x86_64', python=(3, 14))
        self.assertEqual(linux['bytes'], 1000 + 3000 + 500 + 800)
        old = packages.uv_lock(FIXTURE.read_text(encoding='utf-8'), system='darwin', machine='arm64', python=(3, 12))
        self.assertIn('old-python', old['names'], 'python_full_version < 3.13 holds on 3.12')

    def test_the_web_starters_lock_gives_the_numbers_create_shows(self):
        facts = packages.facts(ROOT / 'kit' / 'starter')
        self.assertEqual(facts['manager'], 'uv')
        self.assertEqual(facts['count'], 29 if os.uname().sysname == 'Darwin' else facts['count'])
        self.assertGreater(facts['bytes'], 10_000_000)
        self.assertRegex(facts['line'], r"^Install the app's packages: 29 packages, about \d+ MB \(download from PyPI, once; later projects reuse the shared uv cache\)$")

    def test_no_sizes_says_when_the_size_is_known(self):
        text = '[[package]]\nname = "app"\nversion = "0"\nsource = { virtual = "." }\ndependencies = [{ name = "x" }]\n\n[[package]]\nname = "x"\nversion = "1"\nsource = { registry = "https://pypi.org/simple" }\n'
        facts = packages.uv_lock(text, system='darwin', machine='arm64', python=(3, 14))
        self.assertEqual((facts['names'], facts['bytes']), (['x'], None))
        self.assertEqual(packages.line('uv', 1, None), "Install the app's packages: 1 package, size shown after the first install (download from PyPI, once; later projects reuse the shared uv cache)")

    def test_sizes_read_as_people_read_them(self):
        self.assertEqual(packages.size(4200), '4 KB'); self.assertEqual(packages.size(3_456_789), '3.5 MB'); self.assertEqual(packages.size(118_000_000), '118 MB')

    def test_an_npm_project_with_dependencies_and_a_lock(self):
        folder = Path(tempfile.mkdtemp(prefix='pi-npm-')); self.addCleanup(shutil.rmtree, folder, True)
        (folder / 'package.json').write_text(json.dumps({'devDependencies': {'vitest': '^3'}}))
        (folder / 'package-lock.json').write_text(json.dumps({'packages': {'': {}, 'node_modules/vitest': {}, 'node_modules/tinyspy': {}}}))
        facts = packages.facts(folder)
        self.assertEqual((facts['manager'], facts['count'], facts['installed']), ('npm', 2, False))
        self.assertIn('download from the npm registry', facts['line'])
        (folder / 'package.json').write_text(json.dumps({'name': 'plain'}))
        self.assertIsNone(packages.facts(folder)['manager'], 'no dependencies: nothing to install')

    def test_missing_only_when_a_lock_exists_and_the_environment_does_not(self):
        folder = Path(tempfile.mkdtemp(prefix='pi-env-')); self.addCleanup(shutil.rmtree, folder, True)
        self.assertIsNone(packages.missing(folder))
        shutil.copy(FIXTURE, folder / 'uv.lock')
        self.assertEqual(packages.missing(folder)['count'], packages.facts(folder)['count'])
        (folder / '.venv').mkdir()
        self.assertIsNone(packages.missing(folder))


class InstallTest(Stubbed):
    def test_uv_sync_frozen_online_with_its_progress(self):
        shutil.copy(FIXTURE, self.project / 'uv.lock')
        stub(self.bin, 'uv', 'mkdir -p .venv\necho "Prepared 4 packages in 12ms" >&2\necho "Installed 4 packages in 3ms" >&2\n')
        lines = []
        with mock.patch.dict(os.environ, {'UV_OFFLINE': '1'}):
            result = packages.install(self.project, progress=lines.append)
        self.assertTrue(result['installed'], result)
        self.assertEqual(self.calls(), ['sync --frozen'], 'online this one time: no --offline, UV_OFFLINE cleared')
        self.assertEqual(lines[-1], 'Installed 4 packages in 3ms')
        self.assertTrue((self.project / '.venv').is_dir())
        self.assertEqual(result['command'], 'uv sync --frozen')

    def test_offline_says_so_and_installs_nothing(self):
        shutil.copy(FIXTURE, self.project / 'uv.lock')
        stub(self.bin, 'uv', 'echo "error: Failed to fetch: https://pypi.org/simple/plain/ (dns error: failed to lookup address)" >&2\nexit 2\n')
        result = packages.install(self.project)
        self.assertFalse(result['installed'])
        self.assertIn('Failed to fetch', result['reason'])
        self.assertFalse((self.project / '.venv').exists())

    def test_downloads_off_never_runs_the_installer(self):
        shutil.copy(FIXTURE, self.project / 'uv.lock')
        stub(self.bin, 'uv', 'mkdir -p .venv\n')
        with mock.patch.dict(os.environ, {'PI_NO_DOWNLOADS': '1'}):
            result = packages.install(self.project)
        self.assertEqual((result['installed'], self.calls()), (False, []))
        self.assertIn('Downloads are off', result['reason'])

    def test_npm_ci_for_a_package_lock(self):
        (self.project / 'package.json').write_text(json.dumps({'dependencies': {'left-pad': '1'}}))
        (self.project / 'package-lock.json').write_text(json.dumps({'packages': {'': {}, 'node_modules/left-pad': {}}}))
        stub(self.bin, 'npm', 'mkdir -p node_modules\necho "added 1 package in 1s"\n')
        result = packages.install(self.project)
        self.assertTrue(result['installed']); self.assertEqual(self.calls(), ['ci'])

    def test_the_own_tests_run_offline_once_the_environment_exists(self):
        shutil.copy(ROOT / 'kit' / 'starter' / 'pyproject.toml', self.project / 'pyproject.toml')
        shutil.copy(FIXTURE, self.project / 'uv.lock')
        self.assertIsNone(packages.own_tests(self.project), 'no environment: the base check stays the standard library')
        (self.project / '.venv').mkdir()
        self.assertEqual(packages.own_tests(self.project)[1:], ['run', '--offline', 'pytest', '-q'])


# The base check runs `uv run --offline pytest -q` in the test sandbox, where STUB_LOG is scrubbed: Gate's test-run log
# (test-runs.jsonl) says what ran instead.
UV_OK = 'case "$1" in sync) mkdir -p .venv; echo "Installed 29 packages in 40ms" >&2;; run) echo "19 passed, 1 skipped in 0.75s";; esac\n'
UV_OFFLINE = 'case "$1" in sync) echo "error: Failed to fetch: https://pypi.org/simple/fastapi/ (dns error)" >&2; exit 2;; run) echo "no environment" >&2; exit 2;; esac\n'


class CreateTest(Stubbed):
    def store(self):
        from harness.documents import DocumentStore
        return DocumentStore(self.scratch / 'data')

    def runs(self):
        path = self.scratch / 'data' / 'test-runs.jsonl'
        return [json.loads(row) for row in path.read_text(encoding='utf-8').splitlines()] if path.exists() else []

    def test_create_installs_before_the_base_check_which_then_runs_the_own_tests_offline(self):
        stub(self.bin, 'uv', UV_OK); seen = []
        start = {'packages': ['web'], 'capabilities': [], 'progress': lambda stage, text: seen.append((stage, text))}
        store = self.store(); project = store.create_project('Habit Tracker Web', str(self.scratch), 'start', start=start)
        root = store.project_path(project)  # task 327: the folder is a slug (habit-tracker-web)
        self.assertEqual(self.calls()[0], 'sync --frozen', 'online, once, before the check')
        self.assertTrue((root / '.venv').is_dir())
        commands = [run['command'] for run in self.runs()]
        self.assertTrue(commands[0].startswith('python3 -B -m unittest'), commands)
        self.assertEqual(commands[-1], 'uv run --offline pytest -q')
        check = start['check']
        self.assertTrue(check['passed']); self.assertEqual(check['own_counts']['pass'], 19)
        self.assertEqual(check['tests'], check['counts']['pass'], "the base count stays the Summary's")
        self.assertEqual(check['packages']['installed'], True); self.assertEqual(check['packages']['count'], 29)
        self.assertIn(('install', 'Installed 29 packages in 40ms'), seen)
        self.assertEqual(seen[-1][0], 'check')
        tracked = subprocess.run(['git', '-C', str(root), 'ls-files'], capture_output=True, text=True).stdout
        self.assertNotIn('.venv', tracked)

    def test_offline_create_still_creates_with_the_note(self):
        stub(self.bin, 'uv', UV_OFFLINE)
        start = {'packages': ['web'], 'capabilities': []}
        store = self.store(); project = store.create_project('Offline App', str(self.scratch), 'start', start=start)
        self.assertTrue(project)
        root = store.project_path(project)
        self.assertTrue((root / '.git').is_dir() and not (root / '.venv').exists())
        self.assertFalse(start['check']['packages']['installed'])
        self.assertIn('No connection', start['check']['packages']['reason'])
        self.assertNotIn('uv run --offline pytest -q', [run['command'] for run in self.runs()], 'no environment: the own tests wait')

    def test_a_static_app_installs_nothing(self):
        stub(self.bin, 'uv', UV_OK)
        start = {'packages': ['static'], 'capabilities': []}
        self.store().create_project('Plain', str(self.scratch), 'start', start=start)
        self.assertEqual(self.calls(), []); self.assertNotIn('packages', start['check'])


class RouteTest(Stubbed):
    """Install Packages… is the person's control (PERSON_ROUTES): without the page's secret nothing is installed."""
    def setUp(self):
        super().setUp()
        import http.server, threading
        from harness.web_chat import WebChat, WebHandler
        self.chat = WebChat(self.scratch / 'chats', 9, 0, data_root=self.scratch / 'data'); self.addCleanup(self.chat.close)
        class Handler(WebHandler): pass
        Handler.chat = self.chat; Handler.log_message = lambda *args: None
        self.server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        threading.Thread(target=self.server.serve_forever, daemon=True).start()
        self.addCleanup(self.server.server_close); self.addCleanup(self.server.shutdown)
        self.project = self.chat.documents.create_project('Habit Tracker Web', str(self.scratch), 'web')

    def call(self, path, body=None, secret=None):
        import http.client
        connection = http.client.HTTPConnection('127.0.0.1', self.server.server_port, timeout=30); self.addCleanup(connection.close)
        headers = {'Content-Type': 'application/json', 'Host': f'127.0.0.1:{self.server.server_port}', **({'X-Pi-Person': secret} if secret else {})}
        connection.request('GET' if body is None else 'POST', path, body=None if body is None else json.dumps(body), headers=headers)
        response = connection.getresponse(); return response.status, json.loads(response.read() or b'null')

    def secret(self):
        import http.client, re
        connection = http.client.HTTPConnection('127.0.0.1', self.server.server_port, timeout=5); self.addCleanup(connection.close)
        connection.request('GET', '/', headers={'Host': f'127.0.0.1:{self.server.server_port}'})
        return re.search(rb'<meta name="pi-person" content="([^"]+)">', connection.getresponse().read())[1].decode()

    def test_install_packages_needs_the_person_and_logs_their_decision(self):
        stub(self.bin, 'uv', UV_OK)
        root = self.chat.documents.project_path(self.project)
        status, found = self.call('/api/project-packages?project=' + self.project)
        self.assertEqual(status, 200); self.assertTrue(found['missing']); self.assertEqual(found['count'], 29)
        self.assertEqual(self.call('/api/projects/packages', {'project': self.project})[0], 403)
        self.assertEqual(self.calls(), []); self.assertFalse((root / '.venv').exists())
        status, done = self.call('/api/projects/packages', {'project': self.project}, self.secret())
        self.assertEqual(status, 200, done); self.assertTrue(done['installed'])
        self.assertEqual(self.calls(), ['sync --frozen']); self.assertTrue((root / '.venv').is_dir())
        rows = [json.loads(row) for row in (self.scratch / 'data' / 'decisions.jsonl').read_text(encoding='utf-8').splitlines()]
        self.assertEqual([(row['kind'], row['who']) for row in rows if row['kind'] == 'packages_install'], [('packages_install', 'person')])
        self.assertFalse(self.call('/api/project-packages?project=' + self.project)[1]['missing'])


if __name__ == '__main__':
    unittest.main()
