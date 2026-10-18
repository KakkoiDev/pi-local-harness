"""The base check (Project Start): what New Project runs before it creates the project, with Python alone (no packages
installed). pytest runs it with the rest; `python3 -m unittest tests.test_base tests.test_cap_…` runs the base check."""
import json
import re
import unittest
from pathlib import Path

from app.i18n import choose, translate

ROOT = Path(__file__).resolve().parent.parent


class BaseTest(unittest.TestCase):
    def test_english_and_japanese_have_the_same_keys_and_cover_the_templates(self) -> None:
        keys = {path.stem: set(json.loads(path.read_text(encoding="utf-8"))) for path in (ROOT / "messages").glob("*.json")}
        self.assertEqual(set(keys), {"en", "ja"}, "English and Japanese, always")
        self.assertEqual(keys["en"], keys["ja"])
        used = {key for path in (ROOT / "app/templates").rglob("*.html") for key in re.findall(r"""t\(["']([\w.]+)["']\)""", path.read_text(encoding="utf-8"))}
        self.assertLessEqual(used, keys["en"], used - keys["en"])

    def test_the_language_comes_from_the_address_then_the_choice_then_the_browser(self) -> None:
        self.assertEqual(choose("en", "ja-JP", asked="ja"), "ja")
        self.assertEqual(choose(None, "ja-JP,en;q=0.8"), "ja")
        self.assertEqual(choose(None, "fr"), "en")
        self.assertEqual(translate("ja", "no.such.key"), "no.such.key", "a missing key shows itself")


if __name__ == "__main__":
    unittest.main()
