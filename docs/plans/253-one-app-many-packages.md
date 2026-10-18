# Plan 253: One application, several packages

Direction recorded 2026-10-18. Status: architecture proposal and acceptance plan; no exporter or runtime implemented by this document.

The person: “applications are all built the same way, but exported/packaged in different ways: full stack, front only, mobile, ...”

This develops [plan 198](198-one-stack.md) and the [Project Start direction](../handoff/claude-return-2026-10-17.md). The first goal is a local AI that can build a broad range of working apps. Performance and scalability of those apps follow later.

## One app to build and maintain

The person describes the app and chooses capabilities. The harness assembles tested blocks; the AI implements the novel behavior. The project has one canonical source, one domain model, one set of business rules, HTML templates and HTMX interactions, and one task/test history. A packaging target should not make the model rewrite the application in a different language or create an independently maintained copy.

Python and HTMX are the common foundation. Shared Python business logic should avoid direct dependencies on the filesystem, network transport, platform UI and a particular database connection. Platform effects go through small explicit interfaces. Templates and interaction contracts are shared where their behavior is equivalent. Browser/native bridges, when needed, belong to maintained adapters rather than ad hoc per-app code invented by the model.

This is a direction to prove, not a promise that arbitrary Python packages, every UI or every capability already work unchanged on all targets. The exporter must report unsupported requirements honestly. It must not silently replace Python business rules with a separately maintained JavaScript implementation.

## Capabilities and packaging are separate choices

Capabilities describe what the app does: authentication, dashboards, collaboration, collision detection, offline work and further reusable blocks. Packaging describes where it executes and how it is shared. GitHub Pages is a deployment destination for the browser-only artifact; it is not a separate kind of business logic.

| Target | Proposed execution arrangement | What the app keeps | What an adapter/package supplies |
|---|---|---|---|
| Full stack | Python on a host, HTML/HTMX in the browser | Domain rules, templates, contracts and relevant tests | HTTP transport, server storage, trusted secrets and deployment configuration |
| Frontend only | Python/WASM inside the browser; static assets hosted or distributed | The same supported domain rules, templates, contracts and tests | Browser execution bridge, interaction routing, local persistence and offline assets |
| Mobile | The same app presented as an installable web app or wrapped package, according to the required features | Shared app source and business behavior | Platform packaging, device interfaces and supported storage/transport adapters |
| Further targets | Add an adapter only after a concrete need and proof | The canonical source | Target-specific packaging and conformance checks |

The existing PWA-first direction remains the starting point for mobile; this proposal does not select or download a new mobile framework. A mobile interface and a backend are not mutually exclusive. A mobile package may use a hosted backend; a locally running browser package may optionally connect to a service. Export options must express those dependencies instead of pretending the rows are universally interchangeable.

## A concrete example

Build a notes app once: create a note, validate its title, choose a priority, list and edit it. Domain rules and fragment behavior are defined once. The full-stack package uses a server-side storage adapter; the browser-only package uses an approved browser persistence adapter while running the supported Python logic locally. Mobile reuses that app and supplies the required installation/device integration.

Changing the priority rule should change one source implementation. The same behavior tests must pass on every target that advertises the feature. Packaging must not mark the app complete merely because it produced files: verify a running artifact and its actual behavior.

## Boundaries that must be explicit

A browser Python runtime needs an adapter that executes Python, routes HTMX interactions and returns the expected HTML fragments. Calling it a “server inside the app” describes the desired developer experience; it does not prove conventional server processes or sockets can run unchanged. Runtime selection and package compatibility remain open until demonstrated.

Browser-only assets cannot contain a trusted secret. Authentication, payments and cross-device shared state need an explicit trust/service design. Selecting these blocks may require a backend or other approved service even when the client is statically hosted. Offline behavior must specify what works, where data persists and what happens on reconnect. These are correctness and capability questions, not premature scaling work.

