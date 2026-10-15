# 222: Build round 8: the phone does everything the desktop does

Kind: code

The designer's answer to the round 8 brief (task 216): canvas page "Phone parity" (Ph8_* boards, Ph8_Map),
IMPLEMENTATION.md "Round 8" (12 build points), the PhoneBar card rewritten around π / view menu / ⋯.

- [x] Re-synced `design/`: the Ph8_* boards, Ph_FilesNew (corrected), canvas.json, IMPLEMENTATION.md, the PhoneBar,
  Sheet and Menu cards, design-system.json (bundle.css unchanged).
- [ ] 1 Three places for commands (π app-wide; the view menu: views then that view's commands; ⋯ on the thing).
- [ ] 2 Model and Thinking in the π sheet (Ph_Model, Ph_ModelList, Ph8_Thinking); the model-gone alert line (Ph8_ModelGone).
- [ ] 3 File and folder ⋯ (Ph_FileMore, Ph_FolderMore, Ph8_DocMore, Ph8_Folder); folders open as a level; path as title.
- [ ] 4 View as Markdown, full screen (Ph8_Source).
- [ ] 5 Comments always in the document bar; none open (Ph8_CommentsNone).
- [x] 6 Ask Pi's own sheet for a selection, a block and the file (Ph8_Ask, Ph8_AskFile): `#ask-dialog`, `openAsk()`;
  the question goes the way of the whole-file question (`/api/jobs/create` with the document), never a comment.
- [ ] 7 Preview foot: Stop / Start; the app language in Preview's view menu (Ph8_Preview, Ph8_PreviewMenu).
- [ ] 8 Landing on the detail (Activity, Gate, the status button).
- [ ] 9 Document screens: the phone bar hides on scroll down, returns on scroll up; the document bar only while editing.
- [ ] 10 New Project / Add Existing Folder: "Create in ~/code ›" and the folder browser as its own step (Ph8_NewProject, Ph8_ChooseFolder).
- [x] 11 Details: 44 px targets, no ⌘ hints on the phone, the toast above the edit bar, Mac-only settings hidden with
  a one-line note (Ph8_Toast, Ph8_Settings, Ph8_Details). Not built: Ph8_Settings' Show lessons, Wait 10 s and Phone
  access rows (no such settings in the web Settings yet).
- [x] 12 Files bar without "‹ Projects" (Ph_Files): the code already followed Ph_Files; the designer corrected Ph_FilesNew.

Test fixes on the way: design.cjs knew three project kinds (the Terminal app came in task 217); the status-button check
clicked before the page was wired (the old 1-in-3 flake), now it waits for the composer. chat.cjs's "Drop to attach 2
files" check failed once and passed on the rerun (a timing flake, not touched).
