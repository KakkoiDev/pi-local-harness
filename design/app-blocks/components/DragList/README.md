# DragList

Reorder a list by dragging a handle, with Move Up and Move Down for keyboards and anyone who can't drag.

| | |
| --- | --- |
| Group | Other elements |
| Basecoat | `btn` (`data-variant="ghost" data-size="icon-sm"`), `dropdown-menu` (the row's Move menu on phones), `item` look is plain Tailwind |
| Needs | `js/drag-list.mjs` below (native pointer events, no library); saving the order (`POST /lists/<id>/order` or the store) |
| Used in | Kanban (cards within a column), PageTree (siblings), SettingsPage (navigation order), AppCourse (lesson order), Gallery (cover first) |

Reordering always has three ways: drag the handle, keyboard (Alt+↑ / Alt+↓ on the handle), and the row's Move Up / Move Down buttons or menu. The order is saved after each move.

## Markup

```html
<p id="lessons-help" class="text-sm text-muted-foreground" data-t="drag.help">Drag ⠿ to reorder, or focus it and press Alt+↑ or Alt+↓.</p>
<ol id="lessons" class="grid gap-2" aria-describedby="lessons-help" data-reorder="/courses/c1/order">
  <li class="flex items-center gap-2 rounded-md border bg-card p-2 data-[dragging]:opacity-50 data-[over=before]:border-t-primary data-[over=before]:border-t-2 data-[over=after]:border-b-primary data-[over=after]:border-b-2" data-id="l1">
    <button type="button" class="btn cursor-grab touch-none active:cursor-grabbing" data-variant="ghost" data-size="icon-sm"
            data-handle aria-label="Move Hiragana, position 1 of 4" data-t-label="drag.handle" aria-roledescription="sortable item">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>
    </button>
    <span class="flex-1 truncate text-sm">Hiragana</span>
    <span class="flex gap-1 @max-3xl:hidden">
      <button type="button" class="btn" data-variant="ghost" data-size="icon-sm" data-move="-1" aria-label="Move Hiragana up" data-t-label="drag.up" disabled>↑</button>
      <button type="button" class="btn" data-variant="ghost" data-size="icon-sm" data-move="1" aria-label="Move Hiragana down" data-t-label="drag.down">↓</button>
    </span>
  </li>
  <!-- … -->
</ol>
<p class="sr-only" aria-live="assertive" id="lessons-live"></p>
```

The first row's Move Up and the last row's Move Down are `disabled`. On phones the arrow buttons are hidden and a `dropdown-menu` with Move to Top / Move Up / Move Down / Move to Bottom sits at the row's end.

```js
// js/drag-list.mjs: pointer drag on the handle + keyboard + buttons, one save per move
export function dragList(list, {save, announce, label}) {           // label(li, pos, total) → "Move Hiragana, position 2 of 4"
  const rows = () => [...list.children];
  const done = (li) => { rows().forEach((r, i, all) => { r.querySelector('[data-handle]').setAttribute('aria-label', label(r, i + 1, all.length));
      r.querySelector('[data-move="-1"]')?.toggleAttribute('disabled', i === 0); r.querySelector('[data-move="1"]')?.toggleAttribute('disabled', i === all.length - 1); });
    announce(li); save(rows().map(r => r.dataset.id)); };
  const move = (li, d) => { const to = d < 0 ? li.previousElementSibling : li.nextElementSibling; if (!to) return;
    d < 0 ? to.before(li) : to.after(li); li.querySelector('[data-handle]').focus(); done(li); };
  list.addEventListener('click', e => { const b = e.target.closest('[data-move]'); if (b) move(b.closest('li'), +b.dataset.move); });
  list.addEventListener('keydown', e => { if (!e.altKey || !e.target.matches('[data-handle]')) return;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); move(e.target.closest('li'), e.key === 'ArrowUp' ? -1 : 1); } });
  list.addEventListener('pointerdown', e => {
    const h = e.target.closest('[data-handle]'); if (!h) return; const li = h.closest('li'); h.setPointerCapture(e.pointerId); li.dataset.dragging = '';
    const over = ev => { rows().forEach(r => delete r.dataset.over); const t = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('#' + list.id + ' > li');
      if (t && t !== li) { const r = t.getBoundingClientRect(); t.dataset.over = ev.clientY < r.top + r.height / 2 ? 'before' : 'after'; } };
    const up = ev => { h.removeEventListener('pointermove', over); const t = list.querySelector('[data-over]');
      if (t) { t.dataset.over === 'before' ? t.before(li) : t.after(li); delete t.dataset.over; done(li); } delete li.dataset.dragging; h.focus(); };
    h.addEventListener('pointermove', over); h.addEventListener('pointerup', up, {once: true});
  });
}
```

## States

| State | What changes |
| --- | --- |
| Resting | Rows with handles; first/last arrow disabled. |
| Dragging | The row `data-dragging` (half opacity); the row under the pointer shows a 2 px primary line `before` or `after` (`data-over`). |
| Dropped / moved | Row in its new place, focus on its handle, live region says `drag.moved` (“Hiragana moved to position 2 of 4”). |
| Saving | Nothing visible under 1 s; after that, SavedState “Saving…” near the list. |
| Save failed | Put the row back where it was, InlineAlert `drag.error` with Try Again. |
| Read-only | No handles or buttons; the list is a plain `ol`. |
| One item | No handles. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `drag.help` | Drag ⠿ to reorder, or focus it and press Alt+↑ or Alt+↓. | ⠿ をドラッグして並べ替えます。キーボードでは ⠿ にフォーカスして Alt+↑ / Alt+↓ を押します。 |
| `drag.handle` | Move {name}, position {pos} of {total} | {name}を移動（{total}件中{pos}番目） |
| `drag.up` | Move {name} up | {name}を上へ移動 |
| `drag.down` | Move {name} down | {name}を下へ移動 |
| `drag.top` | Move to Top | 一番上へ移動 |
| `drag.bottom` | Move to Bottom | 一番下へ移動 |
| `drag.moved` | {name} moved to position {pos} of {total} | {name}を{total}件中{pos}番目に移動しました |
| `drag.error` | Couldn’t save the new order. It’s back as it was. | 新しい順番を保存できませんでした。元の順番に戻しました。 |

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
