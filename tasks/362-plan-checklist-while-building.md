# 362: A checklist of the plan while Pi builds

Kind: code

Request 2026-10-22: "in plh, I want that when a task is being implemented, it shows a little checklist like this to
signal to user what is the full plan, that is being worked on right now and that was done already" (with a screenshot
of a checklist: done ✓, in progress, waiting).

Today the person sees the phase and, at the end of a task, its check-in card. While Pi builds three approved tasks
nothing says which one it is on, what is done and what comes next, or how far the task in progress has got.

- [ ] Red (unit): Gate's phase reply carries the building progress: each approved task with its state (done, in
  progress, waiting for your check, next) and the task in progress with its steps (the task file's checkboxes, ticked or
  not); nothing while planning or when no plan is approved (`tests/test_plan_progress.py`).
- [ ] Gate: `Paperwork.progress(root)` and `phase()` returning it as `progress` (back end; no UI yet).
- [ ] Designer: `design/briefs/plan-checklist.md`, the checklist above the composer, desktop and phone.
- [ ] Web: draw the checklist from `progress` and refresh it when a tool call changes a task file or the plan moves
  on (after the canvas).
- [ ] Stories US-new below in `tests/browser/stories.cjs`, listed in `docs/user-stories.md`; controls get their steps.
- [ ] Green: `python3 -m unittest discover -s tests`, `node --test tests/harness`, `python3 tests/browser/run.py all`.

## Scenarios

### US-new while Pi builds the second of three tasks, the checklist shows one done, one in progress and one next
Given I started building three planned tasks and the first one was accepted
When Pi works on the second task
Then a checklist above the chat shows the first task done, the second in progress and the third next

### US-new the task in progress shows its steps, and a step Pi ticks shows as done
Given Pi is building a task whose file lists Red, the change and Green as checkboxes
When Pi checks the Red box in the task file
Then the steps of that task in the checklist show Red done and the other steps not yet

### US-new a task waiting for my check-in says so in the checklist
Given Pi finished a task and its check-in waits for me
When I look at the checklist
Then that task's row says it waits for my check and the next task is not started

### US-new on a phone the checklist folds into one line that opens the whole plan
Given a narrow screen and Pi building the second of three tasks
When I tap the line that says Task 2 of 3
Then the full checklist opens, and the same control closes it
