# Menu

A pull-down menu under a menu-bar title, and the same list inside the phone's π sheet.

- `<div class="pw-menu" role="menu">` of `<button class="pw-menu__item" role="menuitem">`; a checked item uses `role="menuitemradio" aria-checked="true"` (View › Chat ⌘1 …); a disabled item `aria-disabled="true"`.
- Shortcut on the right in `.pw-menu__key`. Separators are dotted (`.pw-menu__sep`).
- Labels are Title Case verbs; an ellipsis means a dialog follows.
- The full command map is in IMPLEMENTATION.md § Menus.
