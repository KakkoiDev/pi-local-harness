# CheckInCard

After each verified task in a plan: the task's DoneRow while it waits for the person. Boards: R10_CheckIn, R10_CheckInStates, Ph10_CheckIn.

- One task is one commit, so the check-in **is** that task's DoneRow (round 7), framed while it waits. Head: ✓ “Task 1 of 4 done: <title>”, files and time. Body: Pi's plain words; `dl.pw-facts` **Verified** (the command and how many passed) and **Next** (the next task); links Show in Preview · Undo This Task….
- Foot: **Continue** (default) · **Review First** · **Stop Here**.
- **Continued**: it settles into the ordinary DoneRow, its head adding “continued by you · 14:33” or the dotted `auto` tag.
- **Not verified**: the head says so with the caution glyph, “Not verified: no passing test run after the last change”, and **Review First** becomes the default. Run on its own stops here too.
- **Stop Here**: one settled line “Stopped after task 1 of 4 · you · 14:34 · Continue Plan”.

## Round 11 (replaces the round 10 labels)

- The head's right side reads “Waiting for you to check it”. Buttons: **Accept and Continue** (default; replaces Continue) · Review First · Stop Here. Stop Here pauses without accepting; the card keeps waiting. All of this stays in Implementation.
- The last task: **Accept Task**; then one settled line “All 4 planned tasks are built · still Implementation · Back to Discussion” (Back to Discussion is the person's choice; Pi never moves the phase).

## Round 12 (task 260, plan 267)

- **Not verified** (no passing test run after the last change): caution head “Task 2 of 4 not verified: Subjects”, facts Not verified (the command and its result), **Outside the task** (changed files not in its Files, named), Next. Foot: **Retry Task** (default) · Review First · **Accept Anyway…** · Stop Here. Accept Anyway… asks “Accept task 2 without a passing test?”; the task is then marked “accepted without verification” in ROADMAP.md. Reopen Task… (Work, Activity) unchecks its boxes and reopens its ROADMAP line; the code stays.
- **Evidence** on a done check-in: Test run (command · passed · failed · time), Tests changed, Tried it, Next. When a test was removed or weakened the line carries a caution and **Review First** becomes the default.
- **Restored** after a reload: a `.pw-notice` “Restored · This check-in comes from the project's state (tasks/…).” at the top of the body.
