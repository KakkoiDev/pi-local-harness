# 89: Pi Workbench System 1, model location copy

Kind: code

Request 2026-10-13, on "Confirm the copy 'Model runs on this Mac'": "Models don't run on this mac, on another one I'll be working on later."

- [x] Red (`tests/test_frontend.py`): `index.html` says "Pi runs on this Mac" in the Projects status bar and never says the model runs on this Mac.
- [x] `index.html`: status bar "Pi runs on this Mac"; About "One person, one agent. Pi runs on this Mac; the model runs wherever its provider points." The harness and Pi run here; the model host comes from Pi's provider `baseUrl` (`harness/provider.mjs`, default `127.0.0.1:11434`), which this UI does not read.
- [x] Dated note on the task 72 copy line.
- Not done: showing the model host in About. It needs Pi's provider config read server side; left until the other Mac is set up.
