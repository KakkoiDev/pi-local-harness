# 273: The decision row: see and change any judgement, without being asked again

Kind: code

Plan 267, section 3 (the UX). Today the UI shows only "you", "auto" and "from the terminal"; code, Laya and the model
never appear as authors, and Laya's judgements are invisible (js/*.mjs inventory). Design changes go through the
designer first: this task starts from design/briefs/round-12.md part C, built from the re-synced canvas.

Files: design/briefs/round-12.md (part C, from plan 267 "For the designer"), harness/web_chat.py and agent_api.py
(GET /decisions, POST /decisions/<id>/change, person-only), js/decision-row.mjs (new), js/plan-cards.mjs,
js/done-row.mjs, js/chat.mjs, js/workspace.mjs, js/i18n.mjs and messages (en, ja), harness/terminal-render.mjs
(terminal form), tests/browser/design.cjs, tests/test_decision_api.py.

- [ ] Add plan 267's "For the designer" list to design/briefs/round-12.md part C and wait for the designer's answer;
  re-sync the canvas into the repository.
- [ ] Red: API tests fail because decisions are not listed per request with author, rule or confidence and reason; a
  browser test fails because the approval card does not show Kind and Files with their source, and a settled decision has
  no "Change…".
- [ ] One decision record for every surface: what was decided, the answer, the author (code with rule id, Laya with
  confidence, you, auto = the recommendation taken by Run on its own, model while any remain), why (one line from the rule
  or question), when, and whether it can still be changed (and what changing it redoes).
- [ ] The decision row (designed): under each answer, a collapsed "N decisions" line; expanded, one row per decision
  with author badge and "Change…"; the approval card and check-in use the same rows for Kind, Files, verification and
  recommendations.
- [ ] "Change…" is a person-only control (the review's P0-2 repair): it records the person's answer in the decisions
  store (task 270), cancels what depended on it, and offers the re-plan card when needed; the same decision is never asked
  again unless the person changes it.
- [ ] Run on its own's report lists every automatic decision as rows, grouped by task, each with "Change…".
- [ ] Beginner and expert detail: beginners see the answer and a plain author ("checked by the workbench", "you", "on its
  own"); experts (Settings) see rule ids, Laya confidence and the evidence link.
- [ ] Terminal: `/decisions` lists the request's decisions in the same form.
- [ ] Green: the API tests, the browser design suite at phone and desktop sizes, light and dark, English and Japanese
  pass; the full workflow passes.

Acceptance: every judgement in plan 267's inventory that is shown to the person uses the decision row, names its author,
and can be changed in one place.
