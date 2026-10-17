# 74: Pi Workbench 1-bit, ruler and block handle

Kind: code

Request 2026-10-13: "implement this new design." Build step 7 of [design/IMPLEMENTATION.md](../design/IMPLEMENTATION.md) § 12 (§ 6.2 Ruler, Block handle).

- [x] Red (`tests/browser/chat.cjs`): no `<select>` left in `#document-editor`; focusing the heading sets `#block-style` to `heading` and adds `.pw-block--focused`; ⌥⌘↓ moves the block and keeps focus on it; the handle opens `#block-menu` and its Move Up works; `#block-style` set to Quote saves `> Describe what we are building.` to the file; the handle's Text item turns it back.
- [x] `js/workspace.mjs`: per-block select and ↑ ↓ × buttons replaced by one `.pw-block__handle`; `focusedBlock` state, `focusBlock`, `setType`, `moveBlock` (focus follows the block); `#block-style` mirrors and sets the focused block; `moveBlock` and `focusedBlock` exported for the commands.
- [x] `js/menubar.mjs`: `installPopup(menu,choose,update)`, a popup menu under its button, kept inside the viewport; ↑ ↓ Home End Esc Tab Enter; a click outside closes it.
- [x] `index.html`: `#block-menu` with Turn Into (eight types as `menuitemradio`), Move Up ⌥⌘↑, Move Down ⌥⌘↓, Comment on Paragraph, Ask Pi About Paragraph…, Delete Paragraph.
- [x] `js/chat.mjs`: `block-up` / `block-down` commands and ⌥⌘↑ / ⌥⌘↓ shortcuts, enabled only in Work with a Markdown page and a focused block.
- [x] `chat.css`: the legacy `.block-tools` rules are gone.
- Differs from the spec: Turn Into is a disabled label followed by the eight types, not a submenu. 2026-10-13: submenu added in task 84. Delete Paragraph has no undo (the spec gives undo only for comments).
- Not tested: Comment on Paragraph, Ask Pi About Paragraph…, Delete Paragraph, keyboard navigation inside the popup.
