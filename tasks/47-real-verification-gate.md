# 47: Completion gate runs the tests

Audit 2026-10-13: `tests/verify_workflow.py`, the gate AGENT.md requires before
completion, only compared ROADMAP checkboxes with task files. It passed while
`test_pi_startup` failed.

- [x] Red: a project with a failing unit test must fail the gate.
- [x] Run `unittest discover -s tests` and `node --test tests/harness/*.test.mjs` inside the gate.
- [x] Green: gate tests pass; the gate passes on this repository with both suites.
- [x] Update the validation docs and roadmap.
