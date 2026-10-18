# Chat critical path audit (2026-10-18, task 324)

The owner, live: "right now the app is a broken mess. the critical path of user chatting with agent is completely
broken. audit it." Also: Planning did not start the agent, and answers show `[CANARY]`. This audit drove the whole
path with real browser stories against the real services (web, Gate, the queue, git, the Preview) and the scripted
fake Pi; no model, no network, no personal data. No transcript content is quoted here.

## Root causes of the live symptoms

| Symptom (build 87491f6) | Root cause | Fix |
|---|---|---|
| A request "running · Tool finished" for 26+ minutes; Pi alive at 0% CPU with an open connection to Ollama, whose runner had restarted | The web worker failed a request only after `silence_seconds` (3600 s) without any event. Pi's own hang recovery only watches a *thought* phase; after a tool result, before the first token, nothing watched the model. A runner restart under an open stream leaves the connection idle forever, so the request sat until the hour passed. | A model watchdog in `WebChat.send`: while Pi waits for the model (no tool running, not after `agent_end` while the harness does its paperwork, not compacting, not paused for the chat), `model_silence_seconds` (default 120 s, `PI_HARNESS_MODEL_SILENCE_SECONDS`, `/config set model_silence_seconds`) of silence fails the request with the board's copy "the model stopped answering (no reply in 120 s).". The worker's `finally` stops the Pi process it started (its handle, then its process group). The partial answer stays with the CutLine and Retry. |
| The next request ("let's plan the icons now", sent after pressing Planning) waited forever: "Next: 1 request waiting" | The chat lane runs one chat request at a time and the zombie still counted as running. Not a Planning bug: any message would have waited. `busy` was false because it means "the whole queue is held" (a model switch, terminal Pi), not "a request runs". | The watchdog ends the zombie, the lane frees and the queued request starts (US-200, unit test). Also `WorkQueue.reap`: a request marked running whose worker thread is gone is settled as failed, so no record can hold a lane. Startup recovery already turns running into Interrupted (tested again). |
| Answers start with `` `[CANARY]` `` in code formatting | The marker is protocol (AGENTS.md line 3). The page stripped only a bare leading `[CANARY]`; this model wraps it in backticks, so it showed as inline code. The server saved and sent it raw everywhere (chat, job text, Activity record, comment replies). | `harness/canary.py strip_canary` on every saved and shown answer (bare, `code`, **bold**, *italic*, with a colon), and a half-streamed marker never flashes. The page's `spoken` does the same for answers saved before. |
| Repeated "Instruction drift: the completed response omitted [CANARY]" recoveries | `missingCanary` required the literal `[CANARY]`; a wrapped marker counted as drift, so the harness compacted and re-asked answers that had followed the instruction. Each recovery costs a compaction and a full re-ask. | The drift detector accepts the wrapped forms; it still reads the raw text (nothing is stripped before it). |
| "Loop detected" recoveries | Working as designed. Checked that a recovery cannot wedge a request: the abort ends the turn (`agent_end`, so the watchdog waits for the harness), compaction is not "the model" (`compaction_start`…`compaction_end`), and the re-asked turn is watched again from `agent_start`. The hour limit still bounds everything. |

## What was tested (stories US-200 to US-209, all passing)

- **US-200** the owner's scenario: a tool finishes, the model stalls; Planning chosen; a message queued behind it.
  The stalled request fails after 3 s (scratch setting) with the CutLine and Retry; the Planning message runs.
  Fails on 87491f6 (the stalled request holds the lane for 600 s).
- **US-201** Planning with the phase button, then a message: with nothing in flight, after a question card, after a reload.
- **US-202** `[CANARY]` never shown: live, after a reload, an answer saved before the fix, Activity. Fails on 87491f6.
- **US-203** the whole path: streaming thoughts, a tool call with Stop, reload mid-request, a second tab, Stop keeps
  the partial answer, Retry, three messages while Pi works (the two waiting ones join into one request by design and
  run after the first, in order), a phase change between messages, a check-in, and the chat goes on; no page errors.
- **US-204** failures: Ollama unreachable, a model error, Pi crashing, Gate refusing a command; each ends its request
  plainly and the next message runs.
- **US-205** the Codex review list: live-vs-saved control ownership (one card, answered once, after a reload mid-request),
  an answer accepted while the worker shuts down, a refresh across a phase change made in another tab.
  Fails on 87491f6 (see below).