Each block should declare required interfaces, compatible targets and acceptance tests. System 1 checks the selected combination and explains any unsupported requirement before export. The person chooses how to resolve a conflict. System 2 must not silently remove a feature, change the target or invent approval.

## Proof sequence before implementation is standardized

1. Define the shared app structure and minimal storage/interaction interfaces using one small Python/HTMX app. Keep domain logic separate from platform effects.
2. Prove the full-stack artifact: run it, exercise create/edit/reload, and verify its fragment and persistence behavior.
3. Prove the frontend-only artifact from that same source: execute a supported Python rule in the browser, submit one HTMX interaction, render its fragment, persist state, reload, and exercise the declared offline behavior.
4. Run common business-behavior cases against both adapters and end-to-end checks against both packaged artifacts. Change one business rule and demonstrate both packages reflect it without parallel implementations.
5. Prove the PWA/mobile path from the same app. Add a native wrapper/device integration only when the chosen capability needs it and the design/toolchain is approved.
6. Expand the block catalog and target combinations from working evidence. Address generated-app performance and scalability afterward, based on real usage needs.

These are proposed future implementation steps, not completed checkboxes. Downloads still require the person's yes. UI work requires local design specifications. A prototype must use scratch projects, not the person's existing apps. No deployment or new model benchmark is implied by this plan.

## What changes in the earlier plan

Plan 198's historical “Apps with no server at all” section specifies a second JavaScript-business-logic starter. The owner's new direction replaces that as the desired future architecture: frontend-only becomes an export target of the common Python/HTMX foundation. Existing static starters and applications remain as they are until a separately scoped migration is designed and approved.

Plan 198's benchmark-improvement condition is historical. Immediate success here means working capability across representative apps and packages, honest verification and recoverable building workflows. A performance comparison is not the entry gate for proving this architecture.

The false-completion and interaction defects in the [test-project review](../reviews/2026-10-17-test-project-log-review.md) remain unresolved. Publishing this architecture does not fix them or constitute approval of an implementation task.

## Implementation tasks (2026-10-18)

Turned into tasks 275-281 (listed at the end of ROADMAP.md). This section fixes the layout, the adapter interface, the
runtime recommendation and the checks those tasks build. Nothing here is downloaded or implemented yet.

### The shared app source (task 275)

One project, one source tree. Packaging never copies or rewrites it; it adds a maintained adapter around it.

```
app/
  logic/        pure rules: no I/O, no framework, no platform (notes.py: check_title, priority rules)
  data/         typed queries over a sqlite3.Connection given by the Storage adapter (db.py), never a path
  web/          routes: create_app(platform) -> ASGI app; templates/pages, templates/fragments
  platform.py   the four interfaces (below), as typing.Protocol; the app imports only these
migrations/     numbered SQL, the same on every target
messages/       en.json, ja.json
static/         icons, manifest, styles (shared); the service worker comes from the web adapter
tests/
  logic/        pure tests (pytest)
  contract/     behaviour through the Routing interface, run once per adapter
  e2e/          the packaged artifact in a browser, per target (task 281)
packaging.json  the targets the person chose and the capabilities (System 1 reads it; Pi does not write it)
platform/       copied, pinned adapters from kit/adapters/ (server, browser, mobile); never edited per app
dist/<target>/  build output, ignored by git
```

### The platform adapter interface (tasks 276, 277)

| Interface | The app asks | Server adapter (in-process) | Browser adapter |
|---|---|---|---|
| Storage | `connect() -> sqlite3.Connection`, `persisted()` after a commit | a file next to the app (`data.sqlite3`) | Python's `sqlite3` in the runtime, its file on a persistent browser filesystem, flushed after each commit |
| Routing | nothing: the adapter delivers HTTP-shaped requests to the ASGI app | uvicorn on a local port | htmx 4's `htmx:config:request` event sets `ctx.fetch` (vendored htmx.js:510, 576) to a function that posts the request to a Web Worker, which calls the same ASGI app and returns a `Response`; the fragment is swapped as usual |
| Auth | `current_user(request) -> User | None`, `trusted: bool` | signed cookie session; trusted when the server holds the secret | one local device identity, `trusted=False`; a capability that needs trusted auth requires a backend (task 278 refuses it otherwise) |
| Network | `async get_json(url)`, `async post_json(url, body)` | httpx | the runtime's fetch, same-origin or CORS-allowed only |

