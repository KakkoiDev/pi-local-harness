# pyright: basic
"""The app in a real browser, one test per scenario of a task, named after the scenario's title: "Add a note and see it
in the list" is `test_add_a_note_and_see_it_in_the_list` (Pi Workbench checks the names). Playwright drives Chromium;
with no Playwright or no browser set up, the test is skipped and says so (nothing is downloaded).
Run: uv run pytest -v tests/e2e   (-v shows each test's name and result)
Find controls the way a person does: get_by_role with the name, get_by_label; data-testid only where nothing else fits."""
import importlib
import os
import socket
import threading
import time
from collections.abc import Iterator
from pathlib import Path
from typing import Any

import pytest
import uvicorn

from app.main import create_app


def free_port() -> int:
    with socket.socket() as probe:
        probe.bind(("127.0.0.1", 0))
        return probe.getsockname()[1]


@pytest.fixture
def base(tmp_path: Path) -> Iterator[str]:
    """The app on a local port with its own database, stopped after the test."""
    port = free_port()
    server = uvicorn.Server(uvicorn.Config(create_app(tmp_path / "e2e.sqlite3"), host="127.0.0.1", port=port, log_level="warning"))
    thread = threading.Thread(target=server.run, daemon=True)
    thread.start()
    while not server.started:
        time.sleep(0.05)
    yield f"http://127.0.0.1:{port}/"
    server.should_exit = True
    thread.join(5)


@pytest.fixture
def page() -> Iterator[Any]:
    """A Chromium page, or the test is skipped with the reason."""
    try:
        sync_api = importlib.import_module("playwright.sync_api")
    except ImportError:
        pytest.skip("no browser is set up for e2e tests (Playwright is not installed)")
    with sync_api.sync_playwright() as playwright:
        try:
            # --use-mock-keychain and --password-store=basic: headless Chromium on macOS never asks for a keychain.
            browser = playwright.chromium.launch(executable_path=os.environ.get("PI_TEST_CHROME") or None, args=["--use-mock-keychain", "--password-store=basic"])
        except Exception as error:  # no browser binary: say so, never download one here
            pytest.skip(f"no browser is set up for e2e tests ({str(error).splitlines()[0]})")
        yield browser.new_page()
        browser.close()


def test_add_a_note_and_see_it_in_the_list(base: str, page: Any) -> None:
    page.goto(base)
    page.get_by_label("New note").fill("buy milk")
    page.get_by_role("button", name="Add Note").click()
    page.locator("#notes li", has_text="buy milk").wait_for()
    assert page.locator("#notes li").count() == 1
