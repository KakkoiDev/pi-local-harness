# Plan 236: Plan mode, always on: Pi discusses before it builds

Date: 2026-10-16. Status: planned; tasks 236-240. The designer draws the cards first (design/briefs/round-10.md).

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
   with the `ask_choices` tool; the person picks one or types their own. One card at a time; several related
   questions may come as one card with several groups (decided by the designer).
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
  (ask_choices or the plan card)." Small requests are not exempt by size; a one-line fix still gets a one-task plan,
  which auto-accept or one tap approves (the person: "every request"? see Open questions).
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

- A toggle the person sets (web: next to the composer and in π; terminal: `/auto on|off`). Per project, remembered,
  always visible while on (the status shows "Auto").
- While on: every choice takes the recommended option (recorded `auto`), every plan is approved (`Plan approved:
  auto`), every check-in continues to the next task, and the autopilot keeps going through the roadmap's open tasks.
- Never auto-accepted, even with Auto on: anything that leaves the machine or cannot be undone. Publishing, git push,
  downloads, sending an issue or a message, Move to Trash, removing a project. These wait in a "Needs you" list.
- When the person comes back: a "While you were away" summary (tasks done, verified or not, decisions taken
  automatically, what waits for them). Every auto decision is listed so it can be changed.
- The bench runs with Auto on, so its runs stay comparable; the bench also scores the plan (tasks written, Done when
  lines, decisions asked).

## Where it lives

- The protocol (tool, decisions, plan approval, check-ins): harness/extension.mjs (the `ask_choices` tool, like
  `task_box`), gate/rules.py (the new rules), gate/paperwork.py (Plan approved, Decisions, check-ins), harness/AGENTS.md
  (how Pi plans), harness/guides/ (the planning checklist per kind of request).
- The web: a choices card and a plan card in the chat (js/), drawn by the designer first.
- The terminal: `ctx.ui.select` with the options plus "Something else…" (then `ctx.ui.input`); the plan as text with
  Approve / Change.

## Open questions (for the person)

1. Plan mode for every request, or skip it for small fixes ("rename X", "fix this typo")?
2. Auto-accept: per project or for the whole workbench? Stays on after a restart? A time or task limit ("stop after
   3 hours or 10 tasks")?
3. One question per card, or several related questions on one card?
4. The words that count as "unsure": start with the list above, and tune it on the bench?
