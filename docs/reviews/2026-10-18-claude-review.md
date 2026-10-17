# Independent review of GPT-Sol's work (tasks 227-259) and the harness logs

Date: 2026-10-18. Reviewer: Claude, with five parallel reviewers (completion, conversation lifecycle, phases and Laya,
runtime logs, packaging and tests). Code reviewed: `harness-next` at `5b34afd`. Logs: `~/pi-local-harness-data`,
read-only, privacy-edited. Every "reproduced" finding was run in a scratch copy with the fake Pi (real git, real test
commands where it matters); nothing in the repo, the person's projects or the data folder was changed by the review.

Status words: **reproduced** (a failing scratch run shows it), **suspected** (from code, not run), **fixed-confirmed**
(an earlier finding now holds), **by design**.

## Which build ran what (from the chats' startup lines)

| Requests | Build | Note |
|---|---|---|
| test-harness R01-R15, harness-test-2 R16-R29 (17 Oct 14:21-19:18) | 1751ab7 | Before Laya and the decision log: the person's "v2" |
| harness-test-2 R30-R31 and four later requests (17 Oct 19:47-22:16) | 8184f73 | Laya installed and ran: a recorded abstention at 0.54 (the code returns 0.0 when the model is absent) |
| harness-test-2, five requests (18 Oct 00:50-01:38) | a8d6b51 (installed) | Without tasks 255-257: they were committed after the install |

No component records its own build; services' builds are inferred. All `activity/*.md` were rewritten at the 00:49
restart, so their earlier content cannot be checked.

## P0: the trust in "verified" and in "chosen by you" can be faked

