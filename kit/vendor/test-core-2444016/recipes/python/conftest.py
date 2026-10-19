"""Shared fixtures for the Python recipes. Copy into your tests folder as conftest.py (recipe fixtures).

- browser_type_launch_args: every Chromium gets --use-mock-keychain and --password-store=basic (NOTES.md 1);
  TEST_CORE_CHROME (or PI_TEST_CHROME) points at an existing Chromium so nothing is downloaded.
- context: refuses every request that leaves 127.0.0.1, so a forgotten stub fails instead of reaching the network.
- app_url: the sample app on its own temporary database and a free port, fresh for every test.
- signed_in_page: a page already signed in (logged-in state), through the API, not the form.
- sample_tasks: three tasks made with the builders (sample data).
"""
from __future__ import annotations

import os
import sys
from pathlib import Path
from urllib.parse import urlsplit

import pytest
from playwright.sync_api import expect

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))  # live_server.py; in your project builders.py sits next to it too
sys.path.insert(0, str(HERE / "data-builders"))  # builders.py, in this repository

from live_server import serve  # noqa: E402
from sample_app.app import TEST_USERS, create_app  # noqa: E402  (replace with your app factory)

CHROMIUM_FLAGS = ["--use-mock-keychain", "--password-store=basic"]
TEST_EMAIL, TEST_PASSWORD = next(iter(TEST_USERS.items()))


@pytest.fixture(scope="session")
def browser_type_launch_args(browser_type_launch_args):
    args = {**browser_type_launch_args, "args": [*browser_type_launch_args.get("args", []), *CHROMIUM_FLAGS]}
    chrome = os.environ.get("TEST_CORE_CHROME") or os.environ.get("PI_TEST_CHROME")
    if chrome:
        args["executable_path"] = chrome
    return args


@pytest.fixture
def context(context):
    def only_local(route):
        if urlsplit(route.request.url).hostname in {"127.0.0.1", "localhost", "::1"}:
            route.fallback()
        else:
            route.abort("internetdisconnected")
    context.route("**/*", only_local)
    return context


@pytest.fixture
def app_url(tmp_path):
    with serve(create_app(tmp_path / "test.sqlite3")) as url:
        yield url


@pytest.fixture
def signed_in_page(page, app_url):
    response = page.request.post(f"{app_url}/api/login", data={"email": TEST_EMAIL, "password": TEST_PASSWORD})
    assert response.ok, response.text()
    page.goto(app_url)
    expect(page.get_by_role("button", name="Sign out")).to_be_visible()  # wait for the state, not for time
    return page


@pytest.fixture
def sample_tasks(signed_in_page, app_url):
    from builders import build_task

    tasks = [build_task(title="Buy milk"), build_task(title="Call the dentist"), build_task(title="牛乳を買う")]
    for task in tasks:
        assert signed_in_page.request.post(f"{app_url}/api/tasks", data={"title": task["title"]}).ok
    signed_in_page.reload()
    expect(signed_in_page.get_by_role("listitem")).to_have_count(len(tasks))
    return tasks
