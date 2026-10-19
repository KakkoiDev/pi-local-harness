"""Plan 198, the kit: pinned libraries match their checksums and licences, and the agent cards only mention what the
libraries really have (a card that invents a class teaches Pi a wrong habit: the first Basecoat card had `.form`)."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:  # run as tests.<module> from the repository root
    from tests import isolation  # noqa: F401
import hashlib
import json
import re
import unittest
from pathlib import Path

KIT = Path(__file__).resolve().parent.parent / 'kit'


class KitTest(unittest.TestCase):
    def setUp(self):
        self.libraries = json.loads((KIT / 'libraries.json').read_text())['libraries']

    def test_every_library_is_pinned_licensed_and_noticed(self):
        notices = (KIT / 'THIRD_PARTY_NOTICES.md').read_text()
        for lib in self.libraries:
            folder = KIT / lib['folder']
            self.assertEqual(hashlib.sha256((folder / lib['main']).read_bytes()).hexdigest(), lib['sha256'], f"{lib['name']}: the file is the pinned one")
            self.assertTrue(any((folder / name).is_file() for name in ('LICENSE', 'LICENSE.md')), lib['name'])
            self.assertIn(f"| {lib['version']} | {lib['license']} |", notices, lib['name'])
            self.assertTrue((KIT / lib['card']).is_file(), f"{lib['name']} has a card")

    def test_test_core_is_pinned_to_its_commit_with_every_file_checked(self):
        """Task 332: test-core (PR #1, not merged yet) is pinned to one commit; every file projects get is checked."""
        library = next(lib for lib in self.libraries if lib['name'] == 'test-core')
        self.assertRegex(library['commit'], r'^[0-9a-f]{40}$'); self.assertTrue(library['commit'].startswith(library['version']))
        self.assertIn(library['commit'], library['source']); self.assertEqual(library['license'], 'MIT')
        folder = KIT / library['folder']
        for name, digest in library['files_sha256'].items():
            self.assertEqual(hashlib.sha256((folder / name).read_bytes()).hexdigest(), digest, name)
        for name in ('test-core/tools/scenarios.py', 'test-core/tools/vocab.py', 'test-core/functional/blocks/python/edit_form.py',
                     'test-core/functional/blocks/js/EditForm.js', 'test-core/LICENSE', 'test-core/a11y-smoke.js', 'AGENTS.md', 'NOTES.md'):
            self.assertTrue((folder / name).is_file(), name)
        import subprocess, sys
        verified = subprocess.run([sys.executable, '-I', str(folder / 'test-core/adopt.py'), '--verify', str(folder / 'test-core')], capture_output=True, text=True)
        self.assertEqual(verified.returncode, 0, verified.stdout + verified.stderr)
        self.assertIn(library['commit'], verified.stdout, 'the adopted copy is this commit, every file as copied')
        for language in ('python', 'js'):
            for recipe in ('scenario-e2e', 'scenario-steps', 'a11y-smoke', 'flaky-rules', 'offline-phone', 'fixtures'):
                self.assertTrue((folder / 'recipes' / language / recipe / 'README.md').is_file(), f'{language}/{recipe}')
        card = (KIT / 'cards/test-core.md').read_text()
        for word in ('SCENARIOS.md', 'scenarios.py', 'e2e_coverage.py', 'flaky_lint.py', 'tests/e2e/conftest.py', 'tests/e2e/browser.mjs', 'data-ready', 'a11y'):
            self.assertIn(word, card)

    def test_the_basecoat_card_names_only_basecoat_classes(self):
        # What a project loads: basecoat.css and what it imports, not the legacy layer (pre-1.0 classes such as
        # btn-outline live only there and render as plain text; the first card taught them).
        folder = KIT / 'vendor/basecoat-1.0.2/css'
        def loaded(path):
            text = path.read_text()
            return text + ''.join(loaded((path.parent / name).resolve()) for name in re.findall(r'@import "([^"]+)"', text))
        css = loaded(folder / 'basecoat.css')
        self.assertNotIn('.btn-outline', css)
        card = (KIT / 'cards/basecoat.md').read_text()
        tailwind = re.compile(r'^(grid|flex|gap-\d+|p[xy]?-\d+|m[xy]?-\d+|w-\w+|h-\w+|items-\w+|justify-\w+)$')
        named = {name for value in re.findall(r'class="([^"]+)"', card) for name in value.split()} | set(re.findall(r'`((?:btn|card|field|label|input|select|textarea|table|badge|alert)[\w-]*)`', card))
        missing = sorted(name for name in named if not tailwind.match(name) and not name.endswith('…') and not re.search(r'\.' + re.escape(name) + r'(?![\w-])', css))
        self.assertEqual(missing, [], 'classes the card names that Basecoat does not have')
        for element, variant in re.findall(r'class="(\w+)"[^>]*data-variant="([\w-]+)"', card):
            self.assertIn(f".{element}[data-variant='{variant}']", css, f'{element} has no {variant} variant')

    def test_the_htmx_card_names_only_htmx_4_attributes(self):
        source = (KIT / 'vendor/htmx-4.0.0/htmx.js').read_text()
        card = (KIT / 'cards/htmx.md').read_text().split('## Rules')[0]  # the rules name removed attributes on purpose
        used = set(re.findall(r'\b(hx-[a-z-]+)', card))
        self.assertTrue(used)
        self.assertEqual(sorted(name for name in used if name.removeprefix('hx-') not in source), [])

    def test_the_school_map_names_each_lesson_once_with_when_and_why(self):
        school = json.loads((KIT / 'school' / 'lessons.json').read_text())
        ids = [lesson['id'] for lesson in school['lessons']]
        self.assertEqual(len(ids), len(set(ids)))
        for lesson in school['lessons']:
            self.assertRegex(lesson['id'], r'^[tar]\d\d$'); self.assertTrue(lesson['when'] and lesson['why'], lesson['id'])
            self.assertEqual(lesson['kind'], {'t': 'tech', 'a': 'ai', 'r': 'theory'}[lesson['id'][0]], lesson['id'])


if __name__ == '__main__':
    unittest.main()
