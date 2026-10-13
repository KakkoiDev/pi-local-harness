# 75: Pi Workbench System 1, comments

Kind: code

Request 2026-10-13: "implement this new design." Build step 8 of [design/IMPLEMENTATION.md](../design/IMPLEMENTATION.md) § 12 (§ 6.2 Selecting text, Markers and inline threads, Review window, Delete and undo; § 9 soft delete).

- [x] Red (`tests/test_documents.py`): `delete_comment` sets `deleted` to an ISO time and keeps the comment; the Markdown thread says `Deleted`; a deleted comment cannot be sent to Pi; restoring sets `deleted` to null; a comment sent to Pi cannot be deleted; an unknown id is "not found".
- [x] `harness/documents.py` `delete_comment`, `harness/web_chat.py` route `/api/documents/delete-comment {path,id,deleted}`. Never hard-deletes.
- [x] Red (`tests/browser/chat.cjs`): selecting text shows `#selection-bar`, ⇧⌘M focuses the composer; the passage gets `.pw-anchor` and a `.pw-mark` named "Comment 1" whose number is not block text; the filter reads "Open 1" and the item "1 · Not sent to Pi"; the marker opens the inline `.pw-thread`; Ask Pi turns the anchor `--sent`, the thread says "Sent to Pi" and has no Delete; Reply shows in the thread; Delete shows the toast, ⌘Z brings the comment back; Deleted filter lists it with Restore; Resolve hides the marker, Show resolved in the text shows `.pw-mark--resolved`; ⌥⌘] marks the Review item current and opens its thread.
- [x] `js/workspace.mjs`: comments in document order, numbered, Review items `.pw-review-item` under `#comment-filter` with counts, actions by state (Open: Resolve, Delete if unsent; Resolved: Reopen; Deleted: Restore), one inline thread at a time, `#show-resolved` (persisted), `stepComment`, selection float bar.
- [x] `js/chat.mjs`: `toast(text,undo)` with Undo ⌘Z (8 s); commands `comment-selection`, `ask-selection`, `toggle-resolved`, `next-comment`, `previous-comment`, `undo-toast`.
- [x] `index.html`: `#selection-bar` float bar replaces the ruler's `#selection-comment`; `#show-resolved` checkbox in the Review window.
- Marker numbers are CSS `::after` content, so typing in a commented block never writes the number into the file.
- Not done here: the phone selection bar at the bottom of the screen (step 12, task 79) and Pi's suggested change (§ 9 phase 2, task 80).
- Not tested: Ask Pi About Selection…, Previous Comment, the toast's Undo button by click.
