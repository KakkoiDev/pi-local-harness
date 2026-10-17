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
- [x] Red: python tests on a fixture project like pong (vendor/, LICENSE, README.md, js/app.mjs, tasks/): the
  selection for "make the ball faster" includes README.md, ROADMAP.md, js/app.mjs and excludes vendor/ and LICENSE.
- [x] Implement; the "Pi sees:" line shows the same selection (it must, it is the same function).
- [x] Log the selection per turn in the request record (`context.included` exists; add the reason per file).
- [x] Green: 38 context/services/web/queue tests, 101 Node tests, both browser suites and full workflow verification.

## Done when
For any turn, "Pi sees:" lists only files from the rules above, each with a reason, and never vendor files or licences.

## Decisions

Confirmed by the person, 2026-10-16: terminal Pi gets the same automatic selection as the web; when this request has
no commit yet, use the latest harness-created project commit. A later human commit is not the fallback.

## Visible reasons

- [x] Show each file's selection reason in the Pi sees line using round 11. Why? opens the full reasons and paths
  in a desktop popover or phone sheet; Escape, outside click and Done close it. An unchanged refresh keeps it open.
- [x] Red: selector test lacked the full path, focused reason tests lacked the mapping, and the browser test lacked Why?.
- [x] Green: 10 context tests, two focused reason tests, both browser suites, and the full workflow check.
  Visually checked at 1440, 1024 and 390 pixels, including a refresh while the phone sheet is open.

## Result

Web previews, execution and terminal requests use the same selector; recovery inputs select again. Each selection
is persisted immediately, including reasons and per-turn history. Files from the latest Pi Workbench commit are
used when this request has no commit yet. The round 11 reason display is implemented.

Round 11 supplies the reason display described below (2026-10-17).

## The design for the reasons (round 11, 2026-10-17)

The "Pi sees" line stays one line; the word in parentheses after each file is its reason: rules, plan, task, named,
changed or related. A Why? button opens the full list (each file's reason as a sentence and its full path): a popover
on the desk, a sheet on the phone. Boards: design/canvas/R11_Context, R11_ContextParts, Ph11_Context; card
design/system/components/ContextLine ("Round 11: why each file (task 234)"); CSS `.pw-context__why`, `.pw-reasons`,
`.pw-why` in design/components.css. IMPLEMENTATION.md round 11.
