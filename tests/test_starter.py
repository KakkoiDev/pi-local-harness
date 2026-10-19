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

    def test_it_has_an_e2e_example_named_after_its_scenario_that_the_base_check_does_not_run(self):
        """Task 329: one e2e test per scenario, named after it; offline, it skips and says why (no browser download)."""
        sys.path.insert(0, str(ROOT))
        from gate import controls
        from kit.capabilities import base_tests
        source = (self.folder / 'tests/e2e/test_notes_e2e.py').read_text()
        self.assertIn('def test_add_a_note_and_see_it_in_the_list(', source)
        self.assertIn('--use-mock-keychain', source); self.assertIn('--password-store=basic', source)
        self.assertIn('pytest.skip("no browser is set up for e2e tests', source)
        self.assertFalse([name for name in base_tests(self.folder) if 'e2e' in name], 'Create never starts a browser')
        self.assertEqual(controls.check(self.folder), {'problems': [], 'removed': []}, 'the starter as it comes passes the control rule')
        tests = controls.snapshot(self.folder)[1]
        self.assertEqual([name for _, name in tests], ['test_add_a_note_and_see_it_in_the_list'])

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

    def test_its_e2e_example_skips_offline_and_says_why(self):
        """Task 329: the scenario's e2e test runs with node --test; with no Playwright it is skipped with the reason."""
        import shutil
        node = shutil.which('node')
        if not node: self.skipTest('node is not on PATH')
        env = {key: value for key, value in os.environ.items() if key not in ('NODE_PATH', 'PI_TEST_CHROME')}
        run = subprocess.run([node, '--test', 'tests/e2e/notes.e2e.test.mjs'], cwd=self.folder, capture_output=True, text=True, timeout=120, env=env)
        self.assertEqual(run.returncode, 0, run.stdout + run.stderr)
        self.assertRegex(run.stdout, r'﹣ Add a note and see it in the list .*# no browser is set up for e2e tests')
        self.assertIn('--use-mock-keychain', (self.folder / 'tests/e2e/notes.e2e.test.mjs').read_text())

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

class ReferencedFilesTest(unittest.TestCase):
    """Task 230: each starter owns a dependency-free guard, including files only used offline."""
    def test_static_guard_names_each_missing_reference(self):
        with tempfile.TemporaryDirectory(prefix='pi-references-') as directory:
            folder=Path(directory)/'app';new_project(folder,static=True)
            guard=folder/'tests/files.test.mjs'
            self.assertTrue(guard.is_file(),'the static starter needs its referenced-files test')
            (folder/'static/app.css').write_text('/* scratch build output */')
            def run():return subprocess.run(['node','--test',str(guard)],cwd=folder,capture_output=True,text=True)
            self.assertEqual(run().returncode,0)
            # The separate probe paths prove all four sources, including nested modules and query strings.
            (folder/'js/probe').mkdir();(folder/'js/probe/use.mjs').write_text("import {\n unused\n} from './only-module.mjs?version=1';\n")
            (folder/'js/probe/only-module.mjs').write_text('export {};\n')
            (folder/'static/cache-only.txt').write_text('cache')
            sw=folder/'sw.js';sw.write_text(sw.read_text().replace('const SHELL = [', "const SHELL = ['static/cache-only.txt',"))
            (folder/'static/page-only.svg').write_text('<svg/>')
            with (folder/'index.html').open('a') as file:file.write('<img src="static/page-only.svg">')
            manifest=folder/'manifest.webmanifest';data=json.loads(manifest.read_text())
            (folder/'static/manifest-only.svg').write_text('<svg/>');data['icons'].append({'src':'static/manifest-only.svg'});manifest.write_text(json.dumps(data))
            cases=['js/logic/notes.mjs','static/cache-only.txt','static/page-only.svg','static/manifest-only.svg','js/probe/only-module.mjs']
            for name in cases:
                path=folder/name;body=path.read_bytes();path.unlink()
                try:
                    result=run();self.assertNotEqual(result.returncode,0,name);self.assertIn(name,result.stdout+result.stderr)
                finally:path.write_bytes(body)
            self.assertEqual(run().returncode,0)

    def test_web_guard_names_missing_template_manifest_and_cache_files(self):
        with tempfile.TemporaryDirectory(prefix='pi-references-') as directory:
            folder=Path(directory)/'app';new_project(folder)
            guard=folder/'tests/test_files.py'
            self.assertTrue(guard.is_file(),'the web starter needs its referenced-files test')
            (folder/'static/app.css').write_text('/* scratch build output */')
            (folder/'static/template-only.svg').write_text('<svg/>')
            with (folder/'app/templates/base.html').open('a') as file:file.write("<img src=\"{{ url_for('static', path='template-only.svg') }}\">\n")
            def run():return subprocess.run([sys.executable,str(guard)],cwd=folder,capture_output=True,text=True)
            self.assertEqual(run().returncode,0)
            (folder/'static/cache-only.txt').write_text('cache')
            sw=folder/'static/sw.js';sw.write_text(sw.read_text().replace('const SHELL = [', 'const SHELL = ["/static/cache-only.txt",'))
            manifest=folder/'static/manifest.webmanifest';data=json.loads(manifest.read_text())
            (folder/'static/manifest-only.svg').write_text('<svg/>');data['icons'].append({'src':'/static/manifest-only.svg'});manifest.write_text(json.dumps(data))
            for name in ['static/cache-only.txt','static/manifest-only.svg','static/template-only.svg']:
                path=folder/name;body=path.read_bytes();path.unlink()
                try:
                    result=run();self.assertNotEqual(result.returncode,0,name);self.assertIn(name,result.stdout+result.stderr)
                finally:path.write_bytes(body)
            self.assertEqual(run().returncode,0)


if __name__ == '__main__':
    unittest.main()
