# 247: Three phases for every request: Discussion, Planning, Implementation

Kind: code

CONSTITUTION.md, Article 8 (the specification). The person, 2026-10-17: every request, small fixes included, one phase
per project, a button in the chat to switch; after Planning, the offer to go back to Discussion or to start
Implementation; with planned tasks waiting, straight to Implementation; three phases (no separate "check" phase:
validation is the end of each task in Implementation).

This task takes over the open tasks 55 (Gate guides each step), 56 (the phases; drop its "check" phase) and 57 (show the
phase and step, release a stuck step), and changes plan 236: the phase is the permission, so the "no approved plan"
catch becomes "not in Implementation", and the assumption words become a Laya question (task 250) asked in Planning and
Implementation. ChoiceCards (236), the plan and check-ins (237) and Run on its own (238) stay as specified, inside the
phases.

## Steps
- [x] The phase: per project, persisted (survives a restart), changed only by the person (the button, `/discuss`,
  `/plan`, `/build`) or by Run on its own (Planning to Implementation, between tasks). Pi cannot change it.
- [x] Gate: Discussion refuses every write; Planning allows ROADMAP.md and tasks/ only; Implementation allows code for
  the task in progress only. Each refusal names the phase and what to press. Tests for each.
- [x] The transitions offered: after Planning: "Plan another task" (Discussion) or "Start building" (Implementation);
  from Discussion with planned tasks waiting: "Build the planned tasks".
- [x] Discussion: the web-search tool allowed (the person: "online searches are OK"); find what Pi offers or add one.
- [x] Prepare design/briefs/round-11.md: the phase control, all three states and transitions, terminal commands, phone, Run on its own and task check-ins.
- [x] The designer answered and round 11 is synced in the repository.
- [x] Build the designed web phase control, transitions, waiting review and refusal rows.
- [x] Update docs/plans/236-plan-mode.md and tasks 55-57 (mark them "taken over by task 247").


## Progress (2026-10-17)

The shared phase policy and round 11 controls are connected. The original checkpoints below record the work in order; the completion result follows them.

- [x] Red: five phase-store tests fail because no shared phase module exists.
- [x] Green: the phase store defaults to Discussion, uses canonical project identity, persists across restarts,
  rejects model changes and invalid automatic transitions, requires planned tasks before Implementation, and preserves
  the previous phase and history when saving fails. Five isolated tests pass.
- [x] Connect the store to Gate, trusted person controls, phase history, terminal commands and web polling.
- [x] Red then Green: phase permissions, scoped approved tasks, checked shell reads and test runners, trusted terminal commands, and Discussion choice side effects.
- [x] Verify this checkpoint: Python/Node workflow gate, both browser suites, desktop/tablet/phone phase-control screenshots, save failure and retry, and Japanese refusal copy.
- [x] Finish round 11 PlanCard labels and Start Building-only approval, waiting task selection, acceptance of the last task, and Stop Here without accepting.
- [x] Finish terminal footer/status, phase-specific refusal rows, web search, and System 1 plan layout.
- [x] Verify the complete round 11 flow after these remaining changes.

### Policy clarification answered

The design specifies the allowed file writes but not what happens to shell commands and tools that can also create
files (browser screenshots and music). The person answered: “Allow checked read-only shell commands too”. A narrow deterministic shell grammar now allows known reads and pipelines; unknown or writing commands stay blocked. Implementation additionally permits known test runners within an approved task. Browser verification is limited to Implementation; music writes now require approved Files: scope for their project artifacts.

Discussion choices are recorded in harness data without writing a task or roadmap. `propose_plan` is checked as a planning operation even though its existing tool transport labels it a read. The old plan approval/check-in labels and plain-text approval path were replaced by the completed round 11 flow below.

## The design (round 11, in the repo since 2026-10-17)

Read docs/handoff/gpt-sol.md "Reading the design" first. Then:
- Words: design/IMPLEMENTATION.md, `## 2026-10-17 · Round 11: three phases for every request (task 247) and context
  reasons (task 234)` and its `### Changed round 10 text (one specification)`, which replaces the round 10 labels you
  built (PlanCard: Approve Plan becomes Start Building, the only approval, and Plan Another Task; CheckInCard: Continue
  becomes Accept and Continue, Accept Task for the last task, Stop Here pauses without accepting; Run on its own presses
  Start Building and never moves to Discussion or Planning).
