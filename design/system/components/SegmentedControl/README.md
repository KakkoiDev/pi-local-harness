# SegmentedControl

A row of joined buttons where one is current: the project view switcher (Chat ⌘1 | Work ⌘2 — the only two tabs in the project window; Activity and Gate are app-level windows), the Review filter (Open · Resolved · Deleted) and the comment-type picker on phone.

- Views: `<nav class="pw-seg">` of `<a>` or `<button>` with `aria-current="page"` on the current view.
- Filters: `<div class="pw-seg" role="radiogroup">` of `<button role="radio" aria-checked>`; add counts in the label (Open 2).
- `.pw-seg--fill` stretches segments evenly; `.pw-seg--touch` makes them 44px.
- Phone filters: Activity (All · Active N · Attention N · Done) and Gate (All · Before · After · Problems) replace the desk Show popup below 761px. `segmentFor(seg, select)` in `js/ui.mjs` keeps the `<select>` as the state: a radio sets it and fires `change`; arrow keys move the choice.
