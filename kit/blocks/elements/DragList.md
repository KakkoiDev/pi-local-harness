# DragList

App Block card (Other elements). Reorder a list by dragging a handle, with Move Up and Move Down for keyboards and anyone who can't drag.

- Basecoat: `btn` (`data-variant="ghost" data-size="icon-sm"`), `dropdown-menu` (the row's Move menu on phones), `item` look is plain Tailwind
- Needs: `js/drag-list.mjs` below (native pointer events, no library); saving the order (`POST /lists/<id>/order` or the store)
- Used in: Kanban (cards within a column), PageTree (siblings), SettingsPage (navigation order), AppCourse (lesson order), Gallery (cover first)

## Markup
Copy, never retype: `{harness}/kit/blocks/elements/DragList.html` (16 lines of HTML).

The first row's Move Up and the last row's Move Down are `disabled`. On phones the arrow buttons are hidden and a `dropdown-menu` with Move to Top / Move Up / Move Down / Move to Bottom sits at the row's end.

Copy, never retype: `{harness}/kit/blocks/elements/DragList.js` (20 lines of JS).

## States
- Resting: Rows with handles; first/last arrow disabled.
- Dragging: The row `data-dragging` (half opacity); the row under the pointer shows a 2 px primary line `before` or `after` (`data-over`).
- Dropped / moved: Row in its new place, focus on its handle, live region says `drag.moved` (“Hiragana moved to position 2 of 4”).
- Saving: Nothing visible under 1 s; after that, SavedState “Saving…” near the list.
- Save failed: Put the row back where it was, InlineAlert `drag.error` with Try Again.
- Read-only: No handles or buttons; the list is a plain `ol`.
- One item: No handles.

## Texts
(Key | English | 日本語)
- `drag.help`: Drag ⠿ to reorder, or focus it and press Alt+↑ or Alt+↓. | ⠿ をドラッグして並べ替えます。キーボードでは ⠿ にフォーカスして Alt+↑ / Alt+↓ を押します。
- `drag.handle`: Move {name}, position {pos} of {total} | {name}を移動（{total}件中{pos}番目）
- `drag.up`: Move {name} up | {name}を上へ移動
- `drag.down`: Move {name} down | {name}を下へ移動
- `drag.top`: Move to Top | 一番上へ移動
- `drag.bottom`: Move to Bottom | 一番下へ移動
- `drag.moved`: {name} moved to position {pos} of {total} | {name}を{total}件中{pos}番目に移動しました
- `drag.error`: Couldn’t save the new order. It’s back as it was. | 新しい順番を保存できませんでした。元の順番に戻しました。

## Keyboard and focus
1. Each row: handle → Move Up → Move Down → (row's own links) → next row.
- On the handle: Alt+↑ / Alt+↓ move the row one place; focus stays on the handle of the moved row.
- Escape during a pointer drag cancels it (row returns).

## Phone
- Handles are 44 px (`@max-3xl:min-h-11 @max-3xl:min-w-11`) with `touch-none` so dragging doesn't scroll; the rest of the row scrolls the page normally.
- The ↑ ↓ buttons are replaced by a `⋯` menu with Move to Top / Up / Down / Bottom (44 px items).

## Data
```json
{"list": "c1", "order": ["l2", "l1", "l3", "l4"]}
```

- Web: `hx-post` is not used for drags; the script calls `fetch(list.dataset.reorder, {method: 'POST', body: JSON.stringify({order})})` with the CSRF header; 200 → done, other → revert.
- No server: `store.setOrder(listId, order)`. Store a `position` number on each item only if the app also sorts elsewhere.

## Don't
- Don't make the whole row draggable (it fights with scrolling and text selection); only the handle.
- Don't use the HTML5 drag-and-drop API (`draggable="true"`): it doesn't work with touch.
- Don't offer drag as the only way.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> DragList` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
