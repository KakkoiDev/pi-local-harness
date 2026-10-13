# 104: Work view drops the extra top buttons

Kind: code

Request 2026-10-13 (UI review of http://127.0.0.1:3000): "the top buttons are not needed I think in the workview" (Add Block, Hide Review, Reload, Move to Trash…, Saved).

- [x] Red: ruler has no Add Block, Reload, Move to Trash, Hide Review buttons or block-style select; commands stay in File/View menus and shortcuts.
- [x] Save status moves to the status bar; Review reopens from View menu and ⌥⌘R.
- [x] Remove the "Agent is idle / Open Project Chat" and file-name infobars (not in the design); file name is the window title.
- Kept per the Work and Final boards: Hide/Show Review (⌥⌘R) and the Document/Markdown Source popup in the ruler; "Saved" moved beside the view tabs. Added the boards' bulleted-list and task-checkbox tools; B / I / { } wait for inline marks. Block style label "Paragraph". Reload from Disk… and Move to Trash… are File menu commands only; Open Project Chat is the Chat tab and Project menu. Red/green: tests/browser/design.cjs; chat.cjs updated.
