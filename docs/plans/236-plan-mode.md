# Plan 236: Plan mode, always on: Pi discusses before it builds

Date: 2026-10-16. Status: planned; tasks 236-240. Designed: canvas page `r10` (design/canvas/R10_*, Ph10_*,
T_PlanMode), the cards ChoiceCard, PlanCard, CheckInCard, AwayCard (design/system/components/), IMPLEMENTATION.md round 10.

## What the person asked for

> "I'm thinking that we should move to a permanent 'plan mode' where when the model is unsure, the gate will catch it.
> And the gate will make the model think about options, could be one or more, to ask the user if this is the right
> direction. There will always be a 'Something else...' field in the radio choices." (2026-10-16)

> "I want this to make the conversation more conversational and guided, so the model doesn't just jump to
> implementing, but takes the time to discuss specs and give time to the user to refine his plans and vision for the
> project." "There will always be a recommended option that will come first." "A button to easily toggle
> 'Auto-accept' (for benching and also when user wants to let the model run for a long time without supervision).
> And the auto accept will also auto-accept the verification after a task is completed … it's basically saying YOLO,
> do the thing and I check later."

Earlier the same evening (the pong project): "even on low thinking, the agent should spend time asking itself about
all it needs to do in the app. ask questions back to the user. confirm what it's gonna do and wait for user approval
(with or without reviewing the roadmap/tasks)."

## Why it matters

The bench (tasks 197, 225) shows small models stop early, guess, and write thin plans. A model with low thinking
will not plan on its own; the harness has to make planning a step that cannot be skipped. The pong game (2026-10-15)
picked the ball speed, the colours and the scope by itself, wrote one task titled with the first 70 characters of the
request, and never filled the roadmap's Goal.

## The flow

1. **The person asks** for something (a new app, a feature, a fix).
2. **Pi plans.** Before any code, Pi writes (or updates) the plan: the Goal in ROADMAP.md and one task file per step.
   Each task has checkboxes, a `Done when:` line and a `## Decisions` section (below). The harness gives Pi a planning
   checklist for the kind of request (who uses it, screens and controls, rules and edge cases, data, what "done"
   means, how it is tested, the language of the UI).
3. **Pi asks.** Every decision Pi cannot take from the request, the code or the project's conventions becomes a
   **choice**: one question, two to four options, the recommended one first, always "Something else…" last. Pi asks
   with the `ask_choices` tool; the person picks one or types their own. One question per card.
4. **Pi proposes the plan.** It ends with a plan card: the Goal, the tasks with their `Done when`, the decisions
   taken. The person approves it (Approve Plan), changes it (edits the files in Work, or says what to change), or
   asks for something else.
5. **Pi builds, one task at a time.** Gate allows code changes only for an approved plan, and only for the task in
   progress (the task file names its files or folders when it can). New decisions found while building go back to
   step 3; Gate catches them (below).
6. **Check-in after each task.** When a task is verified (a test passed on its code, G-012), Pi stops with a check-in
   card: what was done, how it was verified, what is next. The person continues, reviews first, or changes the plan.
7. **Done.** The last task's check-in closes the roadmap item.

## How Gate catches "unsure"

The model cannot be trusted to say it is unsure, so the harness looks for it in three deterministic places:

