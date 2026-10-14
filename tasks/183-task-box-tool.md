# 183: Tick a task box by its label (task_box)

Kind: code

Report 2026-10-15: "it seems like it had issues creating checkboxes in the task md file". In task 173's run Pi's edit to
tick boxes was sent back (its old text was not in the file exactly; Gate event 289), and its script then searched for
an unticked “Red:” box while the file said “Red (browser…”, so nothing was ticked (docs/lessons/L-003).

- [x] Red (node): `boxEdit` finds the one box whose label starts with the given words (case and spacing ignored), ticks
  or unticks it, and answers none or several with the list of boxes. Red (extension test against the real Gate): a
  task_box call is allowed as the exact edit and its audit passes; a label that matches nothing is answered with the list.
- [x] `harness/task-box.mjs` and the `task_box` tool; the extension sends Gate the edit it becomes (so G-004, G-009 and
  G-010 apply) and audits the same edit; G-008's message and the rules summary name it; tool rows draw it.
