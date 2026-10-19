"""Test primitives: small functions every test level shares. Blocks and steps are made of these, nothing else.

Find     control(within, role=, name=, label=, test_id=, text=, css=)  -> a Playwright locator that exists, or
         ControlMissing("... uses a control that no longer exists: button "Delete"")
Act      goto, click, fill, check, uncheck, select, press
Read     seen_text(target); expect_text, expect_no_text, expect_count, expect_visible, expect_hidden,
         expect_attribute, expect_value, expect_checked, expect_name, expect_description. A target is a page or locator (e2e: waits for the state), a response
         (integration) or a plain value (unit).
Data     builder(**defaults) -> build(**overrides): valid, unique records ("Task {n}" numbers each one)
Network  stub_network(routes, page=None): page.route in a browser, an httpx client on a MockTransport in code
Time     freeze_time(at, page=None) -> FrozenClock; with a page, the browser's clock stops there too
Database temp_database(folder, schema="") -> the path of a fresh SQLite file
Routes   http_client(app_or_url): FastAPI's TestClient for an ASGI app (in process), httpx for a local URL

Playwright's sync API (pytest-playwright). Waiting is always for a state, never for a time (NOTES.md 3). The JavaScript
twin is functional/js/primitives.js, with the same names in camelCase.
"""
from __future__ import annotations

import fnmatch
import itertools
import json
import re
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path
from types import SimpleNamespace
from typing import Any, Callable
from urllib.parse import urlsplit

settings = SimpleNamespace(timeout=5000)  # ms: how long a control may take to appear before it counts as missing


class ControlMissing(AssertionError):
    """A step uses a control the page does not have (any more)."""


def _is_locator_like(target: Any) -> bool:
    return hasattr(target, "get_by_role") and hasattr(target, "locator")


def _is_page(target: Any) -> bool:
    return _is_locator_like(target) and hasattr(target, "goto")


def describe_control(*, role=None, name=None, label=None, test_id=None, text=None, css=None) -> str:
    """'button "Log In"', 'field labelled "Email"', 'element [data-testid=save]'."""
    shown = name.pattern if isinstance(name, re.Pattern) else name
    if role:
        return f'{role} "{shown}"' if shown is not None else role
    if label is not None:
        return f'field labelled "{label}"'
    if test_id is not None:
        return f"element [data-testid={test_id}]"
    if text is not None:
        return f'text "{text}"'
    return f"element {css}"


# ---------------------------------------------------------------- find


def control(within, *, role: str | None = None, name=None, label: str | None = None, test_id: str | None = None,
            text: str | None = None, css: str | None = None, exact: bool = False, include_hidden: bool = False,
            block: str | None = None, timeout: float | None = None):
    """A locator for a control a person can find: by role (and name) first, then label, then text, test id or CSS.

    Waits until it is in the page (attached; it may still be hidden). When it never appears, raises ControlMissing:
    the test uses a control that no longer exists. `block` names the block in that message."""
    if role:
        options = {"exact": exact} if name is not None else {}
        if name is not None:
            options["name"] = name
        if include_hidden:
            options["include_hidden"] = True
        locator = within.get_by_role(role, **options)
    elif label is not None:
        locator = within.get_by_label(label, exact=exact)
    elif test_id is not None:
        locator = within.get_by_test_id(test_id)
    elif text is not None:
        locator = within.get_by_text(text, exact=exact)
    elif css is not None:
        locator = within.locator(css)
    else:
        raise ValueError("control() needs role, label, test_id, text or css")
    try:
        locator.first.wait_for(state="attached", timeout=settings.timeout if timeout is None else timeout)
    except Exception as error:  # playwright's TimeoutError
        if "Timeout" not in type(error).__name__:
            raise
        what = describe_control(role=role, name=name, label=label, test_id=test_id, text=text, css=css)
        where = f"{block}: " if block else ""
        raise ControlMissing(f"{where}uses a control that no longer exists: {what}") from None
    return locator


