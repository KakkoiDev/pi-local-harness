"""The starter project (plan 198, phase 1): a new project made from the kit is whole, both languages have every key, and
its templates pass htmx 4's upgrade check. PI_KIT_HEAVY=1 also installs it with uv and runs its tests, strict pyright and
the Tailwind build (minutes, and downloads)."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:
    from tests import isolation  # noqa: F401
import json
import os
import re
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'kit'))
from new_project import new_project  # noqa: E402


class StarterTest(unittest.TestCase):
    def setUp(self):
        self.folder = Path(tempfile.mkdtemp(prefix='pi-starter-')) / 'app'
        new_project(self.folder)

    def test_a_new_project_has_the_app_the_libraries_and_the_pwa(self):
        for name in ('app/main.py', 'app/db.py', 'app/i18n.py', 'app/logic/notes.py', 'migrations/001-notes.sql', 'static/htmx.min.js',
                     'static/basecoat.min.js', 'vendor/basecoat/css/basecoat.css', 'static/manifest.webmanifest', 'static/sw.js', 'uv.lock'):
            self.assertTrue((self.folder / name).is_file(), name)
        self.assertIn('typeCheckingMode = "strict"', (self.folder / 'pyproject.toml').read_text())

    def test_english_and_japanese_have_the_same_keys_and_cover_the_templates(self):
        en, ja = (json.loads((self.folder / f'messages/{language}.json').read_text()) for language in ('en', 'ja'))
        self.assertEqual(set(en), set(ja))
        used = {key for path in (self.folder / 'app/templates').rglob('*.html') for key in re.findall(r"""t\(["']([\w.]+)["']\)""", path.read_text())}
        self.assertLessEqual(used, set(en))

    def test_the_templates_pass_the_htmx_4_upgrade_check(self):
        check = ROOT / 'kit/vendor/htmx-4.0.0/scripts/upgrade-check.py'
        said = subprocess.run([sys.executable, '-I', str(check), str(self.folder / 'app/templates')], capture_output=True, text=True); said = said.stdout + said.stderr
        self.assertIn('Found 0 issue(s)', said)

    def test_it_starts_with_a_repository_and_a_first_commit(self):
        log = subprocess.run(['git', '-C', str(self.folder), 'log', '--format=%an|%s'], capture_output=True, text=True).stdout.split('\n')
        self.assertEqual(log[0], 'Pi Workbench|Start from the Pi Workbench starter', 'the harness commits each verified request: it needs a repository')
        branch = subprocess.run(['git', '-C', str(self.folder), 'branch', '--show-current'], capture_output=True, text=True).stdout.strip()
        self.assertEqual(branch, 'main')
        self.assertEqual(subprocess.run(['git', '-C', str(self.folder), 'status', '--porcelain'], capture_output=True, text=True).stdout, '', 'everything is in it')

    def test_a_folder_that_is_not_empty_is_refused(self):
        with self.assertRaises(SystemExit): new_project(self.folder)

    @unittest.skipUnless(os.getenv('PI_KIT_HEAVY') == '1', 'PI_KIT_HEAVY=1 installs and runs it')
    def test_it_installs_builds_passes_its_tests_and_strict_types(self):
        for command in (['uv', 'sync', '-q'], ['uv', 'run', 'tailwindcss', '-i', 'styles/input.css', '-o', 'static/app.css', '--minify'],
                        ['uv', 'run', 'pytest', '-q'], ['uv', 'run', 'pyright']):
            run = subprocess.run(command, cwd=self.folder, capture_output=True, text=True, timeout=600)
            self.assertEqual(run.returncode, 0, f"{' '.join(command)}: {(run.stdout + run.stderr)[-800:]}")


class StaticStarterTest(unittest.TestCase):
    """The app with no server (plan 198, "Apps with no server at all"): browser only, JSDoc types, IndexedDB, GitHub Pages."""
    def setUp(self):
        self.folder = Path(tempfile.mkdtemp(prefix='pi-static-')) / 'app'
        new_project(self.folder, static=True)

    def test_a_new_static_project_has_the_page_the_logic_the_store_and_the_pwa(self):
        for name in ('index.html', 'js/app.mjs', 'js/logic/notes.mjs', 'js/store.mjs', 'js/i18n.mjs', 'sw.js', 'manifest.webmanifest',
                     'vendor/basecoat/css/basecoat.css', 'tsconfig.json', 'tests/notes.test.mjs'):
            self.assertTrue((self.folder / name).is_file(), name)
        self.assertFalse((self.folder / 'static/htmx.min.js').exists(), 'no server, so nothing for htmx to ask')
        config = json.loads((self.folder / 'tsconfig.json').read_text())['compilerOptions']
        self.assertTrue(config['strict'] and config['checkJs'], 'the types rule holds in the browser too')

    def test_the_logic_has_no_dom_storage_clock_or_randomness(self):
        logic = (self.folder / 'js/logic/notes.mjs').read_text()
        for forbidden in ('document.', 'window.', 'indexedDB', 'localStorage', 'Date.now', 'new Date', 'Math.random', 'crypto.', 'fetch('):
            self.assertNotIn(forbidden, logic, forbidden)

    def test_english_and_japanese_have_the_same_keys(self):
        en, ja = (json.loads((self.folder / f'messages/{language}.json').read_text()) for language in ('en', 'ja'))
        self.assertEqual(set(en), set(ja))

    @unittest.skipUnless(os.getenv('PI_KIT_HEAVY') == '1', 'PI_KIT_HEAVY=1 type-checks and tests it with uv')
    def test_its_types_and_tests_pass_with_only_uv(self):
        node = ['uvx', '--from', 'nodejs-wheel-binaries==24.19.0']
        for command in ([*node, 'npx', '--yes', '-p', 'typescript@7.0.2', 'tsc', '-p', '.'], [*node, 'node', '--test']):
            run = subprocess.run(command, cwd=self.folder, capture_output=True, text=True, timeout=600)
            self.assertEqual(run.returncode, 0, f"{' '.join(command)}: {(run.stdout + run.stderr)[-800:]}")


class TerminalStarterTest(unittest.TestCase):
    """The terminal app (Textual): runs in a terminal and, through textual-serve, in the Preview."""
    def setUp(self):
        self.folder = Path(tempfile.mkdtemp(prefix='pi-tui-')) / 'app'
        new_project(self.folder, tui=True)

    def test_a_new_terminal_project_has_the_app_the_server_and_its_lock(self):
        for name in ('app/tui.py', 'app/logic/notes.py', 'app/db.py', 'app/i18n.py', 'serve.py', 'uv.lock', 'tests/test_tui.py'):
            self.assertTrue((self.folder / name).is_file(), name)
        self.assertIn('typeCheckingMode = "strict"', (self.folder / 'pyproject.toml').read_text())
        en, ja = (json.loads((self.folder / f'messages/{language}.json').read_text()) for language in ('en', 'ja'))
        self.assertEqual(set(en), set(ja))

    @unittest.skipUnless(os.getenv('PI_KIT_HEAVY') == '1', 'PI_KIT_HEAVY=1 installs it with uv and runs its tests and strict types')
    def test_it_installs_passes_its_tests_and_strict_types(self):
        for command in (['uv', 'sync', '-q'], ['uv', 'run', 'pytest', '-q'], ['uv', 'run', 'pyright']):
            run = subprocess.run(command, cwd=self.folder, capture_output=True, text=True, timeout=600)
            self.assertEqual(run.returncode, 0, f"{' '.join(command)}: {(run.stdout + run.stderr)[-800:]}")


if __name__ == '__main__':
    unittest.main()
