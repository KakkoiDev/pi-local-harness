# 171: Build terminal Pi from the round 6 boards

Kind: code

Request 2026-10-14: the designer drew round 6 (Terminal page: T_Principles, T_Startup, T_Footer, T_Outputs, T_Changes, T_Gate, T_Noise, T_Wayfinding, T_Workbench; card TerminalOutput; IMPLEMENTATION.md § Round 6, items 1–12).

- [x] Re-synced `design/`: 9 boards, canvas.json, TerminalOutput card, the system README, design-system.json, IMPLEMENTATION.md.
- [ ] 1–2 One renderer for console outputs (title rule, kv, table with ═ and ellipsis, checklist, list, prose, dim hint), glyphs with an ASCII fallback.
- [ ] 3 Startup header (5 lines; first start adds one; QR beside at ≥100 columns).
- [ ] 4, 11 Footer with the workbench state; one notification when something needs the person.
- [ ] 5–6 Changes: confirmation with from → to, where saved, side effects, named buttons, Cancel default when destructive; Pi's proposal prefills the input line.
- [ ] 7–8 Tool calls: Gate's verdict and the command's exit as separate words; recovery and refusal as a bold sentence.
- [ ] 9 Noise: no timestamp lines, a dim time on the message header, /verbose; [CANARY] stripped from display.
- [ ] 10 /harness as a select list ("Ask in words" first), argument completion.
- [ ] Differences from the boards sent back to the designer (names the repo uses).
