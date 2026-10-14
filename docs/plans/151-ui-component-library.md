# Plan 151: a reusable UI component library

Status: **planned, not started** (2026-10-14). Task: [tasks/151-ui-component-library.md](../../tasks/151-ui-component-library.md).
Read [docs/contributing-for-agents.md](../contributing-for-agents.md) first. Plan 152 (htmx 4 and SSE) builds on this one.

## 1. Why

The person asked for a project that is "robust, well documented and easy to improve by dumber AIs". Today it is not:

- **Markup is written three times.** The same piece of UI exists as a designer card (`design/system/components/<Name>/README.md`), as static HTML in `index.html`, and as DOM built by hand in `js/workspace.mjs` and `js/chat.mjs` (61 `node('…','pw-…')` calls, often several statements per line). The three drift: the 2026-10-14 audit found 28 places where built markup differs from the cards (wrong class names such as `.pw-thread__line` instead of `.pw-thread__state`, missing buttons, wrong copy).
- **Behaviour is tangled with rendering.** Keyboard handling (menus, roving focus, segmented controls), state and DOM building live in the same long functions, so a small change risks a regression elsewhere.
- **Nothing shows all states at once.** To check a component you must drive the whole app into that state.

## 2. Goal

One place per component that produces its markup, matching its designer card exactly, with every state visible on one page and tested. A weaker model can then add or change UI by calling a component, not by writing markup.

Success looks like:

