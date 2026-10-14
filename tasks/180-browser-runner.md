# 180: One command runs the browser suites, or says they did not run

Kind: code

From `docs/lessons/L-005`: Pi could not run the browser suites from its shell (Playwright not found), checked syntax
instead, and called the change passing.

- [x] Red (python, `tests/test_browser_runner.py`): without Playwright the runner prints "Not run: Playwright is not
  installed … Nothing was verified." with the setup command and exits 2; an unknown suite is refused; Gate counts the
  command as a test run.
- [x] `tests/browser/run.py design|chat|all`: finds Playwright (NODE_PATH, PI_PLAYWRIGHT, `~/.cache/plh-browser`), runs the
  suites with their own exit codes.
- [x] Gate's protocol counts `python3 tests/browser/run.py` as a test run (G-005, G-010, G-012); AGENT.md and the
  contributing guide name it.
