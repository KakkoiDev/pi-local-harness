# pyright: basic
"""The e2e tests' one helper: the app on a local port, and the browser. Every e2e test in this folder uses it.

The browser decision lives here and nowhere else: Playwright drives Chromium (the versions test-core pins:
playwright 1.56.0, pytest-playwright 0.9.0); PI_TEST_CHROME points at a Chromium already on this machine. With no
Playwright or no browser set up, every browser test is skipped and says why. Nothing is ever downloaded here.
Every Chromium starts with --use-mock-keychain and --password-store=basic (headless Chromium on macOS never asks for a
keychain), and every request that leaves 127.0.0.1 is refused, so a test can never reach the network.
"""
import importlib
import os
import socket
import threading
from collections.abc import Callable, Iterator
from contextlib import AbstractContextManager, contextmanager
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit

import pytest
import uvicorn

from app.main import create_app

ROOT = Path(__file__).resolve().parents[2]
CHROMIUM_FLAGS = ["--use-mock-keychain", "--password-store=basic"]
A11Y_CHECK = ROOT / "test-core" / "a11y-smoke.js"  # test-core's shared accessibility smoke check


@contextmanager
def serve_app(database: Path) -> Iterator[str]:
    """The app on a free local port with its own database; stopped when the block ends. The socket listens before the
    server starts, so the first request simply waits for it (no polling, no sleep)."""
    listener = socket.socket()
    listener.bind(("127.0.0.1", 0))
    listener.listen()
    port = listener.getsockname()[1]
    server = uvicorn.Server(uvicorn.Config(create_app(database), log_level="warning"))
    thread = threading.Thread(target=server.run, kwargs={"sockets": [listener]}, daemon=True)
    thread.start()
    try:
        yield f"http://127.0.0.1:{port}/"
    finally:
        server.should_exit = True
        thread.join(10)
        listener.close()


@pytest.fixture
def serve() -> Callable[[Path], AbstractContextManager[str]]:
    """`with serve(path) as base:` the app on a database file of the test's choice (to start it twice on one file)."""
    return serve_app


@pytest.fixture
def base(tmp_path: Path) -> Iterator[str]:
    """The app on a local port with a fresh database, for one test."""
    with serve_app(tmp_path / "e2e.sqlite3") as url:
        yield url


@pytest.fixture(scope="session")
def browser() -> Iterator[Any]:
    """One Chromium for the whole run, or every browser test is skipped with the reason."""
    try:
        sync_api = importlib.import_module("playwright.sync_api")
    except ImportError:
        pytest.skip("no browser is set up for e2e tests (Playwright is not installed)")
    with sync_api.sync_playwright() as playwright:
        try:
            chromium = playwright.chromium.launch(executable_path=os.environ.get("PI_TEST_CHROME") or None, args=CHROMIUM_FLAGS)
        except Exception as error:  # no browser binary: say so, never download one here
            pytest.skip(f"no browser is set up for e2e tests ({str(error).splitlines()[0]})")
        yield chromium
        chromium.close()


@pytest.fixture
def page(browser: Any) -> Iterator[Any]:
    """A fresh page (its own cookies and storage) that can only reach 127.0.0.1."""
    context = browser.new_context()

    def only_local(route: Any) -> None:
        if urlsplit(route.request.url).hostname in {"127.0.0.1", "localhost", "::1"}:
            route.fallback()
        else:
            route.abort("internetdisconnected")

    context.route("**/*", only_local)
    page = context.new_page()
    yield page
    context.close()


@pytest.fixture
def a11y_problems() -> Callable[[Any], list[str]]:
    """test-core's accessibility smoke check, `a11y_problems(page)` on the page as it is now: [] when it passes."""
    check = A11Y_CHECK.read_text(encoding="utf-8")
    return lambda page: page.evaluate(check)
