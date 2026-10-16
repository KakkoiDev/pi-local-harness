# A Pi Workbench project

Built on the stack (plan 198): FastAPI, Jinja, htmx 4, Basecoat, SQLite, typed Python, English and Japanese.

    uv sync                                   # once
    TAILWINDCSS_VERSION=v4.3.3 uv run tailwindcss -i styles/input.css -o static/app.css --minify
    uv run uvicorn app.main:app --reload      # http://127.0.0.1:8000
    uv run pytest && uv run pyright           # tests and types

Logic lives in `app/logic/` as pure functions; data in `app/db.py` and `migrations/`; pages and fragments in
`app/templates/`; every visible string in `messages/en.json` and `messages/ja.json`.

In Pi Workbench, the Preview runs all of this for you (the server, and the styles as you change the templates).

`tests/test_files.py` checks template assets (including literal `url_for` static paths), manifest icons and the
service-worker cache list without starting the app. Build the styles before running tests. A missing referenced file
fails with its path, so cleanup cannot silently break offline installation.

The notes feature is a sample to replace on the first real request. Keep the skeleton: storage, i18n, test setup,
build commands and folder rules (and, in web apps, the service worker and manifest). Adapt domain-specific storage
to the new app. Remove unused sample logic, tests and UI; rename the app in messages and the manifest, and update
README and the cache list together. The harness asks once about unchanged sample files before committing.
