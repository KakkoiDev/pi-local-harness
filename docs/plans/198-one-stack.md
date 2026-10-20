# Plan 198: One stack, done very well (an opinionated harness)

Request 2026-10-15: "Maybe we could take it in another direction if it helps, by making it a specialized harness: using
HTMX 4 with Basecoat for web, Python for backend stuff and maybe one way to make phone apps. We limit what the model has
to figure out. We just make it really good at using one way of the most versatile tech possible. We become opinionated."

Decided 2026-10-15: **FastAPI with Jinja2**, **plain sqlite3** (a data module per table), **PWA only**, the blocks
catalogue starts with **the dozen common ones**. Scope: new projects first.

## 2026-10-20: native exports across mobile and desktop

Owner decision: Capacitor for Android/iOS, the Capawesome Electron platform for Capacitor for Windows/macOS/Linux. Browser/PWA and full-stack exports remain packages of the same Python/HTMX app. See plan253’s latest owner decision and task347 for native local storage, bridge security, distribution and real-platform tests. Earlier PWA-first guidance remains the lightweight installation route, not a limit on the chosen native targets.

## 2026-10-18: one app, several packaging targets

The person clarified that full-stack, frontend-only and mobile should be packages of the same application foundation, rather than separately authored apps. See [plan 253](253-one-app-many-packages.md) for the proposed boundary, proof sequence and open runtime questions. This direction supersedes the historical second-JavaScript-stack approach for future frontend-only work below. Existing apps are not migrated by this documentation change. Capability and reliable building come first; generated-app performance and scalability come later.

## What it is for

Added 2026-10-15: "So the project is to teach AI crafting and have a harness helping to build complex projects that
are: working, maintainable, from 0 to prod, learning along the way proper engineering and lots of tips like setting up
GitHub Pages, managing repos and so on. The trade-off is that it might struggle on existing projects."

- **Working:** verified by the harness (tests that fail without the change and pass with it, types, checks on every
  edit, pages opened at two sizes), not by the model's word.
- **Maintainable:** one stack, one layout, typed code, logic in pure tested blocks, the harness's paperwork (a task and a
  commit per request): anyone, or any model, can pick the project up later.
- **From zero to production:** the blocks below, ending with a project that runs, is backed up and can be shared.
- **Learning along the way:** each request ends with a short "what was done and why" in plain words (the engineering
  idea behind it: why a test first fails, why a migration, why a fragment); the recipes teach the craft around the code
  (repositories, branches, pull requests, releases, GitHub Pages), reusing the Kakkoi School handbook's recipes rather
  than writing new ones; the person can ask "teach me" at any step.
- **The trade-off, accepted:** a project that is not on the stack gets the general harness only, and may struggle.
  New projects are the target.

## The school: lessons at the moment they matter

Added 2026-10-15: "and also an explanation about what is GitHub, how to create an account, and how to use git.
basically the lessons I teach here: https://school.kakkoi.dev" and "look for every lesson that would make sense to
include: https://github.com/KakkoiDev/izumo-io".

KakkoiSchool's lessons (the izumo-io repository) are written for the same people this harness is for (starting from
zero), in English, Japanese and Portuguese. The workbench does not write its own course; it shows the right lesson when
the person meets the idea for the first time, in their language:

- `kit/school/lessons.json`: 40 lessons chosen out of 123, each with **when** the workbench shows it (the harness's
  first commit in a project: T19 Git Basics; the first push or pull request: T20; the first "put it online": A18;
  the first migration: T24 SQLite; an answer marked not verified: R20 Never Trust an AI; a layout request: T08 …) and
  **why**. Lessons that are off the stack (React, Next.js, Nest.js, a Node server) are listed as left out, with the
  reason.
- Shown as one line under Pi's answer ("New to git? Lesson T19, 10 minutes"), never in the way; "teach me" opens it.
  Pi can also read a lesson to explain the idea on the person's own project.
- Local: the lessons are copied into the kit (Markdown, en and ja) once izumo-io's licence is merged, so they work
  offline; until then, links to school.kakkoi.dev.
