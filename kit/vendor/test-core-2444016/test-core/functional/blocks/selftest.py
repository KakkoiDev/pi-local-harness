"""Run a test block against its App Block's demo markup: the block's self-test, and the core of a test playground.

    from functional.blocks.python import log_in
    from functional.blocks.selftest import self_test

    def test_log_in_block(page):
        self_test(page, log_in, kit="path/to/pi-local-harness")      # or the fixture copy in tests/

The demo markup (the module's DEMO files under the kit folder) is served at DEMO_URL by page.route, so nothing leaves
the machine and every link or form the block's steps press lands on the same demo again. The steps of SELF_TEST run as
one scenario at the e2e level; a control the markup lost fails with "uses a control that no longer exists".
"""
from __future__ import annotations

from pathlib import Path

from functional import Registry, parse_scenarios, run_scenario

DEMO_URL = "http://127.0.0.1:9"  # answered by page.route; port 9 (discard) is never really asked


def demo_document(kit, module, markup: str | None = None) -> str:
    """The page a block's self-test runs on: its demo markup in a plain document (or `markup` instead)."""
    body = markup if markup is not None else "\n".join(
        (Path(kit) / path).read_text(encoding="utf-8") for path in module.DEMO)
    return (f'<!doctype html>\n<html lang="en">\n<head><meta charset="utf-8"><title>{module.BLOCK} demo</title></head>\n'
            f"<body>\n{body}\n</body>\n</html>\n")


def serve_demo(page, html: str) -> None:
    """Answer every request to DEMO_URL: documents get `html`, anything else (scripts, styles, icons) an empty 204."""
    def answer(route):
        if route.request.resource_type == "document":
            route.fulfill(status=200, content_type="text/html; charset=utf-8", body=html)
        else:
            route.fulfill(status=204, body="")
    page.route(lambda url: url.startswith(DEMO_URL), answer)


def self_test_scenario(module):
    text = f"## Scenarios\n\n### {module.BLOCK} self-test\n" + "\n".join(module.SELF_TEST) + "\n"
    return parse_scenarios(text, source=f"{module.BLOCK}.SELF_TEST")[0]


def self_test(page, module, *, kit=None, markup: str | None = None, registry: Registry | None = None):
    """Serve the block's demo, open it and run its SELF_TEST steps. Returns the world."""
    serve_demo(page, demo_document(kit, module, markup))
    page.goto(f"{DEMO_URL}/")
    return run_scenario(self_test_scenario(module), level="e2e", registry=registry or module.steps,
                        world={"page": page, "base_url": DEMO_URL})
