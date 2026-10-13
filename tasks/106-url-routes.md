# 106: Views and selections live in the URL

Kind: code

Request 2026-10-13 (UI review of http://127.0.0.1:3000): "changing view doesn't update the url I thought we where embracing htmx". Decision: real paths with history.pushState; htmx stays out (IMPLEMENTATION: no framework, no CDN; `specs/migration-spec.md` was the removed portfolio).

- [x] Red: server serves index.html for `/projects`, `/p/<id>/chat`, `/p/<id>/work/<path>`, `/activity`, `/gate`; unknown API paths still 404.
- [x] Red (browser): switching view, project or file updates the path; Back/Forward restore it; reload opens the same place.
- [x] Old `/?chat=` and `/?document=` links redirect into the new paths.
- [x] Mark `specs/migration-spec.md` stale.
- `js/router.mjs` (red: tests/harness/router.test.mjs), server paths (red: tests/test_web_robustness.py), Back/Forward/reload/old links in tests/browser/design.cjs § 106. specs/migration-spec.md: stale note added.