- Boards (design/canvas/, page `r11` "Phases"): R11_Answers (read first), R11_Parts, R11_Discussion, R11_PhaseMenu,
  R11_Planning, R11_Waiting, R11_BuildReview, R11_Implementation, R11_CheckIn, R11_Auto, R11_SaveFailed, R11_Refusals;
  terminal T_Phases; phone Ph11_Discussion, Ph11_PhaseSheet, Ph11_Planning, Ph11_Waiting, Ph11_BuildReview,
  Ph11_Implementation, Ph11_CheckIn, Ph11_Auto, Ph11_Refusal, Ph11_SaveFailed. (R11_Context, R11_ContextParts and
  Ph11_Context are task 234's.)
- Components: design/system/components/PhaseControl (new: Desk, Phone, Refusal, with the three refusal sentences),
  PlanCard and CheckInCard (their "Round 11" sections), TerminalOutput ("Phases (round 11)"), AwayCard (its round 11
  bullet). CSS: the round 11 block at the end of design/components.css (`.pw-phase`, `.pw-phase-menu`,
  `.pw-phase-line`, `.pw-waiting`, `.pw-tool__reason`, `.pw-why`, `.pw-context__why`, `.pw-reasons`).
- The round 11 brief step above is done: the designer answered.

## Review corrections (2026-10-17)

- [x] Red then Green: registered boundaries work without plan files; absolute write/edit targets use their own project's phase; shell writes from outside a project default to Discussion.
- [x] Red then Green: pending plans cannot be approved by phase selection or a forged action label; terminal Start Building is explicit and can resume an already approved task.
- [x] Red then Green: harness mutations are writes even with Run on its own; checked reads reject expanding globs and ripgrep configuration; package-launching tests need offline/no-install forms.
- [x] Red then Green: real shifted shortcut keystrokes work; terminal commands outside a project offer the registered-project picker and cancellation changes nothing.
- [x] Red then Green: phase, approved-plan and pending-choice records migrate from path keys and follow stable registration IDs on rename. Missing Files scope gives a Planning recovery instruction. System 1 can tick verified task boxes outside model file scope.
- [x] Complete the remaining round 11 flow listed above, including replacing the legacy plain-text approval path.

The person chose the registered-project picker and preservation by stable project ID. The picker selects the target of the phase command; it does not change the terminal process's working directory.

Threat model: this is a tool-call policy, not an operating-system sandbox. Approved project tests execute project code with the account's permissions. Trusted child processes inherit the Gate token and can call trusted endpoints; hostile subprocess code is outside this boundary (as recorded in task 56). No claim of isolation from malicious project code is made.

## Completion result (2026-10-17)

Round 11 is complete. Start Building is the approval action; ordinary yes messages cannot approve a plan or accept a
task. Waiting review preserves unchecked tasks. Stop Here leaves validation waiting, including after a reload. The
last task requires Accept Task and stays in Implementation until the person chooses Back to Discussion. An explicit
person acceptance may continue unverified work without changing its verification evidence; Run on its own cannot.

System 1 generates task layouts from structured plan content and owns every task/roadmap checkbox. Discussion also
blocks writes in unregistered folders. Checked reads remain available. Search runs only in Discussion. Music outputs
require approved artifact scope, and publication audit runs only for its approved audit task and project.

Red then Green evidence covers the lifecycle, task layout, roadmap ticks, unknown-folder writes, scoped audit, search,
waiting selection and installation upgrade. The complete workflow gate and both browser suites pass, including the
actual approval/check-in routes, refusal controls and English/Japanese labels. The installer upgrades its known
paperwork instructions while preserving custom memory and moves old build backups to the Trash.

Review notes and remaining roadmap questions: docs/handoff/247-review.md.

## For the person

Choose Discussion, Planning or Implementation in the chat or terminal. Approve a plan with Start Building, then accept
each completed task explicitly. Tried it: all automated suites pass; desktop and phone waiting-review screens checked.