- **US-206** choosing Planning starts the plan (the owner's request): after a discussion a planning request runs and a
  plan card arrives without typing; an empty chat starts nothing; Implementation with an approved task starts it.
- **US-208** Gate's scope question mid-request: Waiting for you, the card after a reload, Keep Out, Keep the Plan, and
  the chat goes on.
- **US-209** Stop during an approved task, then a new request: it writes the task's files and reaches the check-in.
- **US-207** a folder with spaces and capitals ("Habit Tracker"): plan, build, sandboxed test runs, Gate's commit,
  the Preview.
- Unit: `tests/test_chat_critical_path.py` (watchdog, next request after a stall, a thinking model and long tool work
  are not stalled, a running command keeps the long limit, canary everywhere, Ollama down, model error, reaper,
  restart recovery, guide judgement, progress text); Node: canary forms, drift detector, nested lists, underscores,
  pseudo tool calls and nudges.

## What else broke, and what was fixed

1. **An answer given while the worker was still finishing left that request "Waiting for you" forever.**
   `resume_waiting` only completed requests already *waiting*; the worker, still running when the person answered
   the live card, then paused itself. Now the running request is marked and `finish()` completes it.
2. **"Ollama is not answering" was said twice** (`readable_error` ran on its own output in the failure path); now
   idempotent, and Pi's "Connection error." / ECONNREFUSED become "Ollama is not answering (…). Start Ollama …, then Retry."
3. **Choosing Planning only changed the phase.** `harness/phase_start.py` (System 1, the person's control only) queues
   the phase's work, shown as a harness notice, recorded as an automatic decision (`phase_start`), once.
4. **"Which guide should Pi use?" was asked mid-Implementation, and again after it was answered.** Guide choice is
   System 1's judgement: an abstained pick is no guide, decided by code and recorded; never a card.
5. **The phase notice fired on "plan" while already in Planning.** No notice when the words name the current phase.
6. **Small models' tool calls written as text** (`<execute_tool>…`, ```` ```tool_code ````, JSON) stayed in the answer and
   in the session, and a bigger model imitated them on later turns. The extension replaces each with a readable note
   in the message Pi stores and the person sees, and nudges once per request. A turn that only *describes* its tool
   call (no answer, no tool ran) is nudged once ("Call the tool you described now; do not describe it."). The
   deterministic rewrite into real tool calls is task 326's proxy, not this task.
7. **"Preparing attachments…"** showed for minutes with no attachments while Ollama loaded a model: now "Starting Pi…"
   then "Waiting for the model (it may be loading)…".
8. **A refused model switch said "Loading …" then reverted silently**, its refusal far below in the chat: the page
   refuses before claiming Loading and shows the refusal as the toast at the top.
9. **Stop updated the page only at the next poll**: the page now refreshes until the request has ended.
10. **Markdown**: intraword underscores (`add_habit`) started emphasis; indented option lists under numbered questions
    swallowed the rest of the answer. Both render now.
11. **Plan steps on one line** ("1. … 2. … 3. …") become a list in the task file; **propose_plan replaced the person's
    Goal**: it now stays, with the plan's goal as one `Plan:` line under it.
13. **An invisible system question deadlocked a request** (live, qwen3.8:27b): a "Which guide should Pi use?" raised
    mid-request was saved as the project's waiting choice but never shown; every later write got G-017 "A choice is
    waiting for the person" and Pi looped. Guide choice no longer asks (item 4), and G-017 no longer blocks on a
    system-owned question whose request has ended, or on a judgement System 1 decides itself: it is settled. With that
    out of the way, Gate's scope question for a file outside the task appears and pauses the request (US-208).
15. **After Stop, every call was refused "No approved task is in progress"** (live finding 17). Two causes: the Stop
    ended the request through Gate's normal end, which wrote "Not verified at …" into the task file and raised a
    check-in; the note changed the plan's digest (the approved scope), and the check-in made the task "not in
    progress". A stop now keeps the task in progress (no check-in), the harness's end notes and its recorded
    Decisions are no longer part of the digest (a digest saved before is still accepted, so plans in progress
    survive the update), and when a check-in does wait, Gate's refusal says to use Retry Task on its card (US-209).
14. **Live text after a saved card** was hidden while the request ran on; it shows now.
12. `ask_choices`' description tells small models never to write questions with options in prose.

## What remains

- The model watchdog cannot tell a stalled stream from a very slow first token: a cold model load plus a long prompt
  can exceed 120 s on a large model. Raise `model_silence_seconds` for such a model. Ollama exposes no per-request
  progress to tell them apart.
- A prose answer with several questions is not converted into cards by System 1 (only discouraged in the tool
  description); doing it reliably needs Laya's judgement and a design for the result.
- Sessions saved before this fix may still contain pseudo tool-call markup from earlier turns; only new turns are
  cleaned (Pi's session files are not rewritten).
- The model menu could not be driven in the browser stories (Ollama is a closed port there); the refused switch is
  covered by reading, not by a journey.
- Task 323 (shell_risk without policy questions) is separate; US-204 shows a Gate refusal never wedges a request.

## Manual verification for the owner

1. Start a request in a project and, while it runs a tool, stop Ollama's model runner (or `ollama stop <model>`).
   Within two minutes the answer ends with "Failed before Pi finished: the model stopped answering (no reply in 120 s)."
   and Retry; a message you sent meanwhile starts by itself. Activity shows the first request Failed.
2. Discuss something, then choose Planning with the phase button: "Harness · Planning started from your discussion"
   appears and Pi proposes a plan without you typing. On a new, empty chat, choosing Planning starts nothing.
3. Ask anything: no answer starts with `[CANARY]` (also after a reload and in Activity). Older answers saved with it
   no longer show it.
4. Answer a question card the moment it appears: it settles once; after Pi finishes, Activity shows the request
   Completed (not Waiting for you) and your answer runs next.
5. In Implementation, press Stop while Pi builds a task, then send "continue": the task goes on and writes its
   files (no "No approved task is in progress").
6. Press Stop during an answer: the page updates at once and keeps the partial answer with "Stopped by you".
7. With Ollama quit, send a message: "Ollama is not answering (…). Start Ollama …, then Retry."
