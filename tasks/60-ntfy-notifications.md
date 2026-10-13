# 60: ntfy notifications

Kind: code

Request 2026-10-13: notify the user through ntfy, configurable from the CLI and the web UI.

- [ ] Red: `config.json` accepts `ntfy` (server URL and topic); invalid values stop plh with a clear error.
- [ ] Red: Gate posts to ntfy on Blocked, on reaching check, and when Pi exits unexpectedly; nothing is sent without configuration.
- [ ] Pi CLI: `/ntfy <url>` and `/ntfy off`; web UI: settings field with a test button.
- [ ] Green: full suite.
