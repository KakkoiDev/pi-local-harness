# 233: Gate checks that the plan is filled in

Kind: code

The person, 2026-10-16: "The plan was never filled in: I think we can add a gate to check that this is done correctly."
In ~/Code/pong the roadmap kept "Describe what we are building.", the placeholder "- [ ] Define the first task" and
tasks/001-first-task.md (Define the outcome / Implement / Verify) after the game was built.

## The rule (a new G-0xx in gate/rules.py, like G-012; stage 'end', scope PROJECT, decision MARK then wake)
At the end of a request that changed code:
- ROADMAP.md's Goal is not the template text ("Describe what we are building.").
- No placeholder task remains: the template's "Define the first task" line and an unchanged tasks/001-first-task.md
  (compare with the template in harness/documents.py / kit/).
- Every task linked from the roadmap has at least one checkbox and a `Done when:` line.
If not: wake Pi once with exactly what is missing ("ROADMAP.md: write the Goal in one or two sentences."), then mark the
request "Plan incomplete" like G-012's "Not verified".

## Steps
- [ ] Red: tests/test_gate_rules.py cases for each check, on fixture folders.
- [ ] Implement; add the rule to gate/rules.py with its message, lesson (docs/lessons/, a new L-0xx about the pong plan)
  and test, as plan 179 requires (read docs/plans/179-gate-rules.md first).
- [ ] The templates (harness/documents.py `create_project`, kit/new_project.py) write a task 001 that says what to do
  instead of a fake task, or no task 001 at all: decide with plan mode (task 237), where Pi writes the first plan.
- [ ] Green.

## Done when
A request cannot end "done" with an empty Goal, a placeholder task, or a task without Done when, without the person
seeing it.
