# 146: Rename, move and trash files and folders

Kind: code

Request 2026-10-13: "no way to move/rename/delete a file in the file tree", then "file & directory".

- [x] Red (unit): `DocumentStore.move()` renames or moves a file or folder inside its project, keeps a file's extension when none is typed, creates folders as needed, never overwrites, never escapes the project or moves a folder inside itself; comments follow their files. `delete()` trashes any project file or folder, not only Markdown.
- [x] `POST /api/documents/move` (`path`, `name`).
- [x] Select, then command (one button, no right-click; the person's correction the same day): clicking a folder row selects it (`aria-current="true"`) as well as opening or closing it; clicking a file opens it. File › Rename or Move… and Move to Trash… (⌘⌫) act on the selected folder, else the open file, any type.
- [x] The dialog starts from the current path and names the move ("Moves the file “drafts/idea.md” to “drafts/plan”."); an open file that moves stays open at its new path.
- [x] Green (browser): rename the open file, select and move a folder with the open file inside, select and trash a folder.

Not designed yet: the canvas never drew a selected folder row or these two commands, and the phone has no File menu, so on a phone files and folders cannot be renamed or trashed yet. Ask the designer in the next brief.
