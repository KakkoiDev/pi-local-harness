# 150: Fix what the 2026-10-14 audit found

Kind: code

Request 2026-10-14: "I want you to do a full audit of the codebase, you are starting to drop the level of coding. let's clear all issues now before they accumulate" and "do a full audit of the app". Six read-only reviews: Python backend, document editor JS, app shell and Pi extension JS, markup/CSS against the design, tests/docs/process, and every screen at desktop, tablet and phone width.

## Backend

- [x] Malformed requests (comment not an object, attachments not files, document not text) are refused before the queue; a `null` comment means none; a record that cannot be saved never enters the queue; one failing job no longer stops the worker.
- [x] Attachments live in one payload file per job, written when added or joined, deleted when the job ends or is cancelled; joining a waiting message after a restart keeps its earlier attachments.
- [x] A registered folder that is gone is listed as missing instead of failing the whole workspace; Remove from List (`/api/projects/forget`) never touches the folder.
- [x] Gate protocol state is locked and saved through unique temp files (parallel `/gatekeep` and `/audit`).
- [x] While a model loads, the queue waits (no job on the old model) and a second switch is refused; capability misses are cached for a minute; one `models.effective()` for web and plh.
- [x] Trash moves the threads with the file (`<id>-<name>.comments/`), works across drives; a new or moved file never inherits old threads.
- [x] An answer or send for a page that moved fails with a clear message; a file or folder Pi is answering about cannot be moved or trashed until that request ends.
- [x] The first read of an old JSON comment file is normalised; `create()` with an unslugged name leaves no stray project; saving through an in-project link writes the real file.
- [x] GET errors say what happened (400 with the message, 503 when Ollama is down) instead of "Not found"; a transcription timeout is a clear error; stale prompt text and docstrings fixed.
- [x] Tests import `tests/isolation.py` first: no real Ollama, tailnet or live harness from the test process.
- [ ] Not done, low: `gate_today` counts only the 200 events in memory; an interrupted comment job leaves the comment undeletable.

## Front end (document editor, comments, Review)

- [x] Saves never overlap; Undo only acts on the document it came from; queued comments read as sent; Review re-renders on job and text changes; re-selecting a project keeps Review.
- [x] Polls are shared, not skipped; `focusedBlock` resets per document; trashing the open file clears Review and its draft; text file saves keep the revision; file lists ignore stale responses; new blocks keep their blank line; Send Unsent re-enables after a failure; comments refresh only the page they came from; Comment on a phone opens the sheet.
- [x] A missing project shows "folder missing" (dimmed, still choosable) and offers Remove from List; the document's "View task" is "Show in Activity" through one `openJob`; a running job's time keeps moving; ⌥] from Deleted re-renders Review.
- [ ] Accessibility: rows inside `role=list` without listitems (Projects, Files), Activity rows as `row` without a table, `aria-current` used for selection, the phone Plan/Files segment and the comment filter without arrow keys.

## App shell and Pi extension

- [x] One agent at a time really holds (the lock refuses the turn); recovery works for web requests; ⌘Return sends only from the chat composer; the chat transcript is not re-announced; Gate rows reachable by keyboard; Show in Gate clears the project scope; stale chat selections dropped; one failed conversation fetch is not "offline"; the poll leaves recording and dictation alone; the microphone is released on errors.
- [x] Also: the canary check skips tool-call preambles; an image a non-vision model cannot see no longer swallows the prompt; web jobs no longer show the startup banner as progress; the menu's thinking choice wins over models.json; Event Info (menu and close box) and the zoom box work; the model menu closes with Escape while loading and gives up after 15 s; Activity and Gate are grids with column headers; Pi's lists keep their numbers, lists under a line of text render, multi-line quotes stay one quote; Escape only closes an open sheet.
- [x] Checked and kept: the extension's once-per-turn compaction guard is not dead code (agent_end can repeat before a new turn; its test says so), and `ThoughtWatch.feed`'s loop check is tested API.

## Design and markup

- [x] New Project / Add Existing Folder: real folder rows (icon, name, full height, the list scrolls), the path field gets the room, the help names the result; a new project opens its Chat (F1). Mono fields keep the mono face (16px+ on phones).
- [x] Activity and Gate columns as C_ActivityDesk / C_GateDesk; at tablet width Gate hides Check and From (G_Tablet) and Activity keeps the request; the Projects window is 220px there; Review starts closed at tablet width (W_Tablet).
- [x] A link in a selected row inverts with it; in Activity or Gate only the Agent row is current; the composer measures itself when shown (no collapse after Activity); the selection bar goes away with a mode or view change; the thread help sits in the actions and only while Ask Pi is offered.
- [x] Comment composer: Clear Selection · Add & Ask Pi · Add Comment with "Comments stay with the file until you choose Ask Pi."; whole-file box "The answer appears here, not in Chat."; thread state uses `.pw-thread__state`, a sent, unanswered thread links Show in Activity; Window menu starts with Chat and Work; Open on Phone puts the QR first with the board's copy on `.pw-qr`; π menu and About name Gate, Web and the data folder; New File help as Dialogs2; the failed-job line is `.pw-alert-line`; dead `.activity-count`, reference "NEW:" comments and the favicon 404 gone.
- [x] Block types use the card names and one order everywhere (Paragraph, Heading, Task, Bullet, Number, Quote, Code, Raw Markdown; the phone grid shows them all); toasts read "Task deleted."; duplicate `phone-title` id removed; info bars as drawn.

- [ ] New Project folder list; phone Gate and Activity rows; duplicate `phone-title` id; Add & Ask Pi in the composer; block and thread class names from the cards; chat.css duplicates of components.css removed; tablet columns and widths; Window menu order; copy from the boards.

## Tests and docs

- [x] Browser suites fail when the server dies (proven: a dead server used to exit 0, now 1); no `tailscale serve` from tests; docs for the model choice, Gate history, comments, Activity and trash; `config` → `chore` in harness/AGENTS.md; ROADMAP state for tasks 130, 117, 118; verify_workflow flags open lines whose task is complete. Also: tests run from any folder and as single modules (`tests/isolation.py` sets the folder and path), extension tests never read the real `~/.pi/agent`, chat isolation checks use text only one project has, browser test blocks get their own scope, the file list is shared per project (a background poll could make a project switch open no document), a diagnostic prints state if the intermittent deep-link step fails again.
