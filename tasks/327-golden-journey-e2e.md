# 327: The golden journey: the owner's session as one E2E test

Kind: code

Request 2026-10-18 (the owner): "fix critical issues and test workflow from beginning. Use E2E test to redo all the
things you did in this test run. change model, create new app, ask model questions, etc… so many tokens sank in this
project and it is more bugged than 3 days ago". Then: "make sure that the user story you did today is permanently
recorded as an E2E test", "continue the test so that you can go further and actually finish something", and "the e2e
model will use the 4b model for speed".

Files: tests/browser/journey.cjs, tests/browser/journey/*.json, tests/fixtures/fake-ollama.cjs, tests/fixtures/uvicorn-standin.py, tests/browser/run.py,
tests/test_browser_runner.py, docs/user-stories.md, docs/contributing-for-agents.md, harness/folder_name.py,
harness/documents.py, harness/project_start.py, js/project-start.mjs, js/near-note.mjs, js/chat.mjs, js/check-ins.mjs,
chat.css, gate/paperwork.py, gate/ledger.py, kit/publish-audit.md, kit/publish_audit.py, harness/extension.mjs,
harness/web_chat.py, harness/settings.py, messages/ja.json, design/briefs/round-13.md, tests/

- [x] A fake model, not a fake Pi: tests/fixtures/fake-ollama.cjs answers as Ollama does (`/api/tags`, `/api/show`,
  `/api/ps`, `/api/generate` for the menu bar's model switch; Pi's OpenAI-compatible stream with text, thinking, real
  `tool_calls`, a stalled stream left open, a slow stream), scripted per step by tests/browser/journey/*.json (each turn
  tied to the input it follows: the person's words, a nudge, a tool result). The real Pi 1.1.0 and the real harness
  extension run, so the extension's defects (pseudo tool calls, nudges, [CANARY] drift, guide questions, scope pauses)
  are tested, not the fake Pi's imitation of them. Pi's HOME and PI_CODING_AGENT_DIR are scratch; the repair proxy
  (task 326) sits between Pi and the fake model as it does in front of Ollama.
- [x] tests/browser/journey.cjs: 15 steps in the owner's order, one workbench, soft checks (one finding never hides the
  next), and where a failure leaves the journey stuck the step does what the owner did next (Stop, “continue”, Retry
  Task) and says so. Each check names its finding. Watchers in every tab record any [CANARY] (plain, `code`, **bold**),
  every card shown, and “Loading” on the model button, across reloads.
- [x] Steps: J01 stalled stream (findings 1, 5) · J02 model switch refused/applied (4) · J03 Project Start “Habit
  Tracker” (14) · J04 prose questions, cards, [CANARY] (2, 5, 6) · J05 answers, Planning starts by itself (7, 9) · J06
  describe-only turn nudged, Goal, steps, Decisions (8, 10) · J07 Start Building, guide card, pseudo tool calls (11, 12,
  13) · J08 scope card, Add to Task (16) · J09 Stop and continue (17) · J10 verified check-in, Accept and Continue ·
  J11 queue: remove, edit, the edited one runs (325) · J10b Run on its own, risk notice, widened without asking, report ·
  J13 Ready to publish, every task verified and committed, roadmap done, the finished app's own code works · J14 the finished app in the Preview · J12 reloads
  (mid-stream, a waiting card, after Stop) and a second tab.
- [x] `journey` in run.py's SUITES and in `all`; docs/contributing-for-agents.md makes `run.py all` (journey included) a
  required check; without Pi the journey says "Not run" (exit 2), which fails `all`.
- [x] Live mode: `PI_JOURNEY_LIVE=1` runs the workflow against the real Ollama at 127.0.0.1:11434 with gemma4:e4b-mlx,
  scratch data and projects, generous timeouts, workflow checks, and journey-live-report.txt/.json in the kept scratch
  folder. Documented as opt-in, outside the required offline gate.
- [x] User stories US-240 to US-256 in docs/user-stories.md, coverage table updated.
- [x] The journey passes (fix/journey-green): every defect below is fixed in the product; nothing is marked xfail and no
  assertion was weakened (J01's limits follow the coordinator's watchdog decision, item 8).
- [x] J14, the finished app in the Preview: the Web app package's Preview runs `uv run uvicorn … --port N`; FastAPI would
  need a download (not approved), so the journey's uv stand-in serves that command with tests/fixtures/uvicorn-standin.py,
  a stand-in web layer over the project's own habit code (add a habit, tick it, streak, month). US-256.

## Defects the journey finds on harness-next (aa531f0, after tasks 324, 325, 326, 329, b54f3c8, 1ab6189 and cc308d0)

1. J02: a refused model switch's message is the toast at the bottom of the window, 822 px below the model menu.
2. J03: the project folder is “Habit Tracker” (spaces), not a slug.
3. J06: answers given on cards in Discussion are not the plan's Decisions (the plan card says 0 decisions).
4. J10b: with Run on its own, Gate records “Widened task 3 without asking: app/chart_days.py added”, yet the write itself
   is refused (G-015 “Gate asks the person… Stop here”); the task ends “not verified” and the run stops.
5. J13: the Ready to publish task has no `Files:` line, so every write in it is refused (G-015 “the task has no Files:
   line”); the request then ends with no check-in card at all; and its check needs `/audit`, which only terminal Pi
   offers: the Workbench has no way to run it.
6. J13: after Retry Task, task 3's commit leaves out tests/test_chart.py, written in the first attempt (it stays
   untracked); tasks/001-first-task.md's ticked boxes are never committed.
7. J14: because of 5, the app keeps the starter's name: the Preview's page says “Notes”, not “Habit Tracker”.
8. Decision for the person, not asserted: since 1ab6189 a turn after a tool gets model_start_seconds (900 s) before its
   first output, so the owner's exact stall (a tool finishes, the model never answers) fails after 15 minutes by default.
   J01 runs with a 10 s start limit and checks the mechanism.
9. Seen, not asserted: under Run on its own the next task starts with the bare user message “yes”.

## The fixes (fix/journey-green, US-290 to US-297)

- [x] 1, J02: a refused model switch is a note right under the model name (js/near-note.mjs, `#near-note`, the Toast's
  1-bit box, role status), not the toast at the bottom. Designer note in design/briefs/round-13.md. US-291.
- [x] 2, J03: the folder is a slug (harness/folder_name.py: lowercase, hyphens, Latin accents dropped, other scripts such
  as Japanese kept as Unicode letters with hyphens for spaces; never an existing folder: -2, -3…); the name stays as
  typed; Project Start shows “Folder: …” on step 1 and a Folder row in the Summary (`/api/project-start/folder`). Rename
  Project… follows the same rule, and its Undo restores both name and folder. US-290.
- [x] 3, J06: the person's answers on Discussion cards since the last plan are kept by Gate (gate/paperwork.py,
  `UNPLANNED`) and written into the next plan's first task's Decisions; the plan card counts them. Automatic answers are
  not carried. Task 293's test that kept them out is replaced. US-292.
- [x] 4, J10b: under Run on its own Gate answers its own scope question (Add to Task N, automatic, reported) and the same
  write goes through (gate/ledger.py): no “Stop here”. US-293.
- [x] 5, J13: the Ready to publish task has `Files: README.md, manifest.webmanifest, app/, static/, js/, messages/, tests/`
  (kit/publish-audit.md; an older task gets the line from kit/publish_audit.py); when its request ends the harness runs
  the publication audit itself (harness/audit.py `run`, the same code as terminal `/audit`), names a failed check on the
  check-in, and needs no Red (its evidence is the audit, whose “All tests pass” runs the suite). The last check-in says
  “Task N of N done: Ready to publish”, also when Run on its own accepted it (js/check-ins.mjs). US-294.
- [x] 6, J13: what an unverified attempt left uncommitted (`left` in the plan state) is the retry's too, so the retry's
  commit includes tests/test_chart.py. US-295.
- [x] 7, J14: follows from 5.
- [x] 8: watchdog (the coordinator's decision): `model_turn_seconds` (300 s, `PI_HARNESS_MODEL_TURN_SECONDS`) for a turn
  after a tool result; the first turn keeps `model_start_seconds` (900 s), mid-output silence `model_silence_seconds`
  (120 s). J01 runs with start 60 s and turn 8 s, so it proves the after-tool limit. US-297.
- [x] 8b (live, owner's build 7d7819e, qwen3.8:27b): a complete final answer was followed 120 s later by “Failed before
  Pi finished: the model stopped answering”, so no check-in and no Accept Anyway. A finished assistant message
  (message_end, stopReason stop, no tool call) now rests the model watchdog until the next turn; the harness's paperwork
  after it has the long silence limit. Fake Pi `TEST_ANSWER_THEN_PAPERWORK`; tests/test_chat_critical_path.py. US-297.
- [x] 9: Run on its own continues with “Continue the next approved task.” and the notice “Run on its own: task N
  accepted; the next approved task starts.”, never a bare “yes” (harness/extension.mjs). US-296.
- [x] Flaky under load: US-122 and chat.cjs's ⌘K focus check wait for the state, not a moment.

## One live run (gemma4:e4b-mlx, 2026-10-19, build budget 45 minutes)

L01 model menu, L03 Discussion (a question card answered, about 4 minutes) and L04 Planning (auto-started, a plan card in
14 s) passed; L02 failed on the folder slug. L05 failed: no task reached verified in 14 minutes. The model's plan was
about removing the starter's sample notes and renaming the app, not the habit tracker it had discussed; task 1 asked
“Pi wants to change a file outside task 1” four times in a row (each answered Add to Task 1), was retried twice, then
three “How should Pi proceed with this unclassified command?” cards came (task 323's area). README.md was left changed
and uncommitted. Repairs 0, nudges 0, one passing test run.

## For the person

`python3 tests/browser/run.py journey` now replays your session of 2026-10-18 from a stuck request to a finished app,
through the Workbench's own screens, with the real Pi and a scripted model. It is part of `run.py all`, so no change can
skip it. `PI_JOURNEY_LIVE=1` runs it with your local gemma4:e4b-mlx and leaves a short report.
