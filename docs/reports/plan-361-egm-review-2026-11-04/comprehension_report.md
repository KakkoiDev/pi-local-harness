# EGM Stage 6: Comprehension Test

Target: `docs/plans/361-facts-goldfish-skill-improvement.md`, lines 1-362. FeatureRange 1-362; DetailedRange N/A.
Reviewer: egm-comprehension (fresh context), REVIEW mode. Stage has no standard. Reviewer status: completed.
Read: persona, target, all six context files, `harness/extension.mjs:522`.

**Verdict: no Blockers, 6 Majors, 14 Nits.** Every section could be paraphrased at the level of intent. Three
connections could not be followed: fact contradiction, the goldfish answer path, the bench comparison.

## What this proposes

The plan designs three things the captain asked for. Each would be its own task, and the plan changes no code.

1. **TE-2 facts.** The private evidence store gains one kind of human-readable fact: "tests in this project run with
   `<runner>` from `<folder>`". The runner is the matched entry from Gate's fixed list of test runners, never Pi's full
   command. A fact counts as confirmed once 3 separate requests have each ended in a verified commit. Only confirmed
   facts go into Pi's request context, inside a 3-fact / 400-character budget. Facts are dropped when contradicted, when
   the runner exits 126/127, when they expire, or when the person rejects them.
2. **EGM-3 "goldfish" check.** An opt-in setting, web only, off by default. After Pi proposes a plan, one extra request
   with fresh context reads the roadmap, the new task files and the person's request. It may add up to three choice
   cards under the plan card. Under Run on its own the check is skipped and the skip is logged.
3. **SkillOpt.** The plan argues that "on the go" skill optimisation does not fit. During a session or on the person's
   Mac there is no independent scorer, it would breach Article 1, and it would unload the person's model. It fits only
   on the developer bench between releases, and the bench's 9 scenarios are too few today. Instead it proposes two
   small model-free pieces: a per-guide outcome report, and a bench option `--guides <folder>` that records the hash of
   every guide file used.

## How the existing system works, per this document

- **Evidence store.** `harness/learning.py`, "the brain", stores only one-way digests of evidence that System 1
  producers emit: test runs, Gate refusals, verified commits. An entry appears after 2 failures. It becomes `verified`
  only when one request shows fail, then pass, then a verified commit. It becomes `contradicted` on the next failure,
  and it expires after 30 days. Nothing feeds it into Pi's context today.
- **Gate's test runners.** Gate accepts a test command only if its first words match a prefix in `TEST_COMMANDS`.
- **Plans.** `propose_plan` sends the plan to Gate. In the web the turn stops on a plan card; in the terminal a select
  menu offers Start Building or Change…. One agent lock is shared between terminal and web.
- **Skills.** Guides are Markdown files that join the prompt when a request's words match them. Pi edits its own
  `AGENTS.md` after failures, and Gate checks only its size.
- **Bench.** 9 scenarios with hidden checks; reports `resolved`, `first_try`, `verified` and wake-ups.

## Findings

**1. Major. Lines 105-108 (contradiction), line 146 (test 4).**
- `test_failed` events carry only a digest of `cwd + command` (line 50); the brain cannot recover the runner prefix. The
  text does not say where the prefix match happens for contradiction.
- "with no later pass" cannot be known when the failure arrives; when the check runs is not said.
- Every request's Red step is a failing run with the same runner; as written, test 4 contradicts the fact every request.
- No rationale for why a failing test contradicts a fact about which runner the project uses.

**2. Major. Lines 97-100, 115 vs 55-58 (one store, two meanings of `verified`).** How the "Confirmed facts" section
tells fact entries from digest entries is not said (`retrieve` returns both). Whether it uses `Curator.context()`
("UNTRUSTED EVIDENCE DATA" JSON) or a new renderer of the line-90 template is not said. A reader cannot tell which
existing entries would start reaching Pi.

**3. Major. Line 181 vs line 218.** "The check never delays or blocks the person" vs "holds the agent lock, so the next
request waits". Whether Start Building aborts the running goldfish request is not said.

**4. Major. Lines 182-188 (goldfish answer path).** `pendingPlanReply` is per-process state set by the planning tool's
`change` callback; § 2.1 describes Change… only for the terminal. Unexplained: how an answer to a card owned by the
goldfish request reaches the original planning conversation in the web; what happens to the paused goldfish request;
how "No tools that write" is enforced in Planning, where Pi may write `ROADMAP.md` and `tasks/`.

**5. Major. Lines 205-207 (bench comparison for D3).** "The bench" is used before it is defined (explained at 273,
282); "user turns" is never defined. How bench runs answer the goldfish's cards is not said; if the bench runs under Run
on its own, lines 189-192 skip the check and the comparison measures nothing. The D3 criterion is not understandable.

**6. Major. Lines 10-11, 28-32, 73, 81, 254, 273 ("System 1" never defined).** The Rules section quotes Article 1 but
not the "Two systems" definition (`CONSTITUTION.md:9-22`). "Rung 1 of the decision ladder" (line 81) assumes Article 2.
Fix: one sentence plus a pointer.

**7. Nit. Line 6, § 5.** "The captain" role not defined.
**8. Nit. Lines 10-13.** "TE", "EGM" not expanded; Pi and Gate not introduced or linked to contributing § 1.
**9. Nit. Lines 10, 293, 344-355.** This document's D2 reuses an id the cited report uses for a different decision.
Renumber or say the series continues.
**10. Nit. Line 90 vs 145.** Template says "N verified commits"; N counts distinct requests.
**11. Nit. Lines 68-69 vs 92-94.** Line 69 says TE-2 "does not need" `test-runs.jsonl`, but `learning.verified` reads it
(`learning.py:240-245`). Say "reads, never copies". "Matching … again in Python" implies the first match is not Python;
`gate/phase_shell.py` is Python.
**12. Nit. Lines 109-110.** Existing `Curator.invalidate(project, source)` deactivates events by source id; "one
`invalidate` of the matching fact" reads as a different operation. Say whether it is new.
**13. Nit. Line 114.** The ranking in `harness/context.py` and what "the plan" means there are not explained.
**14. Nit. Lines 139-140.** "No scenarios", but `/facts` is a terminal command; contributing § 4 requires scenarios for
terminal changes too.
**15. Nit. Line 186.** The task's Decisions section is not introduced.
**16. Nit. Lines 233, 254, 274-283, 317.** Undefined: "selection split", "G-010", "wake-ups", "prompt levels",
"scratch workbench".
**17. Nit. Lines 258-259.** "the report's TE-2 blocker 2" is wrong: blocker 2 belongs to the report's TokenEconomizer
verdict section, not TE-2.
**18. Nit. Line 243.** "ICM" undefined.
**19. Nit. Line 283.** `soft` formula unclear: boolean AND or sum; how much is "small".
**20. Nit. Lines 189-192 vs 351, § 4.** § 2.2 states the Run on its own skip as settled while D4 leaves it open. § 4
assumes D2 = A without saying so.
