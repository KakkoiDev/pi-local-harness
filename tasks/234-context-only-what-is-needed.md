# 234: Each turn, only the files that are needed are in Pi's context

Kind: code

The person, 2026-10-16: "refine selection algorithm and make sure that at every turn only the needed files are loaded
into context." In ~/Code/pong, Pi's context held ROADMAP.md, vendor/basecoat/LICENSE.md and tasks/001-first-task.md;
not README.md (the starter's rules), not the files the request was about.

## Where
- harness/documents.py, around `context_files=[item for item in inventory if …]` (the selection) and the function that
  builds the context text; harness/web_chat.py `context_preview` (what the "Pi sees:" line shows); the terminal path
  (harness/extension.mjs builds `PI_HARNESS_CONTEXT`; grep it).

## Rules for the selection (write them as one function with a docstring and tests)
1. Never: vendor/, node_modules/, .venv/, static/app.css and other build outputs, lockfiles (uv.lock), LICENSE*,
   binary files, files over 40 KB.
2. Always, when present: README.md of the project (its rules), ROADMAP.md, the task in progress (the request's task).
3. The files the request names (paths or file names in the text), the files the current task lists, the files changed
   in the last commit of this request.
4. Then by relevance to the request's words (file names first), up to the budget (keep today's character budget).
5. Re-evaluated every turn (every user message and every re-ask), not once per chat.

## Steps
- [ ] Red: python tests on a fixture project like pong (vendor/, LICENSE, README.md, js/app.mjs, tasks/): the
  selection for "make the ball faster" includes README.md, ROADMAP.md, js/app.mjs and excludes vendor/ and LICENSE.
- [ ] Implement; the "Pi sees:" line shows the same selection (it must, it is the same function).
- [ ] Log the selection per turn in the request record (`context.included` exists; add the reason per file).
- [ ] Green.

## Done when
For any turn, "Pi sees:" lists only files from the rules above, each with a reason, and never vendor files or licences.
