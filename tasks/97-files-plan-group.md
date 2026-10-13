# 97: Files window, Plan group above Files

Kind: planning

Request 2026-10-13: "Group the tree in the UI only: “Plan” (ROADMAP.md, tasks/) above “Files”. No storage change." Brief: `design/briefs/files-plan-group.md`. Designer output: canvas https://claude.ai/artifact/Re2trGpSgYLrd2anCHTRyK (`C_WorkDesk`, `Ph_Files`, `W_NoPlan`, `W_Tablet`, `W_Search`), system https://claude.ai/artifact/JrBZmw41xj2wXGSFiDxmB1 (`components/ListGroup`, `components/ListRow`, `components/bundle.css`).

2026-10-13: go (user: "no files vs document dropdowns in the tree nav"). Projects home (task 107) hosts the groups. Import the designer output first. Each is its own code task with a red test.

- [x] Groups: `.pw-group` Plan/Files, folder tree (IMPLEMENTATION.md renderFiles, never built; task 88 shipped a flat list), `+` actions replace the New Page/New Task row, collapse state per project, flat search, "No matching files".
- [x] Task progress meta (`2/3`, ROADMAP `47/68`), Blocked from tilde-box "Blocked:" lines (tasks 56/59, not built), Done summary row. Server parses checkboxes.
- [x] Empty Plan: "Create Roadmap" (new endpoint; scaffold as `create_project`).
- [x] Roving keyboard focus across toggles and rows.
- [x] Phone: segmented Plan · N open | Files · N.

Notes:
- The canvas still uses the old checker name; the repo copy takes Gate names (task 96).
- Tablet: the design keeps Files at 220px; task 95 set 256px for the old button row. With the `+` actions 220 fits; the overflow assertion in `tests/browser/chat.cjs` guards it.
- 2026-10-13: built in `js/files-window.mjs` from the re-synced ListGroup/ListRow cards (task 111); progress and Blocked come from `/api/project-files`, Create Roadmap from `/api/documents/create-roadmap`. Red: tests/test_documents.py PlanFilesTest, tests/browser/design.cjs § 97. Compared with Work.dc.html at 1440×900: same title, groups, meta, Done row, folders-first tree; differences: "‹ Projects" in the info bar (task 107), no B / I / { } (inline marks).
- Phone: `#file-seg` + `#file-seg-add` (Ph_Files); group headers hidden, rows 48px with dotted rules, no info bar or ⌘F hint; search shows match counts on both segments. Compared with Ph_Files at 390×844. Red/green: tests/browser/design.cjs § 97 phone.
