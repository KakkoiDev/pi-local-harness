# 338: Manage reusable skills with an ICM adapter

Kind: code

Request 2026-10-20: see [the owner request and research](../docs/plans/337-pi-workstation-skills-and-knowledge.md).

- [ ] Inspect a pinned icm-runtime revision and its Pi hooks; define one adapter beneath Gate and explicit phase controls.
- [x] Record the owner decision: ICM underlies skills for WorkStation and generated projects.
- [ ] Obtain designs for skill discovery, inspection, enable/disable, update/rollback and run evidence.
- [ ] Red then Green: deterministic stage preconditions, tamper refusal, project isolation, restart/resume and failure recovery.
- [x] Implement a local-fixture vertical slice before requesting any downloads or installing hooks (task345; host proof, not production runtime adoption).
- [ ] Run unit, integration and designed E2E stories and document verified limits.

## Scenarios

### US-new a skill stage stays blocked until its recorded precondition passes
Given an approved two-stage fixture skill whose first stage has no passing validator receipt
When the agent attempts the second stage
Then Gate refuses that operation and the project chat remains usable

### US-new a skill resumes only with its original contract and project evidence
Given an interrupted run in project A and a separate project B
When the runtime restarts with a changed contract or evidence from project B
Then the run remains blocked with a recorded reason and neither project advances

### US-new inspecting a skill never runs its checker
Given a skill definition containing an executable checker that would create a marker file
When I inspect its source, version and capabilities
Then the marker is absent and no executable hook has been installed

## Status

Open. The linked document records research and proposals, not shipped functionality. New controls require design first. No downloads or global hooks are authorized by this plan.

Backend proof and limits: [task345](345-skill-evidence-integration-proof.md), [Claude review](../docs/handoff/integration-proof-2026-10-20.md). Production adapter and designed E2E remain open.
