# WeekCalendar

A week of days side by side with hour rows, the events placed by time, a line for now, and new events made by clicking or dragging an empty slot (or from the keyboard).

| | |
| --- | --- |
| Group | Content |
| Basecoat | `btn`, `button-group`, `badge`, `dialog`, `field`, `input`, `select`, `label` |
| Route | `/calendar/week/2026-10-12` (the Monday) |
| Needs | Web: `GET /calendar/week/{monday}` (the grid fragment), `POST /events`. No server: `store.events(fromISO, toISO)`, `store.addEvent(event)`. |
| Links to | Agenda (month and list views), DatePicker (Go to date), TimePicker (the new-event times), EditForm, AppBooking |

## Markup

```html
<section class="grid gap-3" aria-labelledby="week-title">
  <header class="flex flex-wrap items-center gap-2">
    <h2 id="week-title" class="text-xl font-semibold" data-t="week.title">12–18 October 2026</h2>
    <div class="button-group ml-auto" role="group" aria-label="Week" data-t-label="week.nav">
      <button class="btn" data-variant="outline" data-size="icon-sm" type="button" aria-label="Previous week" data-t-label="week.prev">‹</button>
      <button class="btn" data-variant="outline" data-size="sm" type="button" data-t="week.today">Today</button>
      <button class="btn" data-variant="outline" data-size="icon-sm" type="button" aria-label="Next week" data-t-label="week.next">›</button>
    </div>
    <button class="btn" data-size="sm" type="button" data-t="week.new">New Event</button>
  </header>
  <div class="scrollbar overflow-auto rounded-lg border" style="max-height: 32rem">
    <div class="grid min-w-[44rem] grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]" role="grid" aria-labelledby="week-title" aria-describedby="week-help">
      <div class="sticky top-0 z-10 border-b bg-background" role="presentation"></div>
      <div role="columnheader" class="sticky top-0 z-10 border-b border-l bg-background py-2 text-center text-sm">
        <span class="text-muted-foreground" data-t="week.day.mon">Mon</span> <span class="font-medium">12</span>
      </div>
      <!-- Tue … Sun; today's header: <span class="badge">14</span> and aria-current="date" -->
      <div class="relative col-start-1 row-span-1 h-12 pr-2 text-right text-xs text-muted-foreground" role="rowheader">9:00</div>
      <button class="relative h-12 border-b border-l text-left hover:bg-muted/50 focus-visible:z-10" type="button" role="gridcell"
              data-slot="2026-10-12T09:00" aria-label="Monday 12 October, 9:00, free" data-t-label="week.slot_free"></button>
      <!-- one 30-minute slot per day and half hour; an event sits over its slots: -->
      <a class="absolute inset-x-1 top-1 z-[5] grid rounded-md border-l-4 border-primary bg-primary/10 px-2 py-1 text-xs hover:bg-primary/15"
         style="height: calc(3rem * 2 - 0.5rem)" href="/events/31" aria-label="Cut and colour, 10:00 to 11:00, Kei Mori" data-t-label="week.event_label">
        <span class="truncate font-medium">Cut and colour</span><span class="truncate text-muted-foreground">10:00–11:00 · Kei Mori</span>
      </a>
      <div class="pointer-events-none absolute inset-x-0 z-[6] border-t-2 border-destructive" style="top: 61%" aria-hidden="true"></div>
    </div>
  </div>
  <p id="week-help" class="sr-only" data-t="week.help">Arrow keys move between slots. Return on a free slot makes an event there.</p>
  <p id="week-live" class="sr-only" aria-live="polite"></p>
</section>
```

- Rows are 30 minutes, 3rem tall per hour (`h-12` = one hour row split into two 1.5rem slot buttons, or one `h-12` button per hour for simple calendars). An event's `top` and `height` come from its start and length: `top = (start − first hour) × 3rem`, `height = minutes / 60 × 3rem − 0.5rem`.
- Overlapping events split the day's width: two events side by side get `inset-x-1` replaced by `left-1 right-1/2` and `left-1/2 right-1`.
- The now line (`border-destructive`, 2 px) is only in today's column and moves every minute.
- Day names and dates come from `Intl.DateTimeFormat`: English `Mon 12`, Japanese `12(月)`, title `12–18 October 2026` / `2026年10月12日〜18日`.

The block drawn while dragging to create:

```html
<div class="absolute inset-x-1 z-[5] rounded-md border-2 border-dashed border-primary bg-primary/20 px-2 py-1 text-xs font-medium"
     style="top: 3.25rem; height: 4rem" aria-hidden="true" data-t="week.drag_label">11:00–12:30</div>
```

