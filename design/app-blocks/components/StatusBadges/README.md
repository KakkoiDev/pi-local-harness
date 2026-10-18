# StatusBadges

Short labels that say what state a thing is in (Paid, Draft, Overdue, In stock), with a fixed set of meanings so every app reads the same.

| | |
| --- | --- |
| Group | Other elements |
| Basecoat | `badge` (`data-variant="primary|secondary|outline|destructive"`) |
| Needs | The record's status value; the app's status → badge table below |
| Used in | DataTable, IssueList, OrderHistory, ProductGrid (stock), Kanban, PullReview, Roles, Invite, Notifications (count) |

## Markup

```html
<!-- Neutral states: secondary -->
<span class="badge" data-variant="secondary" data-t="status.draft">Draft</span>

<!-- Attention (the one thing to look at): primary -->
<span class="badge" data-t="status.new">New</span>

<!-- A state with a meaning colour: outline + a dot. The word carries the meaning; the dot only helps scanning. -->
<span class="badge" data-variant="outline">
  <span class="size-1.5 rounded-full bg-green-600" aria-hidden="true"></span>
  <span data-t="status.paid">Paid</span>
</span>
<span class="badge" data-variant="outline">
  <span class="size-1.5 rounded-full bg-amber-500" aria-hidden="true"></span>
  <span data-t="status.pending">Pending</span>
</span>

<!-- Problems: destructive -->
<span class="badge" data-variant="destructive" data-t="status.overdue">Overdue</span>

<!-- A count on a button or nav item -->
<a href="/notifications" class="btn" data-variant="ghost">
  <span data-t="nav.notifications">Notifications</span>
  <span class="badge" aria-label="3 unread" data-t-label="status.unread_count">3</span>
</a>
```

## The fixed set

| Meaning | Badge | Examples (key) |
| --- | --- | --- |
| Neutral, not started, archived | `secondary` | `status.draft`, `status.archived`, `status.closed` |
| Needs attention, new | `primary` (no variant) | `status.new`, `status.open`, counts |
| Good, done | `outline` + green dot `bg-green-600` | `status.paid`, `status.done`, `status.in_stock`, `status.merged` |
| Waiting, in progress | `outline` + amber dot `bg-amber-500` | `status.pending`, `status.in_progress`, `status.low_stock` |
| Info, scheduled | `outline` + blue dot `bg-sky-600` | `status.scheduled`, `status.shipped` |
| Problem, failed, overdue | `destructive` | `status.overdue`, `status.failed`, `status.out_of_stock` |

Map each status of a record to one row of this table in one place (a dict in Python, an object in JS) and render from it. One badge per status per item.

## States

| State | What changes |
| --- | --- |
| Long label | Badges never wrap: `whitespace-nowrap`; keep labels to two words. |
| Count over 99 | Show `99+`, full number in `aria-label`. |
| Zero count | No badge at all. |
| Clickable filter | A badge is never a button; use a `btn data-size="xs" data-variant="outline"` with the dot, `aria-pressed` when active. |
| Loading | `skeleton h-5 w-14 rounded-full bg-muted`. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `status.draft` | Draft | 下書き |
| `status.archived` | Archived | アーカイブ済み |
| `status.closed` | Closed | クローズ |
| `status.new` | New | 新着 |
| `status.open` | Open | オープン |
| `status.paid` | Paid | 支払い済み |
| `status.done` | Done | 完了 |
| `status.in_stock` | In stock | 在庫あり |
| `status.merged` | Merged | マージ済み |
| `status.pending` | Pending | 保留中 |
| `status.in_progress` | In progress | 進行中 |
| `status.low_stock` | Only {count} left | 残り{count}点 |
| `status.scheduled` | Scheduled | 予定 |
| `status.shipped` | Shipped | 発送済み |
| `status.overdue` | Overdue | 期限切れ |
| `status.failed` | Failed | 失敗 |
| `status.out_of_stock` | Out of stock | 在庫切れ |
| `status.unread_count` | {count} unread | 未読{count}件 |

## Keyboard and focus

- Badges are text: not focusable, no hover state. Their meaning is in the word, read in order with the item.

## Phone

- Same size (20 px tall): they are not targets. In table rows that become cards on the phone, the badge goes on the first line, right of the title.

## Data

```json
{"status": "overdue", "map": {"draft": "secondary", "new": "primary", "paid": "good", "pending": "waiting", "shipped": "info", "overdue": "destructive"}}
```

- Web: a Jinja macro `status_badge(status)` reads the map; no server: a function `statusBadge(status)` returns the element.

## Don't

- Don't invent colours per status or per app; use the six meanings.
- Don't use colour alone (a dot without a word).
- Don't use badges as buttons or tabs.
