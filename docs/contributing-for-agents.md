# Contributing guide for coding agents

Written for any model working on this repository, including small local ones. Follow it literally. If something here is wrong, fix this file in the same commit as the code.

## 1. What this project is (one paragraph)

Pi Workbench is a local web app for **one person, one local AI agent (Pi), one chat per project, and real Markdown files**. `plh` starts Pi in a terminal, Gate (a command checker) on port 8000 and the web workbench on port 3000. The web server is standard-library Python. The page is plain HTML, CSS and ES modules, designed as a Pi Workbench 1-bit Macintosh-style interface by a separate designer.

## 2. Where things live

| Path | What it is | Touch it when |
|---|---|---|
| `plh.py`, `harness/install.py` | Launcher, installer, auto-update. | Startup or install behaviour. |
| `harness/services.py` | Starts Gate and the web server, phone access (`tailscale serve`). | Ports, startup, phone access. |
| `harness/web_chat.py` | HTTP routes (`WebHandler`), the chat runner (`WebChat`), model choice. | Any API or server behaviour. |
| `harness/documents.py` | Projects, files, comments (sidecars in `<data>/.comments/`), trash. | File, comment, project logic. |
| `harness/work_queue.py` | The one queue of the one agent (records in `<data>/activity/`). | Jobs, ordering, attachments. |
| `harness/context.py` | The small context each request carries. | What Pi sees. |
| `harness/GUIDE.md` | The user guide as questions and answers (`/guide`, Pi's `harness` tool). | A user-visible behaviour changed. |
| `harness/admin.py`, `harness/console.mjs`, `harness/CONSOLE.md` | The harness console (plan 158): admin reads as data; slash commands in terminal Pi; the guide terminal sessions load. | Console commands, admin data. |
| `harness/model.py` | Default model (`harness/model.json`), the person's choice (`<data>/model.json`), Ollama calls. | Models, thinking levels. |
| `gate/` | Gate: checks every command before and after it runs; the commit protocol. | Safety rules. |
| `harness/extension.mjs`, `.pi/extensions/` | The Pi extension (Gate calls, memory, recovery). | Pi-side behaviour. |
| `index.html`, `chat.css` | The page shell and page layout CSS. | Layout, static markup. |
| `js/chat.mjs` | App shell: views, menus, commands, shortcuts, composer, Gate view. | App-level UI. |
| `js/workspace.mjs` | Projects, Work (editor, comments, Review), Activity, polling. | Document and project UI. |
| `js/*.mjs` (others) | Router, menubar, dialogs, Files window, Markdown. | That one concern. |
| `design/` | **The designer's source of truth**: cards (`system/components/*/README.md`), boards (`canvas/*.dc.html`), `components.css`, `IMPLEMENTATION.md`. Synced from claude.ai artifacts; see `design/README.md`. | Never edit by hand except the four documented repo additions in `components.css`. |
| `design/briefs/` | What we asked the designer. | Before a UI change the designer has not drawn (see § 5 rule 9). |
| `tasks/NNN-*.md`, `ROADMAP.md` | One file per piece of work; the roadmap links every task. | Every change (§ 4). |
| `docs/plans/` | Plans for larger projects (component library, htmx/SSE). | Before starting those projects. |
| `tests/` | Python tests (`test_*.py`), Node tests (`tests/harness/*.test.mjs`), browser suites (`tests/browser/*.cjs`). | Every change. |

Data at runtime lives in `~/pi-local-harness-data/` (projects, chats, activity, comments, trash, `gate-events.jsonl`, `model.json`). Tests never use it.

## 3. Commands

Run from the repository root.

```sh
python3 -m unittest discover -s tests          # Python tests (fast)
python3 -m unittest tests.test_documents        # one Python test module
node --test tests/harness/*.test.mjs            # Node tests (fast)
python3 tests/verify_workflow.py                # both of the above + ROADMAP/task checks; must end with "Workflow Verification Passed!"
```

Browser suites (slow, ~2 minutes each; run before committing any UI change):

```sh
# once: install Playwright somewhere outside the repo and a Chromium for it
mkdir -p ~/.cache/plh-browser && cd ~/.cache/plh-browser && npm install playwright@1.56.1 && npx playwright install chromium && cd -
# every time:
python3 tests/browser/run.py design   # or chat, or all: finds Playwright, or says "Not run" and how to set it up (exit 2)
NODE_PATH=~/.cache/plh-browser/node_modules node tests/browser/design.cjs   # design conformance; prints "Design checks passed."
NODE_PATH=~/.cache/plh-browser/node_modules node tests/browser/chat.cjs     # regression; prints "UX regression passed: …"
```

Each suite starts its own server on random ports with a temporary data folder and a fake Pi (`tests/fixtures/fake-pi.py`). A non-zero exit code means it failed, whatever the last line says; never pipe a suite through `tail` without keeping its exit code. A suite that spawns a server must read the server's stderr (an unread pipe fills and the server stalls); on failure both suites print the server's error lines.

Tests must never reach the real Ollama, tailnet, the person's Trash (`PI_TRASH_DIR`) or a running harness: every Python test module starts with `import isolation` (see `tests/isolation.py`, which also gives the tests a temporary `PI_AGENT_DATA`), and the browser suites set `PI_OLLAMA_URL` to a closed port. A Node test that reaches `harness/extension.mjs` must set `PI_AGENT_DATA` to a temporary folder: under `node --test` the extension refuses the person's `~/pi-local-harness-data` (`harness/data-folder.mjs`), and `tests/test_test_isolation.py` runs the Node suite with `HOME` in an empty folder and fails if anything is written there.

## 4. How a change is made (always this order)

Gate enforces it before `git commit` (rule G-005). Every rule Gate enforces is in one registry, `gate/rules.py`: its id, when it applies, what happens, the lesson behind it and the test that proves it. `/gate rules` lists them, the system prompt gets a summary generated from it (`harness/gate-rules.md`, regenerate with `python3 -m gate.rules`), and AGENT.md does not restate them. A new rule is a task with a test that names its id. Mistakes the local model made, and which rule answers each, are in `docs/lessons/`.

1. **Task file.** Create `tasks/NNN-short-name.md` (next free number) from the template below and add `- [ ] [NNN-Title](tasks/NNN-short-name.md)` to `ROADMAP.md`.
2. **Red.** Write a test that fails for the right reason. Run it; see it fail.
3. **Implement** the smallest change that makes it pass.
4. **Green.** Run the fast tests, then the browser suites if UI changed.
5. **Check boxes** in the task file and mark the ROADMAP line `- [x]`.
6. **Commit**: `type: what changed, in plain words (task NNN)` where type is `feat`, `fix`, `chore`, `docs` or `test`. End the message with the attribution line the session gives you.

Task template:

```markdown
# NNN: Title in plain words

Kind: code            ← one of: code, chore, docs, planning

Request YYYY-MM-DD: "the person's words, quoted".

- [ ] Red (unit|browser): what the test proves.
- [ ] What to build, in one line each.
- [ ] Green: which suites.
```

## 5. Rules

1. **Read before you edit.** Open the file and the functions you change, and their callers (`grep -n name -r harness js`).
2. **One concern per commit.** Do not mix a fix with a refactor.
3. **Keep ids and classes** that the browser suites use (`grep -n '#the-id\|the-class' tests/browser/*.cjs`). They are the contract.
4. **Escape everything** that comes from Pi, files, comments or the network: `textContent` in JS (never `innerHTML` with untrusted text), `html.escape` in Python.
5. **No new dependencies** (Python packages, npm packages at runtime, CDNs). Vendored files go in `harness/vendor/` with their license and an exact version.
6. **Paths stay inside the project**: use `DocumentStore.project_file` / `path` helpers; never join user input to a path yourself.
7. **No `//` comments inside one-line statements** in the dense JS files: they comment out the rest of the line. Use `/* … */`.
8. **Unavailable means disabled, not hidden** (Human Interface Guidelines). A disabled control has `aria-disabled="true"` and cannot act.
9. **UI changes go through the designer.** If the designer has not drawn it, build the smallest version, then add it to the next brief in `design/briefs/` so the canvas catches up.
10. **Say what you could not verify** in the task file and in your reply. Never mark a box you did not check.

## 6. Recipes

### Add or change an API route
1. Find the route block in `harness/web_chat.py` (`do_GET` / `do_POST`, search for a neighbouring path).
2. Put logic in `DocumentStore`, `WorkQueue` or `WebChat`, not in the handler; the handler only parses and replies.
3. Errors: raise `ValueError('A sentence the person can read.')`; the handler turns it into 400 with that message.
4. Test the logic in `tests/test_*.py` (unit) and, if the page uses it, in a browser suite.

### Change something on the page
1. Find the designer's card for it (`design/system/components/<Name>/README.md`) and follow its markup, classes and copy.
2. Find where it is built: static markup in `index.html`, dynamic markup in `js/workspace.mjs` or `js/chat.mjs` (search the class name).
3. Change it, keep the ids and classes, run both browser suites, and look at it at 1440, 1024 and 390 px wide.

### Add a command to a menu
1. Add the item in `index.html` with `data-command="name"`.
2. Add `name: () => …` to `commands` and its condition to `enabled()` in `js/chat.mjs`; add a shortcut in the shortcut map only if the design shows one.

## 7. Before you say "done"

- [ ] `python3 tests/verify_workflow.py` ends with "Workflow Verification Passed!".
- [ ] Both browser suites exit 0 (if any UI, CSS or JS changed).
- [ ] Task boxes and the ROADMAP line match what you verified.
- [ ] Docs that describe the changed behaviour are updated (README.md, docs/reference.md, harness/README.md, this file).
- [ ] The commit message says what changed for the person, not just the code.
