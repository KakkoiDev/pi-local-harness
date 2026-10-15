# 203: Undo This Request: a new commit that reverses the harness's commit for a request

Kind: code

Plan 198 ("Preview and undo for people who do not read code"); the button is in [design/briefs/app-preview.md](../design/briefs/app-preview.md).
Request 2026-10-15: "go for it" (build while the course is written).

- [x] Red (python, `tests/test_undo.py`, `tests/test_paperwork.py`): the harness's commit is returned when it commits;
  the preview says the title and each file's lines added and removed; undo makes a new commit by Pi Workbench
  ("Undo: <title>", "This reverts commit …"), keeps history, and a second undo says "already undone"; only commits the
  harness made; unsaved edits in those files are never overwritten; a conflict changes nothing and names the files;
  the workbench waits while Pi works in the project; the answer learns its commit from the harness's note.
- [x] `harness/undo.py` (`preview`, `undo`); `gate/paperwork.py` returns the commit; the extension's "Committed" note
  ends "· committed as <commit>"; the web side stores `commit` on the answer and emits a `committed` event;
  `POST /api/undo {project, commit, preview}`.
- [x] Why the commit and not the request id: a chat's requests share the conversation's id, so only the commit names
  one request.
- [x] Green: verify_workflow. (The extension's note line has no Node test of its own: the request-end path is not
  covered by the Node suite today; the Python side parses the exact text.)
- [ ] The button under each answer, once the canvas has it.
