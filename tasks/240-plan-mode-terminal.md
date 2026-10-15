# 240: Plan mode in terminal Pi

Kind: code

Read docs/plans/236-plan-mode.md. The terminal has no cards: the same protocol with `ctx.ui.select` and `ctx.ui.input`.

## Steps
- [ ] `ask_choices`: select with the options (the recommended marked "(recommended)"), then "Something else…" opens
  an input. Answered choices print one line: `✓ Ball speed: medium`.
- [ ] The plan: printed as text (Goal, tasks, decisions) and a select: Approve / Change… / Open ROADMAP.md.
- [ ] Check-ins: a select: Continue / Review first / Stop here.
- [ ] Auto: `/auto on|off`, the footer's "Auto".
- [ ] Japanese: the fixed words in messages/ja.json (harness/language.mjs translates the screen; Pi reads English).
- [ ] Tests in tests/harness/ (fake ctx.ui like the existing console tests).
