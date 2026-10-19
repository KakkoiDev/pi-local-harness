# 280: The acceptance app: notes with priority, offline, from one source

Kind: code

Plan 253, "A concrete example" and the proof sequence. The web starter's sample grows into the app that proves the same
source runs as all three packages, so every new project starts from a proven base.

Files: kit/starter/app/logic/notes.py (priority rules), kit/starter/app/data/db.py, kit/starter/migrations/002-priority.sql,
kit/starter/app/web/ (edit, priority, list order), templates and messages (en, ja), kit/starter/tests/logic,
kit/starter/tests/contract, kit/starter/packaging.json (targets: server, web, mobile; capability: offline),
kit/starters.json.

- [ ] Red: logic tests fail for priority (low, normal, high; default normal; unknown values refused with a message key),
  ordering (high first, then newest) and editing (title rules apply on edit); contract tests fail for edit, set
  priority, list order, 422 on an empty title, and reload persistence.
- [ ] Implement the rules once in app/logic, the queries in app/data with a numbered migration, the routes and fragments
  in app/web; English and Japanese messages.
- [ ] Offline capability declared in packaging.json; the checks of task 278 pass for server, web and mobile.
- [ ] Green: logic and contract tests pass on the fake, server and browser adapters; strict pyright passes; the full
  workflow passes.

Acceptance: one implementation of the priority rule, passing the same behaviour tests on every adapter; nothing in the
app knows which target it runs on.

## Scenarios

### US-new in a new web app, a note gets a priority, and high notes list first, then the newest
Given a new project from the web starter
When I add three notes and set one to high priority
Then the high note is listed first, the others are normal and newest first, and the order is the same after a reload

### US-new editing a note to an empty title shows the message and keeps the note
Given a note “Buy milk” in a new web starter project
When I edit it and save an empty title
Then the title message is shown and the note still reads “Buy milk”
