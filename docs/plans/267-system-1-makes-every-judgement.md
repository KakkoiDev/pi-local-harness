# Plan 267: System 1 makes every judgement

Date: 2026-10-18. Status: planned (tasks 268-274). The person: "the UX improvements for the gate to make all
judgements". CONSTITUTION.md Articles 1, 2, 3, 6, 10 and 11: System 1 (code, then Laya) decides; System 2 (the model)
only produces; when System 1 cannot decide with confidence, the person decides, never the model.

A **judgement** here is a decision with more than one outcome that changes what happens next: allow or refuse, which
phase, which verification path, done or not, ask or not, which option is recommended, continue or stop, what gets
committed. Writing code, text, tests, plans' content and readings of images is production, not judgement.

## 0. Method and size

Sources read on harness-next (c2f527e): every file in gate/*.py, harness/*.mjs, harness/*.py and js/*.mjs; the prompts
harness/AGENTS.md and harness/guides/*.md; the reviews docs/reviews/2026-10-18-claude-review.md and
docs/reviews/2026-10-17-test-project-log-review.md. Raw rows found, by source and current author:

| Source | Code | Laya | Person | Model |
|---|---:|---:|---:|---:|
| gate/*.py (rules, ledger, paperwork, phases, protocol, shell checks) | ~128 | 4 call sites | 8 controls | ~14 values accepted after a form check |
| harness/*.mjs, harness/*.py | ~125 | 5 questions, 9 lines | 37 controls | 11 |
| js/*.mjs (what the web UI decides or shows) | 15 | 0 shown | 11 | 5 |
| harness/AGENTS.md and guides (instructions delegating a judgement) | 6 | 1 | 4 | 36 |

Many rows are the same judgement seen from several files. Deduplicated, the inventory below has **58
judgements**: 21 made by code (10 listed, 11 rule families), 4 by Laya (each falling back to the person), 8 by the
person and **25 by the model** (directly, or through a value code accepts after checking only its form). Code's ~128 safety
and protocol rows are grouped into families (section 1.8); every model, Laya and person judgement is listed on its own.

## 1. The inventory

Columns: **Now** (who decides today), **Where** (file:line on harness-next), **Target** (per the constitution), **Task**.
"Model via value" means code checks only the form of a value the model chose.

### 1.1 Plan and task layout

| ID | Judgement | Now | Where | Target | Task |
|---|---|---|---|---|---|
| J-01 | The task's Kind (code, docs, chore): decides whether Red and Green are laid out and required | Model via value (propose_plan `kind`, default code) | harness/planning.mjs:11; gate/paperwork.py:316, 331; gate/protocol.py:177-183, 286-293 ("Kind: chore" skips Red) | Code: Kind derived from Files (rule K-001) | 268 |
| J-02 | The task's write scope (Files); no Files line allows every file | Model via value (propose_plan `files`), granted by the person's Start Building without seeing it | gate/paperwork.py:318-319; gate/planning.py:27-34 (:32); gate/phases.py:119-123 | Code completes and checks Files (K-002, K-003); the person grants it on a card that shows it; widening is a card with a code recommendation | 268, 273 |
| J-03 | The task's title, which becomes its file name, the refusal text, the check-in title and the commit subject | Model via value (propose_plan `title`) | gate/paperwork.py:317, 330, 540, 587-601; gate/phases.py:123 | Code: file name and commit from the code short title (W-001, W-002); the model's title is display content after code checks (W-003) | 272 |
| J-05 | What counts as done for a task (Done when) | Model via value; code checks only that the line exists | gate/paperwork.py:317; gate/rules.py:116-137 (G-014) | Content stays the model's; the person approves it on the plan card; "done" itself is J-06 | 269, 273 |
| J-16 | How the work splits into tasks | Model (propose_plan content) | harness/AGENTS.md:25; harness/guides/planning.md:4 | Production (stays the model's); code checks each task has Files and a Done when; the person approves | 268 |
| J-11 | What counts as a small change (no plan needed) | Code regex on the person's words; the model also decides it implicitly by choosing kind docs or chore | gate/planning.py:16-24 | Removed: Article 8 sends every request through the phases; size is measured from the diff after the fact, for display | 268 |
| J-31 | Sample cleanup: which starter parts the new app does not use | Model (AGENTS.md:27), then code asks once | harness/AGENTS.md:27; gate/paperwork.py:483-486, 549-585 | Code: kit/starters.json's sample list; one card with "Remove the unused sample" recommended | 272 |

### 1.2 Verification and completion

| ID | Judgement | Now | Where | Target | Task |
|---|---|---|---|---|---|
| J-06 | Is the task verified / done (Green on the exact code, Red proven) | Code, but on evidence the model chose; review P0-1: `--help` or a weakened test counts | gate/protocol.py:239-257; gate/paperwork.py:442-456, 515-539, 603-625 | Code on a check set code chose (E-101), Red proven by reverting in a scratch worktree (E-102) | 269 (after 260) |
| J-07 | Which test command counts as evidence | Model via value (`test_command`, run with shell=True by prove_red) | gate/paperwork.py:442-456, 603-625; gate/phase_shell.py:92-104 | Code: the project type's check set (E-101) | 269 |
| J-27 | Whether the tests are still real (not weakened) | Model (writes tests; nothing checks them) | gate/phase_shell.py:92-104 (npm/make run scripts the model edits); review P0-1 | Code rule E-103; a weakening becomes a person card, recommended "Keep the tests as they were" | 269 |
| J-15 | "Tried it: …" in For the person | Model prose, shown under the answer unchecked | harness/AGENTS.md:25; js/done-row.mjs:35, 44; js/plan-cards.mjs:60 | Code writes the "Tried it" line from recorded runs; claims without records are removed | 269 |
| J-19 | Which checks are "appropriate" for a change | Model ("verify changes with appropriate checks") | harness/AGENTS.md:7 | Code: E-101 by changed file types | 269 |
| J-26 | Is a document comment answered | Model (writes agent_reply when it thinks it is done) | harness/AGENTS.md:36 | Code: answered when its task is verified | 269 |
| J-28 | A docs or chore task with no change completes verified; plain questions treated as task work | Code, wrongly (review P1-6, P1-7) | gate/paperwork.py:507-514; gate/protocol.py:286-293 | Code, repaired: Kind from K-001; a request with no change is "answered", not a verified task | 268, 269 |

### 1.3 Questions, recommendations and assumptions

| ID | Judgement | Now | Where | Target | Task |
|---|---|---|---|---|---|
| J-08 | Whether a decision is open, so a question is asked | Model ("a decision not answered by the request, current code or project conventions") | harness/AGENTS.md:32; harness/choices.mjs:23 | Code Q-001: the decisions store, kit/defaults.json and conventions answer first; the model may propose, code decides whether it is shown | 270 |
| J-09 | The options and which is recommended | Model (must put its recommendation first; logged as model) | harness/choices.mjs:8, 17, 23; gate/paperwork.py:113-128 (:125); js/plan-cards.mjs:38-40 | Options stay content; the recommendation by System 1 (Q-002: default, then safety tags, then Laya at .95, then the safety order); `recommended` leaves the schema | 270 |
| J-13 | Whether Pi asks or assumes | Model; code catches only keywords (G-016 regex) and decision words before Laya `assumed_value` | harness/AGENTS.md:32; gate/rules.py:146-151; gate/ledger.py:214-220 | Laya `assumed_value` (.98) on every final reply in Planning and Implementation; true or abstain: a card with the stated value as an option | 270 |
| J-17 | Is a decision settled ("(chosen", "(auto", "(given" in task text) | Code reads text the model can type (review P2) | gate/rules.py:154-158; js/plan-cards.mjs:22-29; js/workspace.mjs:70-74 | Code reads the decisions store only; the Decisions section is rendered from it | 270 |
| J-21 | Does a newer message change an earlier decision | Model ("Follow the most recent user instruction if it conflicts") | harness/AGENTS.md:13 | Laya `choice` (.98); yes opens "Change…" for that decision; abstain: unchanged, the person can still change it | 270 |
| J-23 | The language of options | Model ("Write options in the person's language") | harness/AGENTS.md:32 | Code: the language setting | 270 |
| J-29 | Is a reply a yes, no or change to the waiting question | Laya `waiting_reply` (.98), advisory; abstain: a system card | gate/ledger.py:150-151; harness/laya.py:110-112; harness/judgements.py:9-42 | Keep; its abstention must not block writes (finding below) | 270 |
| J-30 | Which phase the person asks for in words | Code regex, then Laya `phase_intent` (.98), advisory | gate/ledger.py:152-153; harness/laya.py:115-117 | Keep; never asked again on its own answer (review P1-5) | 270 |

**Finding:** when Laya abstains on any kind, advisory ones included, harness/judgements.py:39-41 creates a pending
system choice, and G-017 (gate/ledger.py:212) then refuses every content write until the person answers. An advisory
phase or shell question can stall the work. Task 270 separates advisory cards from blocking ones.

### 1.4 Stops, wake-ups and re-planning

| ID | Judgement | Now | Where | Target | Task |
|---|---|---|---|---|---|
| J-10 | Whether a final answer ending in "?" skips the wake-up | Model (its punctuation) | harness/extension.mjs:434, 480, 489 (`/\?\s*$/`) | Code S-001: only a card is a question; Laya `noul` "asks the person to decide" (.98); true or abstain: a card quoting Pi's question | 271 |
| J-14 | Whether to re-plan | Model ("Stop repeating the failed approach"); the person via Plan Another Task | harness/AGENTS.md:17; harness/stuck.mjs:3 | Code S-002 triggers a "Re-plan this task?" card, recommended "Go back to Planning for this task" | 271 |
| J-22 | Retry and give-up limits in guides | Model reading prose ("fix errors twice at most") | harness/guides/music.md:10 | Code counters with rule ids | 271 |
| J-32 | How many wake-ups, stuck detection, recovery | Code (PI_HARNESS_WAKE_UPS, stuck.mjs) | harness/extension.mjs:111-113, 351, 385; harness/stuck.mjs | Keep; logged with authors | 271, 274 |
| J-33 | "Stopped": by the person or by a question | Code, shown ambiguously (review P2) | js/workspace.mjs:185, 206 | Code; the decision row names who stopped it | 273 |

### 1.5 Paperwork text

| ID | Judgement | Now | Where | Target | Task |
|---|---|---|---|---|---|
| J-04 | The commit message | Model via value (the propose_plan title), or code's short title for harness-made tasks | gate/paperwork.py:540, 587-601 | Code template from the task number, code title, checks and decisions (W-001) | 272 |
| J-18 | Is a failure confirmed, so a lesson is written; is feedback a preference | Model ("After a confirmed failure, add a concise lesson") | harness/AGENTS.md:11 | Code trigger (W-004); the model drafts, the person or Run on its own accepts | 272 |
| J-34 | The task's "Done when" for harness-made tasks (a copy of the title) and their short title | Code | gate/paperwork.py:28-41, 643 | Code, with "Done when" from the evidence rule (the check set passes, Red proven) instead of a copy of the title | 269 |

### 1.6 Context and guides

| ID | Judgement | Now | Where | Target | Task |
|---|---|---|---|---|---|
| J-12 | Which guides join the prompt | Code keywords (at most 2), then Laya `applicable_guide` (.95), then the person's card | harness/guides.mjs:18-21; harness/judgements.py:13; harness/extension.mjs:283, 302 | Keep; shown as a decision row | 273 |
| J-35 | Which files go into context ("Pi sees") | Code | harness/context.py; js/context-line.mjs:110-170 | Keep; exclusions shown too (review #13) | 273 |
| J-36 | Which harness tools a request gets | Code (browser tool by a page regex, music when assets/music exists) | harness/tool-choice.mjs:3-8 | Keep | — |

### 1.7 Phase, approvals and Run on its own

| ID | Judgement | Now | Where | Target | Task |
|---|---|---|---|---|---|
| J-40 | The phase | Person (button, /discuss /plan /build); Run on its own moves Planning to Implementation (code) | gate/phases.py:46-72; gate/paperwork.py:200-217; js/phases.mjs:21-45 | Keep; person-only controls must really be the person's (review P0-2, task 261) | 273 |
| J-41 | Start Building, and which planned tasks | Person | gate/paperwork.py:219-238; js/phases.mjs:19-20 | Keep; the card shows Kind and Files with their source | 273 |
| J-42 | Plan approval | Person, or auto under Run on its own | gate/paperwork.py:362-384 | Keep; auto is recorded as auto with the recommendation's source | 273 |
| J-43 | Check-in accept or stop | Person; auto accepts only verified tasks | gate/paperwork.py:240-256; js/plan-cards.mjs:56-63 | Keep | 273 |
| J-44 | The answer to a card | Person; under Run on its own code takes option 0, today the model's recommendation | harness/choices.mjs:28; gate/paperwork.py:148-183 | Person or auto, where auto takes System 1's recommendation (J-09) | 270 |
| J-45 | Confirming a stated value | Person (digest), reused by code | gate/paperwork.py:130-134; harness/judgements.py:29-31 | Keep | — |
| J-46 | Run on its own on or off; the profile; bare mode | Person settings | harness/autonomy.py; gate/engine.py:38; gate/rules.py:51-54 | Keep | — |
| J-47 | Keep running on its own to the next task | Code (committed, next task, autonomy on) | gate/paperwork.py:467-475 | Keep; listed in the run report | 273 |
| J-48 | Undo a request; Retry; Stop; model and thinking | Person | js/done-row.mjs:36-61; js/workspace.mjs:185, 206; js/chat.mjs:84, 211-238 | Keep | — |

### 1.8 Safety and protocol rules (code, kept)

All code today and all staying code: the tool risk table and profile (G-001, G-002; gate/engine.py:12-57); catastrophic
shell commands (G-003; gate/shell_guard.py, 13 checks); edit application and syntax notes (G-004; gate/ledger.py:20-71);
commit order and the harness's own commits (G-005, G-013; gate/protocol.py:64-85, gate/ledger.py:179-183); audit drift
and postconditions (G-006, G-007; gate/engine.py:65-71, gate/ledger.py:295-327); plan file writes, shrinks and ticks
(G-008 to G-010; gate/rules.py:88-113, gate/ledger.py:259-272); plan completeness (G-014; gate/rules.py:116-137);
phase permissions per tool (G-015; gate/phases.py:90-123, 13 branches); read-only shell and test-runner allowlists
(gate/phase_shell.py:19-104); test-run counts (gate/test_runs.py); external-action detection for the run report
(gate/ledger.py:117-119); and, counted as a Laya judgement (J-37), `shell_risk` (.995) as advice after the code rules (gate/ledger.py:207-210; the
refusal stands whatever it answers). Repairs the
reviews asked for (dead branches at gate/rules.py:152-153 and gate/ledger.py:267-272, the cwd fallback that gives any
folder phase rules at gate/ledger.py:185-191, the `python -m pip` gap in the external-action regex) belong to the
review's repair tasks (260-265), not to this plan.

### 1.9 Further model-made judgements found in harness/

| ID | Judgement | Now | Where | Target | Task |
|---|---|---|---|---|---|
| J-50 | Run on its own runs a console change Pi asked for (models pull or remove, ollama set, config set, undo, audit, update) without the person | Model via value (command, args), then code adds `--yes` | harness/console.mjs:63-65, 71-75 | A console change Pi asks for is always a card; System 1's recommendation for a model-requested change is "Don't change it" unless the change is read-only; Run on its own takes that and lists it | 270 |
| J-51 | A question's number and total ("2 of 3") | Model via value | harness/choices.mjs:16 | Code, from the queue of pending questions | 270 |
| J-53 | Edit the page or propose a suggestion for a document comment | Model (prose instruction) | harness/documents.py:280-281 | Code: a suggestion by default (reversible); an edit only when the person chose "Apply directly" for the document | 269 |
| J-57 | Did the request ask for a change; did Pi announce work without doing it (no-action wake-up) | Code regexes on the person's and Pi's words | harness/extension.mjs:477-485 | Code from the phase and the approved task (Implementation with an approved task means a change is expected), not from wording | 271 |

Also found, kept as production checked by Gate: the browser tool's target, size and probes (harness/browser.mjs:139-148,
243-249), the music bank and score (harness/music.mjs:45-57), the search query (harness/web-search.mjs:3), the console
command Pi proposes. Two more findings for the tasks: Laya's answers to `phase_intent`, `waiting_reply` and
`shell_risk` change nothing today (harness/extension.mjs:295, gate/ledger.py:207-211), only their abstentions show a
card; and with Laya not installed every question abstains, so every Implementation write after decision words ("will
be", "decided", 採用…) is refused (gate/ledger.py:217-220). Dead judgement code to remove in the same tasks: task_box
(always blocked, harness/extension.mjs:364), the unreachable tick-evidence checks (gate/ledger.py:267-272),
requires_plan's unused result (gate/paperwork.py:299), approval() (gate/planning.py:12), `code_answer` with no caller
(harness/judgements.py:24-26).

## 2. Each model-made judgement: target, evidence, and what happens when Laya abstains

| ID | Target | Evidence System 1 uses | When Laya abstains (or code cannot decide) |
|---|---|---|---|
| J-01 Kind | Code K-001 | The Files list against implementation and documentation path rules and kit/conventions | Code always answers (no Laya); a path no rule classifies counts as code (the strict path) |
| J-02 Files | Code K-002, K-003; person grants; widening card | The proposed Files, the starter's conventions for companions, the path of the refused write | Widening: the person, with "Allow for this task" recommended only for a companion path, otherwise "Keep the scope and re-plan" |
| J-03 Title, J-04 commit | Code W-001 to W-003 | The person's request words (short_title), the task number, the test-run log, the decisions store | Code always answers |
| J-06 done, J-07 command, J-19 checks | Code E-101, E-102 | The project type, changed files, the exact code state, the test-run log, a scratch worktree with the change reverted | Code always answers; "not verified" is a truthful outcome, not a question |
| J-27 test integrity | Code E-103 | Test and assertion counts before and after, constant assertions, new skips | The person: "Keep the tests as they were" (recommended), "Accept the smaller tests", "Something else…" |
| J-15 Tried it, J-26 comment | Code | The browser and test runs recorded for the request; the comment's task status | Code always answers |
| J-08 whether to ask | Code Q-001 | The decisions store (keyed), kit/defaults.json, the project's conventions | Not answered by code: the question is shown to the person, one at a time |
| J-09 recommendation | Code Q-002, then Laya | Option effect tags (reversible, download, data leaving, inside Files), kit defaults; Laya `choice` "Which option best fits the request and the project's conventions?" at .95 | The deterministic safety order (fewest effects, then proposed order), labelled "safety order"; the person chooses; Run on its own takes it and lists it in the report |
| J-13 asks or assumes, J-21 changed decision | Laya `noul` / `choice` at .98 | The request, Pi's reply, the decisions store | The person: a card with the stated value as an option, or "Change…" on the earlier decision |
| J-10 "?" ending | Code S-001, then Laya `noul` at .98 | Whether a card exists; Pi's last reply | The person: a card quoting Pi's question, "Answer Pi's question" recommended |
| J-14 re-plan, J-22 limits | Code S-002 and counters | Runs per Red, widening cards per task, wake-ups used, unverified check-ins in a row | Code always answers; the re-plan itself is a card, "Go back to Planning for this task" recommended |
| J-18 lessons, J-31 sample | Code W-004; starters.json | Reports, refusals and run sequences; the sample list | The person accepts or skips the draft; Run on its own accepts and lists it |
| J-23 option language, J-51 numbering | Code | The language setting; the pending-question queue | Code always answers |
| J-50 console change by Pi | Code | Whether the change is read-only (gate/phases.py:79-87) | The person, "Don't change it" recommended |
| J-53 suggestion or edit | Code | The document's setting | Code always answers (suggestion) |
| J-57 change expected | Code | The phase and the approved task | Code always answers |
| J-16 task split, J-05 Done when | Production, approved by the person | — | — |

The model is never a fallback. Where the table says "Code always answers", there is a deterministic default; where
Laya abstains, the person gets one card, with a recommendation chosen by System 1 and "Something else…" last.

## 3. The UX: seeing and overriding System 1 without being asked again

**One pattern, the decision row.** Every judgement shown to the person uses the same row: *what* was decided and the
answer · *by whom* (code, Laya, you, auto) · *why*, one line (the rule, the question and its confidence, or "you chose
this at 14:02") · **Change…**. It appears in four places only: under each answer (collapsed to "4 decisions · 1
automatic"), on the plan approval card (Kind, Files, recommendations), on the check-in (verified or not and by which
checks), and in Run on its own's report. Today the UI knows three labels ("you", "auto", "from the terminal") and never
shows code, Laya or the model.

**Ask less, never twice.**

- Code and Laya answer first; only their abstentions reach the person (sections 1 and 2).
- One card at a time; related questions queue as a numbered batch ("2 of 3") on one screen, each answerable alone, with
  "Take all recommendations" for the batch.
- A settled decision is stored by key in the project's harness data (task 270), not in text the model edits; it
  survives compaction, restarts and new requests. The same key is never asked again; a later message that contradicts it
  opens "Change…" on that decision instead of a new question.
- Advisory questions (phase intent, waiting reply, shell risk) never block writes while they wait.

**Run on its own** takes System 1's recommendation for every card (never the model's), records it as auto with the
recommendation's source, and lists each in the report grouped by task, each with Change…. A decision the person later
changes redoes what depended on it, through the re-plan card when needed.

**Beginner and expert.** Beginners see the answer and a plain author ("checked by the workbench", "you", "on its own")
and Change…; experts (a setting) also see rule ids, Laya's confidence and a link to the evidence (the test run, the
diff). The terminal shows the same rows with `/decisions`.

### For the designer (round 12, part C)

For design/briefs/round-12.md part C, in the workbench's 1-bit design, desktop and phone, light and dark, English and
Japanese:

1. **The decision row** and its collapsed line under an answer ("4 decisions · 1 automatic"), expanded, for each author
   (code with rule, Laya with confidence, you, auto, and "model" while any remain), with Change….
2. **The plan approval card** with Kind and Files as decision rows (their source rule), the recommendations taken, and
   Start Building.
3. **The scope-widening card** ("Allow <path> for this task?") with its recommended option and why.
4. **The check-in** showing verified or not with the checks that proved it (test run, pages at two sizes), the
   test-integrity warning, and the code-written "Tried it" line.
5. **A batch of questions** ("2 of 3") with "Take all recommendations", each recommendation's source (default, safety,
   Laya, safety order).
6. **"Pi asked a question"**: the system card quoting Pi's free-text question (J-10).
7. **The re-plan card** ("Re-plan this task?").
8. **Change… flow**: what changing a decision redoes, confirmation, the result in the row.
9. **Run on its own's report** with automatic decisions grouped by task, each with Change….
10. **Settings → Detail**: beginner or expert decisions.
11. **The terminal form** (`/decisions`) for reference.

## 4. The metric

Task 249 logs every decision with its author; review P2 found the share misleading (every Gate preflight counted as a
code decision, Laya abstentions counted as Laya, test runs writing into the live log). Task 274 makes it honest:

- **A catalogue of judgement kinds** (harness/judgement_kinds.json: J-01 … with their target author); a record with an
  unknown kind is refused; every record carries the request id.
- **What counts:** judgements, not checks. Routine Gate passes are counted as checks, apart. A Laya abstention is
  recorded as `laya_abstained`, and the judgement goes to whoever then decided.
- **No hidden model share:** wherever code still uses a model-supplied value as a decision (Kind, Files, title, test
  command, recommendation, "?" ending) it writes a `model` record until tasks 268-272 remove it.
- **Per request and per run:** judgements by author (code, laya, person, auto, model), the model's share = model /
  all judgements, and **coverage** = judgement kinds with a writer / kinds in the catalogue. The bench's README column
  reads "model share (coverage)", e.g. "12% (31/41)"; legacy runs stay "Not recorded".
- **Target: model's share of judgements = 0** with coverage 100%. A 0 with partial coverage is reported as partial,
  never as success. The count covers instrumented decisions, not latent choices inside generated prose (as task 249
  said).

## 5. Tasks

| Task | Change |
|---|---|
| [268](../../tasks/268-kind-and-files-from-system-1.md) | Kind and write scope from code; Files required; widening card; "small change" removed |
| [269](../../tasks/269-completion-from-system-1-evidence.md) | Done and verified from a check set code chose, Red proven by revert, test integrity, "Tried it" from records |
| [270](../../tasks/270-questions-owned-by-system-1.md) | Questions: the decisions store, whether to ask, System 1's recommendation, assumptions on every reply, advisory cards never block |
| [271](../../tasks/271-stops-wake-ups-and-re-planning.md) | Stops, wake-ups and re-planning decided by code and Laya, not punctuation |
| [272](../../tasks/272-paperwork-text-from-system-1.md) | Commit messages, file names, title checks and lesson triggers by code |
| [273](../../tasks/273-the-decision-row.md) | The decision row in every surface, after the designer's round 12 part C |
| [274](../../tasks/274-honest-judgement-metric.md) | The honest metric: catalogue, judgements vs checks, coverage, model share target 0 |

Order: 274 first (so the share is honest before it moves), then 268, 269 (after the review's task 260), 270, 271, 272;
273 when the designer's part C is synced. Each task updates the AGENTS.md and guide lines that delegated its judgement.
