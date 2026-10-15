"""Every visible string goes through t(key): messages/en.json and messages/ja.json have the same keys (the harness checks)."""
import json
from functools import cache
from pathlib import Path

LANGUAGES = ("en", "ja")
MESSAGES = Path(__file__).resolve().parent.parent / "messages"


@cache
def messages(language: str) -> dict[str, str]:
    data: dict[str, str] = json.loads((MESSAGES / f"{language}.json").read_text(encoding="utf-8"))
    return data


def choose(cookie: str | None, accept_language: str | None, asked: str | None = None) -> str:
    """The language asked in the address (?lang=, the workbench's Preview), else the person's choice (a cookie), else
    the browser's first known language, else English."""
    if asked in LANGUAGES:
        return asked
    if cookie in LANGUAGES:
        return cookie
    for part in (accept_language or "").split(","):
        code = part.split(";")[0].strip().lower()[:2]
        if code in LANGUAGES:
            return code
    return "en"


def translate(language: str, key: str, **values: str) -> str:
    text = messages(language).get(key) or messages("en").get(key) or key
    return text.format(**values) if values else text