# ---------------------------------------------------------------- act


def goto(page, url: str):
    page.goto(url)
    return page


def click(target) -> None:
    target.click()


def fill(target, value) -> None:
    target.fill(str(value))


def check(target) -> None:
    target.check()


def uncheck(target) -> None:
    target.uncheck()


def select(target, option) -> None:
    """Choose an option of a <select> by its value or its visible label."""
    target.select_option(str(option))


def press(target, key: str) -> None:
    target.press(key)


# ---------------------------------------------------------------- read


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def seen_text(target) -> str:
    """What a person reads: the page's or element's visible text, a response's body, or the value itself."""
    if isinstance(target, str):
        return _normalize(target)
    if _is_page(target):
        return _normalize(target.locator("body").inner_text())
    if _is_locator_like(target):
        return _normalize(target.inner_text())
    if hasattr(target, "status_code") and hasattr(target, "text"):  # an httpx/requests response
        return target.text
    if isinstance(target, (dict, list, tuple)):
        return json.dumps(target, ensure_ascii=False)
    return _normalize(str(target))


def _expect(target):
    from playwright.sync_api import expect
    return expect(target.locator("body") if _is_page(target) else target)


def expect_text(target, text: str, *, exact: bool = False) -> None:
    """The person sees `text` (contained; the whole text with exact=True). In a browser it waits for it."""
    if _is_locator_like(target):
        # use_inner_text: what is rendered (hidden elements left out), not the DOM's textContent
        (_expect(target).to_have_text if exact else _expect(target).to_contain_text)(text, use_inner_text=True)
        return
    seen = seen_text(target)
    assert (seen == text) if exact else (text in seen), f"expected to see {text!r}, saw {seen!r}"


def expect_no_text(target, text: str) -> None:
    if _is_locator_like(target):
        _expect(target).not_to_contain_text(text, use_inner_text=True)
        return
    seen = seen_text(target)
    assert text not in seen, f"expected not to see {text!r}, saw {seen!r}"


def expect_count(target, n: int) -> None:
    """A locator matches n elements (waits), or a collection has n items."""
    if _is_locator_like(target):
        _expect(target).to_have_count(n)
        return
    assert len(target) == n, f"expected {n} item(s), got {len(target)}: {target!r}"


def expect_visible(target) -> None:
    _expect(target).to_be_visible()


def expect_hidden(target) -> None:
    _expect(target).to_be_hidden()


def expect_attribute(target, name: str, value: str) -> None:
    _expect(target).to_have_attribute(name, value)


def expect_value(target, value) -> None:
    """A field holds `value` (an input, select or text area)."""
    _expect(target).to_have_value(str(value))


def expect_checked(target, checked: bool = True) -> None:
    _expect(target).to_be_checked(checked=checked)


def expect_name(target, text: str) -> None:
    """The element's accessible name (what a screen reader says) contains `text`."""
    _expect(target).to_have_accessible_name(re.compile(re.escape(text)))


def expect_description(target, text: str) -> None:
    """The element's accessible description (its help or error text, aria-describedby) contains `text`."""
    _expect(target).to_have_accessible_description(re.compile(re.escape(text)))


# ---------------------------------------------------------------- data


def builder(**defaults) -> Callable[..., dict]:
    """A record builder: valid defaults, overridable. A text default with {n} gets a number unique to this builder;
    a callable default is called with that number. `build_task = builder(title="Task {n}", done=False)`."""
    numbers = itertools.count(1)

    def build(**overrides) -> dict:
        n = next(numbers)
        record = {}
        for key, value in defaults.items():
            if callable(value):
                value = value(n)
            elif isinstance(value, str) and "{n}" in value:
                value = value.replace("{n}", str(n))
            record[key] = value
        record.update(overrides)
        return record
    return build


# ---------------------------------------------------------------- network


