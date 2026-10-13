# Button

A push button: chrome font, 1px ink border, 8px radius, 32px tall (44px on phone).

- `.pw-btn` normal; `.pw-btn--default` for the one button Return presses (at most one per window, dialog or sheet; always the safe or expected action); `:disabled` greys border and text; `:active` / `aria-pressed="true"` inverts.
- `.pw-btn--icon` square with `aria-label`; `.pw-btn--touch` forces 44px; `.pw-btn--plain` drops the border (sheet Cancel/Close).
- Labels are verbs: Queue, Stop, Apply Change, Keep Mine, Reconnect. Shortcut hints sit inside the button in a smaller size: `Stop ⌘.`.