1. **A trivial edit plus any earlier failing run still gets a code task verified** (reproduced). Task 255 (862ca1b)
   only refuses a task where nothing outside tests changed. One whitespace or comment edit passes; then "Red" is any
   failed run ever recorded in the project (`gate/paperwork.py:519` `failed_run` shortcut; `gate/protocol.py:249-251`;
   runs are never cleared because only Pi's own `git commit` clears them, and G-013 forbids Pi to commit), and "Green" is
   any passing test-prefixed command, even `python3 -m unittest --help` (task 228's counts are never consulted). Repros:
   stale Red from an earlier request; a fully in-request Red/`--help` Green; a weakened test (`assertTrue(True)`). With
   no earlier failed run, the harness's own Red proof correctly refuses. Run on its own accepts such check-ins, so a
   roadmap can be walked with no implementation. **The live logs show three such false completions in harness-test-2**
   (22fa29e, 1f75286, b348b9e), with Red/Green ticked for a test file that does not exist.
2. **Any local process can change the phase, approve a plan, turn on Run on its own or accept a task, and the log says
   "person"** (reproduced). The web API's `trusted()` checks only Host and Origin (`harness/web_chat.py:670-676`); Gate's
   `/plan/approve`, `/phase/accept`, `/decision` trust the caller's `state` and never check that auto is on
   (`agent_api.py:51-93`); and every command Pi runs inherits `PI_HARNESS_TOKEN` (`web_chat.py:529`, Pi passes the whole
   environment to its shell). In Implementation a test the model wrote can approve its own plan.
3. **A renamed or moved project keeps Pi's old session folder** (reproduced with the real Pi 1.1.0 binary). Pi takes its
   working folder from the session header, not the process cwd: every later request fails ("Stored session working
   directory does not exist", seven times in the live logs), and if a folder appears at the old path, Pi silently works
   there (`harness/web_chat.py:528-531`; `harness/documents.py:342-367`). The Preview also kept serving the old folder
   (88 consecutive 404s in the live preview log).

## P1

4. **The model's text never reaches Pi when a system question interrupts** (logs). Three requests (8184f73, a8d6b51) show
   "Question submitted" and no user message; the next request sends only `Choice: … → …`, while the lost text still
   became task titles.
5. **The phase question re-triggers on its own answer** (logs; code unchanged at HEAD). `request_advice`
   (`gate/ledger.py`) matches "phase" in "Choice: Which phase…? → Planning" and asks again; asked four times after the
   person had pressed Planning.
6. **Questions and plain messages derail the approved plan** (reproduced). A plain question in Implementation attaches to
   the active task and ends it "not verified" with a check-in (`gate/paperwork.py:406`, `:509-513`); a question with a
   choice creates a task file and roadmap line (`:117`); a request naming a later planned task rewrites it to
   `Kind: docs`, marks it Done and invalidates the plan's digest (`:513-514`); a request outside the plan with no code
   becomes an auto docs task "verified" (live: b348b9e).
7. **Approved docs or chore tasks with no change at all complete "verified"** (reproduced; `gate/paperwork.py:508`,
   `:515-546`). The model picks the kind.
8. **Choice answers merge, are lost or contradict** (reproduced, also live: nine merged answers persisted into a task's
   Decisions and committed). `harness/work_queue.py:82-90` merges any chat message into the waiting one; two quick
   answers run as two requests; a plain message queued first leaves the choice pending forever (G-017 then blocks).
9. **A choice click destroys the composer's draft and sends its attachments** (reproduced; `js/chat.mjs:60`, `:83`; same
   path for Start Building and Continue).
10. **Code written before a choice pause is orphaned** (reproduced; `gate/paperwork.py:409-414`): on resume it counts as
    the person's edit, so the task ends "no implementation" and the files stay uncommitted.
11. **Check-in deadlocks** (reproduced). A slow `/request/end` (the harness's own Red proof runs the suite twice inside a
    5-second call, `harness/extension.mjs:106`) loses the check-in card and leaves `check_in: true` with no control to
    recover; leaving Implementation during a check-in strands the plan (`paperwork.py:209`, `:250`, `:261`). Live: the
    false completion left harness-test-2 refusing every write until the person switched to Discussion.
12. **The Red proof reverts the live tree**: a new request starting meanwhile can lose writes; a Gate crash mid-proof
    loses the request's code held only in memory (suspected).
13. **Secrets and build output go into Pi's context** (reproduced). `.env` values, `secrets/id_rsa`, `COPYING`,
    `target/`, `venv/`, caches were included as "relevant contents" (`harness/context.py:72-76`, `:105-110`;
    `harness/documents.py:437` ignores `.gitignore`). Exclusions are silent.
14. **Every refused shell command crashes Gate** with an active request (reproduced): `gate/ledger.py:210` passes a
    `PosixPath` into `judgements.decide`, which `json.dumps` it; the refusal becomes "G-011 Gate could not check this
    call" and is never logged. `tests/test_laya.py:169` mocks `decide` and asserts the Path, so the test enshrines it.
15. **The repo's Node tests write into the person's live data folder** (logs): two tests in
    `tests/harness/extension.test.mjs` leave `PI_AGENT_DATA` unset; 723 of 788 `reports.jsonl` rows and 18 of 64
    `decisions.jsonl` rows are test output, distorting the decision share.
16. **Creating a project with a renamed project's old name opens the old project's chat** (reproduced;
    `harness/documents.py:415`, `:325-330`, `:296`).
17. **Music can never write in Discussion or Planning, even in a plain folder** (reproduced; `gate/phases.py:96-117`):
    create, revise and render need an approved task whose Files cover `assets/music/<name>/`, and the guide does not say
    so. Needs the person's decision.
18. **Stale pending questions block approved work** (logs): approval does not settle an older pending question; a
    test-harness question has been pending since 17 Oct 14:45.

## P2

- The model can write "(chosen …)" decisions itself (plan content or a Planning write); G-017 and the cards accept them
  (`gate/paperwork.py:320`, `gate/rules.py:154-158`).
- Approval surfaces never show the Files scope or Kind granted; Files accepts `.git/hooks/pre-commit` and the harness
  commits with hooks enabled (`gate/paperwork.py:592`).
- The decision log logs every Gate preflight and audit as a "code" decision and Laya abstentions as Laya decisions, so the
  model's share trends to 0% whatever happens (`gate/ledger.py:120`, `harness/judgements.py:34`).
- Without Laya (the default), keyword heuristics raise blocking phase cards for questions like "Explain the planning
  module", and "will be" anywhere in Pi's text or thinking blocks writes (G-016).
- `propose_plan` erases roadmap lines when ROADMAP.md has no heading after `## Goal` (`gate/paperwork.py:325-327`).
- Test runners still allowed that delete or upload: `pytest --basetemp=<any>`, `--pastebin`, `-p`, `npm test --prefix=..`,
  `make test SHELL=…`, `node --test --experimental-loader`; and any test run executes model-written code with the
  person's permissions (by design, but unscoped).
- End-of-request checks ignore the Files scope: out-of-scope changes are committed under the task.
- Accept and Continue on an unverified check-in skips the task the card names (`gate/paperwork.py:251-253` vs `:466`).
- 862ca1b's implementation check counts `*.test.ts`, `*_test.go`, `__tests__/` and generated files as implementation.
- A crash mid-answer keeps the partial text only in Activity; the chat shows nothing, and no `/request/end` reaches Gate.
- Two `ask_choices` in one batch: only the last survives; abort texts 256 does not match leave an orphaned pending choice.
- Auto-update swaps the package under a running workbench, which then serves new HTML/JS with an old backend
  (`harness/install.py:42-43`).
- `/update now` promises an install that does not happen when `auto_update` is false; the Update window hides the real
  reason for "unknown" (`js/updates-window.mjs:10`).
- `tests/isolation.py` does not pop `PI_WEB_PORT`, `PI_GATE_PORT`, `PI_CODING_AGENT_DIR` (a run from a workbench request
  fails `test_plh`).
- The music render tests skip everywhere (no `node_modules`); several test files define tests after `unittest.main()`, so
  a direct run (which Gate counts) silently skips them.
- Rename is allowed while terminal Pi works; "Stopped" means both "the person stopped it" and "a system question ended
  it"; decision and Gate logs lack request ids in places; G-015 says "Not written" for reads.

## P3

`*`-bullet boxes bypass G-010; the model's final "?" decides whether wake-ups run; Laya's cold start versus the 5-second
Gate timeout; ⇧⌘3 is macOS's screenshot shortcut; `runs.json` grows forever; `plh setup browser` takes its hash from the
download's own header; browser suites write screenshots to fixed shared paths (a flake source); the Red proof runs from
the project root, unaudited.

## Earlier findings now fixed (confirmed)

Phase enforcement from outside a project (absolute paths from `~`); registered folders without plan files get phases;
the phase menu no longer approves a pending plan; the `harness` tool's changes are writes under Gate; shell globs and
`-delete`/`--pre` are refused; downloading runners (npx without `--no-install`, go, cargo, `uv run` without `--offline`)
are refused; shortcuts use `event.code`; terminal phase commands work outside a project (a picker). Task 256 (pauses keep
the answer and the card) and 257 (returning to a live chat) hold. The merge of the person's music feature kept both sides.
The installed package serves every page module (38 URLs, all 200). Laya's lock, offline install and fail-closed routing
to the person hold. Recovery (227) keeps the request id and ends once.

## Suggested order of repair

1. P0-1 (verification), with the Gate-level repros as tests; and the check-in deadlocks (11) it causes.
2. P0-2 (person-only controls): scrub `PI_HARNESS_*` from Pi's commands, a per-session secret for the page, server-side
   check that auto is on for any `state=auto`.
3. P0-3 and 16 (rename, ids).
4. 15 and the isolation gaps (tests must never touch the live data folder), 14 (Gate crash), 13 (secrets in context).
5. 4-10 (questions, answers, drafts, scope).
6. 17 (music) after the person decides; then the P2 list.
