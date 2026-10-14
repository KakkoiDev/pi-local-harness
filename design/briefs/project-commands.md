# Brief: rename, move, remove and trash a project

Date: 2026-10-14. Asked by the person: "how to rename and move project or even delete then? is it possible from the web interface?" Today it is not. You can only create a project (New Project…, Add Existing Folder…) and, when a project's folder has gone missing, Remove from List. Rename or Move… and Move to Trash… act on files and folders inside a project, never on the project itself. Please draw the project versions. Nothing is built yet (task 154).

## What exists, for reference

- A project is a folder on the Mac with a stable id. Its chat, comments, Activity records and Gate history hang off that id, not off the folder path. So renaming or moving the folder keeps all of them.
- **Select, then command.** Files and folders work this way (round 4, item 2): click a row to select it (inverted, `aria-current="true"`), then choose a command from the File menu. No right-click-only actions. A command that cannot act is dimmed, never hidden.
- **The project's name** is what the Projects window and the window title show. It is the folder's name, made safe for a URL.
- **Trash** means the Mac Trash. The app never deletes anything permanently; the person empties the Trash.

## The four commands to draw

1. **Rename Project…** changes the name shown in the app, and the folder's name with it. Should these be separate? Proposed: one field, "Name", with the help line "Renames the folder “old-name” to “new-name” in <parent folder>."
2. **Move Project…** moves the folder to another parent folder. Reuse the folder browser from New Project / Add Existing Folder (real folder rows, the path field). Help: "Moves “name” into <folder>. Chat, comments and Activity stay with the project." This should be refused while Pi is working in that project, using the same wording as for files: "Pi is answering about this project. Try again when that request ends."
3. **Remove from List…** takes the project off the list and leaves the folder alone. It already exists for missing folders and would now be offered for every project. Alert: "Remove “name” from the list?", detail "The folder stays on your Mac with its files. Add it again with Add Existing Folder…". Buttons: Cancel / **Remove** (default).
4. **Move Project to Trash…** puts the whole folder in the Trash. A caution alert: "Move “name” to the Trash?", detail "Its files go to the Trash on your Mac. Its chat and comments are kept until you empty the Trash." Buttons: Cancel / **Move to Trash**. Should the default button be Cancel here, as for other destructive actions?

## Questions

- **Where do the commands live?** The Project menu, acting on the open project? Or the File menu, acting on the project row selected in the Projects window? Or both?
- **The phone** has no menu bar. Is there a ⋯ on the project row in the π sheet, or a project sheet? This is the same open question as round 4, item 2, for files.
- **A missing folder**: keep the dimmed "folder missing" row. Should Move Project… there mean "Locate…" (point the project at where the folder is now)? That would keep its chat, rather than Remove from List followed by adding the folder again.
- **Undo**: a toast "Project renamed." with Undo ⌘Z, as for block deletion? Or nothing, as for file renames today?

Boards wanted:
- the menu with the four commands, enabled and dimmed;
- the Rename and Move dialogs;
- the two alerts;
- a missing project with Locate…;
- the phone placement.
