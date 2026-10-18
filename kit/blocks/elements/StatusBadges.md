# StatusBadges

App Block card (Other elements). Short labels that say what state a thing is in (Paid, Draft, Overdue, In stock), with a fixed set of meanings so every app reads the same.

- Basecoat: `badge` (`data-variant="primary|secondary|outline|destructive"`)
- Needs: The record's status value; the app's status → badge table below
- Used in: DataTable, IssueList, OrderHistory, ProductGrid (stock), Kanban, PullReview, Roles, Invite, Notifications (count)

## Markup
Copy, never retype: `{harness}/kit/blocks/elements/StatusBadges.html` (24 lines of HTML).

## The fixed set
(Meaning | Badge | Examples (key))
- Neutral, not started, archived: `secondary` | `status.draft`, `status.archived`, `status.closed`
- Needs attention, new: `primary` (no variant) | `status.new`, `status.open`, counts
- Good, done: `outline` + success dot `bg-success` | `status.paid`, `status.done`, `status.in_stock`, `status.merged`
- Waiting, in progress: `outline` + warning dot `bg-warning` | `status.pending`, `status.in_progress`, `status.low_stock`
- Info, scheduled: `outline` + series-1 dot `bg-chart-1` | `status.scheduled`, `status.shipped`
- Problem, failed, overdue: `destructive` | `status.overdue`, `status.failed`, `status.out_of_stock`

Map each status of a record to one row of this table in one place (a dict in Python, an object in JS) and render from it. One badge per status per item.

## States
- Long label: Badges never wrap: `whitespace-nowrap`; keep labels to two words.
- Count over 99: Show `99+`, full number in `aria-label`.
- Zero count: No badge at all.
- Clickable filter: A badge is never a button; use a `btn data-size="xs" data-variant="outline"` with the dot, `aria-pressed` when active.
- Loading: `skeleton h-5 w-14 rounded-full bg-muted`.
- Few left: A warning badge `<span class="badge" data-variant="outline"><span class="size-1.5 rounded-full bg-warning" aria-hidden="true"></span><span data-t="status.low_stock">Only 2 left</span></span>`.

## Texts
(Key | English | 日本語)
- `status.draft`: Draft | 下書き
- `status.archived`: Archived | アーカイブ済み
- `status.closed`: Closed | クローズ
- `status.new`: New | 新着
- `status.open`: Open | オープン
- `status.paid`: Paid | 支払い済み
- `status.done`: Done | 完了
- `status.in_stock`: In stock | 在庫あり
- `status.merged`: Merged | マージ済み
- `status.pending`: Pending | 保留中
- `status.in_progress`: In progress | 進行中
- `status.low_stock`: Only {count} left | 残り{count}点
- `status.scheduled`: Scheduled | 予定
- `status.shipped`: Shipped | 発送済み
- `status.overdue`: Overdue | 期限切れ
- `status.failed`: Failed | 失敗
- `status.out_of_stock`: Out of stock | 在庫切れ
- `status.unread_count`: {count} unread | 未読{count}件

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

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> StatusBadges` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
