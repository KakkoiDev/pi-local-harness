# L-006: A test that could not pass, and a fix for a guessed cause

**Seen** 2026-10-15, task 173 ("the view is lifted, white at the bottom"). Pi's analysis guessed the chat thread's
scroll position. It changed `showView` and `showMessage` to restore it, and added a test that clicked "Open in Chat" on
a whole-file request, whose button is "Show in Review": the test waited forever, with or without the fix. The real cause
was elsewhere: under 1100px the desk behind the windows was scrollable because a hidden screen-reader line sat below the
conversation (fixed in task 173, `chat.css`).

**Why it matters** A fix for a guessed cause, checked by a test that never ran, looks finished. It would have shipped a
change that did nothing and a test that hangs.

**Done** The bug was reproduced in the browser and fixed (task 173); the test checks the desk, at the width where it
happens.

**Open** Enforced: as L-005, a Red box is ticked only after the test was seen failing for the reason in the task. Told:
a bug task starts with "Reproduced: how" before any fix.
