## Design critic (egm-design), Stage 7: completed

Standard: feature-spec-standard.md. Mode REVIEW. Target lines 1-362.
Verdict: not ready. 3 Blockers (1 TE-2, 2 EGM-3), 9 Major, 8 Nit. SkillOpt (section 3) sound.

Read: persona, standard, target, six context files; gate/test_runs.py, gate/protocol.py, gate/phase_shell.py,
gate/ledger.py, gate/paperwork.py, harness/context.py, harness/planning.mjs, harness/choices.mjs, harness/guides.mjs,
harness/reports.mjs, harness/decisions.mjs, harness/settings.py, harness/memory.mjs, harness/work_queue.py,
bench/runner.py, bench/__init__.py, bench/__main__.py, bench/scenarios listing, parts of harness/web_chat.py and
docs/reference.md.

### Blockers
- **B1. TE-2, lines 107-108, test 4 at 146.** G-010 requires a failing run before the passing one
  (gate/paperwork.py:759-761), so every normal request emits `test_failed` with the same prefix and folder. The fact
  goes `contradicted` at the Red step, exactly when Pi picks a test command; learning.py:128-130 keeps it until new
  proof, so it flips every request. A failing test shows the runner works. "No later pass" cannot be judged on arrival.
  Fix: contradict only on runner-level signals (exit 126/127, zero tests: `NO_TESTS` gate/protocol.py:102, empty
  `counts()`), or a verified commit with another prefix in the same folder. Never on `test_failed`. Rewrite test 4.
- **B2. EGM-3, lines 189-192 vs 205-207.** bench/runner.py:128-129 turns Run on its own on for every scratch run;
  `propose_plan` then approves at once (harness/planning.mjs:15); § 2.2 skips the check. On and off run the same code;
  the gate passes by default. Also uses 9 x 3 runs, noise unmeasured, after rejecting 9 scenarios for SkillOpt
  (276-278, 325-326). Fix: bench mode with Run on its own off and a scripted stand-in person; measure noise first; or
  state D3 cannot be judged by the bench today.
- **B3. EGM-3, lines 177-188.** (a) `pendingPlanReply` is set only by the terminal select loop (planning.mjs:28-31 to
  extension.mjs:173), read only in the same process's `agent_settled` (:522). Web Change… is `editPlan`
  (js/chat.mjs:75), which fills the composer. A goldfish one-off runs in another worker after the plan request paused
  (:520-521): no route. (b) One-off requests "never appear in, or use up, the project chat" (docs/reference.md:83-84),
  yet cards must show under the plan card. (c) Web `ask_choices` allows one question and pauses the turn
  (harness/choices.mjs:21-35): three questions are three pause/resume cycles, not "one extra Pi request" (23) or "one
  more full pass" (218). (d) While a goldfish question waits, `request_advice` reads the next message as
  `waiting_reply` (gate/ledger.py:162-163); interaction with the pending plan not said. Fix: specify card ownership,
  answer-to-plan-change route (e.g. System 1 posts a `Choice:` message to the project conversation), per-question cost,
  and the waiting-question vs plan-card relation.

### Major
- **M1. Lines 179-180 vs 218.** One agent, one queue (extension.mjs:75-76; work_queue.py). Start Building, Change… or
  Plan Another Task during a goldfish pass waits minutes. Fix: any plan-card action cancels the job
  (`WorkQueue.cancel`, work_queue.py:230) and records `plan_check_skipped`; define a card answered after Start
  Building; tests.
- **M2. Lines 182-184.** The one-off runs the full extension: `/request` opens paperwork; planning guide forced in while
  unapproved (extension.mjs:361-364); AGENTS.md and Gate rules join the prompt (:306); wake-ups fire; Planning allows
  writes to ROADMAP.md and tasks/ (Article 8); `propose_plan` mapped to `read_file` (:47). "No tools that write" has no
  mechanism; shared memory weakens goldfish independence. Fix: a request kind with read tools plus `ask_choices`; Gate
  refuses writes and `propose_plan`; skip paperwork and wake-ups; leave out memory and the planning guide.
- **M3. Lines 183-184, 198-200.** Model picks the question and the recommended change; a learner who clicks the
  recommendation gets a model judgement (same argument as lines 189-192). Fix: System 1 forces "Keep the plan" as
  option 0, recommended.
