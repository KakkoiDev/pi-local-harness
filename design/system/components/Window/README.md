# Window

Every view lives in a window: a paper box with a 1px ink border and a 2px solid offset shadow.

- Parts in order: title bar (`.pw-titlebar`), optional toolbar (`.pw-toolbar`), info bar closed by a double rule (`.pw-infobar`), body (`.pw-window__body`, the only part that scrolls), optional status bar (`.pw-statusbar`).
- Active window: striped title bar with close box (left) and zoom box (right). Inactive: add `.pw-window--inactive`; the stripes and boxes disappear and the title centres.
- The title is the project name (Chat), the file name (Work), or the view name (Activity, Laya, Review).
- Close box on a side window (Review, Event Info) closes it; on the main window it does nothing destructive and may be omitted.
