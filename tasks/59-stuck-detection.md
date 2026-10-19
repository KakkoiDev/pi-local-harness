# 59: Stuck detection

Kind: code

Request 2026-10-13: a model that keeps hitting the same refusal stops instead of looping.

- [ ] Red: 5 consecutive Gate refusals on the same task step mark the task `- [~] Blocked: <last reason>` and move the project to check.
- [ ] Red: any allowed call on that step resets the count.
- [ ] Green: full suite.

## Scenarios

### US-new Pi refused five times on the same step stops, and the task shows blocked with the last reason
Given Pi is building a task
When Gate refuses five calls in a row on the same step
Then the build stops and the task shows “Blocked” with Gate’s last reason
And the chat says the run stopped and why
