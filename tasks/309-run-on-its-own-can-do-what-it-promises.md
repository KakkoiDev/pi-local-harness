# 309: Run on its own can do what its risk notice promises

Kind: code

Source: the second bug hunt (2026-10-18) and its documentation-drift part; numbers are the hunt report's items. Documentation-drift item 9. The person decided (2026-10-16) that with Run on its own on, everything is automatic,
publishing, git push, downloads and sending included, after the risk notice, with a report. Today Gate's shell grammar
refuses `git push`, `curl`, `npm install` and the like in every phase, so the notice over-promises and the report's
"left the machine" section can never fill.

- [ ] Decide with the person which actions Run on its own performs and how (checked tools for push, publish and download,
  not free shell), then make Gate, the risk notice and the report agree; until then the notice lists only what can
  happen.
- [ ] Tests: with auto on, each promised action runs through its checked tool and appears in the report; with auto off,
  it is a proposal.

## Scenarios

### US-new the Run on its own risk notice lists only what Pi can actually do on its own
Given Run on its own is off
When I turn it on
Then the risk notice names only the actions Gate lets Pi perform on its own

### US-new with Run on its own on, a promised action runs through its checked tool and shows in the report under "left the machine"
Given Run on its own is on and a task needs a promised action (a push, a publish or a download)
When Pi builds the task
Then the action runs without a question and the report lists it under "left the machine"

### US-new with Run on its own off, the same action is only proposed
Given Run on its own is off
When Pi needs that action for a task
Then the chat proposes it for me to choose and nothing leaves the machine
