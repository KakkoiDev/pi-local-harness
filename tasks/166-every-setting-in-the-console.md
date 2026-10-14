# 166: Every setting and variable in the console

Kind: code

Request 2026-10-14: "let's make those settings editable in the plh pi harness directly too. and all variables too."

- [x] Red (python, `tests/test_settings.py`): every environment variable the code reads (plh, harness, gate, js) is listed in `harness/settings.py`: a setting, a variable the harness sets itself, or Ollama's; settings become the variables plh passes on (`hang_seconds` → `PI_HANG_MS` in ms; empty paths are not passed); bad values refused with what is allowed; plh uses the registry; `/config set silence_seconds 7200` works and `/config` shows each key's variable, a shell variable that wins, the harness's own variables and Ollama's.
- [x] `harness/settings.py`: one registry (key, variable, default, check, meaning). New settings: `silence_seconds`, `hang_seconds`, `ollama_url`, `tailscale`, `python`, `gate_auth` (it was read by the extension but only documented), `web_data`, `audit_log`. `plh.configuration` and `plh.environment` and the console use it.
- [x] harness/README: the variable table points at the registry and `/config`.
- [x] Green: verify_workflow.
