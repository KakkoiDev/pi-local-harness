# 327: The golden journey: the owner's session as one E2E test

Kind: code

Request 2026-10-18 (the owner): "fix critical issues and test workflow from beginning. Use E2E test to redo all the
things you did in this test run. change model, create new app, ask model questions, etc… so many tokens sank in this
project and it is more bugged than 3 days ago". Then: "make sure that the user story you did today is permanently
recorded as an E2E test", "continue the test so that you can go further and actually finish something", and "the e2e
model will use the 4b model for speed".

Files: tests/browser/journey.cjs, tests/browser/journey/*.json, tests/fixtures/fake-ollama.cjs, tests/browser/run.py,
tests/test_browser_runner.py, docs/user-stories.md, docs/contributing-for-agents.md

- [x] A fake model, not a fake Pi: tests/fixtures/fake-ollama.cjs answers as Ollama does (`/api/tags`, `/api/show`,
  `/api/ps`, `/api/generate` for the menu bar's model switch; Pi's OpenAI-compatible stream with text, thinking, real
  `tool_calls`, a stalled stream left open, a slow stream), scripted per step by tests/browser/journey/*.json (each turn
  tied to the input it follows: the person's words, a nudge, a tool result). The real Pi 1.1.0 and the real harness
  extension run, so the extension's defects (pseudo tool calls, nudges, [CANARY] drift, guide questions, scope pauses)
  are tested, not the fake Pi's imitation of them. Pi's HOME and PI_CODING_AGENT_DIR are scratch; the repair proxy
  (task 326) sits between Pi and the fake model as it does in front of Ollama.
- [x] tests/browser/journey.cjs: 14 steps in the owner's order, one workbench, soft checks (one finding never hides the
  next), and where a failure leaves the journey stuck the step does what the owner did next (Stop, “continue”, Retry
  Task) and says so. Each check names its finding. Watchers in every tab record any [CANARY] (plain, `code`, **bold**),
  every card shown, and “Loading” on the model button, across reloads.
- [x] Steps: J01 stalled stream (findings 1, 5) · J02 model switch refused/applied (4) · J03 Project Start “Habit
  Tracker” (14) · J04 prose questions, cards, [CANARY] (2, 5, 6) · J05 answers, Planning starts by itself (7, 9) · J06
  describe-only turn nudged, Goal, steps, Decisions (8, 10) · J07 Start Building, guide card, pseudo tool calls (11, 12,
  13) · J08 scope card, Add to Task (16) · J09 Stop and continue (17) · J10 verified check-in, Accept and Continue ·
  J11 queue: remove, edit, the edited one runs (325) · J10b Run on its own, risk notice, widened without asking, report ·
  J13 Ready to publish, every task verified and committed, roadmap done, the finished app's own code works · J12 reloads
  (mid-stream, a waiting card, after Stop) and a second tab.
- [x] `journey` in run.py's SUITES and in `all`; docs/contributing-for-agents.md makes `run.py all` (journey included) a
  required check; without Pi the journey says "Not run" (exit 2), which fails `all`.
- [x] Live mode: `PI_JOURNEY_LIVE=1` runs the workflow against the real Ollama at 127.0.0.1:11434 with gemma4:e4b-mlx,
  scratch data and projects, generous timeouts, workflow checks, and journey-live-report.txt/.json in the kept scratch
  folder. Documented as opt-in, outside the required offline gate.
- [x] User stories US-240 to US-255 in docs/user-stories.md, coverage table updated.
- [ ] The journey passes. Not yet: it fails on real product defects (below). Nothing is marked xfail.
- [ ] The finished app in the Preview. Not possible offline: the Web app package's Preview runs FastAPI through `uv run
  uvicorn`, and FastAPI is not installed without a download (not approved). J13 runs the project's own code instead.

## Defects the journey finds on harness-next (da0063f, after tasks 324, 325, 326)

1. J02: a refused model switch's message is the toast at the bottom of the window, 822 px below the model menu.
2. J03: the project folder is “Habit Tracker” (spaces), not a slug.
3. J06: answers given on cards in Discussion are not the plan's Decisions (the plan card says 0 decisions).
4. J10b: with Run on its own, Gate records “Widened task 3 without asking: app/chart_days.py added”, yet the write itself
   is refused (G-015 “Gate asks the person… Stop here”); the task ends “not verified” and the run stops.
5. J13: the Ready to publish task has no `Files:` line, so every write in it is refused (G-015 “the task has no Files:
   line”); and its check needs `/audit`, which only terminal Pi offers: the Workbench has no way to run it.
6. J13: after Retry Task, task 3's commit leaves out tests/test_chart.py, written in the first attempt (it stays
   untracked); tasks/001-first-task.md's ticked boxes are never committed.
7. Seen, not asserted: under Run on its own the next task starts with the bare user message “yes”.

## For the person

`python3 tests/browser/run.py journey` now replays your session of 2026-10-18 from a stuck request to a finished app,
through the Workbench's own screens, with the real Pi and a scripted model. It is part of `run.py all`, so no change can
skip it. `PI_JOURNEY_LIVE=1` runs it with your local gemma4:e4b-mlx and leaves a short report.
