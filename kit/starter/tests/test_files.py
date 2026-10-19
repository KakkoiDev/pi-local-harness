"""Catch missing page assets and offline-cache files without starting the app."""
import json
import re
import unittest
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent


class ReferencedFilesTest(unittest.TestCase):
    def test_referenced_files_exist(self):
        missing: list[str] = []
        def check(url: str, source: str) -> None:
            if '{{' in url or '{%' in url: return
            parsed = urlsplit(url)
            if parsed.scheme or parsed.netloc or not parsed.path or parsed.path == '/': return
            name = unquote(parsed.path).lstrip('/')
            # These two routes serve files from static/ at the site root.
            if name in {'manifest.webmanifest', 'sw.js'}: name = 'static/' + name
            # static/app.css is built from styles/input.css by Tailwind (git ignores it): its source must exist.
            if name == 'static/app.css': name = 'styles/input.css'
            if not (ROOT / name).is_file(): missing.append(f'{source}: {parsed.path}')
        class Assets(HTMLParser):
            source = ''
            def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
                for key, value in attrs:
                    if key in {'src', 'href'} and value: check(value, self.source)
        for path in (ROOT / 'app/templates').rglob('*.html'):
            text = path.read_text(encoding='utf-8'); source = str(path.relative_to(ROOT))
            parser = Assets(); parser.source = source; parser.feed(text)
            for value in re.findall(r'''url_for\(\s*['"]static['"]\s*,\s*path\s*=\s*['"]([^'"]+)['"]''', text):
                check('/static/' + value.lstrip('/'), source)
        shell = re.search(r'\bSHELL\s*=\s*\[([\s\S]*?)\]', (ROOT / 'static/sw.js').read_text(encoding='utf-8'))
        if shell is None: self.fail('static/sw.js: missing literal SHELL list')
        for value in re.findall(r'''['"]([^'"]+)['"]''', shell[1]): check(value, 'static/sw.js')
        manifest = json.loads((ROOT / 'static/manifest.webmanifest').read_text(encoding='utf-8'))
        for icon in manifest.get('icons', []): check(icon['src'], 'static/manifest.webmanifest')
        self.assertEqual(missing, [], 'Missing referenced files:\n' + '\n'.join(missing))


if __name__ == '__main__':
    unittest.main()
