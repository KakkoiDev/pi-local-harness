import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def test_every_language_has_every_key_and_every_template_key_exists() -> None:
    languages = {path.stem: json.loads(path.read_text(encoding="utf-8")) for path in (ROOT / "messages").glob("*.json")}
    keys = {language: set(messages) for language, messages in languages.items()}
    assert len({frozenset(value) for value in keys.values()}) == 1, keys
    used = {key for path in (ROOT / "app/templates").rglob("*.html") for key in re.findall(r"""t\(["']([\w.]+)["']\)""", path.read_text(encoding="utf-8"))}
    assert used <= keys["en"], used - keys["en"]