## States

| State | What changes |
| --- | --- |
| Week (default) | Hours 8:00–20:00 visible, scrolled to 8:00 or to now. |
| Today | Its header gets `aria-current="date"` and the date in a `badge`; the now line shows. |
| Creating by drag | Pressing a free slot and dragging down draws a `bg-primary/20` block with the times (`week.drag_label`); releasing opens the new-event dialog with those times. A click is a 30-minute event. |
| New-event dialog | `<dialog class="dialog">`: Title (required), Starts and Ends (TimePicker), Date (DatePicker), Notes; **Cancel** · **Save Event**. Errors per field: `week.error.title`, `week.error.ends`. |
| Saved | The block appears; toast: `week.saved`; `#week-live` (the live region) says it too. |
| Busy slot | A slot under an event isn't a button (`aria-hidden` on the slot, the event link takes focus). |
| Empty week | The grid stays; a line above it: `week.empty`. |
| Loading | The grid with three `skeleton` blocks per day. |
| Error | InlineAlert above the grid: `week.error.load` with **Try Again**. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `week.title` | {start}–{end} {month} {year} | {year}年{month}月{start}日〜{end}日 |
| `week.nav` | Week | 週 |
| `week.prev` | Previous week | 前の週 |
| `week.next` | Next week | 次の週 |
| `week.today` | Today | 今日 |
| `week.new` | New Event | 予定を追加 |
| `week.day.mon` | Mon | 月 |
| `week.day.tue` | Tue | 火 |
| `week.day.wed` | Wed | 水 |
| `week.day.thu` | Thu | 木 |
| `week.day.fri` | Fri | 金 |
| `week.day.sat` | Sat | 土 |
| `week.day.sun` | Sun | 日 |
| `week.slot_free` | {day}, {time}, free | {day} {time}、空き |
| `week.event_label` | {title}, {start} to {end}, {who} | {title}、{start}〜{end}、{who} |
| `week.help` | Arrow keys move between slots. Return on a free slot makes an event there. | 矢印キーで枠を移動し、空いている枠で Return を押すと予定を追加できます。 |
| `week.drag_label` | {start}–{end} | {start}〜{end} |
| `week.error.title` | Give the event a title. | 予定の名前を入力してください。 |
| `week.error.ends` | The end must be after the start. | 終了は開始より後にしてください。 |
| `week.saved` | Event saved: {title}, {day} {start} | 予定を保存しました：{title}、{day} {start} |
| `week.empty` | Nothing booked this week. | 今週の予定はありません。 |
| `week.error.load` | The week couldn’t be loaded. | 週を読み込めませんでした。 |

## Keyboard and focus

1. ‹ → 2. Today → 3. › → 4. New Event → 5. the grid (one Tab stop; roving focus).
- In the grid: ← → move a day, ↑ ↓ half an hour, Home/End the first/last hour, Page Up/Down a week. Return on a free slot opens the new-event dialog at that time; on an event, opens it.
- `t` goes to today, `n` opens New Event. After saving, focus moves to the new event.

## Phone

- Below 48rem the grid shows three days (`today` and the two after) with ‹ › stepping one day; a `button-group` **Day · 3 Days · Week** switches. The week view scrolls sideways (`min-w-[44rem]`).
- Long-press on a free slot starts creating (drag still works); **New Event** is always there.
- The new-event dialog takes the full width; times use TimePicker's list, dates DatePicker's calendar (Japanese order).

## Data

```json
{"week": "2026-10-12", "first_hour": 8, "last_hour": 20, "timezone": "Asia/Tokyo",
 "events": [{"id": 31, "title": "Cut and colour", "start": "2026-10-12T10:00", "end": "2026-10-12T11:00",
             "who": "Kei Mori", "status": "confirmed"}]}
```

- Web: `GET /calendar/week/2026-10-12` → the grid fragment; `POST /events` (`title, start, end, notes`) → 201 with the event block, 422 with field errors, 409 when the slot was taken meanwhile (`week.error.taken` toast and the grid reloads).
- No server: `store.events('2026-10-12', '2026-10-19')`, `store.addEvent({title, start, end})`.
- Times are local wall-clock times in the app's time zone, stored as ISO without offset plus `timezone`.

## Don't

- Don't make drag the only way to create or move an event.
- Don't show 24 hours by default; 8:00–20:00 unless the data has earlier or later events.
- Don't hard-code day names or the date order; use `Intl` with the page's language.
