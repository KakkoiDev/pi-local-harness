# 171: Build terminal Pi from the round 6 boards

Kind: code

Request 2026-10-14: the designer drew round 6 (Terminal page: T_Principles, T_Startup, T_Footer, T_Outputs, T_Changes, T_Gate, T_Noise, T_Wayfinding, T_Workbench; card TerminalOutput; IMPLEMENTATION.md § Round 6, items 1–12).

- [x] Re-synced `design/`: 9 boards, canvas.json, TerminalOutput card, the system README, design-system.json, IMPLEMENTATION.md.
- [x] 1–2 One look for every console output: `harness/admin.py` builds a view per command (title, summary, parts: kv, table, checklist, prose, lines; hint); `harness/terminal.py` draws it as plain text (the command line, Pi's tool), `harness/terminal-render.mjs` in terminal Pi with bold titles and dim summaries, hints and IDs at the terminal's width; under 80 columns tables drop PROJECT then ID; glyph + word for every state (✓ ✗ ! ▶ ○ ■ ~), ASCII when the locale is not UTF-8. Both renderers meet `tests/fixtures/terminal-views.json` (python and node tests). /status, /queue (8-character IDs, HH:MM today), /gate (Allowed, Blocked, Revise, Command failed), /models (CAN, in memory), /doctor (checklist), /config (KEY VALUE FROM, the value in force; `/config <key>` explains one), /projects, /paths, /guide, /harness as views. A model name that does not exist suggests the nearest ("Did you mean qwen3:8b?"). Smoke test in real Pi.
- [ ] 3 Startup header (5 lines; first start adds one; QR beside at ≥100 columns).
- [ ] 4, 11 Footer with the workbench state; one notification when something needs the person.
- [x] 5 Changes: the preview lists what changes from what to what, where it is saved and side effects; the choice names the action (Switch Model, Save Setting, Remove Model…) and puts Cancel first when it is destructive; the result is one line with /undo, or "○ Not changed."
- [ ] 6 Pi's proposal prefills the input line.
- [ ] 7–8 Tool calls: Gate's verdict and the command's exit as separate words; recovery and refusal as a bold sentence.
- [ ] 9 Noise: no timestamp lines, a dim time on the message header, /verbose; [CANARY] stripped from display.
- [ ] 10 /harness as a select list ("Ask in words" first), argument completion.
- [ ] Differences from the boards sent back to the designer (names the repo uses).
