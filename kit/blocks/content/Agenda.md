# Agenda

App Block card (Content). A month calendar beside the list of events for the chosen day, with a way to add an event; on the phone the list comes first under a strip of days.

- Basecoat: `card`, `btn`, `button-group`, `item`, `badge`, `empty`, `dialog` (for New Event, see EditForm)
- Route: `/calendar?month=2026-10&day=2026-10-18`
- Needs: Web: `GET /calendar?month=&day=` (page), `GET /calendar/day?day=` (the list fragment), `POST /events`. No server: `store.events(fromIso, toIso)`, `store.addEvent(event)`.
- Links to: EditForm (New Event), DatePicker, TimePicker, EmptyState, LoadingState, ErrorRetry, AppBooking

## Markup
Copy, never retype: `{harness}/kit/blocks/content/Agenda.html` (45 lines of HTML).

`aria-label` texts come from the keys in Texts (`agenda.prev`, `agenda.next`, `agenda.day_label`).

The month grid is a real `<table>` of links (one per day) so it works without JavaScript; arrow keys are an addition (below).

## States
- Day with events (default): The list shows them in time order; all-day events first.
- Empty day: `#agenda-list` is replaced by `<div class="empty"><header><h3 data-t="agenda.empty.title">Nothing on this day</h3><p data-t="agenda.empty.body">Add an event, or pick another day.</p></header></div>`.
- Today: Its cell link gets `aria-current="date"` and a ring (`ring-2 ring-ring`); **Today** is disabled when today is already chosen.
- Chosen day: `aria-selected="true"`, `data-variant="primary"`.
- Other month's days: Shown dim (`text-muted-foreground`), still links.
- Loading a day: `#agenda-list` gets `aria-busy="true"` and three `skeleton h-14` rows (htmx: `hx-indicator`).
- Error: ErrorRetry inside the day card: `agenda.error`, **Try Again**.
- Many events (>3 in a cell): The cell shows 3 dots and `+`; the list scrolls inside the card (`max-h-[60dvh] overflow-y-auto`).
- Long titles: `h3` gets `truncate`; the full title is on the event page.

## Texts
(Key | English | 日本語)
- `agenda.title`: Calendar | カレンダー
- `agenda.prev`: Previous month | 前の月
- `agenda.next`: Next month | 次の月
- `agenda.today`: Today | 今日
- `agenda.new`: New Event | 予定を追加
- `agenda.all_day`: All day | 終日
- `agenda.day_label`: {date}, {count} events | {date}、予定 {count} 件
- `agenda.empty.title`: Nothing on this day | この日の予定はありません
- `agenda.empty.body`: Add an event, or pick another day. | 予定を追加するか、別の日を選んでください。
- `agenda.error`: The events couldn’t load. Try again. | 予定を読み込めませんでした。もう一度お試しください。
- `agenda.duration_h`: {hours} h | {hours} 時間

Month and weekday names come from `Intl.DateTimeFormat(lang, …)`, not from the message files: “October 2026” / “2026年10月”, “Sunday, 18 October” / “10月18日（日）”.

## Keyboard and focus
1. Previous month → 2. Today → 3. Next month → 4. the chosen day in the grid (one tab stop; `tabindex="-1"` on the other days) → 5. New Event → 6. each event.
- In the grid: ← → move a day, ↑ ↓ a week, Home/End the start/end of the week, Page Up/Down a month; Return or Space opens that day's list. Moving changes the chosen day and loads its list without moving focus out of the grid.
- After New Event is saved, focus goes to the new event in the list.

## Phone
- The two columns stack: the month card first, collapsed to a single row of seven days (the chosen week) with a **Month** toggle (`agenda.show_month` “Show Month” / “月を表示”) that expands the full grid; the list under it.
- Swiping the week strip left/right changes the week; the ‹ › buttons do the same.
- New Event opens the dialog full-screen (EditForm's phone rule).

## Data
```json
{"month": "2026-10", "day": "2026-10-18", "week_starts": "monday",
 "days": [{"date": "2026-10-12", "count": 2}],
 "events": [{"id": 41, "title": "Kanji study group", "start": "2026-10-18T10:00:00+09:00", "end": "2026-10-18T11:00:00+09:00", "all_day": false, "place": "Library, room 3", "tag": null},
            {"id": 42, "title": "Culture festival", "start": "2026-10-18", "end": "2026-10-18", "all_day": true, "place": "School grounds", "tag": "School"}]}
```

- Web: `GET /calendar/day?day=2026-10-18` returns the `#agenda-list` fragment (`hx-get` on each day link with `hx-target="#agenda-list" hx-push-url="true"`).
- No server: `store.events('2026-10-01', '2026-11-01')`; times are stored in ISO 8601 with the offset and shown in the person's time zone.

## Don't
- Don't build a week or day timeline view here; that's a separate block if needed.
- Don't hard-code month or weekday names; use `Intl.DateTimeFormat`.
- Don't make the grid a set of `div`s; keep the table and links.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> Agenda` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
