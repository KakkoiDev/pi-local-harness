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

- [ ] Saves never overlap; Undo only acts on the document it came from; queued comments read as sent; Review re-renders on job and text changes; re-selecting a project keeps Review.
- [ ] Polls are shared, not skipped; `focusedBlock` resets per document; trashing the open file clears Review and its draft; text file saves keep the revision; file lists ignore stale responses; new blocks keep their blank line; Send Unsent re-enables after a failure; comments refresh only the page they came from; Comment on a phone opens the sheet.

## App shell and Pi extension

- [ ] One agent at a time really holds (the lock refuses the turn); recovery works for web requests; ⌘Return sends only from the chat composer; the chat transcript is not re-announced; Gate rows reachable by keyboard; Show in Gate clears the project scope; stale chat selections dropped; one failed conversation fetch is not "offline"; the poll leaves recording and dictation alone; the microphone is released on errors.

## Design and markup

- [ ] New Project folder list; phone Gate and Activity rows; duplicate `phone-title` id; Add & Ask Pi in the composer; block and thread class names from the cards; chat.css duplicates of components.css removed; tablet columns and widths; Window menu order; copy from the boards.

## Tests and docs

- [ ] Browser suites fail when the server dies; no `tailscale serve` from tests; docs for the model choice and Gate history; `config` → `chore` in harness/AGENTS.md; ROADMAP state for task 130; verify_workflow flags open lines whose task is complete.
