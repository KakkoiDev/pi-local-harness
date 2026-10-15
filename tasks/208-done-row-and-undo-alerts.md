# 208: The DoneRow under each answer, and the undo alerts

Kind: code

Round 7 (points 7, 8, 12; DoneRow card; boards P_DoneParts, P_Undo, P_UndoConflict, P_UndoUnsaved, P_Undone).

- [x] Server (python, `tests/test_undo.py`): the row's plain words from the task's "For the person" section (or the
  request's name without "(task 002)"), its time; an undo or a redo quotes the request; the overlap names the later
  request and its time; Save Them, Then Undo ("Your edits · 14:38", then the undo); undoing an undo is a Redo
  ("Redo: …", "Redone: …"); the undo's own row in the chat; "undone at" / "redone at".
- [x] Pi writes "For the person": the harness's note at the first change and the paperwork paragraph of AGENTS.md
  (installed copies upgraded, `tests/test_plh.py`).
- [x] `js/done-row.mjs`: ✓ Done · N files · time, the plain words, Show in Preview, Undo This Request… (disabled once
  undone); the Caution alert with the files that change back; the Note alerts for "changed again" (Ask Pi Instead) and
  unsaved edits (Save Them, Then Undo); ↶ Undone rows with Redo Request…. `ask()` gained an extra part.
- [x] Tried in the browser: undo, the row's "undone at", Redo, and the "changed again" alert naming the later request.
- [ ] G-012 into the row ("! Not verified"): a change that is not verified is not committed today, so it has no Undo.
  Waiting for the person: commit unverified changes too (marked), or show the row without Undo.
- [ ] The lesson line (task 211).
