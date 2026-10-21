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

## Round 18: `.pw-dialog__head`

A dialog whose body is edge to edge (VisualResult's Inspect, `padding: 0` on `.pw-dialog`) puts its title in `div.pw-dialog__head`: a flex row, 10 px × 14 px padding, a 1 px ink rule below, gap `--space-2`; `.pw-dialog__title` inside it takes the remaining width and loses its margin; buttons (Close) follow the title. Ordinary padded dialogs keep `.pw-dialog__title` directly, unchanged. Defined in `scripts/round18_fix.css` (end of the bundle); nothing global changes.

## Round 19 follow-up (decided, 21 Oct 2026: decision 4)

**Remove from List…** is a Note alert, opened from Project › Remove from List… or the row's ⋯ in Projects; on the phone it is a sheet.
- Title: "Remove “Class Notes” from the list?" (JA 「Class Notes」を一覧から外しますか？)
- Body: "The folder stays on your Mac with its files; nothing is moved or deleted. Pi WorkStation keeps its conversations and their Trash with this project. Add the same folder again with Add Existing Folder… to connect them again." (JA フォルダとファイルはこの Mac にそのまま残り、移動も削除もされません。Pi WorkStation はこのプロジェクトの会話とそのゴミ箱を保持します。同じフォルダを「既存のフォルダを追加…」でもう一度追加すると、再びつながります。)
- Buttons: Cancel · **Remove** (default; JA 外す). Escape is Cancel.
- After Remove: the toast "Removed “Class Notes” from the list." + Undo ⌘Z (round 8). Focus moves to the next project row.

**Rules**
- Never moves or deletes the folder.
- The retained records are keyed by the stable project id, with removal metadata, on the host.
- Add Existing Folder… reconnects them only for the same recorded id: "Class Notes was here before. Its earlier conversations and Trash are connected again." A reused name or path is not identity: "A different project used this name before. Its history isn’t connected."
- Revoked access stays withheld.

**Who may invoke:** the project's owner. **Cancellation:** Cancel or Escape; Undo after Remove.

**Given/When/Then:** Given Class Notes is removed and its folder is added again with the same recorded id, Then its earlier conversations and Trash are connected again. Given a new folder with the same name but no matching id, Then the history is not connected.

Boards: R19_ProjectRemove, Ph19_ProjectRemove. JA has not been reviewed by a native speaker.

### Closeout (21 Oct)

Removing a project from the list can fail. The alert stays open and the project stays listed: **Try Again** (default; JA 再試行) and Cancel.
- **Host confirms no change:** "Couldn’t remove “Class Notes”." + "Nothing changed." (JA 「Class Notes」を外せませんでした。 / 何も変更していません。). "Nothing changed." appears only when the host confirms no mutation.
- **Result uncertain:** "Couldn’t confirm removal. Check the list and try again." (JA 外せたかどうか確認できませんでした。一覧を確認して、もう一度お試しください。). The list keeps the host's last report; there is no false rollback.

Try Again first re-reads the host's project list. If the project is already gone, it shows the normal "Removed …" toast; otherwise it repeats the removal (idempotent by project id). Project files are never removed.

**Focus:** stays in the alert while retrying. On success it goes to the next project row; on Cancel, back to where Remove from List… was invoked.

**Given/When/Then:** Given the removal request times out, When the alert reads "Couldn’t confirm removal…" and I press Try Again, Then the list is re-read first, and Class Notes is either shown as removed (toast) or removed again; its folder is untouched.

Boards: R19_ProjectRemove, Ph19_ProjectRemoveError.