- **The Workbench course** (decided 2026-10-15: "new Workbench course … in Izumo-io"): a course in izumo-io beside the
  AI course, written for the harness's stack only, from the T, A and R lessons (React, Next.js, Nest.js and the Node
  server lessons stay in the school, not in the course). The school's other lessons stay as they are.
- **Lesson updates at each build:** `kit/school/lessons.json` pins the izumo-io commit; the harness's build (and
  `plh update`) compares it with izumo-io's latest, copies changed lessons (en and ja) into the kit, and says which
  changed; a lesson the map names but izumo-io no longer has is a build error, so the map never points at nothing.
- **Gaps found** (new lessons, written for izumo-io so the school gains them too): making a GitHub account step by step
  (A18 has one line), connecting this computer to GitHub (`gh auth login`), a repository from the workbench (`git init`,
  `gh repo create`, public or private, keeping secrets out), hosting an app that has a server (GitHub Pages is static
  only), and Python versions of the server lessons.

## Opinionated. Local. Capable.

Added 2026-10-15: "I want Pi Local Harness to be: Opinionated. Local. Capable." and "I would like the AI agent to have
access to premade tools and techniques so it doesn't have to figure them out, and reuse those libs and others … the core
libs packaged directly in the harness … all the uv and other utils packaged in it, or at least referenced … and this
project itself refactored according to the stack."

- **Opinionated:** one way for each need (below); the harness knows it completely.
- **Local:** everything Pi needs to build with is on the machine (pinned libraries, their agent cards, the toolchain);
  no CDN, no docs fetched at build time; works offline once installed.
- **Capable:** premade, tested pieces (libraries, logic blocks, generators, recipes) so the model assembles and fills
  in rather than invents.

## Who it is for, and frontier models

Added 2026-10-15: "I want this project to become a tool that people with no experience with AI can use to achieve
great results… I would be OK to extend this tool so that people can use frontier models too… if their machine can't
run local AI, they can still run this whole setup and have great success building projects with AI."

- **The person:** someone with no experience of AI or of the stack. They describe what they want in their words; the
  harness does the rest (paperwork, checks, the kit). Nothing to configure before the first result.
- **Local-first, not local-only:** the harness, Gate, the person's data, the kit and their projects always stay on their
  machine. The model is local when the machine can run one, otherwise a frontier model from a provider Pi supports
  (Pi already speaks to Anthropic, OpenAI, Google and others).
- **First start chooses for them:** `plh` measures the machine (memory, Apple silicon or GPU) and recommends a local
  model that will run well, or a provider when none will; the person confirms. Switching later is the model menu.
- **A cloud model, honestly:** what leaves the machine is said before the first request (the prompt, the context the
  harness chose, tool results); the key is kept in the system keychain, never in a file Pi reads; cost per request is
  shown; Gate and the paperwork work the same.
- **The bench measures both:** the same scenarios with a local and a frontier model, through the harness and bare, so
  the help the harness gives is known for each. Frontier runs use each provider's **lightest model** (decided
  2026-10-15: the person's machine may be slow, and the harness should make a small model succeed): Claude Haiku 5.5
  (`claude-haiku-5-5`), OpenAI's smallest tier "Luna" (GPT-6 or GPT-5.6 Luna: confirm the ID), Gemini 3.5 Flash-Lite
  (`gemini-3.5-flash-lite`), DeepSeek V4.1 Flash (DeepSeek's fast tier; no official "fast" model). Each run has a cost
  cap, and needs the person's key for that provider.

## Types everywhere (a rule)

Added 2026-10-15: "As a rule, I want the agent to type (int, string, bool…) all the code to make sure the compiler can
catch a maximum of errors. Python, TS…"

- **Python:** every function's parameters and return are annotated; data has types (dataclasses or TypedDict, no
  bare dicts crossing modules). A type checker in strict mode runs after every edit, like the syntax check (task
  193), and its errors reach Pi in the same tool result; the starter project and the blocks pass it.
