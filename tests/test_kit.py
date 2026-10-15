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

    def test_the_basecoat_card_names_only_basecoat_classes(self):
        css = ''.join(path.read_text() for path in (KIT / 'vendor/basecoat-1.0.2/css').rglob('*.css'))
        card = (KIT / 'cards/basecoat.md').read_text()
        tailwind = re.compile(r'^(grid|flex|gap-\d+|p[xy]?-\d+|m[xy]?-\d+|w-\w+|h-\w+|items-\w+|justify-\w+)$')
        named = {name for value in re.findall(r'class="([^"]+)"', card) for name in value.split()} | set(re.findall(r'`((?:btn|card|field|label|input|select|textarea|table|badge|alert)[\w-]*)`', card))
        missing = sorted(name for name in named if not tailwind.match(name) and not name.endswith('…') and not re.search(r'\.' + re.escape(name) + r'(?![\w-])', css))
        self.assertEqual(missing, [], 'classes the card names that Basecoat does not have')

    def test_the_htmx_card_names_only_htmx_4_attributes(self):
        source = (KIT / 'vendor/htmx-4.0.0/htmx.js').read_text()
        card = (KIT / 'cards/htmx.md').read_text().split('## Rules')[0]  # the rules name removed attributes on purpose
        used = set(re.findall(r'\b(hx-[a-z-]+)', card))
        self.assertTrue(used)
        self.assertEqual(sorted(name for name in used if name.removeprefix('hx-') not in source), [])


if __name__ == '__main__':
    unittest.main()
