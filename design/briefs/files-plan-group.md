# Brief: Files window, "Plan" group above "Files"

Date: 2026-10-13. For: the designer AI that made the Pi Workbench System 1 handoff.

## Problem

The Files window (Work view) lists every file of the project folder in one list. Two kinds of file are mixed:

- **Plan**: `ROADMAP.md` and `tasks/*.md`. The agent and the user keep these current; Laya's commit gate reads them.
- **Files**: everything else in the folder (code, notes, specs).

They live in the same folder on disk and must stay there (no storage change). Only the window should separate them.

## Current state

- Markup: `aside.window-files` > `.window-section` (New Page… / New Task… buttons, `.pw-search` "Find a file") > `nav#file-tree.pw-list`.
- Rows: `button.pw-row.file-item` with `file` icon and `.pw-row__label` holding the relative path, e.g. `tasks/001-first-task.md`. Flat list, ROADMAP.md first, rest alphabetical.
- Your handoff (`IMPLEMENTATION.md` § renderFiles, `C_WorkDesk`, `Ph_Files`) specifies a directory tree: folders with `disclosure-open`/`disclosure-closed` + `folder` icon, `aria-expanded`, children `.pw-row--nested`, folders collapsed except the one holding the open file. Not built yet; it will ship with this change.
- Phone: Files is a full screen (`Ph_Files`, `body[data-pane="files"]`).

## Ask

Design the Files window with two groups, **Plan** above **Files**, for desktop (`C_WorkDesk`), tablet (761-1100px, Files window 220px wide), and phone (`Ph_Files`). Use only existing tokens and components (`ListRow`, `Window`, `SearchField`, `StatusGlyph`, type tokens). Chrome font is now `system-ui` (Pixelify Sans dropped).

Decide and show:

1. **Group header**: element, type style, spacing, divider or not. Is it collapsible? If yes, its disclosure and keyboard behavior.
2. **Plan contents**: ROADMAP.md first, then tasks. Tasks shown flat (`001-first-task`, no `tasks/` prefix, `.md` hidden or kept?) or as a `tasks` folder row?
3. **Task status in the row**: should a task row show its state (all boxes checked / some / none) via `StatusGlyph` or `.pw-row__meta`, e.g. "2/3"? Optional; say yes or no.
4. **Files contents**: the directory tree from your handoff, minus ROADMAP.md and `tasks/`. Confirm defaults (collapsed folders, open-file folder expanded).
5. **Search** ("Find a file", ⌘F): filter both groups, hide an empty group, or show "No matches" per group? Matched files inside collapsed folders: auto-expand or flat results (your `searching` state in `C_WorkDesk` shows flat paths)?
6. **Empty states**:
   - no ROADMAP.md and no tasks/ (folder added via "Add folder…"): hide Plan, or show Plan with a "Create roadmap" action?
   - Files group empty.
7. **New Page… / New Task…**: stay at the top, or move New Task into the Plan header?
8. **Selected row** (`aria-current="page"`, inverted) and keyboard: does ArrowUp/Down cross the group boundary?
9. **Phone**: same two groups on `Ph_Files`, or a segmented control (Plan / Files) like the Activity and Laya filters?

## Deliverables

- Updated artboards: `C_WorkDesk`, `Ph_Files`, plus one tablet frame and one empty-state frame (folder with no Plan).
- `ListRow` README (and a new component README if you add a group header): markup, classes, ARIA (e.g. `role="group"` + `aria-labelledby`, or `<details>/<summary>`).
- Any new CSS as additions to `components.css` with token names, no raw values.
- A short `IMPLEMENTATION.md` diff for the `renderFiles` row.
