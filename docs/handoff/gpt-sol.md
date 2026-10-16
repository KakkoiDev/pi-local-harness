# Handoff: how to take over the Pi Workbench roadmap (tasks 227-242)

Paste the prompt below to the agent taking over (GPT-Sol). It is written for an agent that is careful but should not
improvise: every rule it needs is in the prompt or in a file the prompt names.

---

## Status on 2026-10-17 (read this first when you resume)

### First: merge the person's music feature

The person added a feature directly on `main` in their own checkout and pushed it: commit `fa98338` "feat: add
chat-driven Blips and Strudel music creation" (harness/music.mjs, harness/music/, harness/music_artifacts.py, setup,
settings, tool choice, web_chat, tests). `harness-next` has 24 commits `main` does not have (your tasks 227-246). The two
must be merged before anything else, and before any push.

1. In the worktree (`/Users/kakkoidev/Code/pi-local-harness-next`, branch `harness-next`), with a clean `git status`:
   `git fetch origin && git merge origin/main`.
2. Six files conflict: `.gitignore`, `harness/extension.mjs`, `harness/tool-choice.mjs`, `harness/web_chat.py`,
   `tests/fixtures/fake-pi.py`, `tests/harness/tool-choice.test.mjs` (and possibly `tests/test_web_chat.py`). **Keep
   both sides** in every conflict: the music tools and routes from `main`, your plan mode, phases, test log, recovery
   and wake-up changes from `harness-next`. Read both versions of each hunk (`git show origin/main:<file>`,
   `git show HEAD:<file>`); do not pick one side wholesale.
3. Also check the files that merged without a conflict but both sides touched: `harness/install.py` (keep every folder
   in the copy list, including `harness/music/` if it needs to be installed, and the test in
   `tests/test_auto_update.py`), `harness/settings.py`, `harness/setup.py`, `README.md`.
4. Run everything: `python3 tests/verify_workflow.py`, `node --test tests/harness/*.test.mjs`,
   `python3 tests/browser/run.py all`. Fix until green.
5. Commit the merge ("merge: the person's music feature into harness-next"), then tell the person. Push only when they
   say so; then `git push origin HEAD:main` (a fast-forward of `main` now) and fast-forward their checkout:
   `git -C /Users/kakkoidev/Code/pi-local-harness merge --ff-only harness-next`.

### Done since the first handoff (by you)

227, 228, 229, 230, 231, 232, 233, 235, 237, 238, 239, 240, 242, 246 (Tailscale sharing recovery). Partly done:
241 (small-model wake-ups), 243 (round 9), 244 (bench tables). Still open: 234, 236 (its box list), 241, 243, 244,
245 (waits for the person).

### Added on 2026-10-17 (by Claude, with the person)

- `CONSTITUTION.md` at the root: how the project uses AI. **Read it before any other task.** System 1 (code and the Laya
  classifier) decides; System 2 (the model) only produces. The decision ladder: code, then Laya, then the person, never
  the model. Three phases for every request.
- **250** Laya as System 1's classifier (laya-mlx). Your own task 246 (Tailscale) kept its number; the Laya task is 250.
- **247** Three phases for every request: takes over the old tasks 55-57 and changes the gating of 236-237 (the phase is
  the permission). You already built 236-240: adapt them in 247; do not undo them.
- **248** Rename the design system to "Pi Workbench 1-bit". **The project stays "Pi Workbench".**
- **249** The decision log and the bench's "model's share of decisions".

### Order from here

1. The merge above.
2. Finish 234, 236, 241, 243 (each task file says what is left).
3. 247, then 250, then 249, then 248.
4. 244 (the bench on e4b, 27b and ChatGPT Luna) last, so it measures the finished harness; 245 when the person says.

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

0. `CONSTITUTION.md`: how the project uses AI (System 1 decides, System 2 produces). It wins over every other file.
1. `docs/README.md`, then `docs/contributing-for-agents.md` (where things live, the commands, the rules).
2. `ROADMAP.md`, the last 20 lines: tasks 227 to 249 are yours (242 is done; 245 waits for the person).
3. `docs/plans/236-plan-mode.md`: the specification of plan mode (tasks 236 to 240).
4. `docs/plans/179-gate-rules.md`: how a Gate rule is written (id, message, lesson, test).
5. Each task file before you start it.

### Reading the design (you have no access to the design tools: everything is in the repo)

The designer works in two online documents you cannot open. Their full content is copied into `design/` and is the
only source you need. Never ask for a link; never try to fetch one.

- **What to build, in words:** `design/IMPLEMENTATION.md`. Each round has a section headed `## <date> · Round N: …`.
  Round 9 starts at the heading `## 2026-10-16 · Round 9: updates, other devices, Terminal app, Language`; round 10 at
  `## 2026-10-16 · Round 10: Pi discusses before it builds (plan 236)`, followed by `### Round 10, version 2 (the
  person's decisions)`. Find them with `grep -n "^## \|^### " design/IMPLEMENTATION.md`.
