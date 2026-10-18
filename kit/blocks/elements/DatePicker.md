# DatePicker

App Block card (Other elements). Pick one date with a calendar popover that reads the page's language (2026年10月14日 in Japanese), or the browser's own date field on an English-only internal page.

- Basecoat: `field`, `label`, `popover`, `btn`, `button-group`; `input` (`type="date"`) only for the native form
- Needs: Nothing: the value is an ISO date `YYYY-MM-DD` in a form field. The calendar version needs `js/basecoat.min.js` (popover) and the small script below
- Used in: EditForm, Agenda, Checkout, AppBooking, IssueDetail (due date)

## Markup
Copy, never retype: `{harness}/kit/blocks/elements/DatePicker.html` (36 lines of HTML).

Day buttons: the chosen day gets `data-variant="primary"` (remove `ghost`) and `aria-selected="true"`; today gets `aria-current="date"` and `class="… font-semibold underline"`; days outside the month get `class="… text-muted-foreground"`; days outside `min`/`max` or unavailable get `disabled`. Exactly one day button has `tabindex="0"` (the chosen day, else today).

## States
- Empty: Native: the browser's placeholder (`yyyy/mm/dd` or the locale's). Calendar: the trigger shows `date.choose` in `text-muted-foreground`.
- Chosen: Trigger text = the date in the page language (`Intl.DateTimeFormat(lang, {dateStyle: "medium"})`): “14 Oct 2026” / “2026年10月14日”. Hidden input = `2026-10-14`.
- Open: Trigger `aria-expanded="true"`, popover `aria-hidden="false"`, focus on the chosen day (else today).
- Unavailable days: `disabled` and `line-through` on the button; the help line says why with `date.unavailable_help`.
- Out of range / invalid: The field gets `aria-invalid="true"` and an error `<p class="text-destructive text-sm">` with `date.error.range` (“Choose a date between {min} and {max}.”).
- Required, empty on submit: `date.error.required`.
- Disabled: `disabled` on the input or trigger; never hide the field.
- Month heading and range: `date.month_title` → the popover’s month heading (“October 2026” / 2026年10月); `date.error.range` → the field’s error line under it.
- Japanese page: The trigger shows the chosen date as `2026年10月14日（水）` (`Intl.DateTimeFormat('ja-JP', {year:'numeric', month:'long', day:'numeric', weekday:'short'})`), the month heading `2026年10月`, weekday headers 月 火 水 木 金 土 日.

## Texts
(Key | English | 日本語)
- `date.due`: Due date | 期限
- `date.due_help`: The day the task should be done. | タスクを終える予定の日です。
- `date.visit`: Visit date | 来店日
- `date.choose`: Choose a date | 日付を選択
- `date.prev_month`: Previous month | 前の月
- `date.next_month`: Next month | 次の月
- `date.today`: Today | 今日
- `date.clear`: Clear | クリア
- `date.month_title`: {month} {year} | {year}年{month}月
- `date.weekdays`: Mo,Tu,We,Th,Fr,Sa,Su | 月,火,水,木,金,土,日
- `date.unavailable_help`: Crossed-out days are fully booked. | 取り消し線の日は満席です。
- `date.error.range`: Choose a date between {min} and {max}. | {min}から{max}までの日付を選んでください。
- `date.error.required`: Choose a date. | 日付を選んでください。

Japanese dates read year, month, day: `2026年10月14日（水）`; the month title is `2026年10月`. Weeks start on Monday in both languages unless the app says otherwise (one setting, `week_start`).

## Keyboard and focus
1. The trigger button (calendar) or the date field (native) → 2. the next field.
- Calendar open (Return, Space or ↓ on the trigger): focus on the chosen day. ← → move a day, ↑ ↓ a week, Page Up / Page Down a month, Home / End the start / end of the week, Return or Space chooses and closes, Esc closes without change. Focus returns to the trigger.
- Inside the popover Tab moves: day grid → Previous / Next month → Today → Clear (roving tabindex inside the grid).

## Phone
- The calendar is the phone's form too on Japanese pages (the system wheel would show the browser's format); on an English-only internal page the native field is fine and opens the system picker at 44 px.
- The calendar popover becomes full width under the trigger (`w-[calc(100cqi-2rem)]`), day buttons `@max-3xl:size-11` so every day is a 44 px target.

## Data
```json
{"due": "2026-10-14", "min": "2026-01-01", "max": "2027-12-31", "unavailable": ["2026-10-17", "2026-10-18"]}
```

- Web: the form posts `due=2026-10-14`; the server validates the range and returns the field fragment with the error state (422). Unavailable days for the calendar: `GET /availability?month=2026-10` → `{"unavailable": [...]}`.
- No server: the value is stored as the ISO string; format only for display.
- Never store a display string (“14 Oct”), a timestamp in local time, or a Date object's `toString()`.

## Don't
- Don't use the native field on a page that is, or can be, in Japanese.
- Don't parse `new Date("2026-10-14")` for display (it is UTC and can show the previous day); split the parts or use `Temporal.PlainDate` when available.
- Don't write Japanese dates as `10/14/2026` or `14/10/2026`.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> DatePicker` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
