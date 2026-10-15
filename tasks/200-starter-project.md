# 200: The starter project: a new app on the stack, typed, tested, in English and Japanese

Kind: code

Plan 198, phase 1. Decisions 2026-10-15: FastAPI with Jinja2, plain sqlite3, PWA, pyright strict, a Japanese UI.

- [x] `kit/starter/`: a small notes app in the stack's layout: routes in `app/main.py` (a page or a fragment, never
  both; an empty title comes back as the form with its message, as a 422, which htmx 4 swaps), data in `app/db.py` with
  numbered migrations, rules as pure functions in `app/logic/`, every visible string through `t()` with
  `messages/en.json` and `messages/ja.json` (the person's choice in a cookie, else the browser), the PWA manifest and
  service worker, Tailwind with Basecoat, `uv.lock`.
- [x] `kit/new_project.py <folder>`: the starter with the kit's pinned htmx and Basecoat copied in; refuses a folder
  that is not empty.
- [x] htmx 4's own guide prefers `<hx-partial>` to `hx-swap-oob`: the new note joins the list through one; the empty
  message hides by CSS when the list has a note.
- [x] Types: strict pyright found 38 unknown types in the tests: Starlette's test client wants `httpx2` now (it warned
  that `httpx` is deprecated). With `httpx2`: 0 errors.
- [x] Tests (python, `tests/test_starter.py`): a new project is whole; both languages have the same keys and cover
  every `t()` in the templates; htmx 4's upgrade check finds nothing; a folder that is not empty is refused.
  `PI_KIT_HEAVY=1` installs it with uv and runs its 8 tests, strict pyright and the Tailwind build (13 s here).
- [x] Opened in the browser pane: adding a note, the empty-title message, switching to Japanese.