- **No approved plan:** a write or edit to code (anything outside ROADMAP.md, tasks/, *.md docs) in a request whose
  task has no `Plan approved:` line is refused (REVISE): "Plan first: write the plan and ask the person to approve it
  (ask_choices or the plan card)." Only for requests that define the project: the first request in a project, and a
  request that adds a feature (a new task). **Small fixes skip plan mode** (the person, 2026-10-16: "plan mode should
  skip small fixes and focus on asking project defining questions"): a bug fix, a rename, a typo, a change inside the
  task in progress. The harness decides which (a short list of words and the request's task, with tests), and Pi may
  say "this is a small fix" in one line, which the person can overrule.
- **Assumption words in Pi's own text:** a write or edit is refused when, since the last answer from the person, Pi's
  visible text or reasoning holds an assumption the person never answered: "I'll assume", "I assume", "let's say",
  "probably", "I guess", "for now I'll", "default to", "arbitrarily", "not specified", "unclear", "I'm not sure",
  and their Japanese equivalents (仮に, とりあえず, たぶん, 不明). The refusal quotes the sentence and asks Pi to turn it into a
  choice. The list lives in one place (gate/rules.py, with tests); false positives are expected and cheap (one card).
- **Undecided values in the plan:** a task's `## Decisions` lines must each be `chosen` (the person picked), `auto`
  (auto-accept picked the recommended option) or `given` (in the request or the code). A line marked `assumed` or
  without a state blocks code changes for that task.

Each catch is a Gate rule with an id, a message, a lesson and a test, like G-001 to G-013 (plan 179).

## The Decisions section (in every task file)

```markdown
## Decisions
- Ball speed: medium, the ball crosses the screen in about 2 s (chosen 2026-10-16 22:10)
- Colours: white paddles and ball on black (given: the request)
- Winning score: 11 points (auto: recommended)
```

## Auto-accept ("YOLO, do the thing and I check later")

- Named **"Run on its own"** (the designer, round 10). A setting in Settings, **once for all projects** (the person:
  "like it the user won't forget to set/unset it for 1 project in particular"), remembered after a restart, **no time
  or task limit**. The same setting from a checkbox beside Send and the Agent menu (⌥⌘A); not in π. `/auto on|off` in
  the terminal, "Auto" in its footer. While on, the status reads "Working · on its own".
- While on: every choice takes the recommended option (recorded `auto`), every plan is approved (`Plan approved:
  auto`), every check-in continues to the next task, and the autopilot keeps going through the roadmap's open tasks.
- **Everything is automatic** (the person: "everything should be automated and a report made at the end of the run
  saying what was done. we go YOLO and inform the user about the risks first"): publishing, git push, downloads,
  sending an issue or a message, Move to Trash, removing a project included. Files still go to the Trash, never deleted
  for good.
- **The risks, first:** a caution alert every time it is turned on, from any place (Settings, the checkbox, the menu,
  `/auto on`): what Pi will do without asking (publishing, git push, downloads, sending, the Trash in bold), and that
  what leaves the Mac cannot be undone. Buttons Turn On / Cancel, **Cancel the default**.
- **The report at the end of the run** (the AwayCard): four sections with counts: tasks done (each verified or not);
  every decision Pi made on its own (each with Change…); everything that left the Mac or used the Trash; problems met
  (tests that failed and were fixed, commands Gate blocked). It ends every run and shows again on return if unseen.
  The terminal prints a one-line summary at the end and `/report` shows the full report.
- The bench runs with Auto on, so its runs stay comparable; the bench also scores the plan (tasks written, Done when
  lines, decisions asked).

## Where it lives

- The protocol (tool, decisions, plan approval, check-ins): harness/extension.mjs (the `ask_choices` tool, like
  `task_box`), gate/rules.py (the new rules), gate/paperwork.py (Plan approved, Decisions, check-ins), harness/AGENTS.md
  (how Pi plans), harness/guides/ (the planning checklist per kind of request).
- The web: a choices card and a plan card in the chat (js/), drawn by the designer first.
- The terminal: `ctx.ui.select` with the options plus "Something else…" (then `ctx.ui.input`); the plan as text with
  Approve / Change.

## The designer's answers (round 10, 2026-10-16)

ChoiceCard: "Question 1 of 3", inline in the chat on the phone too; no "Let Pi choose" (the recommended option is
preselected, Answer takes it); typing in the composer while a question waits answers "Something else" (the composer's
label says so; Send reads Answer). PlanCard: Change… puts "What should change in the plan?" in the composer; a new
version replaces the old, which shrinks to one line; up to 7 tasks, else the first 5 and "and N more · Open the Plan";
decisions always in full. CheckInCard = the task's DoneRow (round 7) while it waits for Continue / Review First / Stop
Here; Review First is the default when the task is not verified. Decisions in the task file: plain Markdown, lightly
rendered; "Plan approved" a quiet line under the title; each decision's state a small tag. Build from the boards on the
"Plan mode" page and IMPLEMENTATION.md's round 10 sections (the version 2 section overrides the first).

## Decided (the person, 2026-10-16)

1. Small fixes skip plan mode; plan mode asks the project-defining questions.
2. Auto-accept: one setting for all projects, in Settings, no limit, remembered.
3. One question per card.
4. With Auto on, everything is automatic; the risks are shown before it is turned on; a report at the end of the run.
5. The bench auto-accepts every recommendation.
6. The "unsure" word list starts as above and is tuned on the bench (a false catch costs one question card).
