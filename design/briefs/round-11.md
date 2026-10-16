# Brief: round 11, three phases for every request

Date: 2026-10-17. Task 247. Specification: CONSTITUTION.md, especially Articles 2–4 and 8–10. This changes round 10's gating; retain its ChoiceCard, PlanCard, CheckInCard and AwayCard.

## The phase control

Draw the phase button in a project's chat, its open control, and its three selected states: **Discussion**, **Planning**, **Implementation**. One phase belongs to the project, shared by web and terminal and saved across restarts. Only the person changes it, except the Run on its own transitions below. The model cannot change the phase. Small fixes use the same three phases.

- Discussion is the starting phase. Pi can read, discuss and search the web; it cannot write any file.
- Planning permits ROADMAP.md and tasks/ only. The harness creates the task layout; Pi supplies the content. Code cannot change.
- Implementation permits changes for the task in progress. Existing choices, plan review and task check-ins remain part of this flow.

Draw the control's placement beside the composer on desktop and its phone equivalent. Specify labels, menu or sheet markup, focus behavior, keyboard operation and 44 px phone hit areas. Use Pi Workbench 1-bit's existing components. Do not introduce a fourth Check phase.

## Moving between phases

Draw these offers and their resolved states:

1. When Planning is ready: **Plan another task** returns to Discussion; **Start building** enters Implementation. Show the actual plan through the existing PlanCard before the person chooses to build. Specify how this replaces or relates to its existing Approve Plan action without showing competing approvals.
2. In Discussion when planned tasks are waiting: **Build the planned tasks** goes straight to Implementation. Specify how the waiting scope is reviewed.
3. After each implemented task, the existing CheckInCard shows what changed, the recorded verification, and what comes next. The person validates it before work continues. Validation stays inside Implementation.
4. Run on its own may move Planning to Implementation and continue between tasks. Keep its existing risk confirmation on every enable, persistent visible state, automatic decision labels and report. Draw any changed phase-control state while it is on.

A phase refusal must explain the current phase and the control to use. Draw its relationship to the existing Gate reason/Why? treatment; specify copy for trying to write in Discussion, code in Planning, and a file outside the active task during Implementation. Do not make Pi choose the next phase on the person's behalf.

## Terminal

The equivalent commands are **/discuss**, **/plan**, **/build**. Draw or specify the current phase in the terminal's existing status view, the command responses, and the same planning-ready and check-in offers using Pi's native controls. The commands change the shared project phase; Pi's tool calls do not.

## States and translations

Include desktop and phone boards for all three phases, the open phase control, a project with waiting planned tasks, Planning ready, a task awaiting validation, Run on its own, a phase refusal, and a failed save/retry. Specify the English copy and behavior; implementation supplies matching Japanese. Keep unavailable actions visible and disabled with a reason.

## Also needed: context-selection reasons (task 234)

ContextLine currently specifies file names and “(plan)” / “(this file)” but no per-file selection reason. The selector already returns and records the reasons. Specify how the person can see each reason on desktop and phone while preserving the compact Pi sees line, file links and +N expansion. Cover a required README/plan/current task, a named file, a file changed in the request's commit, and a related file. Full paths currently occupy link titles; explain whether reasons use a disclosure or another treatment.

## Deliverables

Update IMPLEMENTATION.md, the relevant component READMEs and desktop/phone/terminal boards. Identify any changed round 10 text explicitly so implementation has one unambiguous specification. The project name remains Pi Workbench; the design system is Pi Workbench 1-bit.
