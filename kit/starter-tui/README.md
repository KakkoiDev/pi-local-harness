# A Pi Workbench terminal app

Built with Textual: it runs in a terminal, and in a browser (the workbench's Preview, or a phone) through
textual-serve. Typed Python, English and Japanese.

    uv sync                                   # once
    uv run python -m app.tui                  # in this terminal (Ctrl+L switches English / 日本語, Ctrl+Q quits)
    uv run python serve.py 8000               # in a browser: http://127.0.0.1:8000
    uv run --offline pytest                   # tests (Pi runs this form; after uv sync)
    uv run --offline pyright                  # types (in a terminal)

Rules live in `app/logic/` as pure functions; data in `app/db.py` and `migrations/`; screens and keys in `app/tui.py`;
every visible string in `messages/en.json` and `messages/ja.json`. APP_LANG=ja starts it in Japanese.

## Scenarios and tests (test-core)

`SCENARIOS.md` lists what the app does, one Given/When/Then scenario each. Each scenario has one test named after its
title that drives the real app through Textual's pilot (`tests/test_tui.py`, or `tests/e2e/`).
`tests/test_protocol.py` runs test-core's checks from `test-core/` (MIT) with Python alone: every scenario has
its test, and no test waits for time. The base check runs it, and so does the whole suite.

    uv run --offline pytest -v tests/test_tui.py   # the scenarios' tests, with their names

The notes feature is a sample to replace on the first real request. Keep the skeleton: storage, i18n, test setup,
build commands and folder rules (and, in web apps, the service worker and manifest). Adapt domain-specific storage
to the new app. Remove unused sample logic, tests and UI; rename the app in messages and the manifest, and update
README and the cache list together. The harness asks once about unchanged sample files before committing.