- **M4. Lines 80-81, 96-97, 155.** Folder comes from `test_folder(command, cwd)` following Pi-written `cd <x>`
  (gate/protocol.py:87-97); Pi can create folders. "Exists and matches a pattern" does not make it System 1 text,
  against D1 = B (line 11). A Pi-chosen 64-char folder name in every request is a lasting instruction channel; § 1.6
  treats it only as privacy. Fix: drop folder or allow only `.`, or only folders present at first commit/starter;
  add the injection risk.
- **M5. Lines 111-112.** Two-runner projects (the harness's own guidance names `tests/test_protocol.py` or
  `tests/protocol.test.mjs`) flip `stale` in turn. Fix: up to two runner facts; stale only on a runner-level
  contradiction.
- **M6. Lines 114-116.** `Curator.database()` takes `BEGIN IMMEDIATE` even for reads, 0.5 s timeout
  (learning.py:52, 61); `retrieve()` writes stale rows (:139-140). Concurrent emits raise "database is locked"; a throw
  in `build_context` fails Gate's `/context`, so Pi gets no context and "Current phase unavailable"
  (extension.mjs:152-153). `build_context` takes no data-folder argument (context.py:162). Fix: read-only path; on
  brain error omit the section and report an incident; define how the data folder arrives; locked-database test.
- **M7. Lines 109-110.** `Curator.invalidate(project, source)` works by event source id (learning.py:162-173); a
  126/127 run emits no event (gate/test_runs.py:40). 126/127 not universal (`uv run`, `npm test` without a script;
  sandbox wrapper may change codes); unverified. Fix: invalidation by fact key; define "runner unavailable" per prefix
  family; list under Not verified.
- **M8. §§ 1.3, 2.2 (Alternatives Rule).** TE-2 does not weigh a rung-1 option: derive the runner from files on disk
  (`package.json` `scripts.test`, `pyproject.toml`, `uv.lock`, starter README) matched to `TEST_COMMANDS`: no privacy
  change, no three-request wait, no model folder. EGM-3 does not weigh deterministic System 1 plan checks (G-014
  exists; code tasks without scenarios; `files` entries that do not exist). Fix: alternatives subsections with reasons.
- **M9. Lines 61-66.** TE-2 problem asserted against the outside report, not product failures; README.md and the
  test-protocol card already reach Pi (context.py:209, :215); no lesson, bench run or incident where Pi picked the
  wrong runner; no metric. Fix: cite evidence; define a measure (share of first test commands failing as
  runner-unavailable, before and after).

### Nit
- N1 (144) Test 2 always fails: byte `x` is in JSON keys like `expires`. Use `-k zq_marker`, `tests/a_marker.py`.
- N2 (139-140, 312) contributing § 4 requires scenarios for terminal-Pi changes; `/facts`, `/guides stats` need them.
- N3 (99) Under Run on its own a three-task plan gives three request ids in one sitting (extension.mjs:353); weaker
  than three sessions. Say so, or count distinct days or sessions.
- N4 (186) exact-text dedupe does almost nothing. Normalise or remove.
- N5 (246-247) "Gate checks only the size" holds only for `PI_HARNESS_MEMORY` or `<data>/AGENTS.md`
  (gate/ledger.py:202-203); extension prefers `~/.pi/agent/AGENTS.md` when present (extension.mjs:77-78), then ordinary
  rules apply.
- N6 (309-315) per-guide numbers biased: planning guide always attached while unapproved (extension.mjs:361-364);
  `step_done` only for committed tasks (paperwork.py:925). Note beside "observed".
- N7 (92-94) put `Curator.confirm` inside `verified()`'s try/except (learning.py:239-246).
- N8 (317-318) `start_workbench` strips `PI_HARNESS_*` (bench/runner.py:131); pass `PI_HARNESS_GUIDES` via
  `extra_env`, list it in harness/settings.py `INTERNAL`.

### Checked and accurate (reviewer)
TE-2 citations into learning.py, test_runs.py, protocol.py, phase_shell.py; agent lock extension.mjs:75-76, :282,
:338; paperwork.py:200, :925; bench 9 scenarios, `--repeat` exists; guides.mjs:11, 21-24; `incident()` passes no
request id (reports.mjs:6-8, extension.mjs:148); Constitution citations.
