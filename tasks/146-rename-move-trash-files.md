# 146: Rename, move and trash files and folders

Kind: code

Request 2026-10-13: "no way to move/rename/delete a file in the file tree", then "file & directory".

- [x] Red (unit): `DocumentStore.move()` renames or moves a file or folder inside its project, keeps a file's extension when none is typed, creates folders as needed, never overwrites, never escapes the project or moves a folder inside itself; comments follow their files. `delete()` trashes any project file or folder, not only Markdown.
- [x] `POST /api/documents/move` (`path`, `name`).
- [x] Files window: right-click a file or folder row (or the keyboard's context-menu key) opens `#file-menu`: Open (files only), Rename or Move…, Move to Trash…. File › Rename or Move… and Move to Trash… act on the open file, any type.
- [x] The dialog starts from the current path and names the move ("Moves the file “drafts/idea.md” to “drafts/plan”."); an open file that moves stays open at its new path.
- [x] Green (browser): rename a file, move a folder with the open file inside, File › Rename or Move…, trash a folder.

Not designed yet: the canvas has no row menu, and on a phone there is no right-click (iOS has no long-press context menu). Ask the designer for the row's action affordance on desk and phone (a ⋯ on the focused row, or the PhoneEdit-style sheet) in the next brief.
