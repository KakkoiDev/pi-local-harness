# 162: The console changes Ollama's settings and manages models

Kind: code

Request 2026-10-14: "continue the console harness integration"; "Yes, harness should also manage the models." (plan 158, phase 4).

- [x] Red (python, `tests/test_admin_ollama.py`, a temporary app settings database, fake launchctl and app restart, a fake Ollama): `/ollama set num_parallel|keep_alive` (launchctl variables) and `context_length|models_folder` (the app's settings) preview first, then restart Ollama with the value written while the app is quit, back up the settings database, log, and `/undo` writes the old value back; bad values refused; nothing while Pi works; `/ollama restart`.
- [x] `/models remove <name>` moves the manifest and the files no other model uses to the Trash, laid out like the models folder with a README (Put Back, then merge); shared files stay; the chosen model cannot be removed.
- [x] `/models pull <name>` asks, streams Ollama's pull and reports the result; logged.
- [x] Not run against the real Ollama here. The real calls: `launchctl getenv|setenv|unsetenv`, `osascript quit app "Ollama"`, `open -a Ollama`, Ollama's `/api/pull`.
- [x] Green: verify_workflow.
