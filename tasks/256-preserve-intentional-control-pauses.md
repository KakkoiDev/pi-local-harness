# 256: Preserve replies when Pi pauses for a choice or plan

Kind: code

Request 2026-10-18: fix bugs with unit, integration and end-to-end tests. Live v2 logs showed successful controls followed by error/“This operation was aborted”.

Scope: harness/web_chat.py, tests/test_control_pauses.py, tests/fixtures/fake-pi.py, tests/browser/design.cjs, docs/handoff/claude-return-2026-10-17.md.

- [x] Red: replay the real error-shaped intentional abort, preserve preceding answer text, and reject unrelated provider errors.
- [x] Implement narrowly recognized intentional pauses with pending-control/recovery context; do not suppress generic errors.
- [x] Integration: real subprocess RPC with choice and plan saves the answer and control across store reload.
- [x] E2E: both existing control-card journeys use the observed provider abort shape and survive page reload.
- [x] Green: focused Python tests, design browser suite and full workflow; report the separate chat scroll defect honestly.

Result: 35 focused unit/RPC/queue tests passed. Design browser suite passed with the observed error/abort variants and persisted control answers. Full Python/Node workflow passed. The separate chat scrolling failure remains in task 257; this change does not claim a full chat-suite pass.
