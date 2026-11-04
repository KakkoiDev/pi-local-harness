# pi-harness-design2: TE-2, EGM-3, SkillOpt design, and EGM runs

Status 2026-11-04: **partial. Design written; every EGM run blocked.** Baseline `002ede3` of pi-local-harness.
No code changed, nothing pushed, no PR.

## Paths

| What | Path |
|---|---|
| Design document (TE-2, EGM-3, SkillOpt) | [`docs/plans/361-facts-goldfish-skill-improvement.md`](../plans/361-facts-goldfish-skill-improvement.md) |
| EGM review of the design | not produced: blocked (below) |
| EGM-1 drift report (docs/, harness/*.md) | not produced: blocked |
| EGM-2 reviews of plans 151, 152, 156, 357 | not produced: blocked |

## Blocker: the EGM skills refuse model invocation

- Plugin is installed: `egm@egm` 0.1.0 (`5efe341`), with skills `egm-review` and `egm-drift-report`.
- Both SKILL.md files carry `disable-model-invocation: true`.
- `Skill egm:egm-review` returned: "cannot be used with Skill tool due to disable-model-invocation. Ask the user to run
  /egm:egm-review themselves ... Do not replicate this skill's workflow by other means". Same for
  `egm:egm-drift-report`.
- The brief forbids reviewing by hand. So the reviews need a person to type the commands.

Commands to type, one at a time, from the repository root (each spawns the EGM reviewer subagents, which rule 8 allows):

```text
/egm:egm-review docs/plans/361-facts-goldfish-skill-improvement.md uninterrupted
/egm:egm-drift-report docs and harness/*.md
/egm:egm-review docs/plans/151-ui-component-library.md uninterrupted
/egm:egm-review docs/plans/152-htmx-4-sse.md uninterrupted
/egm:egm-review docs/plans/156-chat-orchestrates-worker.md uninterrupted
/egm:egm-review docs/plans/357-headless-harness-library-and-conformance.md uninterrupted
```

## Design findings (full text and file:line evidence in the design document)

1. **TE-2 is buildable with no model call.** One fact kind first: the test runner, taken from Gate's closed list
   `TEST_COMMANDS` (`gate/protocol.py:19-26`), never the rest of the command (D1 = B).
   - Three gaps in `harness/learning.py` today: no readable field; no count of distinct requests (`verified` comes from
     one request's Red/Green proof, `:108-112`); the key hashes the whole command (`gate/test_runs.py:43-44`), so the
     same runner with different arguments never collects three confirmations.
   - Note: `gate/test_runs.py:33` already writes raw commands, in plaintext, to `test-runs.jsonl`. TE-2 must not copy
     them into the brain.
2. **EGM-3 fits Article 1 only if skipped under Run on its own.** Disagrees with the tool-study report, which let the
   recommended option be taken automatically. Model-written question plus model-recommended answer, taken with no
   person, is a model judgement in practice.
3. **SkillOpt "on the go" does not fit.**
   - During a session: no scorer independent of the model, one local model held by the agent lock
     (`harness/extension.mjs:75-76`, `:338`), one item per decision.
   - Between sessions on the person's Mac: no frozen start states, no hidden checks; Pi's own tests would grade Pi.
     About 200 whole-request rollouts is days.
   - Between releases on the bench: fits Article 1 (bench hidden checks accept or reject; `bench/runner.py:69-78`) and
     can stay local (SkillOpt's `openai_compatible` backend to Ollama). Fails on data: 9 scenarios
     (`bench/scenarios/`), 27 items at most, about 9 per split; the earlier study judged 27 held-out too few.
   - Dependency rule 5: SkillOpt is a PyPI package; it can only be outside-the-repo dev tooling.
   - Smallest version worth building: no SkillOpt. A per-guide outcome record (needs `request` added to wake-up
     incidents, `harness/extension.mjs:148`) and a bench `--guides <folder>` override with guide hashes in results.
     Both System 1, S effort each.
4. **Pi already does skill improvement on the go, unscored.** Pi edits its own `AGENTS.md` lessons in any phase; Gate
   checks only size (`gate/ledger.py:194-214`). That is the path SkillOpt's scorer and gate would be missing from.

## Decisions for the captain

- **D2 SkillOpt:** accept "does not fit on the go" and build the guide record + bench override (recommended) / build
  nothing / run SkillOpt on 9 scenarios now (not recommended: gate picks noise).
- **D3 EGM-3:** added minutes per planned request allowed before `plan_check` defaults to on.
- **D4 EGM-3 under Run on its own:** skip (recommended) / auto-take recommendations.
- **D5 Pi's self-written AGENTS.md lessons:** leave for now (recommended) / plan a System 1 check.
- **D6 task 26:** new TE-2 task, note task 26 partly moved (recommended) / rewrite task 26.
- **Process:** someone types the six EGM commands above, or EGM runs move to a captain session.

## Commands run

- `Skill egm:egm-review`, `Skill egm:egm-drift-report`: refused (quoted above).
- `grep`/`sed` reads of `harness/learning.py`, `harness/extension.mjs`, `harness/skill_runs.py`, `harness/guides.mjs`,
  `harness/memory.mjs`, `harness/decisions.mjs`, `harness/reports.mjs`, `harness/planning.mjs`, `harness/context.py`,
  `gate/test_runs.py`, `gate/phase_shell.py`, `gate/protocol.py`, `gate/ledger.py`, `gate/paperwork.py`,
  `bench/__init__.py`, `bench/runner.py`, `CONSTITUTION.md`, `docs/contributing-for-agents.md`,
  `docs/reference.md:78-90`, `tasks/26-verified-memory.md`.
- Line numbers in the design document re-checked with `grep -n` after writing; four were corrected.

## Not done yet

- All EGM output (blocked).
- The captain-hold-lifecycle completion gate (runs before `done`).
