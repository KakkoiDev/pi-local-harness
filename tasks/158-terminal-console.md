# 158: Plan terminal Pi as the harness console

Kind: planning

Request 2026-10-14: "I want the plh harness that opens in the terminal in pi to be a "backend" of sorts where I can run scripts and see raw data, explore and be guided by the harness that knows itself and exposes tools for me to gain insight on how it works and perform admin level actions. Update settings, even in ollama, etc..."

- [x] Plan: `docs/plans/158-terminal-console.md` (one backend `harness/admin.py`, three doors: slash commands, model tools, scripts; first command set; safety; phases).
- [x] Decided C1: Pi proposes, the person's yes runs it ("needs yes from human"). C2: the console also manages models, pull and remove to the Trash ("harness should also manage the models").
