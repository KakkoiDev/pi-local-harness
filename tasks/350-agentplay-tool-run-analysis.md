# 350: Analyze WorkStation runs with Agentplay

Kind: code

See [plan348](../docs/plans/348-quality-traces-and-phonon.md), section2. The person confirmed Agentplay; uvx is only its launcher.

- [ ] Inventory Pi session, Gate, Activity and test-run schemas using synthetic traces; document missing fields, truncation and retention.
- [ ] Inspect/pin Agentplay, review privacy/dependencies/licence and obtain download approval; establish Pi parser/session-map compatibility before claiming support.
- [ ] Red: exact fixture counts/provenance, blocked versus executed, duplicates/retries, interruption, overlapping tools, long/more-than-200-call runs, malformed input and isolation/redaction.
- [ ] Implement a read-only normalized report and Agentplay adapter proof with explicit unknown/truncated fields, no replay execution and no default home-directory scan/network.
- [ ] Obtain designs for any embedded viewer/filter/export controls; inspection never bypasses Gate or turns trace prose into verified Brain knowledge.
- [ ] Green: fixture/report/viewer comparisons, no-network and scope tests, designed E2E and documented limits; workflow passes.

## Scenarios

### US-new a run report distinguishes a refused command from an executed tool
Given a selected fixture run with an allowed read, a refused write and a failed command
When I inspect its report and Agentplay replay within the Actions panel
Then each recorded call appears with the correct provenance and state and the refused write is never described as executed

### US-new an incomplete trace is shown honestly without losing the next conversation
Given a selected run interrupted before a tool result and an unavailable viewer
When I request its analysis
Then missing results and viewer availability are explained and the project chat remains usable

### US-new inspecting a selected run does not expose other projects or execute its commands
Given traces for two projects and a selected trace containing a fake secret and a recorded shell command
When I export or replay only the selected run
Then other-project data and the secret are absent and the recorded command is never executed

## Owner clarification · 20 October 2026

The intended product integration is the existing **Actions panel**, improving log observability. A standalone Agentplay viewer is only a compatibility proof. The designer brief and plan 348 now record panel integration, live/history continuity, source evidence, explicit unknown/truncated states, keyboard/phone support and read-only inspection. Await the designed boards before implementing new panel controls.

### US-new Actions inspection stays scoped while chat continues
Given a selected project's running request and an older run in its Actions panel
When I inspect the older run, reload, and switch projects
Then the inspected evidence always identifies its project/request, other-project details are absent, and chat and current actions remain usable
