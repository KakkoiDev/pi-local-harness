# Agenda

A month calendar beside the list of events for the chosen day, with a way to add an event; on the phone the list comes first under a strip of days.

| | |
| --- | --- |
| Group | Content |
| Basecoat | `card`, `btn`, `button-group`, `item`, `badge`, `empty`, `dialog` (for New Event, see EditForm) |
| Route | `/calendar?month=2026-10&day=2026-10-18` |
| Needs | Web: `GET /calendar?month=&day=` (page), `GET /calendar/day?day=` (the list fragment), `POST /events`. No server: `store.events(fromIso, toIso)`, `store.addEvent(event)`. |
| Links to | EditForm (New Event), DatePicker, TimePicker, EmptyState, LoadingState, ErrorRetry, AppBooking |

## Markup

```html
<main class="app grid gap-4 p-4 @3xl:grid-cols-[minmax(0,1fr)_20rem] @3xl:p-8">
  <section class="card gap-4 p-4" aria-labelledby="agenda-month">
    <header class="flex items-center justify-between gap-2">
      <h1 id="agenda-month" class="text-lg font-semibold">October 2026</h1>
      <div class="button-group">
        <a class="btn" data-variant="outline" data-size="icon" href="?month=2026-09" aria-label="Previous month" data-t-label="agenda.prev">‹</a>
        <a class="btn" data-variant="outline" href="?month=2026-10&day=2026-10-18" data-t="agenda.today">Today</a>
        <a class="btn" data-variant="outline" data-size="icon" href="?month=2026-11" aria-label="Next month" data-t-label="agenda.next">›</a>
      </div>
    </header>
    <table class="w-full table-fixed text-center text-sm" role="grid" aria-labelledby="agenda-month">
      <thead class="text-muted-foreground">
        <tr><th scope="col" abbr="Monday">Mon</th><!-- … Sun; week starts Monday in ja and en-GB, Sunday in en-US --></tr>
      </thead>
      <tbody>
        <tr>
          <td><a class="btn w-full flex-col gap-0" data-variant="ghost" href="?day=2026-10-12" aria-label="12 October, 2 events" data-t-label="agenda.day_label">12<span class="flex h-1.5 gap-0.5" aria-hidden="true"><span class="size-1.5 rounded-full bg-primary"></span><span class="size-1.5 rounded-full bg-primary"></span></span></a></td>
          <!-- the chosen day: data-variant="primary" aria-current="date" on today, aria-selected="true" on the chosen day -->
        </tr>
      </tbody>
    </table>
  </section>

  <section class="card gap-3 p-4" aria-labelledby="agenda-day">
    <header class="flex items-center justify-between gap-2">
      <h2 id="agenda-day" class="font-semibold">Sunday, 18 October</h2>
      <button class="btn" data-size="sm" type="button" onclick="document.getElementById('event-dialog').showModal()" data-t="agenda.new">New Event</button>
    </header>
    <ol class="grid gap-2" id="agenda-list">
      <li>
        <a class="item" data-variant="outline" href="/events/41">
          <figure class="w-14 text-sm tabular-nums text-muted-foreground"><time datetime="2026-10-18T10:00">10:00</time></figure>
          <section><h3>Kanji study group</h3><p>Library, room 3 · <span data-t="agenda.duration_h">1 h</span></p></section>
        </a>
      </li>
      <li>
        <a class="item" data-variant="outline" href="/events/42">
          <figure class="w-14 text-sm text-muted-foreground" data-t="agenda.all_day">All day</figure>
          <section><h3>Culture festival</h3><p>School grounds</p></section>
          <aside><span class="badge" data-variant="secondary">School</span></aside>
        </a>
      </li>
    </ol>
  </section>
</main>
```

`aria-label` texts come from the keys in Texts (`agenda.prev`, `agenda.next`, `agenda.day_label`).

The month grid is a real `<table>` of links (one per day) so it works without JavaScript; arrow keys are an addition (below).

## States

| State | What changes |
| --- | --- |
| Day with events (default) | The list shows them in time order; all-day events first. |
| Empty day | `#agenda-list` is replaced by `<div class="empty"><header><h3 data-t="agenda.empty.title">Nothing on this day</h3><p data-t="agenda.empty.body">Add an event, or pick another day.</p></header></div>`. |
| Today | Its cell link gets `aria-current="date"` and a ring (`ring-2 ring-ring`); **Today** is disabled when today is already chosen. |
| Chosen day | `aria-selected="true"`, `data-variant="primary"`. |
| Other month's days | Shown dim (`text-muted-foreground`), still links. |
| Loading a day | `#agenda-list` gets `aria-busy="true"` and three `skeleton h-14` rows (htmx: `hx-indicator`). |
| Error | ErrorRetry inside the day card: `agenda.error`, **Try Again**. |
| Many events (>3 in a cell) | The cell shows 3 dots and `+`; the list scrolls inside the card (`max-h-[60dvh] overflow-y-auto`). |
| Long titles | `h3` gets `truncate`; the full title is on the event page. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `agenda.title` | Calendar | カレンダー |
| `agenda.prev` | Previous month | 前の月 |
| `agenda.next` | Next month | 次の月 |
| `agenda.today` | Today | 今日 |
| `agenda.new` | New Event | 予定を追加 |
| `agenda.all_day` | All day | 終日 |
| `agenda.day_label` | {date}, {count} events | {date}、予定 {count} 件 |
| `agenda.empty.title` | Nothing on this day | この日の予定はありません |
| `agenda.empty.body` | Add an event, or pick another day. | 予定を追加するか、別の日を選んでください。 |
| `agenda.error` | The events couldn’t load. Try again. | 予定を読み込めませんでした。もう一度お試しください。 |
| `agenda.duration_h` | {hours} h | {hours} 時間 |

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
