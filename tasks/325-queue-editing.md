# 325: Read, edit and remove the messages waiting for Pi

Kind: code

Request 2026-10-18: "I want to be able to read and update/remove queued messages to the agent......... critical feature. add e2e of course".

- [x] Red (unit): tests/test_queue_editing.py failed before the change (no `QueueRefusal`, no edit or remove).
- [x] Queue: `WorkQueue.edit(id, version, message, remove_files)` and `WorkQueue.remove(id, version)` under the same lock as the worker's claim; every job has a `version` (a joined message bumps it too); a stale version, a started or a removed message is refused (`QueueRefusal`: changed, started, removed, gone); a removed message is Cancelled ("Removed by you before it started"), never runs, and its attachment payload is released.
- [x] Server: `POST /api/jobs/<id>/edit` and `/api/jobs/<id>/remove`, person-only (task 261); a refusal answers 409 with `refused` and the message as it is now; each edit and removal is a `queue_edit` / `queue_remove` row in decisions.jsonl by the person, without the words.
- [x] Chat: js/queue-list.mjs under the transcript (`#queue`): each waiting message of the chat in order, full text, attachments, "Queued HH:MM", Edit (text, drop attachments, Save/Cancel, ⌘Return/Esc) and Remove… (alert, Keep Waiting default); "Next: N requests waiting in …" folds the list (remembered per browser); a refused edit puts the words back in the composer with the server's sentence.
- [x] Activity: waiting messages were already listed with their text and files; Cancel… now goes through the person's remove route (logged, refused once started). Agent › Cancel Waiting Request… too.
- [x] Terminal Pi: `/queue edit <id> <words>` and `/queue remove <id>` (harness/queue-console.mjs), asked first, through the person secret only the person's terminal holds; Pi's harness tool cannot change the queue. Tab completes `edit <id>` and `remove <id>`.
- [x] Japanese strings (messages/ja.json); guide (harness/GUIDE.md), console guide (harness/CONSOLE.md), user stories US-220 to US-226.
- [x] Designer note: design/briefs/round-13.md, "Waiting messages (task 325)".
- [x] Green: tests/test_queue_editing.py (12), stories.cjs US-220 to US-225, stories.test.mjs US-226, the workflow check and all browser suites.

Not done: Reorder (optional in the request). Moving a message ahead of another would also have to respect the rule that
an answer to a question goes before the chat's other waiting messages (task 290); with plain messages joining the one
waiting message there is rarely more than one to reorder, so it was left out.

## For the person

Under the running request you now see every message that waits for Pi, with its attachments and time. Edit changes it
in place; Remove… takes it out (Pi never gets it). A message Pi already started, or one changed in another window, is
never overwritten: your words go back into the composer. In terminal Pi: `/queue edit <id> <words>`, `/queue remove <id>`.
