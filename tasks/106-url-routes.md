# 106: Views and selections live in the URL

Kind: code

Request 2026-10-13 (UI review of http://127.0.0.1:3000): "changing view doesn't update the url I thought we where embracing htmx". Decision: real paths with history.pushState; htmx stays out (IMPLEMENTATION: no framework, no CDN; `specs/migration-spec.md` was the removed portfolio).

- [ ] Red: server serves index.html for `/projects`, `/p/<id>/chat`, `/p/<id>/work/<path>`, `/activity`, `/gate`; unknown API paths still 404.
- [ ] Red (browser): switching view, project or file updates the path; Back/Forward restore it; reload opens the same place.
- [ ] Old `/?chat=` and `/?document=` links redirect into the new paths.
- [ ] Mark `specs/migration-spec.md` stale.
