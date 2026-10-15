"""Every visible string goes through t(key): messages/en.json and messages/ja.json have the same keys (the harness checks)."""
import json
import os
from functools import cache
from pathlib import Path

LANGUAGES = ("en", "ja")
MESSAGES = Path(__file__).resolve().parent.parent / "messages"


@cache
def messages(language: str) -> dict[str, str]:
    data: dict[str, str] = json.loads((MESSAGES / f"{language}.json").read_text(encoding="utf-8"))
    return data


def choose(environment: dict[str, str] | None = None) -> str:
    """APP_LANG when set (the person's choice), else the terminal's locale (LANG, LC_ALL), else English."""
    values = os.environ if environment is None else environment
    for name in ("APP_LANG", "LC_ALL", "LANG"):
        code = values.get(name, "")[:2].lower()
        if code in LANGUAGES:
            return code
    return "en"


def translate(language: str, key: str, **values: str) -> str:
    text = messages(language).get(key) or messages("en").get(key) or key
    return text.format(**values) if values else text
