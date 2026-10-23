# 364: One agent per project with capability-aware admission

Kind: code

Request: parallel agents, one per project, when the serving configuration supports it.

- [x] Red: project-agent availability was absent (AttributeError).
- [x] Expose project-owned lanes using the production scheduler; reflect availability in existing chat controls.
- [x] Green: focused, workflow and browser verification.

Each registered project retains its own conversation, phase, tool directory and queued requests. Only a current verified parallel serving configuration admits concurrent project agents. The global tested capacity still applies; same or overlapping workspaces never run concurrently. Idle agents consume no Pi process. Terminal ownership and model switching retain their existing exclusions.

## For the person
Different projects can work at once when the model server has passed its parallel check. Each project still works on one request at a time.
Tried it: 28 focused Python tests, the chat-state test, full Python/Node workflow verification and all browser suites including US-357 and the golden journey passed.

## Scenarios

### US-357 Chat follows the selected project agent availability
Given another project is working and my project has its own agent lane
When the scheduler reports available or occupied capacity for my project
Then Send and Queue reflect my project and sending preserves its own conversation
