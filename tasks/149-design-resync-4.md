# 149: Re-sync the design after round 4, and build its changes

Kind: code

Request 2026-10-14: the designer drew round 4 (`design/briefs/round-4-notes.md`): model and thinking menus, rename and move, phone More sheets, phone recording, Add Note / Ask Pi.

- [x] `design/`: 9 new boards (MB_Model, Ph_Model, Ph_ModelList, Ph_FileMore, Ph_FolderMore, Ph_Recording, W_FolderSel, W_Rename, W_TrashFolder), 11 changed boards, canvas.json, the stylesheet upload `_blob/df76a9fabeae28600b25f9b7ca37501f.css` (unchanged boards differ only by that link, rewritten here), bundle.css and `components.css` (plus the four repo additions), the Composer, Dialog, InlineThread, ListRow, Menu, MenuBar and Sheet cards, design-system.json, `design/IMPLEMENTATION.md`.
- [x] Menu bar: the Ollama tag everywhere; menu footnotes as `.pw-menu__note` (role note), the designer's note texts and key texts; the ready toast has no button.
- [x] Window holds Chat ⌘1 and Work ⌘2; View keeps only how you see the current document.
- [x] Rename or Move dialog: mono field, the name selected (not the extension), Rename or Move as the button, comments named in the help; the folder trash alert counts its files.
- [x] Phone recording: `.pw-btn--rec` inverted with a paper dot and the time (one bit, no red).
- [x] Thread: Add Note and Ask Pi (default once there is text) with the help line; replaces Reply.
- [ ] Phone: ⋯ More sheets for the open file and a folder; Model and Thinking rows in the π sheet.
