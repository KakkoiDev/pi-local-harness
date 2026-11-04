## Structural reviewer (egm-structural), Stage 7: completed

Standard: feature-spec-standard.md. Read persona, standard, target, six context files, and a sample of cited sources.
No Blockers, 6 Major, 6 Nit. Headings nest correctly; tables well formed. Every repo-relative citation checked matches
the code (CONSTITUTION.md:26-28, 42, 48-50, 138-139; learning.py:1-5, 21, 90, 108-113, 128-130, 145-150, 238-246;
test_runs.py:33, 40, 43-44; protocol.py:19-26; phase_shell.py:122-136; ledger.py:136-139, 193-214; paperwork.py:200,
544, 925-928; extension.mjs:75-76, 148, 159-180, 293-294, 298, 306, 338, 522; guides.mjs:11, 21-24; decisions.mjs:4-10;
bench/runner.py:210-229; docs/reference.md:83-84).

### Major
- **T-M1. Whole document.** No "Alternatives considered" section (standard's Alternatives Rule). SkillOpt 3.3 (a)-(c)
  is a real evaluation under a different label. TE-2: D1 options A and C rejected only in the external report; smaller
  rejections (command-signature key, line 96; copying raw command, 68-69) in passing. EGM-3: "Web only" (177) has no
  reason; holding the card back (179) rejected only implicitly. Fix: an Alternatives subsection in each of §§ 1-3.
- **T-M2. § 2.1 (161-171).** No problem statement for EGM-3: what failure it addresses is never said, so the 2.4 bench
  criteria (guards only) cannot be judged. Add a gap list and a success metric for the benefit.
- **T-M3. § 3 (224-332).** No Risks or Tests subsection, unlike §§ 1-2. `PI_HARNESS_GUIDES` (317) changes prompt text,
  is not limited to bench runs, and its place in the `harness/settings.py` registry is not said. Adding `request` to
  incident rows (311) changes what `reports.jsonl` links; privacy effect not stated. Add 3.7 Tests, 3.8 Risks.
- **T-M4. Line 181 vs 218 (and line 23).** "Never delays or blocks" vs "holds the agent lock". Whether Start Building
  cancels the goldfish request is not decided. Decide, align, add a test in 2.5.
- **T-M5. Line 139, line 312.** "No scenarios" contradicts contributing § 4 step 2 (terminal Pi counts) for `/facts`;
  line 140 plans a story that needs a scenario heading. `/guides stats` has no scenario note.
- **T-M6. Lines 8, 14, 220, 228 and references at 189, 258-261, 276-277, 297-299, 320.** Load-bearing reasoning lives in
  two documents outside the repository, cited by paths outside the repository, which do not resolve from the repo root. Say
  where firstmate lives and quote the load-bearing sentences.

### Nit
- **T-N1. Lines 258-259.** "TE-2 blocker 2" is TokenEconomizer blocker 2; `docs/reference.md` cited without anchor.
- **T-N2. § 5, lines 10-11.** List D1 (taken, B) in § 5; this D2 differs from the report's D2; renumber or say local.
- **T-N3. Lines 346-355.** "(Recommended)" placement ambiguous; D3 has no options or recommendation, against the
  rule cited at line 31.
- **T-N4. Line 180 vs 194.** `skipped` vs `plan_check_skipped` "started early": one name.
- **T-N5.** Parallel subsections differ (1.5 numbered vs 2.5 bullets; 2.3 Constitution check has no § 1 counterpart;
  3.3 bold paragraphs; `---` missing between §§ 4-6).
- **T-N6. Lines 16, 120, 130-135, 328-332.** Non-goals scattered; add "Goals and non-goals" under the Summary.

### Outside the structural lens (not scored)
Line 99 counts "distinct request digests with a verified commit under that key", but `verified_commit` events are keyed
by `digest(cwd + "\0" + command)` (learning.py:244-245), not the fact key. New signature, column or table is not said.
