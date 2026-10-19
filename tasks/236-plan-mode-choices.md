# 236: Plan mode: decisions become choices (ask_choices), and Gate catches guesses

Kind: code
No scenarios: the open box is the bench's verification run with auto-accept; the ask_choices tool, terminal answer path and Gate catches it checks are built and the web card is task 239.

Read docs/plans/236-plan-mode.md first: it is the specification. This task builds the protocol, not the web cards.

## Where
- harness/extension.mjs: a new tool `ask_choices`, registered like `task_box` (grep `task_box`): input
  `{question, options: [{label, detail?}], recommended: 0, allow_other: true}`; the first option is the recommended one
  (the tool rejects a call whose recommended option is not first). "Something else…" is always added by the harness,
  never by Pi.
- The answer path: in the terminal, `ctx.ui.select(question, [labels…, 'Something else…'])`, then `ctx.ui.input` for
  something else. In the web, the tool's call ends the turn with a pending choice the web shows as a card (task 239);
  the person's pick comes back as the next user message, formatted: `Choice: <question> → <answer>`.
- gate/paperwork.py: the task's `## Decisions` section; each answered choice is appended as a line with its state
  (`chosen`, `auto`, `given`) and time.
- gate/rules.py: the three catches in the plan (no approved plan; assumption words; undecided values), each a rule
  with an id, message, lesson and test.

## Steps
- [x] One question per card (decided 2026-10-16): the tool takes one question.
- [x] Red: extension test: `ask_choices` with two options returns the picked label; with "Something else…" returns
  the typed text; with auto-accept on (task 238) returns option 0 without asking.
- [x] Red: paperwork test: an answered choice becomes a Decisions line with the right state.
- [x] Red: Gate tests for the assumption words (English and Japanese) in Pi's text since the last user message: a
  write/edit is REVISEd with the quoted sentence; a write to ROADMAP.md or tasks/ is not.
- [x] Implement; harness/AGENTS.md explains when to ask (any decision not in the request, the code or the
  conventions) and how (one question, 2-4 options, recommended first, short labels, one-line details).
- [x] Japanese: the tool's fixed words and the card's words in messages/ja.json; Pi writes options in the person's
  language.
- [ ] Green; the bench runs with auto-accept and still passes its scenarios.

## Done when
A small model that guesses a value is stopped by Gate with its own sentence quoted and asked to offer choices; the
person picks or types; the pick is recorded in the task.

## Result

The tool and terminal answer path, durable web pending-choice protocol, timed Decisions records, and assumption/undecided-decision catches are implemented. A web pause preserves the original task across workers; the formatted answer is recorded on the next request. Cancellation never records approval. English and Japanese assumption phrases are checked in visible text and reasoning since the last user answer; plan edits remain available.

G-015’s deterministic approval check is registered and tested; task 237 connects it to the approved-plan lifecycle. The shared auto-accept setting and bench verification remain in task 238; the choice tool’s auto path is covered with an injected setting. Web card rendering follows in task 239. The Green/bench box stays open until those integrations are checked.
