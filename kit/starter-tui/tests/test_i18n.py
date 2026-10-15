import json
from pathlib import Path

from app.i18n import choose

ROOT = Path(__file__).resolve().parent.parent


def test_every_language_has_every_key() -> None:
    keys = [set(json.loads(path.read_text(encoding="utf-8"))) for path in (ROOT / "messages").glob("*.json")]
    assert all(found == keys[0] for found in keys)


def test_the_language_comes_from_app_lang_then_the_locale() -> None:
    assert choose({"APP_LANG": "ja", "LANG": "en_US.UTF-8"}) == "ja"
    assert choose({"LANG": "ja_JP.UTF-8"}) == "ja"
    assert choose({}) == "en"
