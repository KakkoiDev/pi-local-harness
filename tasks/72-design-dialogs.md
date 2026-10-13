# 72: Pi Workbench System 1, dialogs

Kind: code

Request 2026-10-13: "implement this new design." Build step 5 of [design/IMPLEMENTATION.md](../design/IMPLEMENTATION.md) § 12 (§ 7 Dialogs).

- [x] Red: `tests/test_frontend.py::test_no_browser_modal_dialogs`: no `confirm(`, `prompt(`, `alert(` in `js/*.mjs`.
- [x] Red (`tests/browser/chat.cjs`): π › About shows the model, Return closes it; File › New Page… opens `#name-dialog`, Return creates and opens the page; Move to Trash… asks "Move “ROADMAP.md” to the Trash?" with Cancel focused, Esc keeps the file; the conflict's Reload from Disk asks "Reload “ROADMAP.md” from disk?" and Reload proceeds; Activity › Cancel asks "Cancel the waiting request?" and Cancel Request proceeds.
- [x] `js/dialogs.mjs` (served): `ask({icon,message,detail,danger,safe})` → `'danger'|'default'` on `#alert-dialog`, Esc = default; `askName({title,label,help})` → name or `null` on `#name-dialog`. `returnValue` is reset before each show, otherwise Esc returned the previous answer.
- [x] Reference markup bug fixed: the name dialog's Cancel was the form's first submit button, so Return in the name field cancelled. It is now `type="button"`.
- [x] `js/workspace.mjs`: New Page/New Task, Reload, Move to Trash, Activity Cancel use the dialogs; folder dialog titles "New Project" / "Make This Folder a Project", button "Create" / "Use This Folder".
- [x] Agent › Cancel Waiting Request… (`cancel-waiting`), enabled when the current project has a queued job. Not covered by the browser test: the only queued job in the test exists at phone width, where the menu bar is hidden.
- [x] About dialog filled (model, web address). Copy changed from the design: "Nothing leaves this Mac" → "The model runs on this Mac" (About and the Projects status bar). 2026-10-13: also false, the model runs on another Mac; now "Pi runs on this Mac" (task 89). With phone access over Tailscale (task 66) the page itself does leave the Mac, so the design's sentence was false.
- Settings and Open on Phone dialogs: steps 11 and 12.
