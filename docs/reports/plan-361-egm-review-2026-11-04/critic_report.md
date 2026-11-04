# EGM Stage 7: Critic Review

Target: `docs/plans/361-facts-goldfish-skill-improvement.md`, FeatureRange 1-362. Reviewers (fresh context, direct
dispatch): egm-design and egm-structural (standard `feature-spec-standard.md`), egm-style (persona rules only).
All three completed. Full reviewer text: `stage7-design.md`, `stage7-structural.md`, `stage7-style.md` (same folder).

**Verdict: not ready. 3 Blockers, 17 Majors after merging (design 9, structural 6, style 8, with overlaps), 24 Nits.**
SkillOpt (§ 3) judged sound on substance by the design critic; structural asks for Tests and Risks subsections there.

## Blockers

| Id | Where | Finding | Raised by |
|---|---|---|---|
| C-B1 | §1.3 lines 107-108, test 4 line 146 | A failing test contradicts the runner fact; G-010 Red runs make that happen on every request (gate/paperwork.py:759-761; learning.py:128-130 sticky). Contradict only on runner-level signals (126/127, zero tests, a verified commit with another prefix). | design B1; style S-M4 (timing) |
| C-B2 | §2.4 lines 205-207 vs 189-192 | Bench always enables Run on its own (bench/runner.py:128-129); the check is skipped there, so on/off are identical. 9 x 3 runs also too few by the doc's own SkillOpt argument. | design B2 |
| C-B3 | §2.2 lines 177-188 | Web answer/card path does not exist: `pendingPlanReply` terminal-only (planning.mjs:28-31, extension.mjs:173, :522); one-off requests never show in project chat (docs/reference.md:83-84); `ask_choices` one question per pause (choices.mjs:21-35); waiting goldfish question captures the next message (gate/ledger.py:162-163). | design B3 |

## Majors (merged)

| Id | Where | Finding | Raised by |
|---|---|---|---|
| C-M1 | lines 179-181 vs 218, line 23 | "Never delays or blocks" vs one agent lock and queue. Plan-card actions should cancel the goldfish job (`WorkQueue.cancel`, work_queue.py:230); test it. | design M1; structural T-M4; style S-M3 |
| C-M2 | lines 182-184 | "No tools that write" has no mechanism; one-off request runs full extension (paperwork, planning guide, AGENTS.md, wake-ups; Planning allows ROADMAP/tasks writes). Needs a read-only request kind. | design M2 |
| C-M3 | lines 183-184, 198-200 | Model picks question and recommended change; force "Keep the plan" as recommended option 0. | design M3 |
| C-M4 | lines 80-81, 96-97, 155 | Folder is Pi-influenced text (`cd x` in Pi's command, Pi creates folders), against D1 = B; injection channel not in risks. | design M4 |
| C-M5 | lines 111-112 | One-runner-per-folder evicts two-runner projects. Allow two facts. | design M5 |
| C-M6 | lines 114-116 | Context path takes a SQLite write lock (learning.py:52, 61, 139-140); a brain error would fail `/context` (extension.mjs:152-153); `build_context` has no data-folder argument (context.py:162). | design M6 |
| C-M7 | lines 109-110 | `invalidate` works by source id; 126/127 emits no event (test_runs.py:40); 126/127 not universal; unverified. | design M7 |
| C-M8 | §§ 1.3, 2.2, whole doc | No Alternatives sections. TE-2 ignores deriving the runner from project files on disk; EGM-3 ignores deterministic System 1 plan checks. | design M8; structural T-M1 |
| C-M9 | lines 61-66, §2.1 161-171 | No problem evidence or success measure for TE-2; no problem statement for EGM-3. | design M9; structural T-M2 |
| C-M10 | § 3 lines 224-332 | No Tests/Risks subsections; `PI_HARNESS_GUIDES` scope and settings registry; `request` on incidents privacy effect. | structural T-M3 |
| C-M11 | lines 139-140, 312 | "No scenarios" for `/facts` and `/guides stats` contradicts contributing § 4 step 2. | structural T-M5; design N2; style Nit 7 |
| C-M12 | lines 8, 14, 220, 228, and refs | Load-bearing reasoning lives in firstmate documents outside the repo; paths do not resolve. | structural T-M6 |
| C-M13 | lines 90, 99 | Template says "N verified commits"; N counts requests. | style S-M1 |
| C-M14 | line 144 | Test 2 cannot pass: byte `x` occurs in JSON keys. | style S-M2; design N1 |
| C-M15 | lines 24, 252, 263, 271, 289-292 | "Fit" means three things; name each verdict's reason. | style S-M5 |
| C-M16 | lines 282-283 | `soft` formula vague; wake-up penalty is new, not "computed today". | style S-M6 |
| C-M17 | lines 258-259, 297, 346-355 | "TE-2 blocker 2" mislabel (it is TokenEconomizer blocker 2); "(Recommended)" placement reads as recommending B. | style S-M7, S-M8; structural T-N1, T-N3 |

## Nits (merged, short)

- Design: N3 three request ids in one sitting under Run on its own; N4 exact-text dedupe useless; N5 AGENTS.md size-only
  check depends on which file; N6 per-guide numbers biased; N7 `confirm` inside `verified()` try/except; N8
  `PI_HARNESS_*` stripped by `start_workbench`.
- Structural: T-N2 D-numbering clash and D1 missing from § 5; T-N4 `skipped` vs `plan_check_skipped`; T-N5 parallel
  subsections differ; T-N6 non-goals scattered.
- Style: "captain"/"person"/"learner" terms; awkward D1 sentence; numbers both ways; filler ("Note:", "exactly");
  context.py ranking assumed; "queues one one-off"; bare "Low."; days estimate; imprecise phrasing list.
- Structural out-of-lens note: `verified_commit` events are keyed by `digest(cwd + "\0" + command)`
  (learning.py:244-245), not the fact key; how confirmations are counted per fact is unsaid.

## What holds up (reviewers)

- SkillOpt verdict, scorer analysis and smallest version (design critic).
- Every repo-relative citation checked matches the code (structural; design spot-check).
- One fact kind first, `gate_rule` deferred; EGM-3 off by default.