1. Every designer card that the app uses has one render function, `harness/ui/components/<name>.py`, with a docstring that links the card and lists its states.
2. `/ui` (dev only) renders every component in every state, side by side with the card's copy, at desk and phone width.
3. Interactive behaviour (menus, popups, roving focus, segmented controls, sheets) lives in small `js/behaviors/*.mjs` modules attached by `data-behavior="…"` attributes, independent of who rendered the markup.
4. The page shell (`index.html`'s windows, menus, dialogs, toolbars) is rendered by the server from components; `index.html` becomes a generated page. The browser suites still pass unchanged (they are the contract: ids and classes stay).
5. Live, changing parts (lists, threads, messages) are rendered by the same components once plan 152 serves them as htmx fragments; until then their JS builders stay, but each is marked `// replaced by harness/ui/components/<name>.py in plan 152`.

## 3. Decisions (please confirm the ones marked **ask**)

| # | Decision | Recommendation | Why |
|---|---|---|---|
| D1 | Where components render | **Server-side Python** functions returning safe HTML strings. | Plan 152 serves HTML fragments with htmx; the server must render them. One renderer for the first paint and for every update. |
| D2 | Template technology (**ask**) | **Standard-library Python only**: a tiny `h()` builder that escapes by default (`html.escape`), plus one function per component. No Jinja2. | The server has no dependencies today (`plh` installs by copying files; there is no `pyproject.toml`). Plain functions are easy for a weaker model to read, test and grep. Jinja2 would add a dependency and a second language. |
| D3 | Escaping | Everything is text unless wrapped in `Safe(...)`, which only `h()` and components produce. | Pi's replies, file names and comments are untrusted. One rule, enforced by tests. |
| D4 | Behaviour | `js/behaviors/<name>.mjs`, each exporting `attach(root)`; one `js/behaviors/index.mjs` attaches everything under a root on load and after every htmx swap. | Markup and behaviour can then change independently; htmx-rendered and JS-rendered markup behave the same. |
| D5 | CSS | `design/components.css` stays the only component stylesheet (synced from the design system). `chat.css` keeps page layout only; component overrides there are deleted as each component lands. | The audit found duplicated and conflicting rules in `chat.css`. |
| D6 | Islands that stay hand-written JS | The block editor (`contenteditable` blocks, selection, Return/Backspace), recording/dictation, drafts in `localStorage`. | They are deeply interactive and client-state heavy; components render their *frame*, JS keeps the editing. |

## 4. Target layout

```
harness/ui/
  __init__.py        # re-exports h, Safe, render helpers
  html.py            # h(tag, attrs, *children) with escaping; Safe; attr helpers (aria, data)
  icons.py           # icon(name) — same drawings as design/icons.mjs (one source: generated from it, or the reverse)
  components/
    button.py        # one module per designer card, named like the card in snake_case
    list_row.py
    list_group.py
    ...
  catalogue.py       # every component × every state, for /ui and for snapshot tests
  page.py            # the page shell (today's index.html), assembled from components
js/behaviors/
  index.mjs          # attach(root): finds [data-behavior] and wires each once (idempotent)
  menu.mjs  popup.mjs  roving.mjs  segmented.mjs  sheet.mjs  dialog.mjs
tests/
  test_ui_html.py            # escaping, attribute rules
  test_ui_components.py      # snapshot per component state (tests/snapshots/ui/<component>/<state>.html)
  harness/behaviors.test.mjs # behaviour modules against a small DOM
```

Snapshots are plain `.html` files so a reviewer can open them. A test fails when markup changes; updating a snapshot is a deliberate step (`python3 tests/test_ui_components.py --update`), never automatic.

## 5. Component inventory and order

Order: small, widely used pieces first; each later one is built from earlier ones. "Today" names where the markup is built now.

| Step | Card(s) | Today | Notes |
|---|---|---|---|
| 1 | — | — | `harness/ui/html.py` + `test_ui_html.py`; `/ui` route (dev only) with an empty catalogue. |
| 2 | Button, TextField, Checkbox, SearchField | index.html, many `node('button','pw-btn')` | Default ring, disabled, pressed, touch. |
| 3 | StatusGlyph (+ icons) | `design/icons.mjs` `stateGlyph` | Decide the single icon source (D: generate `icons.py` from `icons.mjs` with a test that they match). |
| 4 | ListRow, ListGroup | files-window.mjs, workspace.mjs `renderProjects` | Folder rows (fixes the class of bug behind the broken folder chooser), Plan/Files groups, Projects and Agent groups. Fix the audit's `role=list` without listitems here. |
| 5 | Window, Toolbar/Infobar, Statusbar, Ruler | index.html | Frames only; contents stay as they are. |
| 6 | Menu, MenuBar, Popup | index.html, menubar.mjs | Behaviours: `menu.mjs`, `popup.mjs` (move `installPopup` here). Notes as `.pw-menu__note`. |
| 7 | Dialog, Alert, Sheet, Toast | index.html, dialogs.mjs | One `dialog.mjs` behaviour; phone dialogs as sheets (audit). |
| 8 | SegmentedControl, Table | workspace.mjs Activity, chat.mjs Gate | Arrow keys in `segmented.mjs`; grid semantics and keyboard rows (audit). |
| 9 | ReviewItem, InlineThread, CommentMarker | workspace.mjs `thread`, `renderComments` | Biggest win: the thread states, Add Note / Ask Pi, Show in Activity. |
| 10 | Message, ToolCall, AttachmentChip, MarkdownTable | chat.mjs, message-markdown.mjs | Message Markdown rendering moves to Python (`harness/ui/markdown.py`) so htmx can stream messages; the JS renderer stays until plan 152 replaces live chat. |
| 11 | Composer, ContextLine, ContextMeter, CompactionMarker, StatusButton | index.html, chat.mjs | Several are designed but not built yet (task 150 list); build them here, as components first. |
| 12 | DocumentBlock (frame), PhoneBar, DesktopPattern | workspace.mjs `renderBlocks` | Frame and handle only; editing stays the JS island (D6). |

Each step is one task (`tasks/1NN-ui-<name>.md`, `Kind: code`), created when it starts.

## 6. How one component step is done (the recipe)

1. Read the card: `design/system/components/<Name>/README.md` and `preview.html`; find the boards that use it (`grep -l pw-<name> design/canvas/*.dc.html`).
2. Write the red test: add the states to `harness/ui/catalogue.py` and their expected snapshots (hand-written from the card's markup, not from the current app).
3. Write `harness/ui/components/<name>.py`: one public function, keyword arguments only, a docstring with the card link and the list of states. No CSS, no JS.
4. If it is interactive, write or reuse `js/behaviors/<name>.mjs` and its node test.
5. Use it for the **static** markup: the page shell (`harness/ui/page.py`, which replaces the hand-written `index.html` step by step) calls the component where `index.html` had the markup. **Live** markup built by JS (lists, threads, messages) is not changed in this plan; mark the JS builder with `// replaced by harness/ui/components/<name>.py in plan 152`. Keep the ids and classes the browser suites use.
6. Delete the old markup and any `chat.css` rule the component made redundant.
7. Run everything (contributing guide § Commands). Commit: `feat: <Name> component (task NNN)`.

## 7. Risks

| Risk | Mitigation |
|---|---|
| Rewriting markup breaks the browser suites' selectors. | Components keep existing ids and classes; the suites run after every call-site change; no step changes more than one component's call sites. |
| Snapshots become noise that weaker models update blindly. | Snapshots are small, one per state; the update flag is explicit; the contributing guide says to explain every snapshot change in the commit. |
| Icons drawn in two languages drift. | One source of truth plus a test comparing both. |
| The work stalls half-way, leaving two ways to render. | Order is by dependency; every step ends with the old path deleted for that component. |

## 8. Out of scope

New visual design (the designer owns it), the htmx/SSE transport (plan 152), the Table block feature (separate task), a Python dependency.

## 9. Open questions for the person

1. D2: standard-library render functions (recommended) or Jinja2?
2. Should `/ui` be reachable in the installed app (useful for the designer to compare), or only in development?
