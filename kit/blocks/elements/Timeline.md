# Timeline

App Block card (Other elements). A dated list of events in order, newest first or oldest first: an order's history, a ticket's changes, a course's milestones.

- Basecoat: none for the line (an `ol` with Tailwind utilities); `avatar` for people, `badge` for kinds, `btn` for Show More
- Needs: The events with an ISO time. For people's actions use ActivityFeed instead (it groups, filters and links)
- Used in: OrderConfirmation (delivery), IssueDetail (history), AppCourse (milestones), AppPortfolio (career), DetailView

## Markup
Copy, never retype: `{harness}/kit/blocks/elements/Timeline.html` (22 lines of HTML).

Marker kinds, in the 24 px circle: **done** (filled primary, ✓), **past** (ring with a small dot), **now** (ring `border-2 border-primary` with a filled dot, `aria-current="step"` on the `li`), **future** (dashed ring `border border-dashed border-muted-foreground/60`, text muted), **problem** (filled `bg-destructive`, `!`). A person's event uses their `avatar data-size="sm"` as the marker.

## States
- Loading: Three rows of `skeleton`: a 24 px circle and two bars.
- Empty: `<p class="text-sm text-muted-foreground" data-t="timeline.empty">Nothing has happened yet.</p>`.
- Long history: First 5 events, then `btn data-variant="ghost"` `timeline.more` (“Show {count} Earlier Events”) that loads the rest in place.
- Problem: Problem marker, the title in `text-destructive`, the detail says what to do.
- Expected future: Future markers below “now” with `timeline.expected` before the date (“Expected 16 Oct”).
- Time zones: Show the time in the person's zone; `datetime` always has the offset.

## Texts
(Key | English | 日本語)
- `timeline.title`: History | 履歴
- `timeline.empty`: Nothing has happened yet. | まだ履歴はありません。
- `timeline.more`: Show {count} Earlier Events | 以前の{count}件を表示
- `timeline.expected`: Expected {date} | {date}頃の予定
- `timeline.today`: Today | 今日
- `timeline.yesterday`: Yesterday | 昨日
- `order.event.ordered`: Order placed | ご注文を受け付けました
- `order.event.shipped`: Shipped | 発送しました
- `order.event.out`: Out for delivery | 配達中
- `order.event.delivered`: Delivered | お届けしました
- `order.event.failed`: Delivery attempted | 不在のため持ち帰りました

Dates: English “14 Oct, 15:20”, Japanese “10月14日 15:20”; older than this year add the year (“2025年3月2日”). Today and yesterday use the words.

## Keyboard and focus
- The timeline is read, not operated: no Tab stops except links inside events and the Show Earlier button.
- After Show Earlier, focus moves to the first newly shown event's title (`tabindex="-1"`).

## Phone
- Same layout; it already fits 390 px. Long details wrap; dates stay on their own line.
- Show Earlier is a full-width ghost button, 44 px.

## Data
```json
{"events": [
  {"kind": "delivered", "at": "2026-10-14T15:20:00+09:00", "state": "done", "detail": "Left at the front door."},
  {"kind": "shipped", "at": "2026-10-13T09:05:00+09:00", "state": "past"},
  {"kind": "ordered", "at": "2026-10-12T21:40:00+09:00", "state": "past"}],
 "order": "newest_first", "more": 4}
```

- Web: render server-side; Show Earlier is `hx-get="/orders/123/events?before=2026-10-12T21:40:00%2B09:00" hx-target="closest ol" hx-swap="beforeend"`.
- No server: events are a list on the record, sorted by `at`.

## Don't
- Don't alternate events left and right of a centre line; one column reads in order and works on phones.
- Don't show relative times alone (“3 days ago”) for records people check later; show the date, relative only as a `title`.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> Timeline` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
