# 154: Rename, move, remove and trash a project

Kind: code

Request 2026-10-14: "how to rename and move project or even delete then? is it possible from the web interface?" and "I want a designer brief."

- [x] Brief for the designer: `design/briefs/project-commands.md` (Rename Project…, Move Project…, Remove from List… for every project, Move Project to Trash…, where they live, the phone, Locate… for a missing folder).
- [x] Re-synced `design/`: 10 new boards (P_Menu, P_MenuMissing, P_Rename, P_Renamed, P_Move, P_Refused, P_Remove, P_Trash, P_Locate, Ph_ProjectMore), C_MenuBar (Project menu), C_ChatDesk, C_ProjectsWin, canvas.json, the Menu and Sheet cards, design-system.json, IMPLEMENTATION.md § Task 154. bundle.css unchanged.
- [ ] Build from the boards.
- [ ] Red (python): rename and move keep the project id (chat, comments, Activity, Gate history stay); refused while Pi works in the project; trash moves the folder to the Mac Trash and never deletes.
- [ ] Red (browser): the commands from the drawn menu, dimmed when they cannot act; the dialogs and alerts as drawn.
- [ ] Green: python, node and both browser suites.
