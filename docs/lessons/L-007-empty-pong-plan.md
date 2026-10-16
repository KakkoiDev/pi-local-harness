# L-007: Built the app while its plan stayed empty

**Seen** 2026-10-16: a pong project still had “Describe what we are building.”, “Define the first task” and the
unchanged generic first task after the game was built. Passing tests did not make its plan useful.

**Why it matters** The person needs the Goal, concrete tasks and completion criteria to see what Pi is doing.

**Checked** G-014 lists missing Goal text, placeholder tasks, and linked tasks without checkboxes or a `Done when:`
line. A code request gets one chance to fill them; otherwise its task stays open and the commit is marked
“Plan incomplete”. Tests: `tests/test_gate_rules.py`.
