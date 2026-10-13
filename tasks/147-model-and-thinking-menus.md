# 147: Choose the model and the thinking level from the menu bar

Kind: code

Request 2026-10-13: "when clicking thinking level, a dropdown would appear and I could set the level … it would tell me when it's done switching and display the new value", "same for the model", "when switch model send message to Ollama to shut down the previous one … keep only 1 llm active at a time to save power. and if no thinking level on a model, hide the thinking level dropdown. or indicate it is disabled. do the human interface mac best choice."

This lifts the pin of task 50 ("while other models are not being tested"): `harness/model.json` stays the default, the choice lives in `<data>/model.json`.

- [x] Red (unit, fake Ollama): local models list tools / thinking / vision from `/api/show`; switching unloads the previous model (`keep_alive: 0`) before loading the new one and waits until it is in memory; models without tools or not installed are refused; a model without thinking runs with `--thinking off`; the thinking level is saved and used.
- [x] `GET /api/models`, `POST /api/model` (refused while Pi works), `POST /api/effort`; `/api/config` reports the choice. Web requests and terminal `plh` both start Pi with the choice; the provider registers the chosen model with its capabilities.
- [x] Menu bar: the model name and the thinking word are buttons that open menus (`#model-menu`, `#effort-menu`). Switching shows "Loading <model>…" and then the toast "<model> is ready. Ollama keeps only this model in memory."; a thinking change toasts "Thinking set to low. Pi uses it from the next request."
- [x] Human Interface Guidelines: unavailable means dimmed, not hidden. A model without thinking reads "No thinking", its button and every level are dimmed; a model that cannot use tools is listed dimmed.
- [x] Green: unit (fake Ollama), browser (faked `/api/models` and `/api/model`); both browser suites point `PI_OLLAMA_URL` at a closed port so tests never touch the real Ollama.

Terminal Pi started before a switch keeps its model until it restarts (Pi's own /model command can change it); its next request would load that model again.