- **JavaScript (the few islands beside htmx, and libraries like p2p-core):** typed with JSDoc and `// @ts-check`, checked
  by TypeScript's compiler from the kit's toolchain, so there is still no build step for the browser.
- **Enforced:** a new or changed Python function without annotations is sent back by Gate (an `ast` check, instant);
  a type error is not a refusal but a note to fix, and the request is not verified while the checker fails (with the
  tests, it is part of Green).
- **Checker (decided 2026-10-15): pyright** in strict mode, installed through uv with Node as a Python package.

## Slow machines

Added 2026-10-15: "instead of node, why not bun? I want it to run on slower hardware too. Slow hardware: fast tooling +
cloud AI." Measured on this machine (see the kit's toolchain.json): pyright 0.56 s on Node, 1.44 s on Bun; TypeScript's
checker 0.04–0.07 s on either. Node comes as a Python package through uv, so nothing else is installed; Bun is not
needed. For a slow machine: a light cloud model (above) and fast native tools (uv, Tailwind's standalone binary, pyright
on changed files only, htmx's checker in Python). The bench gets a "slow machine" profile (light cloud model, CPU
limited) so this stays measured.

## The harness knows itself, and asks for its own fixes

Added 2026-10-15: "I also want the harness to be aware of itself, to be able to explain its philosophy and even open
issues or PRs on the GitHub repo to ask for fixes and new features when the user chats or when a new issue arises from
real use in a case we didn't consider yet."

- **It explains itself** from its own files, not from the model's guess: this plan's philosophy, `/gate rules`, the
  lessons (docs/lessons/), the kit and its cards, the bench's latest numbers (a guide topic and the `harness` tool).
- **It notices what it did not foresee:** the reports (task 184) collect every incident; a new kind (a rule firing where
  it should not, a stop no rule explains, a request the kit could not serve) becomes a draft issue. "I wish it could…"
  in chat becomes a draft feature request.
- **It drafts; the person sends.** What happened, the evidence (rule, report lines, versions, a minimal reproduction),
  what would have helped. Never the person's project code, data or chat: only the harness's own records, shown in full
  before sending. Sending is the person's yes (an outward action), with `gh` and their login, to the harness's repository.
- **A pull request when it can fix it:** in a checkout of the harness (not the installed copy), with a test, through the
  same paperwork, opened only after the person's yes and marked as written by Pi.

## From zero to production: the composable blocks

Added 2026-10-15: "I want the harness to have the composable building blocks that the AI can use to create new projects
from zero to production." Each block is a generator (files in the conventions, with tests), a card and a recipe:

| Stage | Blocks |
| --- | --- |
| Start | the starter project; kinds: web app, game (LittleJS), multiplayer (p2p-core), command-line tool |
| Build | page, fragment, form with validation, list with create/edit/delete, table (migration and data module), file upload, search, background job, scheduled task, live updates (server-sent events), multiplayer (p2p-core), the logic blocks |
| AI inside the app | one typed function to ask the same local or cloud model the person uses, streamed to the page |
| Accounts | sign-in (passkeys or an email link), sessions, roles; CSRF protection for htmx forms |
| Make it solid | types and checks, tests, an accessibility check on each page, error pages, logs |
| Ship | run on the person's machine (tailnet); share publicly (Tailscale Funnel); host it (one recipe, decision below); static pages on GitHub Pages; HTTPS, a domain, SQLite backups, migrations on deploy, secrets out of the code |
| Keep it alive | kit updates in existing projects (a migration per kit version), restoring a backup, a health page |

## Also needed for a key-in-hand product (the checklist)

