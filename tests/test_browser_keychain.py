"""2026-10-19: every headless Chromium a test or Pi starts asked macOS for a keychain ("A keychain cannot be found to
store Chromium") because it runs with a scratch home. Every launcher passes --use-mock-keychain, so none ever touches it."""
try:
    import isolation  # noqa: F401
except ModuleNotFoundError:
    from tests import isolation  # noqa: F401
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class KeychainTest(unittest.TestCase):
    def test_every_chromium_launch_uses_the_mock_keychain(self):
        launchers = [path for path in [*ROOT.glob('tests/browser/*.cjs'), *ROOT.glob('docs/screenshots/*'), *ROOT.glob('harness/*.mjs')]
                     if path.is_file() and re.search(r"chromium\.launch\(|'--headless", path.read_text(errors='replace'))]
        self.assertTrue(launchers)
        for path in launchers:
            text = path.read_text(errors='replace')
            for launch in re.finditer(r"chromium\.launch\(\{[^\n]*|\['--headless[^\n]*|\[browser, '--headless[^\n]*", text):
                self.assertIn('--use-mock-keychain', launch.group(0), f'{path.relative_to(ROOT)}: {launch.group(0)[:80]}')


if __name__ == '__main__':
    unittest.main()
