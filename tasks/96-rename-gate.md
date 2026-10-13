# 96: Laya is renamed Gate

Kind: code

Request 2026-10-13: "Let's go for Gate and rename the files too. no tech debt wanted yet." Context: Laya (github.com/NandhaKishorM/laya) is an encoder-model decision engine this repo may adopt later; the checker here is local rules (`gate/engine.py`, `gate/shell_guard.py`), so the tab and code are named for the function, not the model.

- [x] Red (`tests/test_naming.py`): no tracked path or content outside closed task records names the old checker; open tasks and their roadmap lines included.
- [x] Renamed: package `laya/` -> `gate/`, `tests/test_gate.py`, `tests/test_gate_enforcement.py`, `specs/02_gate.md`, canvases `Gate`, `C_GateDesk`, `Ph_Gate`, `Ph_GateDetail`, `G_All`, `G_Empty`, open task 15.
- [x] Renamed runtime names, no aliases (no install exists on this Mac: no `~/pi-local-harness-data`, no `plh`): `PI_GATE_PORT`, `PI_GATE_AUTH`, `X-Gate-Token`, `gate_port`, `/api/gate`, `gate-protocol.json`, `gate-audit.log`, view `gate`, ids `#gate-*`.
- [x] Red (`tests/browser/chat.cjs`): a saved view that no longer exists (a browser that last showed the old tab) restores Work instead of a blank window. `js/chat.mjs` `restoreView` falls back to Work.
- [x] `tests/fixtures/fake-pi.py`: helper renamed `call_gate`; `gate=gate(...)` shadowed it.
- Kept: closed task records (01-95) and their roadmap lines say Laya; they are history.
- Kept: `AUDIT.md` #3 "Gate checks nothing" means the verify gate (`tests/verify_workflow.py`), not this checker.
- Not tested: `test_remote_access` failed once under the full suite, passed 4/4 alone and in the next full run; timing, not this change.
