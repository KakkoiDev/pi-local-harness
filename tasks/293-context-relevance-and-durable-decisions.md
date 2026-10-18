# 293: Relevant task context and decisions that survive compaction

Kind: code

GPT-Sol's improvement 5 ("supply the approved requirement, relevant code/interfaces and latest failure evidence; preserve
settled decisions through compaction") and the log review (17 compactions in one project, 4-6 minutes before the first
output, summaries of 19-31k characters).

- [ ] Each turn's context: the approved task and its Done when, the files it names, the interfaces they import, the
  latest failing test output; nothing else above the budget.
- [ ] Settled decisions and the plan are re-injected from harness data after every compaction, never summarised away;
  a settled decision is never asked again (Laya/code check before a ChoiceCard).
- [ ] Compaction budget and summary size measured per request; a regression test caps them for the fixture project.
- [ ] The first turn skips the starter's root commit as "changed" (bug hunt item 16) and adds a 20-line map of the starter
  (where rules, data, page and strings go; sample versus skeleton).
- [x] NEW-2 (user story US-040, an expected failure in tests/browser/stories.cjs): an answer given in Planning before the
  plan exists stays in harness data and never reaches the planned task's Decisions (the plan card says 0 decisions); carry it
  into the plan when propose_plan lays out the task, then remove the story's expected-failure mark.
  Done: Gate's paperwork (`decision`, from the person's answer route) keeps a Planning answer without a task under
  `(before the plan)` in the recorded decisions; `propose_plan` writes it into the first task's Decisions, once, as
  “- Q: A (chosen <time>)”; an answer while a plan waits for Start Building goes into that plan's first task, and the
  plan's digest follows (the harness's line is not a change of scope). Tests: tests/test_paperwork.py (three cases),
  US-040 passes.
