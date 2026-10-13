# 123: The phone matches the phone boards

Kind: code

Request 2026-10-13: "on mobile the navigation is very hard." Walk-through at 390×844 against Phone, Ph_Pi, Ph_Views, Ph_Files, PhoneEdit1, PhoneEdit5, PhoneEdit6: the phone build kept desktop chrome where the boards have phone patterns, and two bugs.

- [x] Not a bug: the walk read the address before the switch finished; the test confirms the project is entered (`/p/<id>/…`, level project).
- [x] Comments sheet: the items render (the walk screenshot came before they loaded); it had no Close. Now a PhoneEdit6 head: "Comments" + Close; Comments in the bar toggles it.
- [x] Phone bar: agent status on the right (Ready, ⧖ Working · N waiting); on a document "‹ Files · name · Saved", or "Comments N" when the page has comments (PhoneEdit1, PhoneEdit6).
- [x] Chat composer in one row: Attach (+), Record (mic), Stop, Queue/Send; no label line, hint or footnote (Phone).
- [x] π sheet as Ph_Pi: "π Pi Workbench" + Close, status card with Stop, project rows with "waiting", New Project / Add Folder side by side, Settings and About as plain rows; no desktop title bar, info bar, shortcut hints or status bar.
- [x] View popup: Activity shows "N running · N waiting" (Ph_Views).
- [x] Document: no desktop ruler; while a block is being edited a bottom toolbar: Paragraph ▾, Task checkbox, Done (PhoneEdit1; B / I wait for inline marks, as on desktop).
- [x] Block handle menu as the PhoneEdit5 sheet: block type title, a 3×2 Turn Into grid, Move Up/Down, Comment, Ask Pi, Delete, Cancel. Comments sheet as PhoneEdit6: "Comments" + Close.
- [x] Red/green: tests/browser/design.cjs § 123 at 390×844; every screen compared with its board.

Split off to task 124: the comment composer sheet (PhoneEdit3: Add & Ask Pi / Add Comment) and the one-thread sheet (PhoneEdit4: Comment 1 of 2, ‹ ›, Reply, Resolve thread).
- Not a bug either: on a document the bar has "‹ Files" instead of π and the view popup, as PhoneEdit1 draws it.
- Compared at 390×844 with Phone, Ph_Pi, Ph_Views, PhoneEdit1, PhoneEdit5, PhoneEdit6. Differences kept: "Add Existing Folder…" (board: "Add Folder…"), Add Block Below in the block sheet (task 105), the composer placeholder.
- chat.cjs: on a phone document screen the view popup is reached through ‹ Files (as the board), and Work can land on the Files list.
