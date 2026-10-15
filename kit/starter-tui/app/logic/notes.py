"""The notes' rules, as pure functions."""
from dataclasses import dataclass

MAX_TITLE = 120


@dataclass(frozen=True)
class Problem:
    """A validation problem: the field and the message key (translated by the page)."""
    field: str
    key: str


def check_title(title: str) -> tuple[str, list[Problem]]:
    """The title as it will be saved, and what is wrong with it (nothing when it is fine)."""
    clean = " ".join(title.split())
    if not clean:
        return clean, [Problem("title", "error.title_empty")]
    if len(clean) > MAX_TITLE:
        return clean, [Problem("title", "error.title_long")]
    return clean, []
