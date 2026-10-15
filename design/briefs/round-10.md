# Brief: round 10, plan mode

Date: 2026-10-16. Round 10. Published for the designer: https://claude.ai/artifact/MTHnUBvtG22H875A3PtdaA. The specification is docs/plans/236-plan-mode.md; this brief is what needs drawing.

The person: "I want this to make the conversation more conversational and guided, so the model doesn't just jump to
implementing, but takes the time to discuss specs and give time to the user to refine his plans and vision for the
project." Pi now always plans before it builds: it asks about every decision it cannot take alone, proposes a plan,
waits for a yes, then builds one task at a time with a check-in after each. An Auto-accept toggle lets it run alone.

## 1. The choices card (new card: ChoiceCard)

Pi asks one question with 2-4 options as radio rows. Example (a 2D game): "What colour is the sky?"
- **Blue** (recommended) — always first, with a "Recommended" tag and selected by default.
- White
- **Something else…** — always last; selecting it opens a text field.
- Each option may have a one-line detail under its label.
- One action: **Answer** (Return answers). Should there be a "Skip (let Pi choose the recommended)"?
- States to draw: asking; answered (collapses to one line: "Sky colour: blue"); answered with something else (the typed
  text); auto-accepted ("Sky colour: blue · auto", with a way to change it later). One question per card (decided).
- Where: in the chat, as Pi's message; the composer stays usable (typing a message answers "something else"?).
- Phone: a sheet or inline? 44 px rows, radios 22 px in 44 px rows (round 8).

## 2. The plan card (new card: PlanCard)

At the end of planning Pi shows its plan: the Goal (one or two sentences), the tasks (title + "Done when"), the
decisions (chosen, given, auto). Actions: **Approve Plan** (default), **Change…** (what does it open: the composer with
a prompt, or the plan in Work?), **Open the Plan** (ROADMAP.md in Work; Ph_FirstChat already draws a button like it).
States: waiting, approved (by the person / auto), changed (a new version replaces it?).

## 3. The check-in card (new card: CheckInCard)

After each verified task: what was done, how it was verified (the test run: command, N passed), what is next.
Actions: **Continue** (default), **Review First** (opens the task and its changes; DoneRow from round 7 already shows
changes and Undo: combine?), **Stop Here**. States: waiting, continued (auto or person).

## 4. Auto-accept

- A setting in Settings, one for all projects, no limit (decided); also a quick toggle where you think it belongs
  (next to Send? in π?), and what it is called ("Auto-accept", "Run on its own"?).
- While on: always visible (the status button shows "Auto"?), every choice takes the recommended option, every plan is
  approved, every check-in continues, until the roadmap is done.
- Everything is automatic while on, publishing, push, downloads, sending and the Trash included (decided).
- **Turning it on shows the risks first**, every time: what will happen without asking; a yes turns it on.
- **The report at the end of the run** (and when the person comes back): tasks done (verified or not), every decision
  taken automatically (each with Change…), every action that left the machine or used the Trash, problems met.

## 5. The plan in Work

The task file gains a `## Decisions` section (one line per decision with its state) and a `Plan approved:` line. Does
the Work view show them specially (a Decisions block, a "Plan approved" mark on the task), or as plain Markdown?

## 6. Terminal Pi

The same in the terminal: a select list (recommended marked, "Something else…" opens an input), the plan as text then
Approve / Change… / Open ROADMAP.md, check-ins as a select, `/auto on|off` and "Auto" in the footer (T_Footer).

## Also waiting

Round 9 (https://claude.ai/artifact/VdvrKzbQ8jBBYbVbuXFL7S): Check for Updates…, installing on other devices, the
Terminal app kind, Settings › Language, and four round 8 differences.
