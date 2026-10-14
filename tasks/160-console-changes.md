# 160: The console changes settings and the model, after a yes

Kind: code

Request 2026-10-14: "continue the console harness integration" (plan 158, phase 3). Decided: "needs yes from human".

- [x] Red (python, `tests/test_admin.py` AdminChangeTest): `/config set <key> <value>` returns a preview (title, from → to, what the key does) and changes nothing without yes; with yes it backs up `config.json` to `<data>/backups/`, writes it and logs the change in `<data>/admin-log.jsonl` (command, before, after, by); bad values are refused with what is allowed (effort, ports, the pinned model, unknown keys, bare names, true/false); `/undo` restores the last change's backup, or sets aside a file the change created (never deleted); `/models use` needs Ollama to know the model (installed, with tools); the command line exits 3 and says "Run again with --yes".
- [x] `/models use <name> [effort]` goes through the running workbench's switch (unloads the previous model) or, without it, saves the choice and switches in Ollama.
- [x] `harness/console.mjs`: on exit 3 the slash command shows the preview with `ctx.ui.confirm` and runs with `--yes` only after yes ("Not changed." otherwise); Node test. `/undo` added; CONSOLE.md says Pi may only propose a change.
- [x] Smoke test in real Pi (`--mode rpc`, scratch data folder): `/config set effort low` asked "Change effort?", ran after yes, logged it.
- [x] Green: verify_workflow.
