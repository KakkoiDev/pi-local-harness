# Dialog

A modal dialog: the double frame (`shadow-dialog`), no title bar, a bold title, fields, and buttons on the right with the default last.

- Use `<dialog class="pw-dialog">` with `showModal()`; Esc cancels; focus starts in the first field.
- Dialogs: New Project…, Add Existing Folder… (folder chooser), New Page / New Task (name), Settings…, Desktop Pattern…, About Pi Workbench.
- A destructive secondary action goes far left (`.pw-dialog__danger`).
- **Rename or Move** (File › Rename or Move…): one field, mono, prefilled with the current path and the name selected (not the extension). Label “New name or path in <project>”. Help names both ends: “Moves the file “drafts/idea.md” to “plans/phone-review.md”. Folders are created as needed. Its comments move with it.” The default button reads **Rename** when only the name changes and **Move** when the folder changes. Errors in the help line: “A file named … already exists.” Board: W_Rename.
- Folders to the Trash: “Move the folder “drafts” and its 3 files to the Trash?” / “Their comments go with them. You can restore them from the data folder’s .trash.”, Cancel (default) / Move to Trash. Board: W_TrashFolder.
- Rename Project: no address line (addresses use the project id). Errors (“A folder named “…” already exists in ~/code.”) replace the help line and keep the dialog open with the field selected; a notice after the dialog closes is too late to fix the name.

## New Project… (round 7)

- Name, Create in, then a fieldset “What are you making?” of three `.pw-choice` rows with a `.pw-radio` (14px circle, 8px dot) and one `small` line each: **Web app** (default) · **App with no server** · **Empty folder**.
- Under the choices, behind a dotted rule, the deciding question as help: “Not sure? If several people need the same data at different times, or the app needs a secret, choose Web app. Otherwise, App with no server.”
- Above the buttons, a help line that changes with the choice and says what gets made (“Creates “~/code/Class Notes” from the web app starter: a small notes app in English and Japanese, with tests. Ask Pi to turn it into yours.”). **Cancel** · **Create** (default). Boards: P_NewProject, P_NewProjectStatic.

## Settings (round 9)

Groups, label column left: **Language** (English · 日本語 · Match System, each in its own script; the workbench, Pi's answers, terminal Pi and the Preview's app start in it), **Appearance** (+ Desktop Pattern…), **Typing** (Return sends), **Pi** (Show lessons; Wait 10 seconds before Gate starts the worker), **Updates** (Check for updates once a day; Check Now). Phone access is not a setting. The phone shows Language first and leaves out Desktop pattern and Return sends. Board: R9_Settings, Ph8_Settings.

## Check for Updates… (round 9)

A Note alert “A new version of Pi Workbench is ready”, the versions, up to 20 plain-words lines in a scroll box, “Your projects, chats and settings are not touched.”; Later · **Update**. States: updating (bar), updated (“Restart plh to use it.” + two steps; Restart Now · Done), up to date, can't reach GitHub (Try Again), and the two blocked states with “Nothing was changed.” and a button that asks Pi to do the safe thing. Board: R9_UpdateStates.

## Round 12

- **New Project** is now the four-step ProjectStart dialog (see its card); **Project › Add a Capability…** and **Project › Theme… ⌃⌥K** join the Project menu.
- **Settings › Pi › Detail**: Beginner (plain words; decisions made by code are hidden) · Expert (every decision with its author, file paths and commands).
- **Appearance**: the default is **Match System**; Paper (black on white, always) and Inverse stay deliberate choices.
- **Rename refused** while terminal Pi works in the folder: “Can't rename “Class Notes” while terminal Pi works in it.” Show in Activity · **OK**. After a rename the Preview restarts from the new folder with one note line.

## Round 13

- **File menu**: New Project… **⌃⌥⇧N** · Add Existing Folder… **⌃⌥O** · — · New File… ⌃⌥N · New Task… ⌃⌥T · — · Rename Project…. ⇧ makes the bigger “new”, as ⇧⌘N (New Folder) on the Mac; ⌘N and ⌘O stay the browser’s. Board: R13_Keys.
