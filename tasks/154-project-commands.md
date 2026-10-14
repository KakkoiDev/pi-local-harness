# 154: Rename, move, remove and trash a project

Kind: code

Request 2026-10-14: "how to rename and move project or even delete then? is it possible from the web interface?" and "I want a designer brief."

- [x] Brief for the designer: `design/briefs/project-commands.md` (Rename Project…, Move Project…, Remove from List… for every project, Move Project to Trash…, where they live, the phone, Locate… for a missing folder).
- [x] Re-synced `design/`: 10 new boards (P_Menu, P_MenuMissing, P_Rename, P_Renamed, P_Move, P_Refused, P_Remove, P_Trash, P_Locate, Ph_ProjectMore), C_MenuBar (Project menu), C_ChatDesk, C_ProjectsWin, canvas.json, the Menu and Sheet cards, design-system.json, IMPLEMENTATION.md § Task 154. bundle.css unchanged.
- [x] Red (python, `tests/test_project_commands.py`): rename and move keep the project id (chat, comments stay; the chat is renamed with the project), also for a project in the data folder; Remove from List and Move to Trash keep a hidden entry, so adding the folder again (or Put Back, then Add Existing Folder…) brings back the same project; Locate points a missing project at its folder; rename, move and trash are refused while Pi works in the project (`ProjectBusy`, 409 with the job).
- [x] Server: `DocumentStore.rename_project`, `move_project`, `locate_project`, `forget` (any project), `trash_project`, `project_summary`; `to_trash` uses the Finder (Put Back works), or `PI_TRASH_DIR` in tests; `WebChat.project_command`; `POST /api/projects/{rename,move,locate,remove,trash,summary}`. A missing project keeps its chat in the workspace listing.
- [x] Page: Project menu items (Move Project… reads Locate Folder… for a missing folder; dimmed, never hidden); Rename dialog; the folder browser for Move (own folder dimmed) and Locate (detail line, Remove from List… on the left); Note alerts for Remove (Return removes, Esc cancels) and for a busy project (Show in Activity / OK); Caution alert for Trash with file and folder counts (Cancel default); toasts with Undo for Rename, Move and Remove; the Projects home after Remove or Trash; a missing project opens its chat with the alert line (Locate Folder… / Remove from List…); phone ⋯ on each project row opens the project sheet (Ph_ProjectMore).
- [x] File renames get the same Undo toast (IMPLEMENTATION § Task 154).
- [x] Red (browser, design.cjs): the menu, each dialog and alert, Undo, the busy alert, Esc on Remove, the test Trash, Locate from the missing line, the phone sheet.
- [x] Found on the way: the server's listen backlog was 5 (the standard library default); a page load opens more connections than that, and macOS reset the rest (`ERR_CONNECTION_RESET`, a page that never loaded). `harness/services.py` uses a backlog of 128 (`tests/test_harness_services.py`).
- [x] Where the build differs from the boards: `design/briefs/project-commands.md` § Built.
- [x] Green: verify_workflow, design.cjs and chat.cjs (both exit 0, twice).
