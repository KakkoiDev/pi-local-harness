# 271: When Pi stops, continues or re-plans is decided by System 1

Kind: code

Plan 267, judgements J-10, J-14, J-22. Today a final answer ending in "?" decides that no wake-up runs
(extension.mjs:434, 480, 489; review P3), whether to re-plan is the model's ("Stop repeating the failed approach",
AGENTS.md:17), and give-up thresholds live in guide prose ("fix errors twice at most", music.md:10).

Files: harness/extension.mjs (the end-of-turn decision), harness/stops.mjs (new: the stop rules), harness/laya.py
(question `asks_person`), harness/judgements.py, harness/stuck.mjs, gate/paperwork.py (re-plan offer),
harness/guides/music.md, harness/AGENTS.md, tests/harness/stops.test.mjs, tests/test_replan.py.

- [ ] Red: tests fail for (a) a reply ending "Shall I continue?" with open, unverified work ending the request with no
  wake-up and no card; (b) a rhetorical "?" stopping the loop; (c) three failed attempts at the same Red with no re-plan
  offer; (d) the music render retry limit enforced only by prose.
- [ ] harness/stops.mjs, rule S-001: a question to the person is only an ask_choices card; text punctuation never
  decides. When the last reply has no card, Laya `noul` "The reply asks the person to decide something before work can
  continue" (.98): true makes a system card quoting Pi's question with "Answer Pi's question" (recommended), "Let Pi
  continue with its proposal", "Something else…"; false wakes Pi as usual; an abstention shows the same card (the
  person, never the model).
- [ ] Rule S-002 (re-plan offer, code): the same Red not reached after 3 runs, a second scope-widening card in one task,
  wake-ups exhausted, or two unverified check-ins in a row → one card "Re-plan this task?": "Go back to Planning for this
  task" (recommended), "Try once more", "Something else…". Run on its own takes the recommendation and lists it.
- [ ] Retry limits as code counters (music renders, edit retries, recoveries), each with its rule id; guides lose the
  numbers.
- [ ] Whether a change is expected (J-57) comes from the phase and the approved task, not from the `changing` and
  `announced` regexes (harness/extension.mjs:477-485).
- [ ] Every stop, wake-up and re-plan decision logged with its author and rule (decisions.jsonl).
- [ ] Green: the new tests, the existing wake-up, stuck and recovery tests, and the chat browser suite pass; the full
  workflow passes.

Acceptance: punctuation in model text decides nothing; every stop names who decided it (a card, a rule, Laya, you).