The app sees only `platform.py`. The adapters are maintained in the kit with their own contract tests, never invented
per app by the model (plan 253: "Browser/native bridges … belong to maintained adapters").

### The browser runtime: candidates (from documentation only, nothing downloaded)

Figures are the projects' documented orders of magnitude, to be measured on this Mac after an approved download.

| Candidate | What it is | First-load size | Licence | Fit with Jinja2 + Starlette/FastAPI + sqlite3 + htmx 4 | Offline | Startup |
|---|---|---|---|---|---|---|
| **Pyodide** | CPython compiled to WebAssembly (Emscripten), with a JS bridge, a package lock and prebuilt C-extension packages | several MB compressed for the core and standard library, plus the app's packages | MPL-2.0 (packages keep their own licences) | Full CPython: Jinja2, Starlette, FastAPI as pure wheels; pydantic-core and sqlite3 are in its package set; the ASGI app is called in-process, no sockets | Yes: self-hosted files, cached by the service worker or bundled in the mobile shell | about one to a few seconds cold on a desktop, longer on a phone; faster from cache; runs in a Web Worker so the page stays responsive |
| MicroPython (WebAssembly port, PyScript's "mpy") | a small Python 3 implementation | a few hundred KB | MIT | Not CPython: no Jinja2, FastAPI, pydantic or sqlite3, so the routes and templates would need a second implementation, which plan 253 forbids | Yes | tens of ms |
| PyScript | a page framework on top of Pyodide or MicroPython | the runtime's size plus its loader | Apache-2.0 | the same as the runtime it wraps; its HTML-tag configuration adds a layer the adapter does not need | Yes | the runtime's |
| Brython | Python transpiled to JavaScript in the page | about 1 MB plus its standard library | BSD-3-Clause | no C extensions (no pydantic-core, no sqlite3); Jinja2 and FastAPI are not supported targets | Yes | fast for small code, slow for heavy code |
| RustPython (WebAssembly) | a Python interpreter in Rust | a few MB | MIT | incomplete standard library and no CPython C extensions; experimental | Yes | moderate |
| CPython's own Emscripten/WASI builds | upstream build targets | a few MB | PSF | no package set or JS bridge; a platform target, not an app runtime | Yes | moderate |

**Recommendation: Pyodide**, pinned and vendored like htmx (kit/vendor/pyodide-<version>/, licences and SHA-256 in
kit/libraries.json, no CDN), only the core and the packages the apps need, never the full distribution. It is the only
candidate that runs the same Python source unchanged. The risks to prove in task 277: the pinned FastAPI/pydantic
versions must match Pyodide's pydantic-core build (otherwise the shared web layer uses Starlette only: a decision
below), cold start on a phone, and memory in a phone's WebView.

**The download the person must approve** (one card, before task 277 starts): the Pyodide core archive for one pinned
release, the Pyodide-built packages the acceptance app needs (sqlite3, pydantic-core, markupsafe and their
dependencies), and pure-Python wheels from PyPI matching the starter's uv.lock (fastapi, starlette, pydantic, jinja2,
python-multipart, anyio and their dependencies). The card names each file, its source, size, licence and checksum;
the expected total is tens of MB on disk, and no file is fetched before the yes.

### The mobile package (task 279)

Plan 198 decided: PWA first, Capacitor as the one native way, installs without a store. The mobile package is the
browser package (Python on the device, offline) inside a Capacitor shell; a "connected" variant points the shell at the
person's full-stack server over the tailnet. Android: the harness builds and signs the APK and serves it by QR
(`plh phone android`); iPhone: the harness makes the Xcode project and opens it, the person signs in with their Apple ID
in Xcode. Offline in the shell comes from the bundled files (a service worker is not relied on inside the native
WebView). Downloads after a yes: the Capacitor npm packages (MIT) through the toolchain's Node, a JDK and Android's
command-line tools (several GB, once), Xcode by the person from Apple.

