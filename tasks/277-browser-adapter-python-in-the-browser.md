# 277: The browser adapter: the same Python app, running in the browser

Kind: code

Plan 253, sections "The browser runtime" and "The platform adapter interface". Recommended runtime: Pyodide (decision 1);
blocked until the person approves the download (decision 2).

Files: kit/vendor/pyodide-<version>/ (core and the needed packages only), kit/libraries.json (pins, licences, SHA-256),
kit/THIRD_PARTY_NOTICES.md, kit/adapters/browser/ (boot.mjs, worker.mjs, bridge.mjs, browser_platform.py, sw.js),
kit/package.py (target "web"), tests/test_package.py, tests/harness/browser-adapter.test.mjs.

- [ ] Ask the person: the runtime choice (decision 1), the shared web layer (decision 3), browser storage (decision 4)
  and the download card (each file, source, size, licence, checksum). Nothing is fetched before the yes.
- [ ] Vendor the approved files with checksums verified offline after the download; record measured sizes and the cold
  and warm start times on this Mac in this file.
- [ ] Red: the contract suite (task 276) fails against the browser adapter, run with Pyodide under the toolchain's Node
  and an in-memory filesystem; a bridge test fails because htmx 4 requests are not routed to the worker.
- [ ] browser_platform.py: Storage = sqlite3 on a persistent browser filesystem mounted at /data, flushed after each
  commit; Auth = one local device identity, `trusted=False`; Network = the runtime's fetch.
- [ ] bridge.mjs: on `htmx:config:request`, same-origin app routes get `ctx.fetch` posting the request to worker.mjs,
  which calls the app's ASGI callable and returns status, headers and body as a `Response`; non-app URLs keep the
  network.
- [ ] sw.js: caches the runtime, the packages, the app's Python files, templates and static files for offline.
- [ ] `build(project, "web")` writes dist/web/: static files only, no server, no secret.
- [ ] Green: the contract suite passes on the browser adapter; a FastAPI (or Starlette, per decision 3) route renders a
  fragment in the worker; the full workflow passes.

Acceptance: the shared source runs unchanged in the browser through the adapter; the package is static files that work
offline; sizes and start times are measured, not assumed.

## Scenarios

### US-new the browser runtime download card lists each file, its source, size, licence and checksum, and nothing is fetched before my yes
Given the browser runtime is not vendored yet
When the browser package is first needed
Then a card lists each file with its source, size, licence and checksum, and no download starts until I choose to download

### US-new the web package opens from static files and keeps working offline
Given a project packaged for the web as dist/web
When I open it, go offline and reload
Then the app starts, reads and writes notes, and the notes are still there after another reload
