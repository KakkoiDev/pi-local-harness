# 261: Only the person's controls can approve, accept, change the phase or turn on Run on its own

Kind: code

Request 2026-10-18: “fix P0-2 of docs/reviews/2026-10-18-claude-review.md (person-only controls reachable by any local
process) and the P2 lines about model-written “(chosen …)” decisions, `.git/hooks` in Files, the decision log share, and
test runners that delete or upload.”

Constitution: Articles 1, 2, 8, 10 and 11.

Scope: harness/extension.mjs, harness/web_chat.py, harness/services.py, agent_api.py, gate/paperwork.py, gate/planning.py,
gate/phase_shell.py, gate/ledger.py, gate/rules.py, harness/judgements.py, harness/decision_log.py, harness/undo.py,
bench/runner.py, js/chat.mjs, js/workspace.mjs, tests.

- [x] Red/Green 1, secrets: a command run through Pi's shell does not see `PI_HARNESS_TOKEN` or `PI_HARNESS_SHARED_PORT`;
  the extension captures them and deletes them from its environment before Pi spawns anything; the workbench hands the
  token to its Pi through a private file the extension reads and removes, not through the environment.
- [x] Red/Green 2, person routes: `/api/phase`, `/api/phase/build`, check-in accept and stop, `/api/plan/wait`, `/api/auto`
  and a chat message that answers a waiting choice need the page's per-run secret (`X-Pi-Person`, from a meta tag in the
  served page); without it the answer is 403. The page sends it with every request; the phone gets it with the page.
- [x] Red/Green 3, Gate routes: `/plan/approve`, `/phase/accept` and `/decision` refuse `state=auto` unless Run on its own
  is on; person actions (`chosen`, `given`, stop, a phase change, Start Building) need the person secret, which only the
  workbench page and the terminal's own Pi (through the services' private ready line) hold. Workbench Pi workers never
  get it.
- [x] Red/Green 4, model-written decisions: Gate refuses writes to ROADMAP.md and tasks/ that add “(chosen …)”,
  “(given …)” or “(auto …)” lines or a `## Decisions` section, and propose_plan refuses such content. Decisions are kept
  by the harness when `paperwork.decision` records them; G-017 and the plan card read those records. Also fixed: the
  request quote propose_plan adds went inside an empty Decisions section, where G-017 read it as an unsettled decision.
- [x] Red/Green 5, Files: a path in `.git/` is never in a task's Files (propose_plan refuses it, Gate refuses the write);
  the harness commits with hooks disabled (`core.hooksPath=/dev/null`), also for Undo's commits.
- [x] Red/Green 6, test runners: refuse `pytest --basetemp`, `--pastebin`, `-p`, `-o`; npm/yarn/pnpm/bun `--prefix`,
  `--cwd`, `--dir`; `make` with `VAR=` assignments or `-f`/`-C`; `node --test --experimental-loader`/`--import`;
  `bun --preload`; any `--option=<path>` outside the project. Normal runs still pass.
- [x] Red/Green 7, decision log: Gate's allow and success events are no longer decisions (they stay in
  gate-events.jsonl); a Laya abstention is logged as abstained and not counted; the model's plan layout choices (each
  task's Kind and Files) are logged as `who=model` proposals.
- [x] Green: `python3 tests/verify_workflow.py`, `node --test tests/harness/*.test.mjs` (166 passed) before every commit;
  browser suites (design and chat) passed after parts 2 and 4, the parts that change what the page sends or shows.

## Not covered (open)

- Any process running as the person can still read the served page and so the page secret, and can write
  `config.json` in the data folder (which turns Run on its own on). The secret raises the bar for a test the model
  wrote from “inherits a token” to “scrapes the page on purpose”; it is not an authentication against the person's own
  account. Gate refuses Pi's own commands that would do it only as far as the Implementation phase allows test runners.
- Decisions recorded before this task live only as lines in task files; G-017 now asks again for an active task whose
  Decisions lines were not recorded by the harness.

## Needs design

- A refused person control (403 “Reload the page”) shows as the generic error line; the designer may want its own
  message and a Reload button.

## Round 12 build (design round 12 step 3; board R12_Grant)

- [x] Red (unit): a write outside the task's Files in Implementation is refused (G-015) with Gate's question “Pi wants to
  change a file outside task N” (Add to Task N · Keep Out); the question keeps its scope when Pi's ask_choices sends it
  again; Add writes the file into Files: and the plan stays approved; Keep Out, then a second need, asks “The plan needs
  to change” (Re-plan → Planning by the person's answer · Keep the Plan → plain refusals) (tests/test_round12_checkins.py).
- [x] Gate side in gate/scope.py (hooks in gate/ledger.py and Paperwork.decision / choice_pending); under Run on its own
  the recommended answer is taken and reported, and no re-plan question is asked.
- [x] What you grant on the plan card: Kind and Files of each task with their source tags (your answer · task file), above
  Decisions (js/scope-cards.mjs; propose_plan sends `grant` per task).
- [x] The scope card (Add to Task N default · Keep Out · Open the Task) and the re-plan card (Re-plan default · Keep the
  Plan · Open the Plan).
- [x] A person route refused for a stale secret answers `stale: true`; the page shows “This page is out of date after plh
  restarted, so your choice wasn't sent. …” with Reload Page where the press happened, not the error line
  (js/refusals.mjs); the reload keeps the chat's scroll position.
- [x] Green: python3 tests/verify_workflow.py; browser suites (stories US-120, US-121).

Not built: the “Laya” source tag (Laya does not decide Files today); the re-plan card does not list “what it adds and
moves” (the new plan does not exist until Planning). Both are in design/briefs/round-12.md, part E.
