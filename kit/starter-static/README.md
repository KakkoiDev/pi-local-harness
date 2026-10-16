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
