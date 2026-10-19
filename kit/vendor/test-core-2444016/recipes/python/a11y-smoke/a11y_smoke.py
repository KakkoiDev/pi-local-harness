"""Accessibility smoke check for a Playwright page. Copy with recipes/shared/a11y-smoke.js (the check itself)."""
from pathlib import Path

from playwright.sync_api import Page

CHECK = (Path(__file__).resolve().parents[2] / "shared" / "a11y-smoke.js").read_text(encoding="utf-8")


def a11y_problems(page: Page) -> list[str]:
    """Problems on the page as it is now: missing names, labels, alt, lang, one h1, tab order, duplicate ids."""
    return page.evaluate(CHECK)


def tab_until(page: Page, locator, limit: int = 30) -> int:
    """Press Tab until `locator` has focus; return how many presses it took. Fails if it is never reached."""
    for presses in range(1, limit + 1):
        page.keyboard.press("Tab")
        if locator.evaluate("el => el === document.activeElement"):
            return presses
    raise AssertionError(f"{locator} was not reached with {limit} Tab presses")
