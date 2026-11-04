# EGM Stage 5: Initial Zoom Out Review

Target: `docs/plans/361-facts-goldfish-skill-improvement.md` (lines 1-362). Reviewer: egm-zoom-out (fresh context).
Standard: `resources/document_standards/zoom-out-standard.md`. Reviewer status: completed.

**Verdict: REVISE. 1 Blocker, 6 Major, 6 Nit.**

The reviewer read the persona, the standard, the target and all six context files. It also checked gate/test_runs.py,
gate/protocol.py, gate/phase_shell.py, gate/ledger.py:415-440, gate/paperwork.py:905-934, harness/choices.mjs,
harness/guides.mjs, harness/decisions.mjs, harness/reports.mjs, harness/context.py, harness/settings.py,
harness/work_queue.py, bench/runner.py, bench/__main__.py and docs/reference.md:82-86.

Context sufficiency: passes.

## Blocker

**B1. A failing test would contradict the runner fact in every request; TE-2 could never stay in Pi's context.**
Scope: §1.3 "Contradiction and replacement" (lines 107-108); §1.5 test 4 (line 146).
- Any `test_failed` with the same prefix and folder marks the fact `contradicted` (rule at harness/learning.py:128-130),
  and that state is sticky.
- G-010 requires a failing Red run before Green in every code request, so the next request's first Red run contradicts
  the fact. Test 4 writes this down as intended.
- A failing test shows the runner worked. The only real counter-evidence is exit 126/127 (already handled at line 109).
- Fix: drop the test-failure contradiction; keep 126/127 invalidation, the check on read, and the TTL.

## Major

**M1. Facts can be computed when the context is built, from logs that already exist.**
Scope: §1.1 note (lines 68-69); §1.3 Recording (92-100); Privacy text (122-124).
- `test-runs.jsonl` (gate/test_runs.py:32-39) and `decisions.jsonl` `step_done` rows (gate/paperwork.py:925) already
  hold everything; `learning.verified` already reads `test-runs.jsonl` (harness/learning.py:241).
- One pure function in harness/context.py could count distinct verified requests per runner prefix and folder over 30
  days and render the fact at 3 or more. No Curator change, no new key, no new state rules, no brain privacy rewrite.
  Only a rejection needs storing.
- If the plan keeps the Curator, say why the derived view was rejected (for example `test-runs.jsonl` retention).

**M2. "One runner per folder" is wrong for projects with two runners.** Scope: §1.3 (lines 111-112). This repository
uses `python3 -m unittest` and `node --test`, both in `TEST_COMMANDS`. Facts would flip. Remove the rule; the 3-fact
budget already limits what Pi sees.

**M3. EGM-3's question flow does not match the `ask_choices` contract.** Scope: §2.2 (lines 177-188).
1. In the web, `ask_choices` takes one question at a time, pauses the turn, and refuses a second call
   (harness/choices.mjs:21-35, task 290). One turn gives at most one card.
2. An answer returns to the session that asked (the goldfish's request), not to `pendingPlanReply` on the plan's request.
3. Comment-style one-off requests "never appear in ... the project chat" (docs/reference.md:83-84), but these cards
   must appear under the plan card.
- Proposed flow: the goldfish writes plain structured text with no tools; System 1 parses, validates with
  `validateChoice`, caps at three; the harness posts them as its own cards on the plan's request (as
  `askSystemChoice` / `/choice` do, harness/extension.mjs:160-170); answers go through Change….

**M4. "Never delays or blocks the person" contradicts "holds the agent lock, so the next request waits".** Scope: lines
179-181 vs 218. State that Start Building cancels the running goldfish job (`WorkQueue.cancel`,
harness/work_queue.py:230).

**M5. The bench comparison for "default on" measures nothing.** Scope: §2.4 (204-207); lines 189-192; D3, D4.
Bench runs always enable Run on its own (bench/runner.py:128-129). With D4 = A the check is skipped there, so on and off
run the same code. D3 depends on D4 and the doc does not say so. Options: a bench mode with the check on and Run on its
own off (scenarios already script replies, runner.py:201); another measure; or state the dependency.

**M6. The guide outcome record has no user in this plan.** Scope: §3.6 item 1 (309-315); D2 option A (346-347).
SkillOpt (c) scores on bench hidden checks; §3.4 says person records never accept an edit; the developer's A/B uses the
bench override. Item 1 also changes `incident()` for every request. Ship item 2 alone; split D2 option A.

## Nit

- **N1.** Reuse `test_folder` and `segments` in gate/protocol.py:87-97 instead of matching `TEST_COMMANDS` again
  (line 93); they handle `cd x && runner` and return the folder.
- **N2.** Exact-text dedupe of questions (line 186) will almost never fire. Drop it or call it best-effort.
- **N3.** "The person can remove them" (lines 115-116) is not true for a web user: the only path is the CLI with a
  64-hex id; nothing in console.mjs or admin.py touches the brain. Make `/facts` part of TE-2 or soften the header.
- **N4.** Fact-key formula (96), stored JSON shape (97) and folder regex (80) belong in the task file.
- **N5.** bench/runner.py already passes `extra_env` (131-133, 181). The EGM-3 bench mode and `--guides` are thin
  flags on it. `PI_HARNESS_GUIDES` needs an entry in harness/settings.py's internal variables (88-107).
- **N6.** EGM-3 effort M (line 23) looks optimistic; the tool-study report said M to L.

## What holds up (reviewer)

- SkillOpt verdict argued, with revisit conditions (line 325); self-edit concern fenced as D5.
- One fact kind, `gate_rule` deferred (§1.4).
- EGM-3 off by default, no effect on plan approval.
- Order of work (§4). Spot-checked citations into learning.py and extension.mjs accurate.
