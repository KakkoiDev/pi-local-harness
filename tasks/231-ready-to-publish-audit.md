# 231: "Ready to publish": an audit task at the end of every roadmap

Kind: code

The person, 2026-10-16: "maybe we should have it run an audit in the roadmap before ready to publish, refactor all
unused code, pass all the tests, if green, we assume success."

## What it is
A task the harness adds as the last open task of a project's roadmap when the roadmap has other open tasks and no
such task yet: `tasks/NNN-ready-to-publish.md`. Its boxes, each checked by a command, not by Pi's word:
- [ ] No unused files: every file in js/, app/, static/ is reached from an entry point (index.html, app/main.py, serve.py)
  or is a test, config or doc. A small checker in the harness (harness/audit.py) lists the unreached ones.
- [ ] No unused code: for JavaScript, exported functions never imported (a small checker in harness/audit.py, no new
  tool); for Python, `uvx vulture` at 80% confidence, pinned in kit/toolchain.json. vulture is a download: ask the
  person before the first run (name, source pypi.org, size), as the handoff's rules say.
- [ ] Every referenced file exists (task 230's test).
- [ ] Types: `tsc -p .` (static) or strict pyright (web), as the starter's README says.
- [ ] All tests pass (the full suite, logged by task 228).
- [ ] The README and the manifest describe this app.

Green on all boxes = the roadmap is done ("we assume success").

## Steps
- [ ] Red: harness/audit.py's unreached-file checker on a fixture project (one used file, one unused).
- [ ] The paperwork adds the task (template in kit/, like tasks/001) once per roadmap.
- [ ] `/audit` in terminal Pi runs the checks and prints the result (harness/admin.py, like `/update`).
- [ ] Green.

## Done when
A project's roadmap always ends with the audit task, and the audit can be run and read without Pi.
