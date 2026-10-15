# Handoff: how to take over the Pi Workbench roadmap (tasks 227-242)

Paste the prompt below to the agent taking over (GPT-Sol). It is written for an agent that is careful but should not
improvise: every rule it needs is in the prompt or in a file the prompt names.

---

## The prompt

You are taking over development of **Pi Workbench** (the repository `pi-local-harness`): a local AI coding workbench.
A local model (via Ollama) runs the coding agent Pi; **Gate** checks every command Pi runs; a web workbench and
terminal Pi share one harness. The harness exists to make a weak local model succeed: when the model makes a mistake,
the harness catches it, explains it, or makes it impossible. "The harness matters more than the model" is the product's
philosophy. Keep that in mind for every decision.

### Where to work

- The worktree `/Users/kakkoidev/Code/pi-local-harness-next`, branch `harness-next`. Work only there.
- `/Users/kakkoidev/Code/pi-local-harness` (branch `main`) is the person's own checkout: their running `plh` installs
  from it. Do not edit it. When the person asks to ship, fast-forward it: `git -C /Users/kakkoidev/Code/pi-local-harness
  merge --ff-only harness-next`, then `python3 harness/install.py` from it.

### Read first, in this order

1. `docs/README.md`, then `docs/contributing-for-agents.md` (where things live, the commands, the rules).
2. `ROADMAP.md`, the last 20 lines: tasks 227 to 242 are yours.
3. `docs/plans/236-plan-mode.md`: the specification of plan mode (tasks 236 to 240).
4. `docs/plans/179-gate-rules.md`: how a Gate rule is written (id, message, lesson, test).
5. Each task file before you start it.

### The order of work

Do them in this order. Each later task depends on the earlier ones:

1. **227** (a bug: the harness commits too early after a loop recovery). It blocks 237.
2. **228** (test-run log), **232** (short titles), **234** (context selection): independent and small.
3. **230** (referenced-files test), then **229** (starter skeleton vs sample), then **233** (plan filled).
4. **231** (the publish audit).
5. **236**, then **237**, then **238** (plan mode: choices, plan and check-ins, auto-accept), then **240** (terminal).
6. **235** (the pong bench scenario): after 236 to 238, because it runs with auto-accept.
7. **241**: confirm with the person first (the task says why).
8. **239** (web cards): only after the designer's round 10 is re-synced into `design/`. **242** is the brief, already
   written; its second box is ticked by whoever re-syncs.

### How to do one task (every task, no exceptions)

1. Read the task file. If anything is unclear or two files disagree, **stop and ask the person**. Do not guess. (The
   whole roadmap is about models that guess.)
2. **Red:** write the test first and run it; see it fail for the right reason. Tick the task's Red box only after the
   failing run.
3. Implement the smallest change that makes it pass. Match the surrounding code: its naming, its comment density, its
   one-line style where the file uses it. Comments say why, in plain words.
4. **Green:** run the test, then the suite for the area:
   - Python: `python3 -m unittest discover -s tests` (or the named test modules).
   - Terminal/extension: `node --test tests/harness/*.test.mjs`.
   - Browser (web UI changes): `python3 tests/browser/run.py all`. It needs Playwright; it tells you how to set it up
     if missing. To use the Chromium already on this Mac: `PI_TEST_CHROME=$HOME/Library/Caches/ms-playwright/chromium-1194/chrome-mac/Chromium.app/Contents/MacOS/Chromium`.
5. Tick the boxes you finished, in the task file. Add a short "Result" note under the boxes when something differs from
   the plan (what, why). If a box cannot be done, leave it open and write why.
6. When every box is ticked, change the task's line in `ROADMAP.md` from `- [ ]` to `- [x]`.
7. Commit, with the workflow check chained so a failure stops the commit:
   ```
   set -o pipefail; python3 tests/verify_workflow.py 2>&1 | tail -1 && git add <the files> && git commit -m "<message>"
   ```
   Message: `feat:`, `fix:`, `docs:` or `chore:`, then what changed for the person in plain words, then `(task NNN)`.
   Add only the files you changed (never `git add -A` in the person's projects). End the message with the attribution
   line your environment requires, if any.
8. Do not push. The person pushes, or asks you to.

### Rules that are never broken

- **Never touch the person's own projects or data** (`~/Code/*` other than the two checkouts above,
  `~/pi-local-harness-data`). Tests and manual checks use scratch folders (`mktemp -d`) and the fake Pi
  (`tests/fixtures/fake-pi.py`), with `PI_TAILSCALE=false`, `PI_OLLAMA_URL=http://127.0.0.1:9`, `PI_TRASH_DIR`,
  `PI_AGENT_DATA` and `PI_WEB_DATA` set to scratch paths. Copy the setup of `tests/browser/design.cjs` lines 10-30.
- **Stop processes only by their exact PID** that you started. Never `pkill` or `killall` by name: the person's `plh` and
  the bench run the same `harness/services.py`.
- **Nothing is deleted for good:** files go to the Trash (`PI_TRASH_DIR` in tests).
- **Pi only proposes; a person's yes runs it.** Auto-accept (task 238) never covers publishing, git push, downloads,
  sending a message or an issue, Move to Trash, or removing a project.
- **UI changes go through the designer.** You build from `design/` (boards in `design/canvas/`, rules in
  `design/IMPLEMENTATION.md`, cards in `design/system/components/`). If the design you need is not drawn, write what
  is missing in the task file and ask the person; do not invent markup.
- **Every new visible string** gets its Japanese in `messages/ja.json` (English text is the key; patterns use
  `{name}`). Numbers-only parts use the names in `js/i18n.mjs` (`n`, `count`, …).
- **The repository is public.** No secrets, no personal data, no artifact runtime code.
- **Downloads** (models, packages, tools) need the person's yes first: say the name, the source and the size.
- **The installer:** if you add a folder the harness reads at runtime, add it to `harness/install.py`'s copy list and
  to `tests/test_auto_update.py`'s `test_the_installed_copy_can_start_its_services` (task 226 is why).

### When you finish a session

Write in the chat: the tasks done (with their commit ids), the boxes still open and why, anything you were unsure
about, and the commands the person can run to check your work.

---

## Notes for the person

- The tasks are written so each can be done and checked alone; 227 is the urgent one (it lost a verified commit in the
  pong project).
- Plan mode's open questions (docs/plans/236-plan-mode.md) should be answered before task 236 starts.
- The designer's round 9 (https://claude.ai/artifact/VdvrKzbQ8jBBYbVbuXFL7S) and round 10 briefs are both waiting.
