# CheckInCard

After each verified task in a plan: the task's DoneRow while it waits for the person. Boards: R10_CheckIn, R10_CheckInStates, Ph10_CheckIn.

- One task is one commit, so the check-in **is** that task's DoneRow (round 7), framed while it waits. Head: ✓ “Task 1 of 4 done: <title>”, files and time. Body: Pi's plain words; `dl.pw-facts` **Verified** (the command and how many passed) and **Next** (the next task); links Show in Preview · Undo This Task….
- Foot: **Continue** (default) · **Review First** · **Stop Here**.
- **Continued**: it settles into the ordinary DoneRow, its head adding “continued by you · 14:33” or the dotted `auto` tag.
- **Not verified**: the head says so with the caution glyph, “Not verified: no passing test run after the last change”, and **Review First** becomes the default. Run on its own stops here too.
- **Stop Here**: one settled line “Stopped after task 1 of 4 · you · 14:34 · Continue Plan”.
