# 81: Pi Workbench 1-bit, Laya checks per tool call

Kind: code

Request 2026-10-13: "finish now" (after task 80 left Phase 2 open). Build step 13 of [design/IMPLEMENTATION.md](../design/IMPLEMENTATION.md) § 12, the "Laya results per tool call in chat" row of § 9.

- [x] Red (`tests/test_laya_enforcement.py`): gate and audit events carry the Pi `tool_call` id, also for a blocked call.
- [x] Red (`tests/test_harness_services.py`): `/gatekeep` accepts `tool_call_id`, and `/api/laya` returns it on both events.
- [x] Red (`tests/harness/extension.test.mjs`): the extension sends `event.toolCallId` with each gate request.
- [x] Red (`tests/test_work_queue.py`): `tool_execution_start` and `tool_execution_end` build `tools[]` on the job (id, name, command or path, running, done or failed); it survives a restart.
- [x] Red (`tests/test_web_chat.py`): `with_checks` joins ledger events into each tool's `checks` without changing the stored job.
- [x] Red (`tests/browser/chat.cjs`): fake Pi runs one command through Laya (`TEST_TOOL`); the live card shows `$ cat README.md`, Approved and Running; the Activity detail lists it with Approved and Verified; Show in Laya opens the audit event.
- [x] `laya/ledger.py`, `agent_api.py`, `harness/extension.mjs`, `harness/work_queue.py`, `harness/web_chat.py`: the data path above.
- [x] `js/ui.mjs` `toolCard`, `js/chat.mjs` live card and `showLayaEvent`, `js/workspace.mjs` Commands in the Activity detail, `chat.css`.
- [x] Fix found on the way: a desktop row click left the phone Activity and Laya panes on the detail screen; only phone width opens the detail pane now.
- Pi emits `tool_execution_start` before `beforeToolCall`, so blocked calls appear too (read in pi-agent-core `agent-loop.js`).
- Limits: the ledger keeps the last 200 events in memory, so older or pre-restart tools show "No Laya record". Finished chat messages store no tool calls, so per-tool checks live in the Activity detail, not under old chat replies.
- Not tested: a real Pi run through the extension end to end; a blocked call's reason line in the browser.
