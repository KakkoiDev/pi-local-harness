# Sheet

The phone's bottom sheet (≤760px): a paper panel with a double top rule over a 55% dither scrim. Used for the π menu, the view switcher, comment composing, threads, the Comments list, block menus and every desktop window that does not fit (Review, Event Info, Markdown task record).

- `.pw-sheet` with a `.pw-sheet__head` (title, Close or Cancel as `.pw-btn--plain`). All controls 44px.
- `role="dialog" aria-modal="true"`; Esc or the scrim closes it; focus is trapped inside.
