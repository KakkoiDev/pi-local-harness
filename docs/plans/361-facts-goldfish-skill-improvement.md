# 361: Readable facts, a goldfish plan check, and skill improvement

Status: design, not built. Written 2026-11-04 at `002ede3`.
Kind: planning. No code changes in this document.
Review: an elephant-goldfish (EGM) review of this plan is in progress and may revise it.

Request 2026-11-04 (the captain): "let's do all of this now and also add the skillopt feature for skill improvement on
the go." "All of this" is ranks 8, 10 and 11 of the tool-study report
(`firstmate/data/pi-harness-report/report.md`, "Ranked list of changes worth shipping"). This document covers:

- **TE-2** (rank 8): readable project facts, confirmed three times. Decision D1 was taken as **B**: facts built only
  from words System 1 already classifies, never model text or raw arguments.
- **EGM-3** (rank 11): a fresh-context "goldfish" check of Pi's plan, off by default.
- **SkillOpt**: "skill improvement on the go", after microsoft/SkillOpt, which rewrites one Markdown skill file and keeps
  a rewrite only if a scorer says it is better (`firstmate/data/skillopt-loop/report.md`, A1).

Rank 10 (running EGM on this repository's docs and plans) is a process step, not product code. It is not designed here.

## Summary

| Feature | Verdict | Smallest version worth building | Model call | Effort |
|---|---|---|---|---|
| TE-2 facts | Build | One fact kind: the project's test runner, from Gate's closed list of runners | None | M |
| EGM-3 goldfish | Build, off by default, web only, skipped under Run on its own | One extra Pi request after `propose_plan` that may add up to three choice cards | One more pass of the person's local model | M |
| SkillOpt "on the go" | **Does not fit as asked.** Not during a session, not between sessions on the person's Mac. It fits the rules only between releases, on the bench, and the bench has too few scenarios for it today. | No SkillOpt. Two System 1 pieces it would need anyway: a per-guide outcome record, and a bench option that runs a different guides folder | None | S + S |

## Rules every part follows

- `CONSTITUTION.md:26-28` (Article 1): "The language model is used for generation, never for judgement. ... System 1
  judges all of them."
- `CONSTITUTION.md:42` (Article 2): "When System 1 cannot decide with confidence, it asks the person, never the model."
- `CONSTITUTION.md:48-50` (Article 3): every question has options, the recommended one first; under Run on its own the
  recommended option is taken.
- `CONSTITUTION.md:138-139` (Article 12): "The model and the data stay on the machine unless the person chooses an
  online model or a search."
- `docs/contributing-for-agents.md` § 5 rule 5: no new dependencies (Python packages, npm packages at runtime, CDNs).
  § 5 rule 9: UI changes go through the designer. § 4: task file, scenarios, Red, Green, `python3 tests/verify_workflow.py`.

---

## 1. TE-2: readable facts, confirmed three times

### 1.1 What exists

`harness/learning.py` (task 343) is the private evidence store ("the brain").

- It stores one-way digests only: "no prompts, output, file bodies or command arguments are stored"
  (`harness/learning.py:1-5`). `observe` hashes the project, request and signature (`:90`).
- Producers, all System 1:
  - test runs: `gate/test_runs.py:43-44` emits `test_passed` / `test_failed` with
    `signature = sha256(cwd + "\0" + command)`;
  - Gate refusals: `gate/ledger.py:136-139` emits `failure` with `signature = rule id`;
  - verified commits: `gate/paperwork.py:925-928` calls `learning.verified` (`harness/learning.py:238-246`), which emits
    `verified_commit` with the same `cwd + command` signature;
  - skill runs: `harness/skill_runs.py:103` (no runtime caller today; only `tests/test_skill_runs.py` uses it).
- States: an entry appears after 2 failures (`:113`). It becomes `verified` only from one request's own proof: a failed
  test, then a passing test, then the verified commit (`:108-112`). It becomes `contradicted` on the next failure
  (`:128-130`). TTL 30 days (`:21`). The person can reject, restore and pause (`:175-196`, `:226-228`).
- `context()` exists but is "Deliberately not injected into every request" (`:145-150`). Nothing calls it from
  `harness/context.py`.

Three gaps against TE-2:

1. **No readable fact.** Pi never sees "tests here run with `uv run --offline pytest`".
2. **No "three times".** `verified` comes from one request's Red/Green proof. Nothing counts separate requests.
3. **The key is too narrow.** The signature hashes the whole command. `pytest tests/test_a.py` and `pytest -k b` are
   two signatures, so the same runner would never collect three confirmations.

Note: the readable command already exists in the data folder, outside the brain. `gate/test_runs.py:33` writes the raw
`command` into `test-runs.jsonl`. TE-2 does not need that file; it must not copy model-written arguments into the brain.

### 1.2 What "words System 1 already classifies" means here (D1 = B)

A command Pi writes is model text, even after Gate accepts it. What Gate classifies is not the command but which
**known runner** it starts: `gate/phase_shell.test_run` (`gate/phase_shell.py:122-136`) accepts a command only when its
first words equal one of the prefixes in `TEST_COMMANDS` (`gate/protocol.py:19-26`), a closed list written in code.

So a fact may contain:

- the matched `TEST_COMMANDS` prefix, as the list spells it (for example `uv run --offline pytest`);
- the folder the run started in, relative to the project, only if it exists on disk, matches `[A-Za-z0-9_./-]{1,64}` and
  stays inside the project (a file on disk: rung 1 of the decision ladder).

A fact never contains the rest of the command (paths, `-k` expressions, test names, options), test output, or anything
Pi wrote in its answer.

### 1.3 Design

**One fact kind first: `test_runner`.** Template, fixed in code:

> Tests in this project run with `<prefix>` (from `<folder>`). Confirmed by N verified commits.

**Recording.** In `learning.verified` (`harness/learning.py:238`), after the existing `emit`, call a new
`Curator.confirm(project, request, kind='test_runner', prefix=…, folder=…)`. The prefix comes from matching the
command against `TEST_COMMANDS` again in Python. A command that matches no prefix records nothing.

- Fact key: `digest(project + ':test_runner:' + prefix + ':' + folder)`. Not the command signature (gap 3).
- Stored readable fields: `{'kind': 'test_runner', 'prefix': [...words], 'folder': '.'}`, inside the entry body.
  Everything else stays a digest.
- Confirmations: the number of **distinct request digests** with a verified commit under that key, inside the TTL.
- Status: `observed` at 1 or 2 confirmations; `verified` at 3 or more. Only `verified` facts are shown to Pi.

**Validation on read, not only on write.** `retrieve` drops a fact whose prefix is no longer in `TEST_COMMANDS`, or
whose folder no longer exists. A changed list in code wins over an old row.

**Contradiction and replacement.**

- A `test_failed` for a command with the same prefix and folder, after the last confirmation, with no later pass,
  marks the fact `contradicted` (the rule at `:128-130`, applied to the fact key). It leaves Pi's context.
- A runner that is not installed exits 126 or 127; `gate/test_runs.py:40` returns before any `emit` today. Add one
  `invalidate` of the matching fact there.
- A second `test_runner` fact that reaches `verified` in the same folder marks the older one `stale`. Pi never gets
  two runners for one folder.

**Joining the request.** `harness/context.py` gains a "Confirmed facts" section, ranked right after the plan.
Budget: 3 facts, 400 characters. The header says where the facts come from and that the person can remove them. A
paused brain (`status()['paused']`) or a rejected fact adds nothing.

**The person's control.** The existing CLI (`python3 -m harness.learning list|reject|restore|pause`) already works. A
terminal console line (`/facts`, in `harness/console.mjs`) lists facts and rejects one by id. A web panel is a UI
change: it goes into the next designer brief (`design/briefs/`), not into this task.

**Privacy text.** The module docstring (`harness/learning.py:1-5`) and `docs/reference.md` change: the brain keeps
digests plus short facts built from Gate's closed list of runners and existing folder names. This is decision D1 = B
on record.

**Task 26.** `tasks/26-verified-memory.md` asks for "incident-specific candidate lessons; validate evidence and a
successful retry before promotion". TE-2 is narrower: no lessons in prose. Recommended: a new task for TE-2, and a
one-line note in task 26 that its fact part moved there.

### 1.4 Later fact kind, only with evidence: `gate_rule`

"Gate refused `<rule id>` in this project in N separate requests: `<the rule's own what-to-do text from
gate/rules.py>`." All of it is System 1 text. Not in the first ship: the Gate-rule summary already joins every
system prompt (`harness/extension.mjs:293-294`). Add it only if the bench shows the same refusal repeating across
requests in one project.

### 1.5 Tests (Red first)

No scenarios: the person sees no new control in the web UI. The terminal `/facts` line gets one
`tests/harness/stories.test.mjs` story if it ships in the same task.

1. Three verified commits in three requests, with `uv run --offline pytest -k x` and `uv run --offline pytest tests/a.py`:
   one `verified` fact, prefix `uv run --offline pytest`. After two requests: `observed`, not in context.
2. The bytes of `evidence.sqlite3` never contain `-k`, `x` or `tests/a.py` after test 1.
3. Two verified commits in the same request count once.
4. A later failing run with the same prefix: `contradicted`, gone from `context.py`'s text.
5. A prefix removed from `TEST_COMMANDS`, or a folder deleted: the fact is not rendered.
6. Exit 127 from the runner invalidates the fact.
7. A rejected fact never returns; a paused brain renders nothing.
8. `context.py` keeps the section inside 400 characters and after the plan.

### 1.6 Risks

- A stale fact misleads Pi. Mitigated by validation on read, contradiction, replacement and the 30-day TTL.
- Folder names become readable in the data folder. They are already readable on disk next to it. Low.

---

## 2. EGM-3: a goldfish check of Pi's plan

### 2.1 What exists

- `propose_plan` (`harness/planning.mjs:8-39`) sends the plan to Gate (`gate/paperwork.py:544`). In the web, the tool
  reports the plan as pending and the turn stops (`harness/extension.mjs:171-180`, `pauseChoice` at `:159`); the web
  shows the plan card. In the terminal, a select loop offers Start Building, Plan Another Task, Change… and Open
  ROADMAP.md (`harness/planning.mjs:18-34`).
- One agent at a time: terminal and web share `<data>/.agent-lock` (`harness/extension.mjs:75-76`, `:282`, `:338`).
- "Comment and whole-file requests run as one-off Pi requests with their own context" (`docs/reference.md:83-84`).
- Choice cards: `ask_choices` and the harness's own cards (`harness/extension.mjs:160-170`). A model-recommended option
  is recorded as `who: model, proposal: true` (`gate/paperwork.py:200`).
- Settings live in one registry (`harness/settings.py`).

### 2.2 Design

- **Setting** `plan_check`, boolean, default `false`, in `harness/settings.py` (`PI_HARNESS_PLAN_CHECK`). Changed with
  `/config set` only; a web toggle waits for the designer.
- **When.** Web only. After `propose_plan` returns pending and the turn has settled (the lock is free), the workbench
  queues one one-off request, the same kind as a comment request.
- **The plan card is not held back.** It shows at once. The goldfish's questions arrive later as extra choice cards
  under it. If the person presses Start Building first, the questions are dropped and recorded as `skipped`. The check
  never delays or blocks the person.
- **What the goldfish gets.** `ROADMAP.md`, the task files the plan created, and the person's request, quoted. No chat
  history. No tools that write. The instruction: at most three questions about what the plan assumes or leaves out,
  each through `ask_choices` with two to four options, the recommended one first, one option meaning "keep the plan".
- **What System 1 checks.** At most three cards (code drops the rest). Each card passes the existing `ask_choices`
  validation. A question whose exact text is already in the task's Decisions section is dropped.
- **Answers.** "Keep the plan" changes nothing. Any other answer goes back through the existing Change… path
  (`pendingPlanReply`, `harness/extension.mjs:173`, `:522`): Pi revises the plan, and the person approves it as usual.
- **Run on its own: the check is skipped.** This departs from the tool-study report, which said the recommended option
  is taken "as with every other card". Under Run on its own, a question written by the model plus an answer recommended
  by the model would change the plan with no person in the loop: a model judgement in practice (Article 1). The skip
  is logged.
- **Records.** Each question: a decision row `plan_check_question`, `who: model`, `proposal: true`. Each answer: the
  existing `question_answer` row. Each skip: `plan_check_skipped`, `who: code`, with the reason (auto, started early).

### 2.3 Constitution check

- Article 1: the goldfish only writes questions (generation). It never approves, blocks or changes the plan.
- Article 2: it is not a rung on the decision ladder; nothing waits on its answer.
- Article 3: every card has a recommendation and "Something else…".
- Article 11: every question is logged as the model's proposal.

### 2.4 Before it may default to on

Add a bench mode with `plan_check` on. Compare with it off over the 9 scenarios, 3 repeats each
(`python3 -m bench run --repeat 3`): resolved, user turns, median minutes. Turning it on by default needs: resolved does
not drop, and the time added stays under a limit the captain sets (decision D3).

### 2.5 Tests

- Scenario `US-new a plan check adds at most three questions under the plan card` (web, fake model).
- Scenario `US-new Start Building before the plan check ends drops its questions`.
- Unit: a fourth card is dropped; under Run on its own no request is queued and `plan_check_skipped` is recorded; the
  setting off queues nothing.

### 2.6 Risks

- One more full pass of a 20B to 26B local model: minutes, and it holds the agent lock, so the next request waits.
- Wrong questions confuse a learner. An earlier EGM run produced a false finding
  (`firstmate/data/openui-genui-egm/report.md:26`). Mitigated by three cards at most and off by default.

---

## 3. SkillOpt: "skill improvement on the go"

### 3.1 What SkillOpt needs

From `firstmate/data/skillopt-loop/report.md` A1, read from the SkillOpt source at `1a44050`:

- one Markdown skill document per run;
- rollouts that score each item (`hard`, `soft`) and keep its conversation;
- an optimizer model that reads the conversations and proposes edits ("Reflect");
- a gate that keeps an edit only if the selection split scores strictly higher, with no margin;
- about 200 rollouts per run in that study's setup.

### 3.2 What a "skill" is in Pi today

| Text | Where | Who writes it | Joins the prompt |
|---|---|---|---|
| Guides (7: bug, doubt, music, page-layout, planning, qr-code, rename) | `harness/guides/*.md`, shipped with the harness | Harness developers | When a request's words match its triggers (`harness/guides.mjs:21-24`, `harness/extension.mjs:298`) |
| Persistent memory | `~/.pi/agent/AGENTS.md` or `<data>/AGENTS.md`; template `harness/AGENTS.md` | **Pi itself**, after failures ("Persistent self-improvement"), plus fixed harness lessons (`harness/memory.mjs:11-20`) | Every request (`harness/extension.mjs:306`) |
| App Block cards | `kit/blocks/`, generated from `design/app-blocks` | The designer | When matched (`harness/blocks.mjs`) |
| ICM skills | `harness/skill_runs.py` | Skill authors | Not at all: a contract proof with no runtime caller |

**Pi already improves a skill on the go.** The model edits its own `AGENTS.md` after a failure or feedback, in any
phase. Gate checks only the size: at most 32 KiB, at most 4 KiB more at a time, never cut below half
(`gate/ledger.py:194-214`). Nothing checks that a lesson is true or that it helps. What SkillOpt would add is exactly
what this path lacks: a scorer and a gate.

### 3.3 What "on the go" can mean, and whether it fits

**(a) During a session: does not fit.**

- No scorer. Inside a request, System 1 sees Gate refusals, wake-ups and test runs. The tests are Pi's own, written
  in the same request (G-010 proves Red then Green, not that the tests check the right thing). An edited skill cannot be
  compared with the old one without running the same request twice.
- One local model, one agent at a time (`harness/extension.mjs:75-76`, `:338`). A reflection call waits for the
  person's work or blocks it. Asking Ollama for a second model unloads the person's model (`docs/reference.md`, the
  report's TE-2 blocker 2).
- One item per decision. The skillopt-loop study found that even a 10-item selection split could not separate
  candidates (A4).

**(b) Between sessions, on the person's Mac: does not fit.**

- A rollout needs a frozen starting state and a check Pi never saw. The person's projects have neither. Scoring a skill
  by tests Pi wrote is the model grading itself through a proxy (Article 9: evidence, not words; here the evidence is
  produced by the thing under test).
- Cost: one rollout is one whole request. Bench scenarios allow 20 to 30 minutes each
  (`bench/scenarios/*/scenario.json`, `timeout_minutes`). About 200 rollouts is days of the person's machine.

**(c) Between releases, on a harness developer's machine, with the bench: fits the rules, not the data.**

- Scorer: the bench's hidden checks, which Pi never sees (`bench/__init__.py:3-9`, `bench/runner.py:69-78`), plus
  `resolved`, `first_try`, `verified` and wake-ups per run (`bench/runner.py:210-229`, `:264-280`). That is System 1.
- Skill: one guide file.
- Data: 9 scenarios (`ls bench/scenarios`), 3 prompt levels each, so 27 items at most and about 9 per split. The
  skillopt-loop study judged 27 held-out items too few for a strictly-greater gate. Nine is worse. Pass-to-pass noise of
  the local model on these scenarios has not been measured.

### 3.4 Which scorer

- For (c): `hard` = the bench's `resolved` (hidden check passed, no regressions). `soft` = `resolved` and `verified`
  and `first_try`, minus a small amount per wake-up. Both are computed by `bench/runner.py` today.
- The person's own records can give only an observational scoreboard: which guides were attached
  (`decisions.jsonl`, kind `guide_chosen`, `harness/decisions.mjs:4-10`) and how those requests ended (`step_done
  verified_and_committed`, `gate/paperwork.py:925`). There is no counterfactual, so it can point at a guide worth
  reading, never accept an edit.

### 3.5 Does it need a model call, and does that fit Article 1 and the local-only stance?

- **Yes, Reflect is a model call.** The optimizer writes edits to the skill.
- **Article 1: the edit itself fits; it depends on who accepts it.** Writing an edit is generation. In (c) the bench's
  hidden checks accept or reject it: System 1 judges. This is the difference from D1 option C, where facts proposed by
  the model would enter Pi's context with no independent check of their truth. In (a) and (b) nothing independent
  accepts the edit, so the model would in effect judge its own skill: Article 1 is broken.
- **Local-only.** In (a) and (b) the call goes to the person's machine and model: the same objection the report raised
  against option C and against TokenEconomizer's side calls (unloads the model, skips the agent lock). In (c) it runs on
  a developer's machine over synthetic scenarios, not the person's data. SkillOpt's `openai_compatible` backend can
  point at the local Ollama (skillopt-loop A1, Providers), so even (c) can stay local.
- **Dependency rule.** SkillOpt is a PyPI package. The product and this repository's tests cannot import it (rule 5).
  As developer tooling it would live outside the repository, as Playwright does in `~/.cache/plh-browser`
  (`docs/contributing-for-agents.md` § 3), with its environment adapter outside too.

### 3.6 The smallest version worth building

**Not SkillOpt.** Two System 1 pieces that any later SkillOpt run, or a developer editing a guide by hand, needs
anyway. Neither calls a model.

1. **Guide outcome record (S).**
   - Wake-up incidents carry no request id today: `incident()` passes `source` and `cwd` only
     (`harness/extension.mjs:148`, `harness/reports.mjs:6-8`). Add `request`.
   - A console read (`/guides stats`, from `harness/admin.py`) joins `guide_chosen` rows with `step_done` rows and
     wake-ups by request: per guide, requests, share verified and committed, wake-ups per request. Labelled
     "observed, not a comparison".
   - Red: a fixture `decisions.jsonl` and `reports.jsonl` give the expected per-guide numbers.
2. **Bench guide override (S).**
   - `python3 -m bench run --guides <folder>` passes `PI_HARNESS_GUIDES` to the scratch workbench;
     `loadGuides` (`harness/guides.mjs:11`) reads that folder instead of `harness/guides/`.
   - `results.jsonl` records the sha256 of every guide file that ran, so a result names the text behind it (the same
     idea as the skillopt-loop study's prompt files, Part B).
   - Red: a run with an override records the override's hashes; a run without records the shipped ones.

With these, a developer can A/B a hand-edited guide on the bench with `--repeat 3` and read the result.

**Revisit SkillOpt when** the bench has 40 or more scenarios with hidden checks, and pass-to-pass noise is measured
with `--repeat 3` or more. Before that, a strictly-greater gate over 9 items keeps noise.

### 3.7 The existing self-edit path (out of scope, flagged)

Pi's own `AGENTS.md` lessons (3.2) are model-written instructions that join every request, checked only for size.
That sits awkwardly with Article 1 and Article 9. TE-2 facts are a System 1 alternative for project facts. Whether to
narrow the self-edit path is decision D5; nothing here changes it.

---

## 4. Order of work

1. TE-2 `test_runner` facts (no model, no UI).
2. Guide outcome record, then the bench guide override.
3. EGM-3 behind its setting, then its bench comparison.

Each is its own task under `docs/contributing-for-agents.md` § 4.

## 5. Decisions for the captain

- **D2. SkillOpt.** (A) Accept that "on the go" does not fit; build the guide record and the bench override.
  **(Recommended)** (B) Build nothing now. (C) Run SkillOpt on the 9 bench scenarios now. Not recommended: the gate
  would pick noise.
- **D3. EGM-3 bench limit.** How many added minutes per planned request are acceptable before `plan_check` may default
  to on.
- **D4. EGM-3 under Run on its own.** (A) Skip the check. **(Recommended)** (B) Take the recommended options
  automatically, as the tool-study report proposed.
- **D5. Pi's self-written `AGENTS.md` lessons.** (A) Leave as is. **(Recommended for now)** (B) Plan a System 1 check
  for them, separately.
- **D6. Task 26.** (A) New task for TE-2, task 26 noted as partly moved. **(Recommended)** (B) Rewrite task 26.

## 6. Not verified

- Whether the web shows a second batch of choice cards under a pending plan card without UI work. If not, EGM-3 needs
  the designer first.
- The local model's pass-to-pass noise on the bench.
- The time an EGM-3 pass takes on the default model.
