# TimePicker

App Block card (Other elements). Pick a time of day: the browser's own time field for any time, or a list of free slots when only some times can be booked.

- Basecoat: `field`, `label`, `input` (`type="time"`), `select` (native `select.select`), `btn`, `button-group`
- Needs: Nothing for the native field. Slots need the free times (`GET /slots?date=` or the store)
- Used in: EditForm, Agenda, AppBooking, SettingsPage (quiet hours)

## Markup
Copy, never retype: `{harness}/kit/blocks/elements/TimePicker.html` (32 lines of HTML).

## States
- Empty: Native: the browser's `--:--`. Slots: nothing checked; the submit button stays enabled and the error explains on submit.
- Chosen: Native value `14:30`. Slot label gets the primary fill through `:has(:checked)`.
- Taken slot: The radio is `disabled`, the label `aria-disabled="true"`, `opacity-50`, the time struck through; screen readers hear `time.taken` (add `<span class="sr-only" data-t="time.taken">taken</span>`).
- No free slots: Replace the grid with `<p class="text-muted-foreground" data-t="time.no_slots">` and a button `time.next_day` (“Show the next free day”).
- Loading slots: Six `skeleton` boxes the size of a slot (`<div class="skeleton h-9 rounded-md bg-muted"></div>`).
- Error: `aria-invalid="true"` on the input or the fieldset, `<p class="text-destructive text-sm">` with `time.error.range` or `time.error.required`.
- Slot taken meanwhile: On submit the server answers 409; the slot becomes Taken, focus moves to the slot grid, the alert says `time.error.gone`.

## Texts
(Key | English | 日本語)
- `time.start`: Start time | 開始時刻
- `time.zone_help`: Times are in Japan time (JST). | 時刻は日本時間（JST）です。
- `time.reminder`: Daily reminder | 毎日のリマインダー
- `time.none`: No reminder | リマインダーなし
- `time.slots`: Choose a time | 時間を選択
- `time.slots_help`: {minutes} minutes · {date} | {minutes}分 · {date}
- `time.taken`: taken | 予約済み
- `time.no_slots`: No free times on this day. | この日は空きがありません。
- `time.next_day`: Show the Next Free Day | 次の空き日を表示
- `time.error.required`: Choose a time. | 時間を選んでください。
- `time.error.range`: Choose a time between {min} and {max}. | {min}から{max}までの時間を選んでください。
- `time.error.gone_title`: That time is gone | この時間は予約済みになりました
- `time.error.gone`: Someone booked {time} a moment ago. Choose another time. | {time}は先ほど予約されました。別の時間を選んでください。

## Keyboard and focus
1. Time field (hour, minute, AM/PM segments with ← →, ↑ ↓ change the value) → 2. next field.
- Slots are one radio group: Tab enters on the checked slot (else the first free one), ← → ↑ ↓ move between free slots, Space chooses. Taken slots are skipped.
- After a 409, focus goes to the radio group and the alert is announced (`role="alert"`).

## Phone
- The native time field opens the system wheel; prefer it on phones.
- Slots: three columns below 48rem, every slot 44 px tall (it is a `btn`). Long days scroll inside the page, not a nested scroller.

## Data
```json
{"date": "2026-10-14", "zone": "Asia/Tokyo", "minutes": 60,
 "slots": [{"time": "10:00", "free": true}, {"time": "11:00", "free": false}, {"time": "14:30", "free": true}],
 "chosen": "14:30"}
```

- Web: `GET /slots?date=2026-10-14` returns the slot fragment (`hx-get` on date change, `hx-target="#slots"`); `POST /bookings` with `slot=14:30` → 201, 409 if taken, 422 if invalid.
- No server: slots come from the app's own rules (opening hours minus saved bookings) in the store; there is no taking-meanwhile case.

## Don't
- Don't make your own hour/minute dropdown pair: use `type="time"`.
- Don't store “2:30 PM” or a local Date; store `14:30` and the zone.
- Don't show AM/PM in Japanese; use 24 hours (14:30), or 午前/午後 only if the app asks for it.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> TimePicker` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
