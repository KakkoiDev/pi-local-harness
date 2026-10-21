# Brief: a checklist of the plan while Pi builds

Date: 2026-10-22. Task: [362](../../tasks/362-plan-checklist-while-building.md). Back end built (Gate's phase reply
carries `progress`); the web UI waits for this canvas.

The person: "when a task is being implemented, it shows a little checklist … to signal to user what is the full plan,
that is being worked on right now and that was done already". They showed the checklist Claude's app pins under its
latest message: one line per step, a check for done, a ring for the step in progress, an empty ring for the rest.

## The problem today

In Implementation the person sees the phase button, the chat and, at the end of each task, the check-in card. While Pi
builds three approved tasks (often 10 to 60 minutes with a local model), nothing on screen says which task Pi is on,
which are done, what comes next, or how far the current task has got. The person reads the chat to find out.

## What to draw

A compact checklist that belongs to the composer area (above the composer, below the last message), visible only in
Implementation while a plan is being built:

- **One row per approved task, in build order**, title as in the task file. States, each glyph + word, never colour alone:
  - done (accepted, or accepted anyway: say "accepted without verification" for that one, as the ROADMAP label does);
  - in progress (Pi is working on it);
  - waits for your check (the check-in card is open: the row points to it);
  - next (not started).
- **The task in progress opens its steps**: the task file's checkboxes (typically Red, the change, Green), ticked or not,
  indented under its row. Long step text is cut to one line with the full text on hover / in the expanded view.
- **A header line**: "Task 2 of 3" and how many steps of the current task are done ("Red done · 1 of 3 steps").
- **Collapsed state**: one line ("Task 2 of 3: Add multiply · in progress") that opens the full list. Desktop: open by
  default, the person can fold it; the choice is remembered per project. Phone (≤ 760 px): folded by default, the line
  opens a sheet or expands in place.
- **When the plan finishes**: the list shows all done for a moment (or until the next message), then goes away; the
  plan stays reachable through "Open the Plan" as today.
- **Planning / Discussion**: no checklist. The existing "N planned tasks wait" line stays as it is.

Live updates: the list changes when Pi ticks a box in the task file or the plan moves on; no reload. Motion: at most a
quiet change of glyph; none under reduced motion.

## Data (served today by `POST /api/phase` and the phase reply)

```json
"progress": {
  "total": 3, "current": 1, "finished": false,
  "tasks": [
    {"path": "tasks/002-add-subtraction.md", "title": "Add subtraction", "state": "done"},
    {"path": "tasks/003-add-multiply.md", "title": "Add multiply", "state": "in_progress",
     "steps": [{"text": "Red: a test fails for this change.", "done": true},
               {"text": "Green: the test passes with this change.", "done": false}]},
    {"path": "tasks/004-add-divide.md", "title": "Add divide", "state": "next"}
  ]
}
```

`state` is one of `done`, `accepted_anyway`, `in_progress`, `check_in` (waits for the person's check), `next`.
`progress` is `null` outside a build. Only the current task carries `steps`.

## Constraints

- The 1-bit Pi WorkStation family and its components (rows like `.pw-choice`, glyph + word states, `pw-help` text).
- Accessible: a list with the state in words for screen readers; the fold control is a real button with
  `aria-expanded`; nothing conveyed by colour alone.
- Must not push the composer off a phone screen: folded is one line.
- Every control will get an e2e step (dogfood rule), so keep controls few: the fold toggle, and a task row that opens
  its task file (optional).

## Acceptance (the task's scenarios)

- Second of three tasks: first done, second in progress, third next.
- A step Pi ticks shows as done under the task in progress.
- A task waiting for the check-in says so; the next one is not started.
- Phone: one line "Task 2 of 3" opens the whole list; the same control closes it.
