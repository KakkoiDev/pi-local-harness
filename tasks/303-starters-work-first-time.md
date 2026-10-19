# 303: A new project works on the first command

Kind: code

Source: the second bug hunt (2026-10-18) and its documentation-drift part; numbers are the hunt report's items. Items 2, 3, 13, 14, 15, 27; proposals 2 and 5.

- [ ] Each starter README's commands are in Gate's allowed forms (or run through the harness check tool, task 296); a
  test parses each README code block and asserts every line passes test_run().
- [ ] `static/app.css` is built or shipped at creation and gitignored, so a new project's own tests pass with no network
  (static: node --test; web: tests.test_files) and a Preview rebuild never counts as implementation.
- [ ] The skeleton is generic: no notes types in js/store.mjs or app/db.py, no type-only import that breaks the
  referenced-files test when the sample goes; entry points are a "rewrite" class, not "remove"; sample cleanup covers
  `<title>`, ja.json and the README text; starter READMEs describe their own kind.
- [ ] Project creation commits with signing and hooks off and cleans up on failure, so a retry works.
- [ ] Emoji in project names are kept or refused with a message, never silently dropped.

## Scenarios

### US-new a new project's own tests pass on the first run, with no network
Given the network is off
When I create a web project and a static project and run each README's test command
Then Gate allows every README command and the tests pass

### US-new a project name with an emoji is kept or refused with a message, never silently changed
Given the new-project sheet
When I create a project named "Habits 🌱"
Then the project is created with that name, or the sheet says why the emoji cannot be used and nothing is created

### US-new a project creation that fails can be tried again with the same name
Given a project creation that failed half way
When I create the project again with the same name
Then it is created and its first commit is there

Note (task 331, 2026-10-19): a new Web app or Terminal app now gets its packages at Create (`uv sync --frozen`, the
person approves by pressing Create; the Summary shows the count and size from uv.lock), and the base check then also
runs `uv run --offline pytest -q`. A project without its `.venv` offers Project › Install Packages… (terminal:
`/setup packages`). The starter READMEs say `uv run --offline pytest` (verified; task 323) and `uv sync --frozen`.
See [task 331](331-project-environment.md).
