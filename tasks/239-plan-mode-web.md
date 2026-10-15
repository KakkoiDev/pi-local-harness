# 239: Plan mode in the web workbench (after the designer's round 10)

Kind: code

Unblocked 2026-10-16: the designer answered (canvas page "Plan mode"; cards ChoiceCard, PlanCard, CheckInCard,
AwayCard; IMPLEMENTATION.md round 10 and its version 2 section) and `design/` was re-synced. Formerly blocked until the
designer answered design/briefs/round-10.md and `design/` was re-synced (the person or Claude does the
re-sync; see design/README.md "Backup of the two artifacts"). Build from the boards and IMPLEMENTATION.md's "Round
10" section, not from this file. Design changes go through the designer: do not invent the cards.

## The pieces (from the designer's answer; the boards are the source)
- ChoiceCard ("Question 1 of 3", inline also on the phone; the composer answers "Something else", Send reads Answer).
- PlanCard (Change… fills the composer; old versions shrink to one line; 7 tasks max, else 5 + "and N more").
- CheckInCard = the DoneRow (js/done-row.mjs) with Continue / Review First / Stop Here.
- AwayCard (the end-of-run report, four sections).
- "Run on its own": the checkbox beside Send, the Agent menu item (⌥⌘A), Settings; the risk alert; "Working · on its
  own" in the status.
- Decisions and "Plan approved" lightly rendered in Work.
- Note: the MenuBar card and IMPLEMENTATION.md round 10 item 4 still say "per project"; the version 2 section and the
  AwayCard card say one setting for all projects, which the person decided. Follow version 2.

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