def _route_matches(key: str, method: str, url: str) -> bool:
    """'GET /api/tip', '/api/tip', 'POST /api/*', or a whole URL pattern like 'https://api.example.com/*'."""
    parts = key.split(None, 1)
    wanted_method, target = (parts[0].upper(), parts[1]) if len(parts) == 2 else (None, parts[0])
    if wanted_method and wanted_method != method.upper():
        return False
    subject = urlsplit(url).path if target.startswith("/") else url
    return fnmatch.fnmatchcase(subject, target)


def _reply(spec, request) -> tuple[int, dict, bytes]:
    if callable(spec):
        spec = spec(request)
    if not isinstance(spec, dict):
        spec = {"json": spec}
    headers = dict(spec.get("headers", {}))
    if "json" in spec:
        body = json.dumps(spec["json"], ensure_ascii=False).encode()
        headers.setdefault("content-type", "application/json")
    else:
        body = spec.get("body", "")
        body = body.encode() if isinstance(body, str) else body
    return spec.get("status", 200), headers, body


def stub_network(routes: dict, page=None):
    """Answer requests from a table instead of the network: {'GET /api/tip': {'json': {...}}, '/api/x': {'status': 500}}.

    With a page (or browser context): page.route answers the matching requests, the rest go on (and the test
    fixtures refuse anything that leaves this machine). Returns the page.
    Without: returns an httpx.Client whose transport answers from the table and fails on any other request."""
    if page is not None:
        def matching(url: str) -> bool:
            return any(_route_matches(key.split(None, 1)[-1], "GET", url) for key in routes)

        def handler(route):
            request = route.request
            for key, spec in routes.items():
                if _route_matches(key, request.method, request.url):
                    status, headers, body = _reply(spec, request)
                    route.fulfill(status=status, headers=headers, body=body)
                    return
            route.fallback()
        page.route(matching, handler)
        return page
    import httpx

    def answer(request):
        for key, spec in routes.items():
            if _route_matches(key, request.method, str(request.url)):
                status, headers, body = _reply(spec, request)
                return httpx.Response(status, headers=headers, content=body)
        raise AssertionError(f"test-core: no stub for {request.method} {request.url} (stub_network routes: {list(routes)})")
    return httpx.Client(transport=httpx.MockTransport(answer), base_url="http://stub.test")


# ---------------------------------------------------------------- time


class FrozenClock:
    """A clock that only moves when the test says so. Pass `clock.now` to code that asks for the time."""

    def __init__(self, at: datetime):
        self.at = at

    def now(self) -> datetime:
        return self.at

    __call__ = now

    def advance(self, **delta) -> datetime:
        """clock.advance(days=1, hours=2)."""
        self.at = self.at + timedelta(**delta)
        return self.at


def freeze_time(at, page=None) -> FrozenClock:
    """Stop time at `at` (a datetime or ISO text; naive means UTC). With a page, the browser's Date stops there too."""
    moment = datetime.fromisoformat(at) if isinstance(at, str) else at
    if moment.tzinfo is None:
        moment = moment.replace(tzinfo=timezone.utc)
    if page is not None:
        page.clock.set_fixed_time(moment)
    return FrozenClock(moment)


# ---------------------------------------------------------------- database and routes


def temp_database(folder, schema: str = "", name: str = "test.sqlite3") -> Path:
    """A fresh SQLite database file in the test's temporary folder (tmp_path), with an optional schema."""
    path = Path(folder) / name
    if path.exists():
        raise FileExistsError(f"{path} exists: each test gets its own database")
    connection = sqlite3.connect(path)
    try:
        if schema:
            connection.executescript(schema)
        connection.commit()
    finally:
        connection.close()
    return path


def http_client(app_or_url):
    """Call routes: an ASGI app (FastAPI, Starlette) in process through TestClient, or a local URL through httpx."""
    if isinstance(app_or_url, str):
        import httpx
        return httpx.Client(base_url=app_or_url)
    from starlette.testclient import TestClient
    return TestClient(app_or_url)
