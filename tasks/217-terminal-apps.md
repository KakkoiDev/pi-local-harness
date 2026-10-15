# 217: Pi Workbench makes terminal apps too (Textual)

Kind: code

The person, 2026-10-15: "It would be so cool if Pi workbench could also create CLI apps. let's use Python and get a
good tui lib."

- [x] The library: Textual 8.2.8 (typed, strict pyright passes; its own test driver runs the app headless; textual-serve
  1.1.3 shows the same app in a browser). Checked in a scratch project before choosing: tests pass, 0 strict errors,
  the app typed into through the browser.
- [x] `kit/starter-tui`: the notes app as a terminal app: rules in `app/logic` (the same as the web starter's), SQLite
  in `app/db.py`, screens and keys in `app/tui.py`, English and Japanese through `t()` (APP_LANG, else the terminal's
  locale; Ctrl+L switches), the footer's key names translated too, `serve.py` for the browser; `uv.lock`.
- [x] `kit/new_project.py --tui`; New Project… gets "Terminal app" (kind `tui`); the Preview runs it through
  textual-serve (4 s to start, checked through the Preview code).
- [x] Tests (python, `tests/test_starter.py`, `tests/test_project_kinds.py`, `tests/test_preview.py`); `PI_KIT_HEAVY=1`
  installs it and runs its 6 tests and strict pyright.
- [ ] The designer has not drawn the fourth kind in New Project… (it follows the drawn three; in the round 9 brief).
