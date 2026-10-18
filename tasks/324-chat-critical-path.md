# 324: Repair the chat critical path (person sends, Pi answers)

Kind: code

The owner, 2026-10-18 (live): "right now the app is a broken mess. the critical path of user chatting with agent is
completely broken. audit it." Also: Planning did not start the agent; the model's [CANARY] shows in answers. The audit
is docs/reviews/2026-10-18-chat-critical-path-audit.md; stories US-200 to US-219.

## Owner's items
- [x] Stalled model watchdog: while Pi waits for the model (not a tool, not the harness's paperwork, not compaction, not
  paused), `model_silence_seconds` (default 120 s, `PI_HARNESS_MODEL_SILENCE_SECONDS`) of silence fails the request:
  "the model stopped answering (no reply in 120 s)."; the Pi process it started is stopped by its handle and process
  group; the partial answer keeps its CutLine and Retry; the next queued request starts. Unit + US-200.
- [x] No zombie can block the queue: a running request whose worker thread is gone is settled (`WorkQueue.reap`);
  startup recovery already marks running requests Interrupted (tested). Unit.
- [x] Planning request starts: with a stalled request in flight (US-200), with nothing in flight, after a question
  card, after a reload (US-201).
- [x] [CANARY] never shown: stripped server-side (bare, `code`, **bold**) from conversation, job text, Activity record,
  comment replies; the page hides it in old saved answers and never flashes a half-streamed marker; the drift detector
  accepts the wrapped forms (they were "recovered" as drift every answer). Unit, node, US-202.
- [x] Whole critical path in the browser (US-203) and failures (US-204: Ollama down, model error, Pi crash, Gate refusal).
- [x] Codex review list: live-vs-saved control ownership, an answer accepted while the worker shuts down (it stayed
  "Waiting for you" forever: fixed), a refresh across a phase change (US-205).

## Coordinator's live findings (gemma4:e4b, qwen3.8:27b)
- [x] 1. Backtick/bold [CANARY]: covered by the item above.
- [x] 2. "Preparing attachments…" without attachments while the model loads.
- [x] 3. A refused model switch never says "Loading …"; the refusal is the toast at the top (no journey: Ollama is
  closed in the scratch workbench).
- [x] 4. Stop → the page updates at once.
- [x] 5. Discussion: ask_choices is always offered (its description now forbids option questions in prose); nested
  lists render. Not done: converting a prose multi-question answer into cards (needs Laya and a design).
- [x] 6. Folder names with spaces: plan, build, sandboxed tests, commit and Preview work (US-207); no slug needed.
- [x] 7. A turn that describes a tool call and ends without it is nudged once (System 1; recorded as a wake-up incident in reports, not in decisions.jsonl).
- [x] 8. No phase notice when the phase word equals the current phase.
- [x] 9. Intraword underscores never start emphasis.
- [x] 10. Numbered plan steps on one line become a list in the task file.
- [x] 11. propose_plan keeps the person's roadmap Goal.
- [x] 12. Textual pseudo tool calls become a note in the answer and the session, and are nudged once (the rewrite
  into real tool calls is task 326).
- [x] 13. Guide selection never asks the person.
- [x] 14. Choosing Planning with a discussion in the chat starts a planning request; an empty chat starts nothing.
- [x] 15. A pending system-owned question of a request that ended, or one System 1 decides itself (applicable_guide),
  never blocks writes (G-017); it is settled ("its request ended"). Unit (test_person_controls).
- [x] 16. Gate's scope question mid-request pauses the request (Waiting for you), the card survives a reload, Keep Out
  and Keep the Plan work, the chat goes on (US-208). Text Pi writes after a saved card still shows live.
- [x] 17. Stop during an approved task keeps it in progress: a stopped request gets no check-in, the harness's own
  end-of-request notes and recorded Decisions no longer change the plan's digest (a digest saved before is accepted),
  and a refusal while a check-in waits names Retry Task; a tool that writes nothing is refused "Not run" (US-209).

## Checks
- [x] Workflow verification and all browser suites pass; the audit is written.

## Live 2026-10-19 (owner's Workbench, project "Habit Tracker"; reproduced in scratch, stories US-270 and US-271)
Start Building stamped and ticked the plan but committed nothing, so a later request's commit swept the approval in.
Then "Continue task 1: add the habits and daily_logs tables …" named tasks/001 (the done planning task: "task 1" by
number, in harness/context.py `mentioned`, not the candidate the coordinator's note assumed), Pi only reran a capability
test that already passed, and the harness wrote "Green" into task 001, ticked it, committed "Plan this app (task 001,
plan)" and showed "Done · 1 file"; task 003, the approved task in progress, got no check-in.
- [x] Red (unit, tests/test_task_attribution.py, a scratch Project Start project with the live sequence; browser US-270,
  US-271): each failed on the old code for the reason above.
- [x] Start Building (and Run on its own's automatic approval) commits the approval paperwork itself: "Plan approved: N
  tasks" with the approved and waiting task files, the planning task it completes and ROADMAP.md (`commit_approval`).
- [x] While an approved task is in progress, a request never takes a planning task (Kind: planning) or a task outside the
  plan as its own, by number or path; a test run makes the task in progress the request's task (a question that runs
  nothing still raises no check-in, task 260); its commit holds only its own changes and its task's paperwork.
- [x] A test that passed before the request changed any file is not written as Green; a request that changes no
  implementation file ends "not verified" for the task in progress with the Retry Task check-in, and its reason says
  the test "already passed before any change, so it is not evidence". Nothing is committed.
- [x] Commit titles: a plan proposal is "Plan proposed: N tasks"; a request that only edits a task's file is "<title>
  (task NNN, <its Kind>)", never "(task NNN, plan)" for a code task. In Implementation, notes on a planned task that is
  not the one in progress complete nothing and are not committed as done.
- [x] The same flow under Run on its own (unit and US-271): the automatic approval is committed; the unverified task
  waits for the person.
- Not done (left for the person; an open box would reopen task 324): Pi's context still lists tasks/001 when the person writes "task 1" (harness/context.py `mentioned`), so
  a model can still read the planning task as its job. The harness no longer records or commits anything there; whether
  "task N" in Implementation means the plan's Nth task (as the check-in card numbers it) is the person's decision.
- Note, not translated: the new not-verified reason and commit titles, like the existing paperwork reasons, are English
  only (none of them is in messages/ja.json today).
