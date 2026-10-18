# DatePicker

Pick one date: the browser's own date field first, and a calendar popover when people need to see the month (bookings, due dates).

| | |
| --- | --- |
| Group | Other elements |
| Basecoat | `field`, `label`, `input` (`type="date"`), `popover`, `btn`, `button-group` |
| Needs | Nothing: the value is an ISO date `YYYY-MM-DD` in a form field. The calendar version needs `js/basecoat.min.js` (popover) and the small script below |
| Used in | EditForm, Agenda, Checkout, AppBooking, IssueDetail (due date) |

Two forms, one value. **Use the native field** unless the person must compare days (free/busy days, a range of nights): then use the calendar popover. Both submit the same hidden or native `name` with `YYYY-MM-DD`.

## Markup

```html
<!-- 1. Native date field (default) -->
<div class="field">
  <label class="label" for="due-date" data-t="date.due">Due date</label>
  <input class="input" id="due-date" name="due" type="date" min="2026-01-01" max="2027-12-31" aria-describedby="due-date-help">
  <p class="text-muted-foreground text-sm" id="due-date-help" data-t="date.due_help">The day the task should be done.</p>
</div>

<!-- 2. Calendar popover -->
<div class="field">
  <label class="label" id="visit-label" for="visit-trigger" data-t="date.visit">Visit date</label>
  <div id="visit" class="popover">
    <button type="button" class="btn w-full justify-start font-normal" data-variant="outline" id="visit-trigger"
            aria-haspopup="dialog" aria-expanded="false" aria-controls="visit-popover" aria-labelledby="visit-label visit-trigger">
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
      <span id="visit-text" data-t="date.choose">Choose a date</span>
    </button>
    <div id="visit-popover" data-popover aria-hidden="true" class="w-72 p-3" role="dialog" aria-label="Visit date" data-t-label="date.visit">
      <header class="flex items-center justify-between gap-2 pb-2">
        <button type="button" class="btn" data-variant="ghost" data-size="icon-sm" data-step="-1" aria-label="Previous month" data-t-label="date.prev_month">‹</button>
        <h2 class="text-sm font-medium" id="visit-month" aria-live="polite">October 2026</h2>
        <button type="button" class="btn" data-variant="ghost" data-size="icon-sm" data-step="1" aria-label="Next month" data-t-label="date.next_month">›</button>
      </header>
      <table class="w-full text-center text-sm" role="grid" aria-labelledby="visit-month">
        <thead><tr class="text-muted-foreground text-xs"><th scope="col" abbr="Monday">Mo</th><th scope="col">Tu</th><th scope="col">We</th><th scope="col">Th</th><th scope="col">Fr</th><th scope="col">Sa</th><th scope="col">Su</th></tr></thead>
        <tbody><!-- 6 rows × 7 cells, filled by the script -->
          <tr><td><button type="button" class="btn" data-variant="ghost" data-size="icon-sm" data-date="2026-10-01" tabindex="-1">1</button></td>…</tr>
        </tbody>
      </table>
      <footer class="flex justify-between gap-2 pt-2">
        <button type="button" class="btn" data-variant="ghost" data-size="sm" data-today data-t="date.today">Today</button>
        <button type="button" class="btn" data-variant="ghost" data-size="sm" data-clear data-t="date.clear">Clear</button>
      </footer>
    </div>
  </div>
  <input type="hidden" name="visit" id="visit-value" value="">
</div>
```

Day buttons: the chosen day gets `data-variant="primary"` (remove `ghost`) and `aria-selected="true"`; today gets `aria-current="date"` and `class="… font-semibold underline"`; days outside the month get `class="… text-muted-foreground"`; days outside `min`/`max` or unavailable get `disabled`. Exactly one day button has `tabindex="0"` (the chosen day, else today).

## States

| State | What changes |
| --- | --- |
| Empty | Native: the browser's placeholder (`yyyy/mm/dd` or the locale's). Calendar: the trigger shows `date.choose` in `text-muted-foreground`. |
| Chosen | Trigger text = the date in the page language (`Intl.DateTimeFormat(lang, {dateStyle: "medium"})`): “14 Oct 2026” / “2026年10月14日”. Hidden input = `2026-10-14`. |
| Open | Trigger `aria-expanded="true"`, popover `aria-hidden="false"`, focus on the chosen day (else today). |
| Unavailable days | `disabled` and `line-through` on the button; the help line says why with `date.unavailable_help`. |
| Out of range / invalid | The field gets `aria-invalid="true"` and an error `<p class="text-destructive text-sm">` with `date.error.range` (“Choose a date between {min} and {max}.”). |
| Required, empty on submit | `date.error.required`. |
| Disabled | `disabled` on the input or trigger; never hide the field. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `date.due` | Due date | 期限 |
| `date.due_help` | The day the task should be done. | タスクを終える予定の日です。 |
| `date.visit` | Visit date | 来店日 |
| `date.choose` | Choose a date | 日付を選択 |
| `date.prev_month` | Previous month | 前の月 |
| `date.next_month` | Next month | 次の月 |
| `date.today` | Today | 今日 |
| `date.clear` | Clear | クリア |
| `date.month_title` | {month} {year} | {year}年{month}月 |
| `date.weekdays` | Mo,Tu,We,Th,Fr,Sa,Su | 月,火,水,木,金,土,日 |
| `date.unavailable_help` | Crossed-out days are fully booked. | 取り消し線の日は満席です。 |
| `date.error.range` | Choose a date between {min} and {max}. | {min}から{max}までの日付を選んでください。 |
| `date.error.required` | Choose a date. | 日付を選んでください。 |

Japanese dates read year, month, day: `2026年10月14日（水）`; the month title is `2026年10月`. Weeks start on Monday in both languages unless the app says otherwise (one setting, `week_start`).

## Keyboard and focus

1. The date field (native) or the trigger button (calendar) → 2. the next field.
- Calendar open (Return, Space or ↓ on the trigger): focus on the chosen day. ← → move a day, ↑ ↓ a week, Page Up / Page Down a month, Home / End the start / end of the week, Return or Space chooses and closes, Esc closes without change. Focus returns to the trigger.
- Inside the popover Tab moves: day grid → Previous / Next month → Today → Clear (roving tabindex inside the grid).

## Phone

- Prefer the native field on the phone: it opens the system wheel or calendar and is 44 px tall.
- The calendar popover becomes full width under the trigger (`w-[calc(100cqi-2rem)]`), day buttons `@max-3xl:size-11` so every day is a 44 px target.

## Data

```json
{"due": "2026-10-14", "min": "2026-01-01", "max": "2027-12-31", "unavailable": ["2026-10-17", "2026-10-18"]}
```

- Web: the form posts `due=2026-10-14`; the server validates the range and returns the field fragment with the error state (422). Unavailable days for the calendar: `GET /availability?month=2026-10` → `{"unavailable": [...]}`.
- No server: the value is stored as the ISO string; format only for display.
- Never store a display string (“14 Oct”), a timestamp in local time, or a Date object's `toString()`.

## Don't

- Don't build a calendar where the native field works.
- Don't parse `new Date("2026-10-14")` for display (it is UTC and can show the previous day); split the parts or use `Temporal.PlainDate` when available.
- Don't write Japanese dates as `10/14/2026` or `14/10/2026`.
