# 90: Pi Workbench System 1, tablet layout (761-1100px)

Kind: code

Request 2026-10-13, on "Tablet layout at 761-1100px: decide": "you decide." Before: Projects 300 + Files 290 + Review 380 left the main window at its 320px floor, so the desk scrolled sideways at 768px (task 70 note).

Decision: keep the desk, shrink the side windows, float the inspectors.

- [x] Red (`tests/browser/chat.cjs`, 768px, all four views): the desk does not scroll sideways, the main window is at least 400px, Review stays open in Work, Laya header labels fit their columns. Fails with `chat.css` stashed (main window 396px in Chat).
- [x] `chat.css` `@media (min-width:761px) and (max-width:1100px)`, at the end of the file so it wins over the column rules:
  - Projects 240px, Files 220px.
  - Review and Event Info float over the lower right of the main window (top 45%, below the title, view tabs and document bar) instead of taking a column.
  - Laya table drops Project and From (Event Info shows both).
- [x] Dated note on the task 70 line.
- Trade-off: the floating Review covers the lower right of the document, and Event Info covers the lower Laya rows. Hide Review (⌥⌘R) clears the first; Event Info has no hide. Checked by screenshot at 768px only, not on a real tablet.
