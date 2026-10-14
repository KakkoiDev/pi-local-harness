"""Task 166: every harness setting is in harness/settings.py, editable from the console (/config set), passed on by plh;
every variable the code reads is listed there (a setting, set by the harness, or Ollama's), so none hides."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:  # run as tests.<module> from the repository root
    from tests import isolation  # noqa: F401
import json
import os
import re
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from harness import admin, settings

SYSTEM = {'PATH', 'HOME'}


class SettingsTest(unittest.TestCase):
    def test_every_variable_the_code_reads_is_listed(self):
        read = set()
        for path in [Path('plh.py'), *Path('harness').glob('*.py'), *Path('harness').glob('*.mjs'), *Path('gate').glob('*.py'), *Path('js').glob('*.mjs')]:
            text = path.read_text(encoding='utf-8')
            read |= set(re.findall(r"""(?:os\.getenv|os\.environ\.get)\(\s*['"]([A-Z][A-Z0-9_]+)['"]""", text))
            read |= set(re.findall(r"""os\.environ\[['"]([A-Z][A-Z0-9_]+)['"]\]""", text))
            read |= set(re.findall(r'process\.env\.([A-Z][A-Z0-9_]+)', text))
        listed = {name for name, *_ in settings.SETTINGS.values() if name} | set(settings.INTERNAL) | set(settings.OLLAMA) | SYSTEM
        self.assertEqual(sorted(read - listed), [], 'add each to harness/settings.py: a setting, INTERNAL or OLLAMA')
        self.assertIn('PI_HARNESS_SILENCE_SECONDS', read)

    def test_settings_become_the_variables_plh_passes_on(self):
        values = settings.validate({'hang_seconds': 90, 'remote_hosts': ['mini.ts.net'], 'remote_users': ['me@x.com']})
        env = settings.environment(values)
        self.assertEqual((env['PI_HANG_MS'], env['PI_HARNESS_SILENCE_SECONDS'], env['PI_WEB_REMOTE_HOSTS']), ('90000', '3600', 'mini.ts.net'))
        self.assertEqual(env['PI_OLLAMA_URL'], 'http://127.0.0.1:11434')
        for bad, reason in [({'silence_seconds': 5}, 'from 60'), ({'ollama_url': 'localhost'}, 'address'), ({'model': 'x'}, 'pinned'), ({'remote_hosts': ['a']}, 'together')]:
            with self.assertRaisesRegex(ValueError, reason, msg=bad): settings.validate(bad)

    def test_plh_uses_the_registry(self):
        import plh
        temp = tempfile.TemporaryDirectory(); self.addCleanup(temp.cleanup)
        (Path(temp.name) / 'config.json').write_text(json.dumps({'silence_seconds': 7200}))
        values = plh.configuration(temp.name)
        self.assertEqual(plh.environment(values)['PI_HARNESS_SILENCE_SECONDS'], '7200')

    def test_the_console_changes_them_and_shows_every_variable(self):
        temp = tempfile.TemporaryDirectory(); self.addCleanup(temp.cleanup)
        data = Path(temp.name).resolve(); console = admin.Console(data)
        admin.run(console, 'config', ['set', 'silence_seconds', '7200'], yes=True)
        self.assertEqual(json.loads((data / 'config.json').read_text())['silence_seconds'], 7200)
        with self.assertRaisesRegex(ValueError, 'from 60'): admin.run(console, 'config', ['set', 'silence_seconds', '5'], yes=True)
        preview, _ = admin.run(console, 'config', ['set', 'hang_seconds', '120'])
        self.assertIn('PI_HANG_MS', preview['detail']); self.assertIn('next time plh starts', preview['detail'])
        with patch.dict(os.environ, {'PI_HARNESS_SILENCE_SECONDS': '900'}):
            value, text = admin.run(console, 'config', [])
        self.assertIn('silence_seconds: 7200', text); self.assertIn('PI_HARNESS_SILENCE_SECONDS=900 in the environment wins', text)
        self.assertIn('Set by the harness', text); self.assertIn('PI_HARNESS_TURN_URL', text); self.assertIn('/ollama set', text)
        self.assertEqual(value['environment']['silence_seconds'], '900')


if __name__ == '__main__':
    unittest.main()
