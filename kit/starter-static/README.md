# A Pi Workbench project with no server

Everything runs in the browser: the data stays on this device (IndexedDB; a backup is a file), it works offline, it
installs on a phone, and GitHub Pages hosts it for free. Plain JavaScript modules with no build step; the types are
JSDoc comments that TypeScript checks strictly. Only uv is needed:

    uvx --from nodejs-wheel-binaries==24.19.0 npx --yes -p typescript@7.0.2 tsc -p .     # types (js/; tests are checked by running)
    TAILWINDCSS_VERSION=v4.3.3 uvx --from pytailwindcss tailwindcss -i styles/input.css -o static/app.css --minify
    uvx --from nodejs-wheel-binaries==24.19.0 node --test                               # tests
    python3 -m http.server                                                               # http://127.0.0.1:8000

Rules live in `js/logic/` as pure functions with tests; the data in `js/store.mjs`; the page in `index.html` and
`js/app.mjs`; every visible string in `messages/en.json` and `messages/ja.json`. In Pi Workbench, the Preview runs it.

`tests/files.test.mjs` checks every local page asset, manifest icon, service-worker cache entry and module import.
Build the styles before running tests. Removing a referenced file fails with its path, so cleanup cannot silently break offline installation.

## Scenarios and tests (test-core)

`SCENARIOS.md` lists what the app does, one Given/When/Then scenario each. Each scenario has one e2e test in
`tests/e2e/` whose name is its title, driving Chromium through Playwright from the one helper `tests/e2e/browser.mjs`;
with no browser set up they are skipped and say why (nothing is downloaded). `tests/protocol.test.mjs` runs
test-core's checks from `test-core/` (MIT, Python's standard library): every scenario has its test, every
button, link and field on the page has an e2e step, and no test waits for time. The base check runs it, and so does
`node --test`. The page sets `<body data-ready="true">` when it can take a click; the e2e tests wait for it.

    uvx --from nodejs-wheel-binaries==24.19.0 node --test 'tests/e2e/*.e2e.test.mjs'   # the e2e tests (a browser set up; build the styles first)

The notes feature is a sample to replace on the first real request. Keep the skeleton: storage, i18n, test setup,
build commands and folder rules (and, in web apps, the service worker and manifest). Adapt domain-specific storage
to the new app. Remove unused sample logic, tests and UI; rename the app in messages and the manifest, and update
README and the cache list together. The harness asks once about unchanged sample files before committing.
