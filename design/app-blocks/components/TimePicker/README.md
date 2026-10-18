# TimePicker

Pick a time of day: a list of times that reads right in both languages, free slots when only some times can be booked, and the browser's own time field only on English-only pages.

| | |
| --- | --- |
| Group | Other elements |
| Basecoat | `field`, `label`, `input` (`type="time"`), `select` (native `select.select`), `btn`, `button-group` |
| Needs | Nothing for the native field. Slots need the free times (`GET /slots?date=` or the store) |
| Used in | EditForm, Agenda, AppBooking, SettingsPage (quiet hours) |

Times are stored as `HH:MM` in 24 hours, with the time zone named once per form (`Asia/Tokyo`). Display follows the language through `Intl.DateTimeFormat(lang, {hour: 'numeric', minute: '2-digit'})`: English “2:30 PM”, Japanese “14:30” (24-hour, the usual form in Japan). An app whose settings choose a 12-hour clock passes `hour12: true`, which reads 午後2:30 in Japanese. The browser's own `type="time"` field ignores the page's language (an English browser shows 02:30 PM on a Japanese page), so it is used only where the page is English-only.

## Markup

```html
<!-- 1. Time list (the default; any page that is in Japanese or can be): option labels from Intl in the page's language -->
<div class="field">
  <label class="label" for="start-time" data-t="time.start">Start time</label>
  <select class="select" id="start-time" name="start" aria-describedby="start-time-help">
    <option value="14:00">14:00</option>
    <option value="14:15">14:15</option>
    <option value="14:30" selected>14:30</option>
    <option value="14:45">14:45</option>
    <!-- … every 15 minutes between min and max, labels from Intl.DateTimeFormat(lang): “2:30 PM” in English, “14:30” in Japanese -->
  </select>
  <p class="text-muted-foreground text-sm" id="start-time-help" data-t="time.zone_help">Times are in Japan time (JST).</p>
</div>

<!-- 1b. A short fixed list (up to ~30 times) -->
<div class="field">
  <label class="label" for="reminder" data-t="time.reminder">Daily reminder</label>
  <select class="select" id="reminder" name="reminder">
    <option value="" data-t="time.none">No reminder</option>
    <option value="07:00">7:00</option>
    <option value="08:00" selected>8:00</option>
    <option value="21:00">21:00</option>
  </select>
</div>

<!-- 2. Native time field: English-only internal pages (an admin tool used only in English) -->
<div class="field">
  <label class="label" for="start-time-native" data-t="time.start">Start time</label>
  <input class="input" id="start-time-native" name="start" type="time" step="300" min="08:00" max="22:00">
</div>

<!-- 3. Free slots: radio buttons that look like buttons -->
<fieldset class="fieldset" aria-describedby="slots-help">
  <legend class="label" data-t="time.slots">Choose a time</legend>
  <p class="text-muted-foreground text-sm" id="slots-help" data-t="time.slots_help">60 minutes · Wednesday 14 October</p>
  <div class="grid grid-cols-3 gap-2 @3xl:grid-cols-4" role="radiogroup">
    <label class="btn has-[:checked]:bg-primary has-[:checked]:text-primary-foreground" data-variant="outline">
      <input type="radio" name="slot" value="10:00" class="sr-only">10:00
    </label>
    <label class="btn opacity-50" data-variant="outline" aria-disabled="true">
      <input type="radio" name="slot" value="11:00" class="sr-only" disabled><s>11:00</s>
    </label>
    <!-- … one label per slot … -->
  </div>
</fieldset>
```

## States

| State | What changes |
| --- | --- |
| Empty | List: no option chosen (a first `<option value="">` with `time.choose`). Native: the browser's `--:--`. Slots: nothing checked; the submit button stays enabled and the error explains on submit. |
| Chosen | Value `14:30` (24-hour `HH:MM`) in every variant; the list shows it as “2:30 PM” or “14:30”. Slot label gets the primary fill through `:has(:checked)`. |
| Taken slot | The radio is `disabled`, the label `aria-disabled="true"`, `opacity-50`, the time struck through; screen readers hear `time.taken` (add `<span class="sr-only" data-t="time.taken">taken</span>`). |
| No free slots | Replace the grid with `<p class="text-muted-foreground" data-t="time.no_slots">` and a button `time.next_day` (“Show the next free day”). |
| Loading slots | Six `skeleton` boxes the size of a slot (`<div class="skeleton h-9 rounded-md bg-muted"></div>`). |
| Error | `aria-invalid="true"` on the input or the fieldset, `<p class="text-destructive text-sm">` with `time.error.range` (“Choose a time between 8:00 AM and 10:00 PM.”, `min`/`max` formatted like the options) or `time.error.required`, set from code into `#start-time-error`, which the field's `aria-describedby` then names. |
| Which variant | A page that is in Japanese, or that a person can switch to Japanese, uses the list (1) or the slots (3). The native field (2) is fine only on an English-only internal page, or when any minute must be typed and the page is English-only. |
| Slot taken meanwhile | On submit the server answers 409; the slot becomes Taken, focus moves to the slot grid, the `alert` above the grid (`<div class="alert" data-variant="destructive" role="alert">`) shows `time.error.gone_title` and `time.error.gone`, set from code. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `time.start` | Start time | 開始時刻 |
| `time.zone_help` | Times are in Japan time (JST). | 時刻は日本時間（JST）です。 |
| `time.reminder` | Daily reminder | 毎日のリマインダー |
| `time.none` | No reminder | リマインダーなし |
| `time.choose` | Choose a time | 時間を選択 |
| `time.slots` | Choose a time | 時間を選択 |
| `time.slots_help` | {minutes} minutes · {date} | {minutes}分 · {date} |
| `time.taken` | taken | 予約済み |
| `time.no_slots` | No free times on this day. | この日は空きがありません。 |
| `time.next_day` | Show the Next Free Day | 次の空き日を表示 |
| `time.error.required` | Choose a time. | 時間を選んでください。 |
| `time.error.range` | Choose a time between {min} and {max}. | {min}から{max}までの時間を選んでください。 |
| `time.error.gone_title` | That time is gone | この時間は予約済みになりました |
| `time.error.gone` | Someone booked {time} a moment ago. Choose another time. | {time}は先ほど予約されました。別の時間を選んでください。 |

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
