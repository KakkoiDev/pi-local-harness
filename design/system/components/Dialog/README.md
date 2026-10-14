# Dialog

A modal dialog: the double frame (`shadow-dialog`), no title bar, a bold title, fields, and buttons on the right with the default last.

- Use `<dialog class="pw-dialog">` with `showModal()`; Esc cancels; focus starts in the first field.
- Dialogs: New Project…, Add Existing Folder… (folder chooser), New Page / New Task (name), Settings…, Desktop Pattern…, About Pi Workbench.
- A destructive secondary action goes far left (`.pw-dialog__danger`).
- **Rename or Move** (File › Rename or Move…): one field, mono, prefilled with the current path and the name selected (not the extension). Label “New name or path in <project>”. Help names both ends: “Moves the file “drafts/idea.md” to “plans/phone-review.md”. Folders are created as needed. Its comments move with it.” The default button reads **Rename** when only the name changes and **Move** when the folder changes. Errors in the help line: “A file named … already exists.” Board: W_Rename.
- Folders to the Trash: “Move the folder “drafts” and its 3 files to the Trash?” / “Their comments go with them. You can restore them from the data folder’s .trash.”, Cancel (default) / Move to Trash. Board: W_TrashFolder.
- Rename Project: no address line (addresses use the project id). Errors (“A folder named “…” already exists in ~/code.”) replace the help line and keep the dialog open with the field selected; a notice after the dialog closes is too late to fix the name.
