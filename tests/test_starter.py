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

    def test_a_folder_that_is_not_empty_is_refused(self):
        with self.assertRaises(SystemExit): new_project(self.folder)

    @unittest.skipUnless(os.getenv('PI_KIT_HEAVY') == '1', 'PI_KIT_HEAVY=1 installs and runs it')
    def test_it_installs_builds_passes_its_tests_and_strict_types(self):
        for command in (['uv', 'sync', '-q'], ['uv', 'run', 'tailwindcss', '-i', 'styles/input.css', '-o', 'static/app.css', '--minify'],
                        ['uv', 'run', 'pytest', '-q'], ['uv', 'run', 'pyright']):
            run = subprocess.run(command, cwd=self.folder, capture_output=True, text=True, timeout=600)
            self.assertEqual(run.returncode, 0, f"{' '.join(command)}: {(run.stdout + run.stderr)[-800:]}")


if __name__ == '__main__':
    unittest.main()
