# 237: Plan mode: plan before code, approval, check-ins after each task

Kind: code

Read docs/plans/236-plan-mode.md (the flow, steps 2, 4, 5, 6). Depends on task 236 (choices) and task 233 (plan
filled).

## Steps
- [x] Which requests plan: the first request in a project and requests that add a feature (a new task); small fixes
  (a bug fix, a rename, a typo, a change inside the task in progress) skip plan mode. One function with tests decides,
  from the request's words and its task; Pi may say "this is a small fix", which the person can overrule.
- [x] The planning checklist: harness/guides/planning.md (how guides are chosen: grep `chooseGuides`), always given
  for a request without an approved plan: who uses it, screens and controls, rules and edge cases, data, what done
  means, how it is tested, the UI language. Pi answers each item from the request, the code, or a choice.
- [x] `Plan approved:` line in the request's task (paperwork): written when the person approves (the plan card's
  Approve, or a reply that is a yes: "yes", "go", "ok", "approve", "はい", "お願いします"; keep the list in one place
  with tests) or by auto-accept (`Plan approved: auto`).
- [x] Gate rule (task 236's "no approved plan"): code writes are refused until then; plan files are always allowed.
- [x] A plan may have several tasks; the harness works them in roadmap order, one per request turn chain. Gate allows
  code for the task in progress only (the task file's `Files:` line when present; otherwise any code file).
- [x] Check-in: when a task is verified (G-012 green), the paperwork commits it, ticks its roadmap box, and Pi stops
  with a check-in message: done / how verified / next task / "Continue?". The person's yes (or auto-accept) starts the
  next task as a new request. The early-commit bug (task 227) must be fixed first.
- [x] Red/green tests for each: approval words, the refusal before approval, the check-in after a verified task, the
  next task started on yes.

## Done when
In the pong request, Pi would have asked about speed and scoring, written Goal + several tasks with Done when, waited
for approval, built task by task with a check-in after each, and ticked each box itself.

## Result

The backend persists plan proposals and person approvals, validates their scope after restart, blocks code until approval and enforces the active task’s Files line. Exact English/Japanese approval words live in one policy. Pi’s plan headings supply commit subjects and the complete request stays in the first task. Starters have a planning checklist instead of fake implementation tasks. Terminal approval and web preview persistence are tested; web cards belong to task 239 and terminal presentation to task 240.

Verified planned tasks tick their own boxes and roadmap line, commit separately and wait for a new person reply before the next task. Task 238 connects the same check-in to automatic continuation with a fresh request identity; unverified tasks stop for review.
