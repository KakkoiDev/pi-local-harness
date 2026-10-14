# 163: Re-sync the design after round 5, and build its changes

Kind: code

Request 2026-10-14: the designer drew round 5 (the brief at https://claude.ai/artifact/3tcPDRcTaTtB5Ws6YtLPRe): working-to-activity links and back buttons (A), the chat's worker card (B), items since round 4 (C), project-command answers (D).

- [x] `design/`: 14 new boards (A_FromChat, A_FromComment, A_FromFile, A_FromWorker, B_Worker, C_Dictate, Ph_ActivityFromComment, Ph_Worker, S_WorkerDone, S_WorkerPaused, S_WorkerPropose, S_WorkerRunning, S_WorkerWaiting), 5 changed component boards, canvas.json, the stylesheet upload (now `_blob/0a58a7bd56eede27d7d5c52f8a4dd6da.css`; every board's link rewritten), bundle.css and `components.css` (plus the four repo additions), the WorkerCard card (new) and the Composer, ContextLine, Dialog, DocumentBlock, InlineThread, Menu, StatusButton and Table cards, design-system.json, the `more` icon, `design/IMPLEMENTATION.md`.
- [x] Build A (task 157): "Show in Activity" after each working state; status button and Agent row open the running request; Activity detail "From" line and one button back by origin.
- [x] Build C and D: the model menu adds "parallel", "one at a time" or "checking…" (while the workbench measures it) and lists a chosen model that is gone, dimmed, "not installed", with the designer's note; `icon('more')` in `design/icons.mjs` (a Node test checks every listed icon is drawn) replaces the inline glyph; Rename Project errors stay in the dialog, in the help line with the name selected (`askName` takes a `check`); Dictate reads "Stop dictating" and shows the hourglass while transcribing. Browser tests for each (design.cjs).
- [x] Found on the way: two Python tests raced the queue's worker (it could start, and finish, a request the test expected to stay waiting): the intermittent verify failure. Both hold the queue now.
- [x] Green: verify_workflow, design.cjs, chat.cjs.
- [ ] B (the worker card) waits for plan 156 phases 2 to 5.
