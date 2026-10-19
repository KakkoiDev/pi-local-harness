# A Pi Workbench project

Built on the stack (plan 198): FastAPI, Jinja, htmx 4, Basecoat, SQLite, typed Python, English and Japanese.

    uv sync                                   # once
    TAILWINDCSS_VERSION=v4.3.3 uv run tailwindcss -i styles/input.css -o static/app.css --minify
    uv run uvicorn app.main:app --reload      # http://127.0.0.1:8000
    uv run --offline pytest                   # tests (Pi runs this form; after uv sync)
    uv run --offline pyright                  # types (in a terminal)

Logic lives in `app/logic/` as pure functions; data in `app/db.py` and `migrations/`; pages and fragments in
`app/templates/`; every visible string in `messages/en.json` and `messages/ja.json`.

In Pi Workbench, the Preview runs all of this for you (the server, and the styles as you change the templates).

`tests/test_files.py` checks template assets (including literal `url_for` static paths), manifest icons and the
service-worker cache list without starting the app. Build the styles before running tests. A missing referenced file
fails with its path, so cleanup cannot silently break offline installation.

## Scenarios and tests (test-core)

`SCENARIOS.md` lists what the app does, one Given/When/Then scenario each. Each scenario has one e2e test in
`tests/e2e/` named after its title (`test_add_a_note_and_see_it_in_the_list`), driving Chromium through Playwright
from the one helper `tests/e2e/conftest.py`; with no browser set up they are skipped and say why (nothing is
downloaded). `tests/test_protocol.py` runs test-core's checks from `test-core/` (MIT) with Python alone: every
scenario has its test, every button, link and field in the templates has an e2e step, and no test waits for time. The
base check runs it, and so does the whole suite.

    uv run --offline pytest -v tests/e2e      # the e2e tests (a browser set up; build the styles first)

The notes feature is a sample to replace on the first real request. Keep the skeleton: storage, i18n, test setup,
build commands and folder rules (and, in web apps, the service worker and manifest). Adapt domain-specific storage
to the new app. Remove unused sample logic, tests and UI; rename the app in messages and the manifest, and update
README and the cache list together. The harness asks once about unchanged sample files before committing.
