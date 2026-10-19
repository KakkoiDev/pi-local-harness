# 298: Understandable progress and recovery

Kind: code

GPT-Sol's improvement 7: show what works, what is blocked, which evidence is missing and what happens next; plain words for
beginners, inspectable detail for engineers; no repeated questions. UI goes through the designer (round 12, part C).

- [ ] A per-project status: tasks done with evidence, blocked with the reason, next step; the evidence behind each tick.
- [ ] Recovery actions where they are needed (reopen a task, retry, resume), from the designer's boards.
- [ ] After a failed or stopped request, a chat line with Undo This Request and Retry, and Pi is told what failed (bug
  hunt proposal 6); a journey test: describe, build, change, fail, undo or retry, green check.

## Scenarios

### US-new the project status shows what is done with its evidence, what is blocked and why, and the next step
Given a project with one verified task, one blocked task and one waiting task
When I open the project's status
Then the verified task shows its passing test, the blocked one its reason, and the next step is named

### US-new a failed request leaves a chat line with Undo This Request and Retry
Given Pi changed files in a request that then failed
When I look at the chat
Then a line says what failed, with Undo This Request and Retry
And Undo This Request puts the files back, and Retry runs the request again with the failure told to Pi
