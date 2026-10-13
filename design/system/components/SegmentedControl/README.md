# SegmentedControl

A row of joined buttons where one is current: the view switcher (Chat ⌘1, Work ⌘2, Activity ⌘3, Laya ⌘4), the Review filter (Open · Resolved · Deleted) and the comment-type picker on phone.

- Views: `<nav class="pw-seg">` of `<a>` or `<button>` with `aria-current="page"` on the current view.
- Filters: `<div class="pw-seg" role="radiogroup">` of `<button role="radio" aria-checked>`; add counts in the label (Open 2).
- `.pw-seg--fill` stretches segments evenly; `.pw-seg--touch` makes them 44px.
