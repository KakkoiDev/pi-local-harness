# 340: Add an AI-powered Python and HTMX app starter

Kind: code

Request 2026-10-20: see [the owner request and research](../docs/plans/337-pi-workstation-skills-and-knowledge.md).

- [ ] Agree model adapters and obtain starter/demo designs; reuse the one-stack packaging plan.
- [ ] Red: scratch unit/integration/E2E stories using an offline fake for response, cancel, retry, missing model and safe output rendering.
- [ ] Implement the starter with external credentials, bounded requests and no automatic downloads.
- [ ] Verify packaging capabilities: browser-only exports cannot carry provider secrets or silently assume a local server.
- [ ] Run required checks and document how the person creates, tests and packages the starter.

## Scenarios

### US-new an AI app starter responds through its fake model and recovers from a failed request
Given a scratch AI starter configured with the offline fake provider
When I submit a request that fails once and then retry
Then the failure is visible, retry succeeds once and the request identity remains traceable

### US-new cancelling an AI response leaves the next request usable
Given a fake response that is still streaming
When I cancel it and submit a new request
Then the first response stops and the second completes without mixing their output

### US-new generated markup and unavailable providers remain safe
Given the fake returns executable markup or reports an unavailable model
When the app displays the response or error
Then markup renders as inert content and the missing provider does not trigger a download

## Status

Open. The linked document records research and proposals, not shipped functionality. New controls require design first. No downloads or global hooks are authorized by this plan.
