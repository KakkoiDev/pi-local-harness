# The Pi Workbench constitution

How Pi Workbench uses AI. This file comes before PRODUCT.md, DESIGN.md, AGENT.md and every plan: when they disagree,
this file wins. Only the person changes it. Adopted 2026-10-17.

Each article says what holds it today (**Enforced by**). "Not yet" marks the work left: those lines are the roadmap
for System 1.

## Two systems

Like the fast and slow systems of thinking (Kahneman), the workbench has two:

- **System 1** makes quick, precise judgements. It gates every action for safety and predictability, and it does all
  the paperwork. It is made of **code** (Gate's rules, the paperwork, the tests) and **Laya**, a classifier that
  answers typed questions with probabilities and abstains when unsure ([laya-mlx](https://github.com/mizorewww/laya-mlx),
  local, multilingual, about 10 ms a question). System 1 gives the same answer to the same question, and it can be
  tested.
- **System 2** is slow and powerful: the language model behind Pi, local or online. It understands natural language,
  writes code and text, calls tools, reads images. It also forgets protocol and makes mistakes.

The goal: **System 1 does as much as possible.** First with code, then with Laya. System 2 takes over only when
System 1 cannot do the work at all.

## Article 1. System 1 decides; System 2 produces

The language model is used for generation, never for judgement. It does not decide whether a step is done, whether a
command is safe, which phase the work is in, whether the person said yes, or what comes next. It produces answers,
code, the content of plans, readings of images, and tool calls; System 1 judges all of them.

**Enforced by:** Gate checks every tool call (G-001 to G-013); the harness keeps the paperwork (plan 184). Not yet: the
decisions System 2 still takes (Articles 4 and 6).

## Article 2. The decision ladder

Every decision climbs the same ladder and stops at the first rung that can answer:

1. **Code:** a rule, a test, a file on disk.
2. **Laya:** a typed question (choose an option, give a level, true or false) with a confidence threshold. Below the
   threshold Laya abstains.
3. **The person:** one question, on one card, with options.

System 2 is not on the ladder. When System 1 cannot decide with confidence, it asks the person, never the model.

**Enforced by:** code rungs: Gate's rules. Not yet: Laya (task 246); the person's card (ChoiceCard, task 236).

## Article 3. Always a recommendation

Every question put to the person comes with options, the recommended one first and "Something else…" last. One question
per card. With **Run on its own** on, the recommended option is taken, and the choice is recorded as automatic so the
person can change it later.

**Enforced by:** not yet (tasks 236, 238).

## Article 4. System 1 does the paperwork

System 1 creates the roadmap item, creates the task file and lays out its steps (the TDD layout: Red, Green, and the
boxes the task's kind requires), records the decisions, ticks a box when the evidence for it exists (a recorded test
run, a commit), commits verified work, and writes the reports. System 2 only fills in the content: what the test
checks, what the code does, what the person is told.

**Enforced by:** the harness creates the request's task, its progress and the commit (plan 184, gate/paperwork.py);
G-010 (Red and Green are ticked after the runs); G-012 (unverified changes are marked); G-013 (the harness commits). Not
yet: Pi still ticks some boxes itself (the `task_box` tool) and writes plan layouts (tasks 233, 237).

## Article 5. When System 2 takes over

Only for what System 1 cannot do:

- understand open natural language beyond Laya's typed questions;
- write code, text, plans' content;
- deal with an open-ended set, such as an unknown shell command with many loopholes, and only after Laya was tried and
  abstained;
- read an image (OCR), listen to audio (speech to text is its own model);
- search the web during Discussion.

Even then, what System 2 produces goes back through System 1 (Article 7).

## Article 6. System 2 never does what System 1 does

The model never lays out a task plan, ticks a box, picks the next step, decides the phase, judges its own work as done
or verified, or answers a question that code or Laya already answers.

**Enforced by:** G-010 for Red and Green boxes. Not yet: the rest (tasks 233, 237, 246, 247).

## Article 7. Every action passes through System 1

Every tool call System 2 makes is checked by Gate before it runs and audited after. A check that fails blocks only that
call (G-011).

**Enforced by:** G-001 to G-013, the audit log.

## Article 8. Three phases, for every request

Every piece of work goes through **Discussion**, then **Planning**, then **Implementation**. Small fixes too: a small fix
can break a feature, and the same steps every time is the real convenience.

| Phase | System 2 may | System 1 refuses |
|---|---|---|
| Discussion | read, talk, propose other perspectives, search the web | any write |
| Planning | write ROADMAP.md and tasks/, ask questions (with a recommendation) | any change to code |
| Implementation | change code within the approved tasks | changes outside the task in progress |

- **One phase per project.** Only the person changes it, with the phase button in the chat (or `/discuss`, `/plan`,
  `/build` in the terminal); Run on its own moves Planning to Implementation and continues between tasks.
- **Discussion always comes first.** When the plan is done, the person is offered to go back to Discussion to plan
  another task, or to start Implementation. When planned tasks are waiting, the person may go straight to
  Implementation.
- **Implementation ends with the person's validation:** after each task, a check-in (done, how it was verified, what
  is next) waits for the person (or Run on its own) before the next task.

**Enforced by:** not yet (task 247, which takes over tasks 55-57 and 236-237).

## Article 9. Evidence, not words

A box is ticked, a task verified and a step done from recorded evidence, never from the model's own claim. Every test
run is logged: what ran, on what, with what result.

**Enforced by:** G-010, G-012; Gate's record of test runs. Not yet: the full test-run log (task 228).

## Article 10. Run on its own

The person may let the work run unattended ("Run on its own", one setting for all projects). Everything then happens
without asking, after the person saw the risks, every time it is turned on. A report at the end of the run lists the
tasks done (verified or not), every automatic decision, everything that left the machine or used the Trash, and the
problems met.

**Enforced by:** not yet (task 238).

## Article 11. Measured

Every decision is logged with who took it: code, Laya, the person, or the model. The bench reports the share of
judgements the model still makes. The target is zero.

**Enforced by:** not yet (task 249).

## Article 12. Safe by default

Nothing is deleted for good: files go to the Trash. The model and the data stay on the machine unless the person
chooses an online model or a search. Secrets never go into the repository, a chat or a log.

**Enforced by:** G-003 (no catastrophic shell commands); the Trash (`PI_TRASH_DIR`); the tests' isolation.

## Changing this constitution

Only the person changes it. A change names the articles it touches, and the plans and tasks that must follow.
