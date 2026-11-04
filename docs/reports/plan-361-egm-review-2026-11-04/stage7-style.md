## Style reviewer (egm-style), Stage 7: completed

Mode REVIEW; no standard assigned; persona rules only. Read persona, target, all six context files (extension.mjs
60-359 and :522). No blockers, 8 Major, 10 Nit.

### Major
- **S-M1. Lines 90, 99.** Template "Confirmed by N verified commits" but N counts distinct requests (test 3, line 145).
  Say "in N separate requests", as line 132 does.
- **S-M2. Line 144.** Test 2 cannot pass: entry bodies are JSON with key `expires` and kind `test_runner`
  (learning.py:122-125), so a byte search for `x` always matches. Use a distinctive `-k` expression or path.
- **S-M3. Lines 179-180 vs 199, 218.** "Never delays or blocks" contradicts "holds the agent lock, so the next request
  waits"; duration unmeasured (line 362). State the real bound.
- **S-M4. Lines 107-108.** "No later pass" cannot be known when the failure arrives; when the rule runs is not said;
  with Red-first TDD it reads as contradicting the fact every request.
- **S-M5. Lines 24, 252, 263, 271, 289-292.** "Fit" changes meaning: constitution (3.5), feasibility (3.3a), data
  (3.3c). Name each verdict's reason: "infeasible (no scorer)", "violates Article 1/9", "allowed, too few scenarios".
- **S-M6. Lines 282-283.** `soft` formula vague (AND or sum; "small amount" not a number). "Computed by
  bench/runner.py today" is true of inputs, not of `soft`; the wake-up penalty is new.
- **S-M7. Lines 258-259, 297.** "The report's TE-2 blocker 2" mislabels: blocker 2 is under TokenEconomizer "Should Pi
  WorkStation use it?" (report.md:228-235). "The report" is ambiguous with two reports cited.
- **S-M8. Lines 346-355.** "(A) Skip the check. **(Recommended)** (B) ..." can be read as recommending B. Use
  "(A, recommended)" or one line per option.

### Nit
1. Lines 6, 207, 219, § 5: "the captain", "the person", "a learner", "a harness developer"; "captain" undefined. Use
   "the person" for "a learner".
2. Line 10: "Decision D1 was taken as B" awkward; name the source decision.
3. § 5: D2-D6 reuse the tool-study report's numbering (its D2 differs). Use a prefix or say numbering continues.
4. Lines 10, 55, 100, 205, 276: numbers written both ways.
5. Line 68 "Note:" and line 247 "exactly" are filler.
6. Line 114: "ranked right after the plan" assumes knowledge of context.py's sections.
7. Lines 119, 139: "console line" vague; "No scenarios" conflicts with contributing § 4 step 2 for terminal commands.
8. Line 177: "queues one one-off request".
9. Line 155 bare "Low."; line 269 "days of the person's machine" (give 200 × 20-30 min, about 3-4 days).
10. Lines 260, 292-295, 323, 326, 331: imprecise phrasing ("one item per decision", unclear "it", "broken" vs
    "violated", "A/B" as verb, "keeps noise", "sits awkwardly").
