# 273: The decision row: see and change any judgement, without being asked again

Kind: code

Plan 267, section 3 (the UX). Today the UI shows only "you", "auto" and "from the terminal"; code, Laya and the model
never appear as authors, and Laya's judgements are invisible (js/*.mjs inventory). Design changes go through the
designer first: this task starts from design/briefs/round-12.md part C, built from the re-synced canvas.

Files: design/briefs/round-12.md (part C, from plan 267 "For the designer"), harness/web_chat.py and agent_api.py
(GET /decisions, POST /decisions/<id>/change, person-only), js/decision-row.mjs (new), js/plan-cards.mjs,
js/done-row.mjs, js/chat.mjs, js/workspace.mjs, js/i18n.mjs and messages (en, ja), harness/terminal-render.mjs
(terminal form), tests/browser/design.cjs, tests/test_decision_api.py.

- [x] Add plan 267's "For the designer" list to design/briefs/round-12.md part C and wait for the designer's answer;
  re-sync the canvas into the repository. (Round 12: boards R12_Gate, T_Decisions, Ph12_Gate; HarnessNotice card.)
- [x] Red: API tests fail because decisions are not listed per request with author, rule or confidence and reason
  (tests/test_decision_rows.py); a settled decision has no "Change…" (stories.cjs US-119).
- [ ] Red: a browser test fails because the approval card does not show Kind and Files with their source (not built:
  the plan card's Kind and Files rows wait for task 268, which makes them code's, and the check-ins work of round 12).
- [x] One decision record for every surface: what was decided, the answer, the author (code with rule id, Laya with
  confidence, you, auto = the recommendation taken by Run on its own, model while any remain), why (one line from the rule
  or question), when, and whether it can still be changed (and what changing it redoes).
- [x] The decision row (designed): under each answer, a collapsed "N decisions" line; expanded, one row per decision
  with author badge and "Change…" (js/decision-row.mjs, GET /api/conversations/<id>/decisions, harness/decision_rows.py).
- [ ] The approval card and check-in use the same rows for Kind, Files, verification and recommendations. (The check-in's
  evidence data is served: each answer's `evidence.test_run` in the same API, for the check-ins card.)
- [x] "Change…" is a person-only control (POST /api/decisions/change in PERSON_ROUTES): a question's answer is recorded
  as the person's (`decision.change`), the task's Decisions line follows, and one request asks Pi to redo what depended
  on it; the phase changes through the phase route and an accepted task reopens through Reopen Task; other decisions
  keep Change… disabled with the reason.
- [ ] Cancel what depended on a changed decision and offer the re-plan card (needs task 270's decisions store and task
  271's re-plan card).
- [ ] Run on its own's report lists every automatic decision as rows, grouped by task, each with "Change…".
- [x] Beginner and expert detail: beginners see the answer and a plain author ("checked by the workbench", "you", "on its
  own"); experts (Settings) see rule ids, Laya confidence and the evidence link.
- [x] Terminal: `/decisions` lists the request's decisions in the same form (`--all` for the expert form; `/decisions
  change <name>` points to the web's Change… for now).
- [ ] Green: the API tests, the browser design suite at phone and desktop sizes, light and dark, English and Japanese
  pass; the full workflow passes.

Acceptance: every judgement in plan 267's inventory that is shown to the person uses the decision row, names its author,
and can be changed in one place.

## Built in round 12 (step 7), and what is left

Also built with it: batch questions keep their numbers (“Question 2 of 3”, J-51 passes Gate's choice record) and Take All
Recommendations answers the rest of the batch with their first options as the person's answers; a question Pi asks
during a task reads “Pi asked a question · task N”; request ids now reach the phase, Start Building, check-in and reopen
records and Gate's events (the review's traceability finding), a chained request keeps its job's id as a prefix, and a
refusal's decision names its Gate event so the expert row shows the command without the log keeping it.

Tests: tests/test_decision_rows.py (rows, detail, evidence, request ids, Change…, the batch, the setting, /decisions),
tests/harness/decisions-command.test.mjs (/decisions through the console), stories.cjs US-119, US-120, US-121.

Not built here: Run on its own's report as decision rows; the plan approval card's Kind and Files rows; the re-plan card
and the scope-widening card (tasks 268 and 271 decide them); Laya's plain beginner words ("checked by the workbench")
are the board's source tags instead. Needs the designer: the expert row's small rule, confidence, time and command; the
disabled Change… with its reason line; the How to Install dialog.

## Scenarios

### US-new the approval card shows each task’s Kind and Files with who set them
Given Pi proposed a plan in Planning
When I open the plan card
Then each task's Kind and Files are decision rows naming the workbench and its rule, with Change… where it can be changed

### US-new changing a decision a task depended on stops that work and offers “Re-plan this task?”
Given a task in progress that followed my answer “Store notes in SQLite”
When I choose Change… on that answer and pick a JSON file
Then the work that depended on it is cancelled and the “Re-plan this task?” card is shown

### US-new Run on its own’s report lists every automatic decision by task, each with Change…
Given Run on its own finished two tasks
When I open its report
Then every decision it took is a row under its task, with its author and Change…