- **How it looks: the boards**, one HTML file per screen or state in `design/canvas/<Board>.dc.html`. You cannot
  render them (the viewer `design/view.py` needs a runtime file that is not in the repo), so **read them as text**:
  - Skip the `<helmet>` block (fonts) and the `<script type="text/x-dc">` block at the end (the canvas's own code).
  - The markup between them is the screen: element order, visible texts (copy them exactly, including punctuation such
    as “…”, ·, ›), `class="pw-…"` names, `aria-*` attributes, and inline `style` sizes.
  - The `pw-*` classes are defined in `design/components.css` (the same CSS the app serves). Use those classes; do not
    copy inline styles that only position the board on the canvas.
  - Board names and their titles: `design/canvas/canvas.json`, key `boards`: each board's `title` and `page` (`r9` is
    "Updates & devices", `r10` is "Plan mode"). Each page's first board (`R9_Answers`, `R10_Answers`) answers the round's
    questions in words: read it first.
- **Components:** `design/system/components/<Name>/README.md` (rules: markup, states, copy) and `preview.html` (an
  example). New in round 10: `ChoiceCard`, `PlanCard`, `CheckInCard`, `AwayCard`. Changed in round 9/10: `Dialog`
  (Settings, Check for Updates…), `MenuBar` (π and Agent menus), `PhoneBar`.
- **When two sources disagree, use this order:** (1) the person's decisions in `docs/plans/236-plan-mode.md`
  ("Decided"); (2) the `### Round 10, version 2` section of IMPLEMENTATION.md; (3) the round's own section of
  IMPLEMENTATION.md; (4) the component README; (5) the board. A later-dated text wins over an earlier one. Example:
  a board titled "first time" for the risk alert is overridden by version 2: the alert shows every time.
- **If something you need is not drawn or not written**, do not invent it. Add a `## Needs design` section to the task
  file saying exactly what is missing (the screen, the state, the text), leave that box open, tell the person, and move
  on to the next box or task.

### The order of work

Do them in this order. Each later task depends on the earlier ones:

1. **227** (a bug: the harness commits too early after a loop recovery). It blocks 237.
2. **228** (test-run log), **232** (short titles), **234** (context selection): independent and small.
3. **230** (referenced-files test), then **229** (starter skeleton vs sample), then **233** (plan filled).
4. **231** (the publish audit).
5. **236**, then **237**, then **238** (plan mode: choices, plan and check-ins, auto-accept), then **240** (terminal).
6. **235** (the pong bench scenario): after 236 to 238, because it runs with auto-accept.
7. **241**: confirm with the person first (the task says why).
9. **244** (the benchmark of the updated harness on Gemma 4 e4b, Qwen 3.8 27B and ChatGPT Luna, records in the repo,
   the README table): last, after 227, 228, 235-238 and 241. The person sets the OpenAI key themselves.
10. **245** (DeepSeek Flash): only when the person says it is set up.
11. **250** (Laya, the classifier), **247** (three phases: it takes over 55-57 and changes 236-237's gating), **248**
    (rename the design system only; the project stays "Pi Workbench"), **249** (the decision log). Added 2026-10-17 with CONSTITUTION.md; read it first. Do
    247 before finishing 236-237 if you have not started them; if you have, finish them and let 247 adapt them.
8. **239** (plan mode's web cards) and **243** (round 9: updates, other devices, the Terminal app kind, Settings): the
   designer's answers are re-synced into `design/` (2026-10-16); build from the boards. **242** is done.

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
   Add only the files you changed (never `git add -A` in the person's projects). End every commit message with your
   own attribution line, e.g. `Co-Authored-By: GPT-Sol <…>` (the person wants every commit traceable to the agent
   that made it).
8. Do not push. The person pushes, or asks you to.

### Rules that are never broken

- **Never touch the person's own projects or data** (`~/Code/*` other than the two checkouts above,
  `~/pi-local-harness-data`). Tests and manual checks use scratch folders (`mktemp -d`) and the fake Pi
  (`tests/fixtures/fake-pi.py`), with `PI_TAILSCALE=false`, `PI_OLLAMA_URL=http://127.0.0.1:9`, `PI_TRASH_DIR`,
  `PI_AGENT_DATA` and `PI_WEB_DATA` set to scratch paths. Copy the setup of `tests/browser/design.cjs` lines 10-30.
- **Stop processes only by their exact PID** that you started. Never `pkill` or `killall` by name: the person's `plh` and
  the bench run the same `harness/services.py`.
- **Nothing is deleted for good:** files go to the Trash (`PI_TRASH_DIR` in tests).
- **Pi only proposes; a person's yes runs it**, except with Auto-accept on (task 238): then everything runs, after the
  person saw the risks, and a report lists what happened.
- **UI changes go through the designer.** Build only from `design/` (see "Reading the design" above). If the design
  you need is not there, write it under `## Needs design` in the task file and tell the person; do not invent markup.
- **Every new visible string** gets its Japanese in `messages/ja.json` (English text is the key; patterns use
  `{name}`). Numbers-only parts use the names in `js/i18n.mjs` (`n`, `count`, …).
- **The repository is public.** No secrets, no personal data, and never `design/canvas/support.js` or any other
  design-tool runtime file (it is git-ignored on purpose).
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
- Plan mode's questions were answered on 2026-10-16 (docs/plans/236-plan-mode.md, "Decided").
- The designer answered rounds 9 and 10; both are in `design/` (re-synced 2026-10-16, including the designer's two
  later fixes to IMPLEMENTATION.md round 10 points 4 and 6 and the MenuBar card).
