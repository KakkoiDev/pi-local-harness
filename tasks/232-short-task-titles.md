# 232: Tasks get a short title, not the first 70 characters

Kind: code

The person, 2026-10-16: "The task title is cut off: what can we do about it?" gate/paperwork.py `subject()` takes the request's first line
cut at 70 characters: "I want to make a very basic and minimal pong game. white pales and whi".

## Steps
- [ ] Red: tests for a `short_title(text)` in gate/paperwork.py: drops filler openings ("I want to", "I would like to",
  "Can you", "Please", "make a", "create a"), stops at the first sentence end, cuts at a word boundary at 48 characters
  with "…", capitalises the first letter. "I want to make a very basic and minimal pong game. white pales…" → "Very basic
  and minimal pong game".
- [ ] Use it for the task file name and its title. Keep the full request in the task's "Request" line (it is already
  there).
- [ ] Better title from Pi: in plan mode (task 237) Pi names each task in its plan; the paperwork renames the request's
  task when Pi gives a title (a `title` field in the plan, or the task file's first heading changed by Pi). The
  heuristic stays as the fallback for small models.
- [ ] Green.

## Done when
No task title ends in the middle of a word, and plan-mode tasks carry Pi's own short titles.
