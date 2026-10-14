# 164: Requests run in two lanes; the chat goes first with a one-at-a-time model

Kind: code

Request 2026-10-14: "continue with plan 156 phase 2" (plan 156 § 4; decided: the chat gets priority, one worker per project).

- [x] Red (python, `tests/test_lanes.py`): requests have a role (chat, worker, comment, document); the chat lane runs one chat request at a time; the work lane (workers, comments, whole-file requests) never runs two in one project, and only one in all with a one-at-a-time model; with a parallel model, one per project up to the model's slots minus one kept for the chat; nothing starts while the harness is busy (model switch, capability check, terminal Pi). A worker request no longer merges into a waiting chat message.
- [x] The queue dispatches every request that may start, each in its own thread; a record that cannot be saved fails its request instead of blocking its lane; closing waits for running requests.
- [x] `WebChat`: requests are keyed by job (a chat and its comment run at once, each with its own context file); `busy()` no longer counts running requests; the harness holds `<data>/.agent-lock` while any request runs (terminal Pi waits) and its own workers skip it (`PI_HARNESS_LOCK_HELD`); `POST /api/jobs/stop` stops one request; a chat's Stop stops only its chat requests. End-to-end test with the fake Pi: a chat and a comment run at the same time, stop separately, and the lock goes with the last.
- [x] Turn gate: work requests get `PI_HARNESS_TURN_URL`; the extension posts to it before each model call (`before_provider_request`, awaited by Pi) and `WebChat.wait_turn` holds it while a chat request runs with a one-at-a-time model, marking the request "Paused while Pi answers you" (`paused` on the job). An unreachable workbench never blocks the model (Node test).
- [x] Activity's Stop stops that request only. A browser test that relied on a comment waiting behind a chat now queues it behind another comment.
- [x] Green: verify_workflow, design.cjs, chat.cjs.
- [x] Not measured on the real model: how much slower a worker gets when it alternates with the chat (plan 156 § 10).
