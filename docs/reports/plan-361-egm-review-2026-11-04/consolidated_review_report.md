# EGM Consolidated Review: 361-facts-goldfish-skill-improvement.md

Target: `docs/plans/361-facts-goldfish-skill-improvement.md` (362 lines, baseline `002ede3`). Mode: uninterrupted.
Goldfish context: pi-harness-report/report.md, docs/contributing-for-agents.md, harness/learning.py,
harness/extension.mjs, CONSTITUTION.md.
Split: no "Detailed Implementation Plan" header. FeatureRange 1-362, DetailedRange N/A.
**Stage 9 (Implementation Readiness) skipped: the document has no implementation plan section.**
Stages run: 5 Zoom Out, 6 Comprehension, 7 Critic (design, structural, style), 8 Intermediate Zoom Out. All reviewers
completed. The document was not edited between stages (uninterrupted mode has no resolve step).

## Overall verdict

- **§ 1 TE-2: RETHINK.** The Curator-backed "confirmed by successes" design breaks on G-010 Red runs and solves a
  problem with no evidence. Replace with a derived, failure-driven view, after a one-off count shows the problem exists.
- **§ 2 EGM-3: RETHINK, recommend defer.** The web mechanism it relies on does not exist, the bench cannot measure it,
  and its Article 1 argument is wrong. Put "defer vs build at effort L" to the captain.
- **§ 3 SkillOpt: PROCEED after a trim.** Verdict ("on the go" does not fit) held across every stage. Trim the
  smallest version to: measure bench noise first; `--guides` with hashes; drop the guide outcome record.

## Action items

### Blocker

| Id | Action | Sources |
|---|---|---|
| A1 | TE-2: replace § 1.3 with a pure function at context time over `test-runs.jsonl` and `step_done` rows; fact only when a `TEST_COMMANDS` prefix exited 126/127 in 2+ requests and another prefix then reached a verified commit; store only rejections; drop the folder. Add order-of-work step 0: count first-test-command 126/127 rates on existing logs. | Z-B1, Stage 5 M1, C-M9, C-B1, C-M4..C-M7 |
| A2 | Never contradict a runner fact on `test_failed` (moot under A1; must hold if the Curator design is kept). Rewrite test 4. | Stage 5 B1, C-B1, Stage 6 #1, S-M4 |
| A3 | EGM-3: make defer (recommended) vs build-at-L a captain decision; record revisit conditions (web can show harness cards under a paused plan; a benefit measure exists). | Z-B2, C-B2, C-B3 |

### Major

| Id | Action | Sources |
|---|---|---|
| A4 | Rewrite the Run-on-its-own skip rationale: Article 3 allows automatic recommendations; skip for cost only. Reframe or drop D4. Do not adopt "always recommend Keep the plan". | Z-M1, C-M3 |
| A5 | If EGM-3 is built: no tools for the goldfish, start from `PI_HARNESS_BARE` plus a memory guard; cards posted by the harness as a queued Pi job under the lock (no side call); plan-card actions cancel the job via `WorkQueue.cancel`; bench mode with Run on its own off; state per-question cost. | Z-M2, Z-M3, C-M1, C-M2, C-B3, Stage 5 M3, M4, M5 |
| A6 | SkillOpt § 3.6: D2 (A) becomes "measure noise with `--repeat` on current guides; ship `--guides` with hashes (pass via `extra_env`, register in settings `INTERNAL`); drop the guide outcome record and the 'read the result' claim". | Z-M4, Stage 5 M6, design N8, Stage 5 N5 |
| A7 | Add Alternatives subsections to §§ 1-2 (TE-2: Curator vs derived view vs project-file parsing, with reasons; EGM-3: model pass vs deterministic checks vs defer). | C-M8, T-M1 |
| A8 | Add problem statements and success measures: TE-2 (rate of runner-unavailable first test commands), EGM-3 (plan revisions after Start Building). | C-M9, T-M2 |
| A9 | § 3: add Tests and Risks subsections; state `PI_HARNESS_GUIDES` scope. | T-M3 |
| A10 | Typed commands (`/facts`, `/guides stats`) need scenarios per contributing § 4 step 2. | T-M5, C-M11 |
| A11 | Quote the load-bearing sentences of the firstmate reports inline; give their absolute location. | T-M6 |
| A12 | Fix "TE-2 blocker 2" (it is TokenEconomizer blocker 2) and the "(Recommended)" placement; give D3 options. | S-M7, S-M8, T-N1, T-N3, Stage 6 #17 |
| A13 | If any Curator path survives: "N separate requests" wording; test 2 distinctive markers; read-only brain path that omits the section on error; invalidation by fact key; `confirm` inside `verified()` try/except. | S-M1, S-M2, C-M6, C-M7, design N7, Stage 6 #2, #12 |
| A14 | Name each SkillOpt verdict's reason instead of "fit"; make the `soft` formula exact. | S-M5, S-M6, Stage 6 #19 |
| A15 | Define System 1, the decision ladder, "bench", "user turns", G-010, ICM, "selection split" on first use. | Stage 6 #5, #6, #16, #18 |

