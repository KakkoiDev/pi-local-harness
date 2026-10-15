# 240: Plan mode in terminal Pi

Kind: code

Read docs/plans/236-plan-mode.md. The terminal has no cards: the same protocol with `ctx.ui.select` and `ctx.ui.input`.
The design: board design/canvas/T_PlanMode.dc.html (read it as text, see docs/handoff/gpt-sol.md "Reading the
design"), IMPLEMENTATION.md round 10 point 6 and the version 2 section, and the terminal cards
design/system/components/TerminalOutput/README.md. Copy the existing patterns of harness/console.mjs, footer.mjs and
terminal-render.mjs.

## Steps
- [ ] `ask_choices`: select with the options (the recommended marked "(recommended)"), then "Something else…" opens
  an input. Answered choices print one line: `✓ Ball speed: medium`.
- [ ] The plan: printed as text (Goal, tasks, decisions) and a select: Approve / Change… / Open ROADMAP.md.
- [ ] Check-ins: a select: Continue / Review first / Stop here.
- [ ] Auto: `/auto on|off` (the risks every time, Cancel the default), the footer's "Auto", `/status`'s "Run on its own"
  row, a one-line report at the end of a run, `/report` for the full report.
- [ ] Japanese: the fixed words in messages/ja.json (harness/language.mjs translates the screen; Pi reads English).
- [ ] Tests in tests/harness/ (fake ctx.ui like the existing console tests).
