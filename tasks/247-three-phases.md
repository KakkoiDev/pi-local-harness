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
- [ ] The phase: per project, persisted (survives a restart), changed only by the person (the button, `/discuss`,
  `/plan`, `/build`) or by Run on its own (Planning to Implementation, between tasks). Pi cannot change it.
- [ ] Gate: Discussion refuses every write; Planning allows ROADMAP.md and tasks/ only; Implementation allows code for
  the task in progress only. Each refusal names the phase and what to press. Tests for each.
- [ ] The transitions offered: after Planning: "Plan another task" (Discussion) or "Start building" (Implementation);
  from Discussion with planned tasks waiting: "Build the planned tasks".
- [ ] Discussion: the web-search tool allowed (the person: "online searches are OK"); find what Pi offers or add one.
- [x] Prepare design/briefs/round-11.md: the phase control, all three states and transitions, terminal commands, phone, Run on its own and task check-ins.
- [ ] The person sends the brief to the designer; build the web phase control after the design re-sync.
- [x] Update docs/plans/236-plan-mode.md and tasks 55-57 (mark them "taken over by task 247").


## Needs design

The current design has no phase control or phase-transition offers. The reviewable brief is design/briefs/round-11.md. It also asks for task 234’s per-file selection reasons. No phase UI has been invented or implemented; the phase persistence, Gate policy, terminal commands and search integration remain open above. The round 10 runtime stays in place until task 247 adapts it.
