# pyright: basic
"""Installs on a phone (a capability chosen in Project Start), in a real browser: its scenario in SCENARIOS.md, one test named
after its title. The app and the browser come from tests/e2e/conftest.py; with no browser set up it is skipped and
says so."""
from typing import Any


def test_the_browser_finds_the_manifest_the_icon_and_the_service_worker(base: str, page: Any) -> None:
    # Given the app open in the browser
    page.goto(base)
    # When the browser reads the manifest the page links to
    link = page.locator('link[rel="manifest"]').get_attribute("href")
    manifest = page.request.get(base.rstrip("/") + "/" + str(link).lstrip("/"))
    assert manifest.ok, f"{link}: {manifest.status}"
    # Then the manifest names the app, its icon loads and the service worker is active
    data = manifest.json()
    assert data["name"] and data["icons"]
    assert page.request.get(base.rstrip("/") + "/" + data["icons"][0]["src"].lstrip("/")).ok
    page.evaluate("() => { navigator.serviceWorker.ready.then(registration => { window.e2eWorker = Boolean(registration.active); }); }")
    page.wait_for_function("() => window.e2eWorker === true")  # build static/app.css first: the worker caches it
