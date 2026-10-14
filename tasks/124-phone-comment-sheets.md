# 124: Phone comment composer and thread sheets

Kind: code

Split from task 123. Boards: PhoneEdit3 (Comment sheet: quoted passage, Your comment, "Saved with the file. Pi sees it only when you ask.", Add & Ask Pi, Add Comment default), PhoneEdit4 (Comment 1 of 2 with ‹ ›, messages, suggested change, Reply + Send, Resolve thread).

- [x] Red (tests/browser/design.cjs) per sheet at 390×844.
- [x] Build both sheets; compare with the boards.

Done 2026-10-14: on a phone, writing a comment opens the Comment sheet (Cancel · Comment, the quoted passage, "Your comment", Dictate, Add & Ask Pi, Add Comment default, "Saved with the file. Pi sees it only when you ask."); a comment marker opens its thread as a bottom sheet headed "Comment N of M" with ‹ ›, Close, the conversation, the state line and the Add Note / Ask Pi row (round 4 replaces PhoneEdit4's Reply + Send). The "Pi sees" line on the board waits for task 134.
