# Menu

A pull-down menu under a menu-bar title, and the same list inside the phone's π sheet.

- `<div class="pw-menu" role="menu">` of `<button class="pw-menu__item" role="menuitem">`; a checked item uses `role="menuitemradio" aria-checked="true"` (View › Chat ⌘1 …); a disabled item `aria-disabled="true"`.
- Shortcut on the right in `.pw-menu__key`. Separators are dotted (`.pw-menu__sep`).
- Labels are Title Case verbs; an ellipsis means a dialog follows.
- The full command map is in IMPLEMENTATION.md § Menus.
- Submenu: an item with `aria-haspopup="menu"`, `aria-controls` and a `▸` key opens a nested `.pw-menu--sub` (Block › Turn Into, Block › Add Block Below, Agent › Earlier Conversations). Click, hover or Right opens it; Left or Esc returns to the item. On phone it opens inline under the item. `installPopup` in `js/menubar.mjs` handles one level.
- Command changes in this system: View holds Chat ⌘1 and Work ⌘2 only (always enabled: from Activity or Gate they return to the last project in that view). Window ends with Activity · All Projects ⌘3 and Gate · All Projects ⌘4. Agent adds Compact Now, New Conversation…, Earlier Conversations ▸ (date range, message count; newest first). File has New File… ⇧⌘N and New Task… ⌘T.
- Block menu (handle): Turn Into ▸, Add Block Below ▸ (both list Paragraph, Heading, Task, Bullet, Number, Quote, Table, Code, Raw Markdown), then for a Table only: Add Row, Add Column, Edit as Markdown ↩; then Move Up/Down, Comment on *Type*, Ask Pi About *Type*…, Delete *Type*.
