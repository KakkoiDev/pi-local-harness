# 145: Re-sync the design after round 3

Kind: chore

Request 2026-10-13: "designer is done" (round 3: table block, workflows F1–F10, answers to the open questions, corrections), answering the brief in `design/briefs/round-3-tables-workflows.md`.

- [x] `design/canvas/`: every board and canvas.json (new: W_Table, Ph_Table, Ph_TableEdit, Ph_ThreadAnswered, Ph_FirstChat, Ph_FilesNew, Ph_NewProject, S_Earlier, S_FirstChat, A_Retry, M_AgentEarlier and the workflow boards F1–F10); the stylesheet upload is now `_blob/ccf0bf8ae1858e4ffc7f6a20d13d0d3b.css` (the old one removed). No board was dropped.
- [x] `design/system/`: README, tokens, design-system.json, bundle.css and every card (new: MarkdownTable; updated: Table, ContextLine, ContextMeter, CompactionMarker, StatusButton, SegmentedControl, Popup, InlineThread, Menu, DocumentBlock), the Icons README and `assets/Icons/gate.svg`.
- [x] `design/IMPLEMENTATION.md` from the system artifact (the repo's text plus the round-3 sections); `design/README.md` now lists it in the backup.
- [x] `design/components.css` rebuilt from the new bundle plus the four repo additions.
- [x] The designer's three changes to the bracketed decisions are recorded for the build: follow-up answers are added below the earlier one (task 135); ⌘1/⌘2 stay enabled in Activity and Gate and open the last project (built in task 130); reworded Activity empty copy (task 128 follow-up).
- [x] Green: unittest, node --test, both browser suites.