- **Windows and Linux:** the harness assumes macOS today (launchctl, the Finder's Trash, MLX models); people new to AI
  are often on Windows. The tools all run there; the harness's macOS paths need a second implementation.
- **Preview and undo for people who do not read code:** the app running beside the chat (and on the phone by QR), each
  request explained in plain words, "undo this request" in one click (each request is already a commit).
- **Languages (decided 2026-10-15: a Japanese UI):** a stack convention from the start: every visible string goes through
  one function, `t("key")`, with `messages/en.json` and `messages/ja.json`; the language comes from the person's choice
  (a cookie) or the browser; a check after every edit finds a string that skipped `t()` or a key missing in a language.
  The starter project, the generated apps and, once on the stack, the workbench itself.
- **A gallery of finished example apps** built with the kit: examples are what small models learn best from.
- **Security of what it builds:** autoescaping, CSRF, validation, secrets in the keychain, dependencies limited to the kit.
- **Cost and privacy with cloud models:** a monthly cap, the cost per request, nothing sent that the person did not see.
- **No telemetry:** reports stay on the machine; sharing bench results or issues is always the person's choice.
- **Onboarding:** the first start checks the machine, installs the toolchain, chooses the model, and builds a first app
  with the person in minutes.

## Why

What we have measured so far points the same way:

- A local model does well when the task is narrow and the path is known (the bench's small scenarios: solved in 1–7
  minutes) and badly when it must find its way (the large-repository scenarios: an hour, at the limit).
- Its mistakes are mostly choices it should not have had to make: which tool, which command, which edit format, which
  file, which cause (docs/lessons/).
- Its knowledge is old. HTMX 4 shipped on 2026-08-28, after these models were trained: asked for htmx, they write
  htmx 2 (implicit attribute inheritance, `hx-inherit`), which htmx 4 changed. A general harness cannot fix that; a
  harness that owns one stack can carry the stack's current rules itself.

So: one stack, and the harness knows it completely. Every decision the stack makes is one the model does not have to.
Other stacks keep working as today, without the extra help.

## The stack (one way each)

| Need | The one way | Why this one |
| --- | --- | --- |
| Pages and interaction | **HTMX 4**, pinned and vendored (one file, no CDN) | Server-rendered HTML with small swaps: easy to reason about, fast, no single-page app, little JavaScript to get wrong |
| Look | **Basecoat** (shadcn-style components as CSS classes, a tiny vanilla script), its **Jinja macros** | Good-looking by default; components are class names the harness can list and check; ships Jinja templates |
| CSS build | **Tailwind** through its standalone binary, installed by `pytailwindcss` | Basecoat needs Tailwind; the standalone binary keeps the toolchain Python-only (no Node) |
| Backend | **Python 3.12+**, one web framework (decision below), **Jinja2** templates | Runs everywhere, the language of AI projects, the language the harness itself is written in |
| Data | **SQLite**, migrations as numbered SQL files | One file, no server, enough for personal and small-team apps |
| Packages and running | **uv** (`uv run`, `uv add`) | One command for environments, packages and scripts |
| Tests | **pytest** for routes and logic; the harness's **browser tool** for pages, at phone and desktop size | Fast, and the browser checks are already ours |
| Phone | **PWA**: the same app, installable (manifest, service worker, offline page) | No second codebase or language; works on iOS and Android; a native shell (Capacitor) only if a store is ever needed |
| Running it | One process on the person's machine, reachable on the tailnet (as the workbench is) | Nothing to host |

Not in the stack: React, Vue and other single-page frameworks, Node build chains, other CSS frameworks, ORMs beyond
the decision below, other databases. Adding one is the person's decision (a Gate rule asks), never the model's.

## Conventions (what "the one way" means in a project)

- **Layout:** `app/main.py` (routes), `app/db.py`, `app/templates/{pages,fragments,components}/`, `static/` (htmx,
  Basecoat's script, the built CSS, the PWA files), `migrations/NNN-*.sql`, `tests/`.
- **A route returns either a page or a fragment**, never both. A fragment is what an htmx request swaps; its template
  lives in `fragments/`. A page includes its fragments.
- **htmx 4 rules:** inheritance only with `:inherited`; `hx-status` for error targets; no `hx-inherit` or
  `hx-disinherit`; forms post and swap their own fragment; validation errors come back as the form fragment with a 422.
- **Components** are Basecoat classes and macros only; no hand-written CSS except in one `app.css` for the project's
  own few rules.
- **Every page** works at 390 px wide and 1440 px wide, and is checked at both.

## The kit: premade libraries, cards, recipes and tools, packaged in the harness

`kit/` in this repository, versioned with the harness:

- **Libraries, vendored and pinned** (plain files, no build step, committed, as p2p-core recommends): htmx 4, Basecoat
  (CSS and its script), **p2p-core** (browser multiplayer and device-to-device data: same browser, same Wi-Fi with no
  internet, anywhere, pairing codes; it covers what htmx does not: real-time and peer-to-peer), LittleJS for browser
  games (as the Kakkoi School handbook routes games to it). Each with its version, licence and source in
  `kit/libraries.json`; `plh kit update` pins a new version deliberately.
- **An agent card per library**, in the form p2p-core's AGENTS.md already uses: "the five lines that are almost always
  right", then the rules. Where the upstream project keeps its own (p2p-core's AGENTS.md, LittleJS-AI), the kit keeps a
  pinned copy of theirs instead of writing a second one (the handbook's rule: do not duplicate upstream guidance), so
  it works offline and does not drift.
- **Recipes and skills**, in the handbook's form: a router from intent to a recipe ("add a page", "add multiplayer",
  "publish", "serve on my phone"), each recipe a short procedure the harness can also run as a generator; skills as
  slash commands (`/serve`, `/publish`). The handbook's GitHub recipes are referenced, not copied.
- **The toolchain, pinned:** `kit/toolchain.json` names exact versions and checksums of uv, the Python uv installs,
  Tailwind's standalone binary and Chromium for the browser tool. `plh setup` installs them into the harness's own
  folder (`~/.local/share/pi-local-harness/tools/`), never system-wide; `/doctor` checks them. Pi's commands are fixed
  (`uv run pytest`, `uv run plh-css`, `uv add` only for the stack's list): it never chooses a package manager or a
  version.
- **How Pi reaches it:** the `stack` tool (look up a card, a block, a recipe; run a generator), the keyword guides
  (task 196) pointing to the right card, and the checks that hold the code to the kit.

## Logic as known, tested building blocks (functional core)

Added 2026-10-15: "we can ask it to use well known Exercism/LeetCode/functional programming to make it better at using
premade functional blocks of logic."

Asking the model to "practise" does not change it (its weights stay as they are); what changes its results is what the
harness gives it and checks. So:

- **Functional core, imperative shell.** Logic lives in `app/logic/` as pure functions (data in, data out: no database,
  files, network, clock or randomness); routes and `app/db.py` are the thin shell that reads, calls the logic and
  renders. Pure functions are what a small model writes best, and what tests check completely.
- **A catalogue of blocks**, shipped with the stack and tested: the well-known small algorithms apps keep needing
  (paginate, slugify, group by, sort by several keys, deduplicate, date ranges and calendars, moving windows and
  running totals, money and number formatting, input validation and parsing, search and filter, diff two lists, tree
  from a flat list). Each block has a signature, examples and tests; Pi looks them up with the `stack` tool and
  composes them instead of writing logic from scratch; the generators use them.
- **Checks:** a module in `app/logic/` that imports I/O (sqlite3, open, requests, datetime.now, random) is sent back
  ("logic stays pure; do that in the route"); every new logic function needs a test (the harness proves Red, task
  192).
- **Katas as a bench track:** Exercism exercises (open source: the licence is checked before any is copied into this
  public repository) measure exactly this skill: a small, well-specified pure function with tests. LeetCode's problems
  are proprietary and stay out; its classic algorithms can inspire blocks, written fresh.
- **Later, if the model itself should get better at it:** a fine-tune (LoRA) on the person's verified runs and the
  katas. Out of scope here; the bench would measure it like any other change.

## What the harness does with it

1. **A project template.** New Project… gains a kind, "Web app (HTMX + Python)": a running app with one page, one
   fragment, one form, a migration, its tests and its PWA files, all passing. Pi never starts from nothing.
2. **Generators for the common changes**, run by the harness, not written by the model: add a page, add a fragment
   endpoint, add a table (migration and data functions), add a form with validation, add a list with
   create/edit/delete. Each generator writes the files in the conventions and their tests; Pi fills in the content
   (fields, words, logic). This is the "fixed steps" idea from the earlier list, made concrete for one stack.
3. **The stack's knowledge, carried by the harness:** an HTMX 4 reference (what changed from 2; the attributes), the
   Basecoat component catalogue (class names, macro names, an example each) and the conventions above. They reach
   Pi as keyword guides (task 196) and through a `stack` tool to look things up, so the model never relies on its
   memory of htmx 2.
4. **Checks, deterministic, after every edit** (like the syntax check, task 193):
   - htmx: unknown or removed attributes (`hx-inherit`), a target that matches nothing in the template, an
     `hx-get`/`hx-post` whose route does not exist in `app/main.py` (the harness reads the route table).
   - Basecoat: class names that are not Basecoat's (a typo gives an unstyled page silently).
   - Python: it parses; a route renders a template that exists.
   - Pages: each changed page opened at 390 and 1440 px by the browser tool: no console errors, nothing wider than the
     window, no element scrolled that should not be.
5. **Gate rules for the stack** (only in projects made from the template): a new dependency outside the stack's list,
   a `package.json`, a single-page framework or a second CSS framework is sent back ("the stack does not use it; ask
   the person"). Raw SQL outside `app/db.py` and `migrations/` is sent back.
6. **The harness moves onto its own stack** (see "This project on the stack" below), so its authors use what Pi uses.

## This project on the stack

Today the harness is standard-library Python (no dependencies, by design) and a hand-written ES-module front end.
With uv packaged in the kit, dependencies are no longer a cost to the person, so the harness can use the stack:

- **Backend:** FastAPI with Jinja2 replaces the standard-library HTTP handler in `harness/web_chat.py`; the queue, Gate,
  the paperwork and the console stay as they are (they are already plain Python). `pyproject.toml` and `uv.lock`; `plh`
  starts through `uv run`.
- **Front end:** htmx 4 and Basecoat replace the single-page modules in `js/`, view by view (plans 151 and 152), with
  server-sent events for live progress. The browser suites stay the safety net: each view moves only when its suite
  passes on the new one.
- **The look:** the Pi Workbench 1-bit design becomes a Basecoat theme (a style pack: tokens, square corners, inversion for
  selection). That is a design change: it goes to the designer first, as a brief (the person's rule: design changes go
  through the designer).
- **Order:** after the kit and the starter project exist and the bench shows the stack pack helps, so the refactor
  follows a stack that is proven, and each step is measured (the bench runs on the harness's own history scenarios).

## Phones

| Option | What it is | Fits the stack? |
| --- | --- | --- |
| **PWA** (the default) | The same app, installed from the browser: icon, full screen, offline pages, notifications | Fully: same code |
| **Capacitor** | A native iOS/Android shell around the same web app: app stores, native APIs (camera, files, notifications, biometrics) | Yes: the htmx app stays; the shell talks to the person's machine over the tailnet. Needs Xcode / Android Studio to build |
| **Tauri 2 (mobile)** | Like Capacitor, with a small Rust core | Same idea, a younger mobile story, Rust toolchain |
| **Hyperview** | Server-driven native screens (its own XML, HXML) with a React Native client: hypermedia, natively | The same philosophy, but a second markup language and React Native |
| **Flet** | Flutter interfaces written in Python; builds iOS, Android, desktop and web | Python everywhere, logic on the phone (offline), but a second UI way beside htmx |
| **BeeWare / Kivy** | Native widgets (BeeWare) or custom ones (Kivy, games) in Python | Python, but a second UI way; smaller ecosystems |
| Swift/Kotlin, React Native, Flutter (Dart) | Native or cross-platform frameworks | Out: another language and ecosystem |

Recommended ladder, still one way at a time: **PWA** for everything; **Capacitor** only when an app needs a store or a
native API, around the same htmx app. Phone apps that must work fully offline with logic on the device are the one case
the stack does not cover well (Flet would be the exception path, decided per project).

**Decided 2026-10-15:** "so we don't do the cordova or whatever it was for the phone native capabilities? Also will need to
explain how to compile and install apps on devices without using a store. and will need to make pi harness do as much
of the work as possible." Capacitor (Cordova's successor) is the stack's native way, the second rung after the PWA.

Installing without a store (checked 2026-10-15; these rules move, the lessons carry the date):

- **Android:** the harness builds the APK itself (`plh phone android`: a JDK and Android's command-line tools in the
  harness's own toolchain folder, several GB, downloaded once after a yes), signs it with a key it keeps for the
  project, and serves it over the tailnet with a QR code; the phone opens the link and allows "install unknown apps"
  once. Google's developer verification also covers sideloaded APKs: it starts on 2026-09-30 in Brazil, Indonesia,
  Singapore and Thailand and widens from 2027; an "install without verification" path stays, with more steps. The
  lesson and the harness follow it.
- **iPhone:** a Mac with Xcode; the harness makes the Xcode project and opens it; a free Apple ID signs the app for 7
  days on up to 3 devices (Developer Mode on, iOS 16 and later), then it must be signed again (the harness re-runs it on
  request); the paid Apple Developer Program (a year) removes the weekly signing and allows TestFlight. In the EU,
  alternative app marketplaces are another route. The PWA stays the answer for most iPhone apps.
- **Releases on GitHub** (decided 2026-10-15): each Android build can also be published as a GitHub release of the
  project (`gh release create`, the APK attached), after the person's yes: a fixed link to send to friends, and the
  history of versions. A release of a public repository is public: anyone can download it; the harness says so before
  the first one. (A private repository's releases need a GitHub login, which a phone's browser rarely has: public, or
  the QR over the tailnet.)
- **Apple's policy, explained to the person** (decided 2026-10-15): the first time someone asks for an iPhone app, the
  harness says plainly what Apple allows before building anything: an app outside the App Store must be signed by an
  Apple developer identity; with a free Apple ID that signature lasts 7 days and covers up to 3 devices, so the app stops
  opening each week until it is signed again from the Mac; the yearly paid Apple Developer Program gives a year-long
  signature, more devices, and TestFlight for testers; everything else goes through Apple's App Store review. It
  recommends the PWA when the app needs nothing a PWA cannot do. The lesson (W15) says the same, with the date checked.
- What the harness does: checks what is installed and what is missing, downloads only after a yes, builds, signs,
  serves the APK by QR, opens Xcode on the right screen, and says each step in plain words. What the person does: the
  taps on the phone and, for iPhone, the Apple ID sign-in in Xcode (never typed by Pi).

## Apps with no server at all

Added 2026-10-15: "is it possible to offer the option and to inform the user that he can ask to try to put all the logic
on the frontend to make the app run without server at all if possible?"

Yes, as the second kind of project, chosen by one question rather than by taste. When a new project starts, and whenever
the person asks, the harness asks or answers: **does more than one person need the same data when they are not online
together, or does the app need a secret (a paid API key, a password check, payments)?**

- **No:** the app can run with no server. Everything runs in the browser; data stays on the device (IndexedDB); it
  works offline, installs as a PWA, and is hosted free on GitHub Pages with nothing to keep running. People can still
  share live, with no server of ours, through p2p-core (already in the kit: other tabs, the same Wi-Fi, anyone online
  through public relays, or pairing codes with no internet). Fits: personal tools, trackers, flashcards, calculators,
  games (LittleJS), classroom activities.
- **Yes:** the server stack (FastAPI, SQLite, Funnel or Fly.io).

The harness offers it, never forces it: "This app could run with no server: free on GitHub Pages, works offline, nothing
to keep on. Want that?" It also says what is lost: data lives on one device unless shared live (a backup is an export
file), no secrets in the page (anyone can read the page's code), no data shared with people who are offline. An existing
server project can be asked to move to no server; Pi checks the question above first and explains why not when it
cannot.

The no-server stack, one way again: plain ES modules with no build step; types through JSDoc checked by TypeScript in
strict mode (the types rule holds: `tsc --checkJs`, through the Node pyright already brings); Basecoat and Tailwind for
looks; a small storage block over IndexedDB; the logic as pure functions with tests (`node --test`); a service worker
for offline. A second starter, `kit/starter-static`, beside the server one.

## How we know it helps (the bench)

A "stack" track in the bench: scenarios built on the template, in the person's everyday words:

- "Add a page that lists my notes, newest first" (generator path).
- "The delete button removes the whole list instead of one note" (an htmx target bug).
- "Saving the form with an empty title shows nothing" (validation as a fragment with 422).
- "On my phone the table is cut off on the right" (layout at 390 px, the browser tool).
- "Make it work offline enough to read my notes" (PWA).

Run in three conditions: bare (no harness), the general harness, the harness with the stack pack. The stack pack must
beat the general harness on these scenarios, without losing on the others, or it is not worth its weight.

## What we give up

- Generality: projects on other stacks get the general harness only.
- HTMX 4 is weeks old: its ecosystem (examples, answers) is thin, which is the point of carrying its rules in the
  harness, and also a risk if 4.x keeps changing. Pin the version; update the reference with it.
- A Tailwind build step (one binary, but a step).
- The opinions themselves: some apps (heavy client-side editors, games, real-time collaboration) fit htmx badly. The
  stack is for the large class of apps that are forms, lists, pages and dashboards.

## Phases

0. The kit's skeleton: `kit/libraries.json` and `kit/toolchain.json` (pinned, licences checked), the vendored htmx 4,
   Basecoat and p2p-core with their cards, `plh setup` for the toolchain.
1. The template, with its tests and PWA files; the bench's stack track and its baseline (general harness and bare).
2. The knowledge pack (HTMX 4 reference, Basecoat catalogue, conventions) and the first blocks, as guides and the
   `stack` tool; the Exercism kata track. Measure.
3. The checks after every edit (htmx, Basecoat, routes, pages at two sizes). Measure.
4. The generators. Measure.
5. The stack's Gate rules.
6. This project on the stack: FastAPI backend, then the views one by one on htmx 4 and Basecoat (after the designer's
   Basecoat theme), measured on the bench's history scenarios.

## Decisions for the person

1. **The Python web framework:**
   - **FastAPI with Jinja2** (recommended): the most used in AI projects, small, async, typed routes the harness can
     read; htmx and Jinja work with it directly.
   - **Django** with django-htmx: the most "one way" (ORM, migrations, auth, admin, forms included) and the most training
     data, but large, and its own template language (Basecoat's macros are Jinja).
   - **Starlette** alone: what FastAPI is built on; fewer conventions, more for the model to decide.
2. **Data access:** plain `sqlite3` with a small data module per table (recommended: nothing to learn, the generator
   writes it), or SQLModel (typed models, one more library and its versions).
3. **Phone:** decided 2026-10-15: PWA first, Capacitor as the one native way, with installs that need no store
   (see Phones).
4. **Scope:** the stack pack for new projects only (recommended to start), or also a migration helper for existing ones.
5. **The Python type checker:** decided, pyright.
7. **Hosting for production:** decided 2026-10-15: **Tailscale Funnel** is the free default (the app stays on the
   person's machine with its SQLite file and gets a public HTTPS address; the machine must stay on); **Fly.io** is the
   "more solid" step for someone who wants it always on (paid: a few dollars a month, a volume for SQLite). Checked and
   left out: Bonto (Node.js and static only), Render's free tier (sleeps, wipes its disk on deploy: SQLite is lost).
   An app with no server (below) goes to GitHub Pages, free.
8. **Issues and pull requests:** decided 2026-10-15, always ask before sending.
9. **Windows and Linux:** decided 2026-10-15, after the starter project and the bench's stack track.
10. **KakkoiSchool's lessons in the kit:** decided 2026-10-15: CC BY 4.0 for the lessons, MIT for the code, and the
    gaps written as T41-T46 (izumo-io PR #31). The kit copies them once merged.
6. **The blocks catalogue:** start with the dozen above (recommended), or grow it only from what the person's projects
   turn out to need.
