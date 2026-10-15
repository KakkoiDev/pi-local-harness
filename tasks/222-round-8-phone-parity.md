# 222: Build round 8: the phone does everything the desktop does

Kind: code

The designer's answer to the round 8 brief (task 216): canvas page "Phone parity" (Ph8_* boards, Ph8_Map),
IMPLEMENTATION.md "Round 8" (12 build points), the PhoneBar card rewritten around π / view menu / ⋯.

- [x] Re-synced `design/`: the Ph8_* boards, Ph_FilesNew (corrected), canvas.json, IMPLEMENTATION.md, the PhoneBar,
  Sheet and Menu cards, design-system.json (bundle.css unchanged).
- [x] 1 Three places for commands: the view menu is Chat · Work · Preview, then the current view's commands (Preview:
  App language, Reload, Open App); Activity and Gate left it for the π sheet's Agent group. ⋯ on the thing: point 3.
  Not built anywhere yet, so not on the phone either: Chat's Compact Now, New Conversation…, Earlier Conversations ›.
- [x] 2 Model and Thinking in the π sheet (Ph_Model, Ph_ModelList, Ph8_Thinking), each its own sheet with ‹ π; the
  model-gone alert line in Chat with Choose Model… (Ph8_ModelGone), on the desk too, instead of a toast. Its second
  sentence says what the code does, "Pi uses <model> until you choose another model.", not the board's "Pi cannot
  answer until you choose a model": the server falls back to an installed model (for the designer, round 9).
- [x] 3 File and folder ⋯ (Ph_FileMore, Ph_FolderMore, Ph8_DocMore, Ph8_Folder): `#file-more` (Rename or Move…, Copy Path,
  Ask Pi About This File…, View as Markdown, Reload from Disk, Download Draft…, Move to Trash…) and `#folder-more`
  (New File in <folder>…, Rename or Move…, Copy Path, Move to Trash…), the path as title; on the phone a tapped folder
  opens as its own level (‹ Files goes up one level). Copy Path copies the full path on the Mac.
- [x] 4 View as Markdown, full screen (Ph8_Source): the source editor with only the name · Markdown · Done.
- [x] 5 Comments always in the document bar (Markdown files); none open names the file and holds Ask Pi About This File…
  (Ph8_CommentsNone).
- [x] 6 Ask Pi's own sheet for a selection, a block and the file (Ph8_Ask, Ph8_AskFile): `#ask-dialog`, `openAsk()`;
  the question goes the way of the whole-file question (`/api/jobs/create` with the document), never a comment.
- [x] 7 Preview foot: state, Stop / Start, Open App; the app language in Preview's view menu (Ph8_Preview, Ph8_PreviewMenu).
- [x] 8 Landing on the detail: Show in Activity, the status button (the running request) and Show in Gate open the
  detail on the phone; ‹ goes to the list.
- [x] 9 Document screens: the phone bar (π · view · status) stays above a new document bar (‹ Files · name · Comments ·
  ⋯); it hides on scroll down and returns on scroll up or a tap on the name; while editing only the document bar shows,
  with the save status. A detail screen's back button is now `#detail-back` (the document bar keeps `#phone-back`).
- [x] 10 New Project / Add Existing Folder: one "Create in ~/code ›" row (the folder for the other modes) opens the folder
  browser as its own full-height step: Home › … crumbs, 44 px folder rows, New Folder… (`/api/directories/create`,
  one new folder, never an existing one or a dotted name), Choose “<folder>”. Kinds are 44 px rows (point 11); the
  Terminal app kind stays (task 217), which Ph8_NewProject does not draw yet.
- [x] 11 Details: 44 px targets, no ⌘ hints on the phone, the toast above the edit bar, Mac-only settings hidden with
  a one-line note (Ph8_Toast, Ph8_Settings, Ph8_Details). Not built: Ph8_Settings' Show lessons, Wait 10 s and Phone
  access rows (no such settings in the web Settings yet).
- [x] 12 Files bar without "‹ Projects" (Ph_Files): the code already followed Ph_Files; the designer corrected Ph_FilesNew.

Test fixes on the way: design.cjs knew three project kinds (the Terminal app came in task 217); the status-button check
clicked before the page was wired (the old 1-in-3 flake), now it waits for the composer. chat.cjs's "Drop to attach 2
files" check failed once and passed on the rerun (a timing flake, not touched).
chat.cjs's drop hint was a real race, not a flake: any refresh during a drag replaced "Drop to attach N files"; hint()
now keeps it while dragging. One chat.cjs run in five timed out somewhere unreported; the other four passed.

Still open:

- [ ] Japanese for round 8's new strings (messages/ja.json).
- [ ] Found while taking the README screenshots (task 224): with Work, Preview and Review open at 1440 px the Review
  window runs past the right edge; on the phone the chat does not scroll to the last line of a reply.
- [ ] Round 9 brief for the designer: the model-gone sentence, the Chat commands no view has yet (Compact Now, New
  Conversation…, Earlier Conversations ›), Ph8_Settings' rows with no setting behind them, Terminal app in Ph8_NewProject.
