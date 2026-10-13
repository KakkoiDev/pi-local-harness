# 128: Activity and Gate are app windows; the project window has Chat | Work

Kind: code

Request 2026-10-13: "design updated" (re-synced in task 126); build what the agent-scope brief asked for. Inventory of design vs code: 2026-10-13 review.

- [x] Red (browser): no Activity/Gate tabs; titles "Activity · All Projects" / "Gate · All Projects"; close boxes "Close Activity and go back"; View menu Chat ⌘1 / Work ⌘2 (disabled in app windows); Window menu radios ⌘3/⌘4; project names are links; "Open in {project}"; "Show in Activity"; Activity copy from C_ActivityDesk.
- [x] Update chat.cjs and design.cjs.
- Activity rows are `div role="row"` (C_ActivityDesk) so the project name can be a link; nested links had broken the rows. Gate's Project popup and From column come with task 129.
- chat.cjs: app windows are reached with ⌘3/⌘4 and left with File › Close Window (an inactive window hides its title-bar boxes, per the design).
