# WipLimit

A work-in-progress limit on a Kanban column: the count against the limit in the column header, a warning when the column goes over, and a small form to set or remove the limit.

| | |
| --- | --- |
| Group | Collaboration |
| Basecoat | `badge`, `btn`, `popover`, `field`, `input`, `label`, `alert` |
| Route | none (part of a board) |
| Needs | Web: `PATCH /columns/{id}` (`limit`). No server: `store.setLimit(columnId, limit)`. |
| Links to | Kanban (the board it sits on), StatusBadges, DragList, AppBoard |

## Markup

```html
<header class="flex items-center justify-between gap-2">
  <h2 id="col-doing" class="flex items-center gap-2 text-sm font-semibold">
    <span data-t="board.col.doing">Doing</span>
    <span class="badge" data-variant="secondary" aria-describedby="wip-doing-help" data-t="wip.count">3 / 4</span>
  </h2>
  <div class="popover">
    <button class="btn" data-variant="ghost" data-size="icon-sm" type="button" id="wip-doing-trigger" aria-expanded="false" aria-controls="wip-doing-popover"
            aria-label="Limit for Doing" data-t-label="wip.edit_label">⋯</button>
    <div id="wip-doing-popover" data-popover aria-hidden="true" class="w-64">
      <form class="grid gap-3" id="wip-doing-form" novalidate>
        <div class="field">
          <label class="label" for="wip-doing-limit" data-t="wip.limit">Work-in-progress limit</label>
          <input class="input" id="wip-doing-limit" name="limit" type="number" min="1" max="99" inputmode="numeric" value="4" aria-describedby="wip-doing-limit-help">
          <p id="wip-doing-limit-help" class="text-sm text-muted-foreground" data-t="wip.limit_help">Most cards this column should hold at once. Empty for no limit.</p>
        </div>
        <div class="flex justify-between gap-2">
          <button class="btn" data-variant="ghost" data-size="sm" type="button" data-t="wip.remove">Remove Limit</button>
          <button class="btn" data-size="sm" type="submit" data-t="wip.save">Save</button>
        </div>
      </form>
    </div>
  </div>
</header>
<p id="wip-doing-help" class="sr-only" data-t="wip.count_label">3 cards, limit 4</p>
```

Over the limit, the badge and a line under the header change:

```html
<span class="badge bg-warning text-warning-foreground" aria-describedby="wip-doing-help" data-t="wip.count">5 / 4</span>
<p class="flex items-center gap-1.5 rounded-md bg-warning/20 px-2 py-1 text-xs" role="status" data-t="wip.over">2 over the limit. Finish a card before starting another.</p>
```

At the limit and while a move would go over (text for screen readers and the header line):

```html
<p id="wip-doing-help" class="sr-only" data-t="wip.at_limit">At the limit: 4 cards</p>
<p class="rounded-md bg-warning/20 px-2 py-1 text-xs" role="status" data-t="wip.would_exceed">Moving it here goes over the limit of 4.</p>
```

## States

| State | What changes |
| --- | --- |
| No limit | The badge shows only the count (`3`); the ⋯ popover offers the field empty and **Save**. |
| Under the limit | `3 / 4`, `data-variant="secondary"`. |
| At the limit | `4 / 4`, `data-variant="outline"`; `#wip-doing-help` says `wip.at_limit`. |
| Over the limit | Badge `bg-warning text-warning-foreground`; the `wip.over` line (with `{n}`) under the header; the column gets `ring-2 ring-warning`. A move into the column is still allowed: the limit warns, it never blocks. |
| Moving a card in would go over | During the drag (or the keyboard move), the column header shows `wip.would_exceed`; `#board-live` says it too. |
| Saving the limit | **Save** `disabled aria-busy`; on success the popover closes, the badge updates, toast: `wip.saved`. |
| Invalid limit | `aria-invalid="true"` on the field and `wip.error.range` under it. |
| Someone else changed it | With Presence: the badge updates and flashes `ring-2` for 1 s. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `board.col.doing` | Doing | 進行中 |
| `wip.count` | {count} / {limit} | {count} / {limit} |
| `wip.count_label` | {count} cards, limit {limit} | {count}枚、上限 {limit}枚 |
| `wip.at_limit` | At the limit: {limit} cards | 上限に達しています：{limit}枚 |
| `wip.over` | {n} over the limit. Finish a card before starting another. | 上限を{n}枚超えています。新しく始める前にカードを1枚完了させましょう。 |
| `wip.would_exceed` | Moving it here goes over the limit of {limit}. | ここに移動すると上限の{limit}枚を超えます。 |
| `wip.edit_label` | Limit for {column} | {column}の上限 |
| `wip.limit` | Work-in-progress limit | 同時進行の上限 |
| `wip.limit_help` | Most cards this column should hold at once. Empty for no limit. | この列に同時に置くカードの最大数です。空欄にすると上限なしになります。 |
| `wip.remove` | Remove Limit | 上限をなくす |
| `wip.save` | Save | 保存 |
| `wip.saved` | Limit for {column} set to {limit} | {column}の上限を{limit}枚にしました |
| `wip.error.range` | Use a number from 1 to 99, or leave it empty. | 1〜99 の数字を入力するか、空欄にしてください。 |

## Keyboard and focus

1. the column's ⋯ button (after its + button) → in the popover: 2. the limit field (focused on open) → 3. Remove Limit → 4. Save.
- Return saves, Esc closes; focus returns to the ⋯ button.

## Phone

- The badge stays in the column header; the popover opens as a full-width panel under the header (Basecoat popover, `w-full` below 48rem).
- The number field shows the numeric keyboard (`inputmode="numeric"`).

## Data

```json
{"column": {"id": "doing", "limit": 4, "count": 5}}
```

- Web: `PATCH /columns/doing` with `limit=4` (empty for none) → 200 with the column header fragment; 422 `wip.error.range`.
- No server: `store.setLimit('doing', 4)`; the count is the number of cards in the column.

## Don't

- Don't block moves over the limit; warn only.
- Don't use red (destructive) for over the limit; it's a warning, not an error.
- Don't put limits on To Do or Done unless the person sets them.
