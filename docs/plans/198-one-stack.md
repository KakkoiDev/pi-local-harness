# Plan 198: One stack, done very well (an opinionated harness)

Request 2026-10-15: "Maybe we could take it in another direction if it helps, by making it a specialized harness: using
HTMX 4 with Basecoat for web, Python for backend stuff and maybe one way to make phone apps. We limit what the model has
to figure out. We just make it really good at using one way of the most versatile tech possible. We become opinionated."

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
6. **The workbench eats its own cooking:** plans 151 (component library) and 152 (htmx 4 with server-sent events)
   move the workbench's own front end to the same stack, so the harness's authors use what Pi uses.

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

1. The decisions below; the template, with its tests and PWA files; the bench's stack track and its baseline (general
   harness and bare).
2. The knowledge pack (HTMX 4 reference, Basecoat catalogue, conventions) and the first blocks, as guides and the
   `stack` tool; the Exercism kata track. Measure.
3. The checks after every edit (htmx, Basecoat, routes, pages at two sizes). Measure.
4. The generators. Measure.
5. The stack's Gate rules. The workbench's own front end on the stack (plans 151, 152).

## Decisions for the person

1. **The Python web framework:**
   - **FastAPI with Jinja2** (recommended): the most used in AI projects, small, async, typed routes the harness can
     read; htmx and Jinja work with it directly.
   - **Django** with django-htmx: the most "one way" (ORM, migrations, auth, admin, forms included) and the most training
     data, but large, and its own template language (Basecoat's macros are Jinja).
   - **Starlette** alone: what FastAPI is built on; fewer conventions, more for the model to decide.
2. **Data access:** plain `sqlite3` with a small data module per table (recommended: nothing to learn, the generator
   writes it), or SQLModel (typed models, one more library and its versions).
3. **Phone:** PWA only (recommended), or PWA plus a Capacitor shell for the stores later. (Hyperview, server-driven
   native screens, was considered: it brings React Native and its own XML, a second way, against the point.)
4. **Scope:** the stack pack for new projects only (recommended to start), or also a migration helper for existing ones.
5. **The blocks catalogue:** start with the dozen above (recommended), or grow it only from what the person's projects
   turn out to need.
