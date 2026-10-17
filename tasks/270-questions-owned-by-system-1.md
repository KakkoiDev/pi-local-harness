# 270: Questions: System 1 decides whether to ask, what is recommended, and never asks twice

Kind: code

Plan 267, judgements J-08, J-09, J-13, J-17, J-21, J-23. Today the model decides whether a question is open
(AGENTS.md:32), writes the options and must put "its" recommendation first (choices.mjs:8, 23); the recommendation is
logged as model (paperwork.py:125). Settled answers live in task text where the model can type "(chosen" (rules.py:154;
review P2), and questions repeat (test-project review §4, §5). Laya abstentions on advisory questions also stall every
write through G-017 (judgements.py:39-41 with ledger.py:212).

Files: gate/decisions_store.py (new: settled decisions per project, keyed), gate/paperwork.py (choice_pending,
decision), gate/rules.py (G-017 reads the store), harness/choices.mjs (schema), harness/judgements.py,
harness/laya.py (new typed questions), kit/defaults.json (new: convention defaults per decision key),
harness/AGENTS.md (the "Project decisions" paragraph), tests/test_decisions_store.py, tests/test_recommendation.py,
tests/harness/choices.test.mjs.

- [ ] Red: tests fail for (a) the same question (same key) asked again after it was answered, including after a
  compaction and a restart; (b) a model-chosen recommendation used by Run on its own; (c) "(chosen …)" typed into a
  task's Decisions settling G-017; (d) an advisory Laya abstention (phase intent, shell risk) blocking content writes;
  (e) four questions shown at once.
- [ ] gate/decisions_store.py: every settled decision has a key (kind + normalised subject), the answer, the author
  (code, laya, person, auto), the rule or confidence, the time; stored in the project's harness data, not in text the
  model edits; the task's Decisions section is rendered from it by the paperwork. Compaction and restarts read it back.
- [ ] Whether to ask (rule Q-001): a question the model proposes is dropped when the store, kit/defaults.json or the
  project's conventions answer it (the answer is returned to the model as a tool result, logged as code); otherwise it is
  queued. One card at a time; related queued questions are shown as a numbered batch ("2 of 3") on one screen, each
  answerable alone.
- [ ] The recommended option (rule Q-002), climbing the ladder: a kit default or project convention matching an option;
  else the option that is reversible, downloads nothing, sends nothing out and stays inside Files (tags set by code from
  the option's declared effects); else Laya `choice` "Which option best fits the request and the project's
  conventions?" at .95; else the deterministic safety order (fewest effects, then the proposed order), shown as "safety
  order". The model's order never decides; `recommended` is removed from the tool schema.
- [ ] Asks or assumes (J-13): Laya `assumed_value` runs on every final reply in Planning and Implementation, not only on
  trigger words; an assumption it finds, or an abstention, becomes a card with the stated value as one option.
- [ ] Advisory questions never block writes: a Laya abstention on phase intent, waiting reply or shell risk shows its card
  without making a pending choice that G-017 enforces.
- [ ] A newer message that changes a settled decision (Laya `choice` "Does this message change an earlier decision?"
  .98; abstain: unchanged) opens a "Change…" card for that decision instead of a silent overwrite.
- [ ] Option language comes from the person's language setting (code), not the model.
- [ ] Console changes Pi asks for (J-50, harness/console.mjs:71-75) become a card; System 1 recommends "Don't change
  it" unless the change is read-only (gate/phases.py:79-87); Run on its own takes that, never `--yes` on Pi's behalf.
- [ ] Question numbers and totals (J-51) come from the pending-question queue, not the model.
- [ ] Green: the new tests and the existing choice, phase and Laya tests pass; the full workflow passes.

Acceptance: a settled decision is never asked again; every recommendation names its source (default, safety, Laya,
safety order); Run on its own never takes a model's recommendation.
