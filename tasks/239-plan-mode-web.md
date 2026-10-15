# 239: Plan mode in the web workbench (after the designer's round 10)

Kind: code

Blocked until the designer answers design/briefs/round-10.md and `design/` is re-synced (the person or Claude does the
re-sync; see design/README.md "Backup of the two artifacts"). Build from the boards and IMPLEMENTATION.md's "Round
10" section, not from this file. Design changes go through the designer: do not invent the cards.

## Expected pieces (names to confirm on the boards)
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
