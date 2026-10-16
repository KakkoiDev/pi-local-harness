# 231: "Ready to publish": an audit task at the end of every roadmap

Kind: code

The person, 2026-10-16: "maybe we should have it run an audit in the roadmap before ready to publish, refactor all
unused code, pass all the tests, if green, we assume success."

## What it is
A task the harness adds as the last open task of a project's roadmap when the roadmap has other open tasks and no
such task yet: `tasks/NNN-ready-to-publish.md`. Its boxes, each checked by a command, not by Pi's word:
- [x] No unused files: every file in js/, app/, static/ is reached from an entry point (index.html, app/main.py, serve.py)
  or is a test, config or doc. A small checker in the harness (harness/audit.py) lists the unreached ones.
- [x] No unused code: for JavaScript, exported functions never imported (a small checker in harness/audit.py, no new
  tool); for Python, `uvx vulture` at 80% confidence, pinned in kit/toolchain.json. vulture is a download: ask the
  person before the first run (name, source pypi.org, size), as the handoff's rules say.
- [x] Every referenced file exists (task 230's test).
- [x] Types: `tsc -p .` (static) or strict pyright (web), as the starter's README says.
- [x] All tests pass (the full suite, logged by task 228).
- [x] The README and the manifest describe this app.

Green on all boxes = the roadmap is done ("we assume success").

## Steps
- [x] Red: harness/audit.py's unreached-file checker on a fixture project (one used file, one unused).
- [x] The paperwork adds the task (template in kit/, like tasks/001) once per roadmap.
- [x] `/audit` in terminal Pi runs the checks and prints the result (harness/admin.py, like `/update`).
- [x] Green.

## Done when
A project's roadmap always ends with the audit task, and the audit can be run and read without Pi.

## Result

The person confirmed that the description check means starter leftovers and consistent README, manifest and English app names; it does not judge arbitrary prose. The person approved the 27 kB Vulture 2.16 PyPI download before its first run. Both scratch Python starters passed Vulture at 80% confidence. Static types and all three starter test suites ran offline (6 static, 10 web, 6 terminal tests); the web referenced-files test needed strict type annotations, now fixed. Unchanged starter descriptions correctly remain failures. Missing tools fail visibly without downloading.

Audit tasks are added to new projects, new roadmaps and changed projects, kept last, reused if their roadmap link was removed, and reopened after new work. Commands and full-suite test evidence are saved; the roadmap is ready only when every check and every other task passes. Literal local references are checked; computed paths beyond message-language files need manual review.
