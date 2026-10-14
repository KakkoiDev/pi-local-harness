# Sheet

The phone's bottom sheet (≤760px): a paper panel with a double top rule over a 55% dither scrim. Used for the π menu, the view switcher, comment composing, threads, the Comments list, block menus and every desktop window that does not fit (Review, Event Info, Markdown task record).

- `.pw-sheet` with a `.pw-sheet__head` (title, Close or Cancel as `.pw-btn--plain`). All controls 44px.
- `role="dialog" aria-modal="true"`; Esc or the scrim closes it; focus is trapped inside.
- **More** (phone, task 146): the phone has no File menu, so whatever is open carries a ⋯ button at the right of its header: the open file (Ph_FileMore: Rename or Move…, Copy Path, Ask Pi About This File…, Download Draft…, then Move to Trash… after a double rule) and a folder, which opens as its own level from Files (Ph_FolderMore: New File in drafts…, Rename or Move…, Copy Path, Move to Trash…). The sheet's title is the path.
- **More for a project** (phone, task 154): each project row in the π sheet has a 44px ⋯ at its right (a separate tap target from the row, which opens the project). The sheet is titled with the project name and its path: Open, Rename Project…, Move Project…, Copy Folder Path, ═, Remove from List…, Move Project to Trash…. A missing project's sheet shows Locate Folder… first. Board: Ph_ProjectMore.
