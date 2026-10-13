# 59: Stuck detection

Kind: code

Request 2026-10-13: a model that keeps hitting the same refusal stops instead of looping.

- [ ] Red: 5 consecutive Gate refusals on the same task step mark the task `- [~] Blocked: <last reason>` and move the project to check.
- [ ] Red: any allowed call on that step resets the count.
- [ ] Green: full suite.