### Nit

| Id | Action | Sources |
|---|---|---|
| A16 | Renumber decisions (this doc's D2 clashes with the report's D2); list D1 = B in § 5; send D2 and D5 now (§ 3 is independent). | T-N2, Stage 6 #9, style Nit 3, Z-N1 |
| A17 | Add to § 6 "Not verified": static starter `uvx ... node --test` matches no `TEST_COMMANDS` prefix; 126/127 universality. | Z-N2, C-M7 |
| A18 | AGENTS.md size-only Gate check applies only to `PI_HARNESS_MEMORY` / `<data>/AGENTS.md`. | design N5 |
| A19 | One name for the skip record; parallel subsection shapes; Goals/non-goals block; terms ("captain", "learner"); numbers style; filler words. | T-N4, T-N5, T-N6, style Nits 1-10, Stage 6 #7, #8 |
| A20 | Drop exact-text question dedupe; note per-guide bias; note same-sitting request ids under Run on its own. | Stage 5 N2, design N4, N6, N3 |

## Traceability matrix

| Raw finding | Action |
|---|---|
| Stage 5 B1 | A2 (A1) |
| Stage 5 M1 | A1 |
| Stage 5 M2 | A1 (vanishes) |
| Stage 5 M3, M4, M5 | A5 |
| Stage 5 M6 | A6 |
| Stage 5 N1, N4 | A1 (vanish) |
| Stage 5 N2 | A20 |
| Stage 5 N3 | A10 (`/facts` part of TE-2) |
| Stage 5 N5 | A6 |
| Stage 5 N6 | A3 (effort L) |
| Stage 6 #1 | A2 |
| Stage 6 #2, #11, #12 | A13 / A1 |
| Stage 6 #3 | A5 |
| Stage 6 #4 | A3, A5 |
| Stage 6 #5 | A3, A15 |
| Stage 6 #6, #13, #15, #16, #18 | A15 |
| Stage 6 #7, #8 | A19 |
| Stage 6 #9 | A16 |
| Stage 6 #10 | A13 |
| Stage 6 #14 | A10 |
| Stage 6 #17 | A12 |
| Stage 6 #19 | A14 |
| Stage 6 #20 | A4, A16 |
| C-B1 (design B1) | A2 / A1 |
| C-B2 (design B2) | A3, A5 |
| C-B3 (design B3) | A3, A5 |
| C-M1 (design M1, T-M4, S-M3) | A5 |
| C-M2 (design M2) | A5 |
| C-M3 (design M3) | A4 (lowered to Nit, rejected) |
| C-M4 (design M4) | A1 |
| C-M5 (design M5) | A1 |
| C-M6, C-M7 | A13 / A1, A17 |
| C-M8 (T-M1) | A7 |
| C-M9 (T-M2) | A1, A8 |
| C-M10 (T-M3) | A9 |
| C-M11 (T-M5) | A10 |
| C-M12 (T-M6) | A11 |
| C-M13, C-M14 (S-M1, S-M2) | A13 |
| C-M15, C-M16 (S-M5, S-M6) | A14 |
| C-M17 (S-M7, S-M8, T-N1, T-N3) | A12 |
| Design N1..N8 | A13, A10, A20, A20, A18, A20, A13, A6 |
| Structural T-N2, T-N4..T-N6 | A16, A19 |
| Style Nits 1-10 | A19 |
| Structural out-of-lens (verified_commit keyed by command digest) | A1 (moot) / A13 |
| Z-B1 | A1 |
| Z-B2 | A3 |
| Z-M1 | A4 |
| Z-M2, Z-M3 | A5 |
| Z-M4 | A6 |
| Z-N1 | A16 |
| Z-N2 | A17 |
| Z-N3 | A1 |

## Author's (orchestrator's) verification of the load-bearing findings

- Stage 5 B1 / C-B1: valid. `harness/learning.py:128-130` marks `contradicted` on a later failure; G-010 Red runs are
  `test_failed` with the same runner (`gate/paperwork.py:757-759`).
- Z-B1: the motivating fact is in `kit/starter/README.md:8`; README.md is a required context section
  (`harness/context.py:209`); the source report's `envfacts` "uses repeated failures only" (report.md:213-214). Valid.
- Z-M1: `CONSTITUTION.md:48-50` takes the recommended option under Run on its own. The design's Article 1 argument
  (lines 189-192) is withdrawn by its author; the skip stands on cost only.

## Stage reports

`zoom_out_report.md`, `comprehension_report.md`, `critic_report.md` (with `stage7-design.md`, `stage7-structural.md`,
`stage7-style.md`), `intermediate_zoom_out_report.md`, all in this folder. The plan text as reviewed is `reviewed-plan-361.md`.
