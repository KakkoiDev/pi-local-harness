# 159: The harness console in terminal Pi: read commands

Kind: code

Request 2026-10-14: "yes, let's make the plh pi harness the place where we can take guided actions" (plan 158, phases 1 and 2).

- [x] Red (python, `tests/test_admin.py`): `harness/admin.py` reads paths, settings with an explanation per key, Gate's history (newest first, blocked, one event), the queue and a request's record from the data folder when the services are down, status and doctor (what is wrong and what to do; a stale agent lock); `python3 -m harness.admin` prints tables and `--json`; every command is in `harness/CONSOLE.md`.
- [x] `harness/console.mjs`: one slash command per admin command (`/harness`, `/status`, `/queue`, `/job`, `/gate`, `/models`, `/ollama`, `/projects`, `/config`, `/paths`, `/doctor`); the output goes into the session as a `harness-console` message; Pi's own `/settings` and `/model` are left alone (`/config`, `/models` instead). Node test: same commands as admin.py, all in CONSOLE.md, none of Pi's names. Written before its tests, so those were not seen failing first.
- [x] Terminal sessions get `harness/CONSOLE.md` in the system prompt; web workers (shared port) do not (extension test).
- [x] Smoke test in real Pi 1.1.0 (`--mode rpc`, scratch data folder, free ports): `/status` ran without a model call and showed the live web port.
- [x] Every start announces the console: the startup lines end with "Console: type /harness for the harness commands (/status, /doctor, /queue, /gate, /models, /ollama …)" (the person: "when booting, display help text to make sure everybody knows about it"; `tests/harness/startup-display.test.mjs`, red first; seen in real Pi).
- [x] Green: verify_workflow (python and node).
