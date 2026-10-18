"""The base check (Project Start): what New Project runs before it creates the project, with Python alone (no packages
installed). pytest runs it with the rest; `python3 -m unittest tests.test_base tests.test_cap_…` runs the base check."""
import json
import unittest
from pathlib import Path

from app.i18n import choose, translate

ROOT = Path(__file__).resolve().parent.parent


class BaseTest(unittest.TestCase):
    def test_english_and_japanese_have_the_same_keys(self) -> None:
        keys = {path.stem: set(json.loads(path.read_text(encoding="utf-8"))) for path in (ROOT / "messages").glob("*.json")}
        self.assertEqual(set(keys), {"en", "ja"}, "English and Japanese, always")
        self.assertEqual(keys["en"], keys["ja"])

    def test_the_language_comes_from_app_lang_then_the_locale(self) -> None:
        self.assertEqual(choose({"APP_LANG": "ja", "LANG": "en_US.UTF-8"}), "ja")
        self.assertEqual(choose({}), "en")
        self.assertEqual(translate("ja", "no.such.key"), "no.such.key", "a missing key shows itself")


if __name__ == "__main__":
    unittest.main()