### What System 1 checks before packaging (task 278)

Code, not the model: imports of app/ against the target's package set (the Pyodide lock for the browser and mobile);
app/logic purity (no I/O, framework or platform imports: an `ast` rule); no secret or environment read in a browser
bundle; capability × target compatibility from kit/capabilities.json (trusted auth, payments, shared state across
devices need a backend); every file the app refers to is in the bundle and the offline cache list (task 230's test);
every hx- URL in templates matches a route; first-load size budget; for mobile, the app id, icons and built webDir. A
problem stops the package and becomes one ChoiceCard per conflict with the recommended resolution first and "Something
else…" last; the model never removes a feature or changes the target.

### Decisions for the person

1. **The browser runtime:** Pyodide (recommended: the same CPython source runs unchanged) · MicroPython (tiny, but the
   web layer would need a second implementation) · Something else…
2. **The Pyodide download** described above (files, sizes, licences and checksums shown on the card).
3. **The shared web layer:** FastAPI as today, if task 277's spike runs it in Pyodide (recommended) · Starlette only
   (fewer dependencies in the browser, small change to the starter's routes) · Something else…
4. **Browser storage:** sqlite3 on a persistent browser filesystem, the same SQL and migrations (recommended) · the
   Origin Private File System (faster, browser support varies) · an IndexedDB key-value store (a second data layer) ·
   Something else…
5. **The mobile default:** bundled and offline, Python on the device (recommended for personal apps) · connected to the
   person's server over the tailnet · Something else…
6. **Android signing key:** kept by the harness per project in the data folder, never in the repository, with a backup
   reminder (recommended) · the person's own keystore · Something else…
7. **iPhone:** a free Apple ID (re-sign every 7 days, 3 devices) · the paid Apple Developer Program · the PWA when it is
   enough (recommended) · Something else…
8. **The Android toolchain download** (a JDK and Android's command-line tools, several GB), asked when the first mobile
   package is requested.
9. **Existing no-server apps (kit/starter-static):** stay as they are (recommended, as plan 253 says) · a migration
   task later · Something else…

### Project Start, built (round 12 step 1, 2026-10-18)

New Project is now Name → Capabilities → Packages → Summary (js/project-start.mjs, kit/capabilities.json,
kit/capabilities.py): the kinds are packages (Web app, App with no server, Phone app as the PWA per decision 7,
Terminal app), chosen separately from capabilities. Create assembles the base from one starter plus each capability's
files and tests, runs the base check offline (Python's unittest or Node's test runner, nothing installed) and creates
nothing if a test fails; packaging.json records the choice (task 275's file, written by the harness). Until the browser
adapter (task 277) gives one source to several packages, one project has one base package (Web app, App with no
server or Terminal app), plus the Phone app on a page package; choosing two base packages says so instead of
pretending. Add a Capability… keeps a capability as one harness commit only if every test still passes. Still open
here: Gate refusing Pi's writes to packaging.json and kit/capabilities.json (tasks 275, 278), the shared layout and
adapters (275-277), the native phone package (279). Terminal Pi has no project-creation command; capability choice is
in the web only.

### The person's answers (2026-10-18): "do recommended"

1. Pyodide. 2. Its download is approved; it happens when task 276/277 starts, pinned and checksum-checked as described,
with the files and sizes listed in the task's commit. 3. FastAPI, if the spike runs it in Pyodide; Starlette only
otherwise (the spike decides; no further question). 4. sqlite3 on a persistent browser filesystem. 5. Bundled and
offline. 6. The harness keeps the Android key per project in the data folder, with a backup reminder. 7. The PWA when it
is enough. 8. The Android toolchain is asked for when the first mobile package is requested. 9. Existing no-server
apps stay as they are.
