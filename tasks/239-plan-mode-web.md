# 239: Plan mode in the web workbench

Kind: code

The design is in the repo (read docs/handoff/gpt-sol.md, "Reading the design", first). Build from these files only:

- Words: design/IMPLEMENTATION.md, sections `## 2026-10-16 · Round 10: Pi discusses before it builds (plan 236)` and
  `### Round 10, version 2 (the person's decisions)` (version 2 wins where they differ).
- Boards (design/canvas/, page `r10`), in this order:
  - R10_Answers: the designer's answers, read first.
  - R10_Choice, R10_ChoiceStates: ChoiceCard and its states.
  - R10_Plan, R10_PlanStates: PlanCard and its states.
  - R10_CheckIn, R10_CheckInStates: CheckInCard (the waiting DoneRow) and its states.
  - R10_AutoOn: the risk alert (shown every time, per version 2, whatever the board's title says).
  - R10_AgentMenu: Agent › Run on Its Own ⌥⌘A, the status "Working · on its own".
  - R10_Away: the end-of-run report (AwayCard).
  - R10_Work: Decisions and "Plan approved" in the task file.
  - Ph10_Choice, Ph10_Plan, Ph10_CheckIn, Ph10_Away: the phone versions.
  - (T_PlanMode is the terminal: task 240.)
- Components: design/system/components/ChoiceCard, PlanCard, CheckInCard, AwayCard (README.md and preview.html), DoneRow
  (the check-in reuses it), MenuBar (Agent menu), Dialog (the alert pattern). CSS: design/components.css, the block
  headed "Rounds 9–10: updates, plan mode (plan 236)" (`.pw-card…`, `.pw-tag`, `.pw-option`, `.pw-plan…`, `.pw-facts`,
  `.pw-auto`).
- Code to extend: js/chat.mjs (messages, composer), js/done-row.mjs (the DoneRow), index.html (the Agent menu, the
  composer, Settings), messages/ja.json (Japanese), tests/browser/design.cjs (tests; the phone block for Ph10_*).

## The pieces (from the designer's answer; the boards are the source)
- ChoiceCard ("Question 1 of 3", inline also on the phone; the composer answers "Something else", Send reads Answer).
- PlanCard (Change… fills the composer; old versions shrink to one line; 7 tasks max, else 5 + "and N more").
- CheckInCard = the DoneRow (js/done-row.mjs) with Continue / Review First / Stop Here.
- AwayCard (the end-of-run report, four sections).
- "Run on its own": the checkbox beside Send, the Agent menu item (⌥⌘A), Settings; the risk alert; "Working · on its
  own" in the status.
- Decisions and "Plan approved" lightly rendered in Work.

## First list (kept for the record)
- The choices card in the chat (radio rows, the recommended first with its tag, "Something else…" with a text field,
  Answer); answered and auto-accepted states.
- The plan card (Goal, tasks with Done when, decisions; Approve Plan / Change…; Open the Plan).
- The check-in card after a task.
- The Auto-accept toggle (composer and π), and its "Auto" state in the status.
- "While you were away" and "Needs you".
- The phone versions (sheets) and the Japanese text (messages/ja.json).

## Steps
- [ ] Re-read IMPLEMENTATION.md round 10; list every board and build each, with tests in tests/browser/design.cjs
  (the phone block for phone boards). Copy how round 8 was built (task 222) and tested.
- [ ] Green on `python3 tests/browser/run.py all`.
