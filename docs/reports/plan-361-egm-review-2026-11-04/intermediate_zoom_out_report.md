# EGM Stage 8: Intermediate Zoom Out

Target: `docs/plans/361-facts-goldfish-skill-improvement.md`, lines 1-362 (unchanged since Stages 5-7). Reviewer:
egm-zoom-out (fresh context), standard `zoom-out-standard.md`. Reviewer status: completed.
Reading-list note (reviewer): the tool-study report path in the reading list did not exist; it used the file the target
cites at line 8 (now in the repository as `docs/reports/outside-tools-study-2026-10-30.md`).

**Verdict: RETHINK for § 1 (TE-2) and § 2 (EGM-3). § 3 (SkillOpt) PROCEED after one trim.**
2 Blockers, 4 Majors, 3 Nits. Most Stage 5-7 findings are symptoms of two shape choices:
- TE-2 stores new state in the Curator: causes C-B1, C-M4, C-M5, C-M6, C-M7, C-M13, C-M14, Stage 6 #2.
- EGM-3 built now with no web mechanism and no benefit measure: causes C-B2, C-B3, C-M1, C-M2, C-M3.

Orchestrator spot-check of the load-bearing citations (all hold): `kit/starter/README.md:8` holds
`uv run --offline pytest # tests (Pi runs this form; after uv sync)`; `harness/context.py:209` adds README.md as a
required section; `gate/paperwork.py:759` writes ``Red: `{command}` failed``; `CONSTITUTION.md:48-50` (Article 3)
takes the recommended option under Run on its own; `harness/extension.mjs:52-54` defines `PI_HARNESS_BARE`; the source
report says `envfacts` "uses repeated failures only" (report.md:213-214) and EGM in the product "suits an engineer, not
a learner" (:313-314); `kit/starter-static/README.md:9` test command starts with `uvx`.

## Blockers

**Z-B1. TE-2 solves a problem with no evidence and reverses the idea it copies.** Lines 22, 61-66, 88-100, 102-116, 338.
Raises C-M9 from Major to Blocker.
- The motivating fact (line 63) is already in every starter project README, which reaches Pi every request.
- The harness already writes the readable Red command into the task progress.
- TokenEconomizer `envfacts` learn from failures; the plan counts verified commits, so a fact appears only after Pi
  already found the runner three times. Missing the useful half: "`X` is not available here; `Y` works".
- Fix: a pure function at context time over `test-runs.jsonl` (126/127 rows are logged before return,
  gate/test_runs.py:32-40) and `step_done` rows (gate/paperwork.py:926). Show a fact only when a `TEST_COMMANDS` prefix
  exited 126/127 in 2+ separate requests and another prefix then reached a verified commit. Render "`<failed prefix>`
  is not available in this project; tests run with `<working prefix>`." Store only rejections. Removes Curator change,
  new key, contradiction/replacement/stale rules, read-only brain path, privacy docstring change, folder. Keeps D1 = B.
- Step 0: count, over existing `test-runs.jsonl` files, how often a request's first test command exits 126/127. Near
  zero means TE-2 is not needed yet.

**Z-B2. EGM-3 should not be built this round.** Lines 23, 159-221, 340, 349-352. Agrees C-B3 is a Blocker; fix differs.
- Mechanism missing; fixes (new request kind, harness cards on a paused plan, cancel on plan action) make it L for the
  lowest-ranked, off-by-default item (report.md:423).
- Benefit unmeasurable even after C-B2: scenarios script replies in advance (bench/runner.py:201); answers to
  generated questions cannot be scripted; a recommend-always stand-in measures cost only.
- Async plus cancel: only people idle on the plan card for the whole pass see the questions; holding the card back
  breaks "never delays".
- G-016 (gate/rules.py:45, :201-208) and the planning protocol (harness/AGENTS.md:36) already turn assumptions into
  questions; the goldfish adds only fresh context from the same local model.
- Source report: EGM in the product "no"; feedback volume suits engineers (report.md:313-317).
- Fix: captain decision. (A, recommended) defer, with revisit conditions (web can show harness cards under a paused
  plan; a benefit measure exists, e.g. plan revisions after Start Building with and without the check). (B) build now,
  effort L. No deterministic-check option C without evidence of form gaps beyond G-014.

## Majors

**Z-M1. The Article 1 argument for skipping under Run on its own is wrong; C-M3 builds on it.** Lines 189-192, 198,
351-352. Lowers C-M3 to Nit.
- Article 3 (CONSTITUTION.md:48-50) takes the recommended option automatically under Run on its own; every Planning
  `ask_choices` card already works that way. Lines 189-192 prove too much.
- Keep the skip for cost (minutes, no person benefits). Reframe or drop D4.
- C-M3 ("Keep the plan" always recommended) makes every card recommend ignoring the question.

**Z-M2. Proposed mitigations contradict each other or the source report.** Lines 105-112, 177-188.
- (a) C-B1 fix (another prefix's verified commit contradicts) vs C-M5 fix (two runner facts): in two-runner projects
  each commit contradicts the other. Disappears under Z-B1.
- (b) Three goldfish tool sets (Stage 5 M3 none; C-M2 read plus `ask_choices`; plan `ask_choices`). Pick "no tools".
- (c) Harness-posted cards must stay a queued Pi job under the agent lock, not a direct model call: the side call the
  report rejected (report.md:228-235; extension.mjs:75-76).
- (d) No mitigation breaks Articles 1, 2, 12 except the side-call risk in (c).

**Z-M3. Missed reusable mode: `PI_HARNESS_BARE`.** extension.mjs:52-54, settings.py:109 already run plain Pi with core
Gate rules, no tools, recovery, wake-ups or paperwork. Memory still joins the prompt (:306 has no bare guard). If
EGM-3 is ever built, start there.

**Z-M4. SkillOpt's smallest version contradicts the doc's own argument.** Lines 309-326, 346-347. Line 323 says a
developer can A/B a guide with `--repeat 3` and "read the result"; § 3.3(c) says 9 scenarios with unmeasured noise
cannot separate candidates. Fix: D2 (A) becomes "measure noise on current guides with `--repeat` (no code); ship
`--guides` with hashes when a guide edit is proposed, or now without the 'read the result' claim; drop the guide
outcome record".

## Nits

- Z-N1. § 4: § 3 is independent; send D2 and D5 to the captain now. Order of work starts with Z-B1's count.
- Z-N2. Lines 77-79: static starter test command `uvx --from nodejs-wheel-binaries==24.19.0 node --test`
  (kit/starter-static/README.md:9) matches no `TEST_COMMANDS` prefix (gate/protocol.py:19-26). Find how those runs are
  classified; add to § 6.
- Z-N3. Line 64: counting separate requests already exists in the logs (request ids in `test-runs.jsonl`, `step_done`).

## Severity changes against earlier stages

- Raised: C-M9 to Blocker (Z-B1).
- Lowered: C-M3 to Nit, rationale rejected (Z-M1).
- Vanish if Z-B1 adopted: C-B1, C-M4, C-M5, C-M6, C-M7, C-M13, C-M14, Stage 6 #1 and #2, Stage 5 N1 and N4.
- Same severity, different fix (defer): C-B2, C-B3, C-M1, C-M2.
