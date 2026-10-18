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
- [ ] 1. Backtick/bold [CANARY]: covered by the item above.
- [ ] 2. "Preparing attachments…" without attachments while the model loads.
- [ ] 3. A refused model switch must not say "Loading …"; the refusal shows by the menu.
- [ ] 4. Stop → the page updates at once.
- [ ] 5. Discussion: ask_choices offered to small models; nested lists on one line render.
- [ ] 6. Folder names with spaces (Project Start).
- [ ] 7. A turn that describes a tool call and ends without it is nudged once (automatic decision).
- [ ] 8. No phase notice when the phase word equals the current phase.
- [ ] 9. Intraword underscores never start emphasis.
- [ ] 10. Numbered plan steps on one line become a list in the task file.
- [ ] 11. propose_plan keeps the person's roadmap Goal.
- [ ] 12. Textual pseudo tool calls are nudged once and never shown as the answer.
- [ ] 13. Guide selection never asks the person.
- [ ] 14. Choosing Planning with a discussion in the chat starts a planning request; an empty chat starts nothing.

## Checks
- [ ] Workflow verification and all browser suites pass; the audit is written.
