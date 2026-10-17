# 84: Pi Workbench 1-bit, Turn Into submenu

Kind: code

Request 2026-10-13: "finish now", pointing at the deviation listed after task 80: "Turn Into is a flat list, not a submenu." Spec: [design/IMPLEMENTATION.md](../design/IMPLEMENTATION.md) § 6.2 Block handle: "Turn Into ▸ (the eight types)".

- [x] Red (`tests/browser/chat.cjs`): the block menu opens with `#turn-into-menu` hidden and focus on `Turn Into▸`; Right opens it and focuses Text; Left closes it and returns focus to the parent (`aria-expanded=false`) with the block menu still open; clicking Turn Into then Text sets the type. Fails with the implementation stashed.
- [x] `index.html`: `Turn Into` is a `menuitem` with `aria-haspopup`, `aria-controls` and a `▸` key; the eight types sit in `#turn-into-menu.pw-menu--sub`.
- [x] `js/menubar.mjs` `installPopup`: one level of submenu. Click, hover, Right, Enter or Space opens it; Left or Esc inside it returns to the parent; closing the menu closes it.
- [x] `design/components.css`: `.pw-menu--sub` beside the parent; inline under the item on phone. `chat.css`: dropped the rule for the old disabled `span` label.
- [x] `design/system/components/Menu/README.md`: submenu note.
- Not tested: hover opening and the phone inline layout (no assertion; checked only that the browser test passes at 320/390px with the submenu present).
