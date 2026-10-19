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

The notes feature is a sample to replace on the first real request. Keep the skeleton: storage, i18n, test setup,
build commands and folder rules (and, in web apps, the service worker and manifest). Adapt domain-specific storage
to the new app. Remove unused sample logic, tests and UI; rename the app in messages and the manifest, and update
README and the cache list together. The harness asks once about unchanged sample files before committing.
