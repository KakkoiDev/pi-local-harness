# 66: Phone access over Tailscale and voice into the prompt box

Kind: code

Request 2026-10-13: "access the local ui through tailscale and be able to send audio from my phone in the webui and have the whisper installed on my mac mini to do the transcription and paste in the input field." Follow-up: "finish building and document well for even dumb agent to know how it works."

- [x] Red: `tests/test_remote_access.py` (remote Host refused by default; configured host and login allowed; https tailnet Origin only; `/api/transcribe` returns text; no-speech error is 400; plh validates the lists).
- [x] `WebHandler.trusted` accepts configured tailnet hosts with a configured `Tailscale-User-Login`; server stays on 127.0.0.1.
- [x] `POST /api/transcribe` returns `{text}`; the mic button inserts it at the cursor, falls back to attaching the recording.
- [x] `remote_hosts` / `remote_users` in config.json, exported as `PI_WEB_REMOTE_HOSTS` / `PI_WEB_REMOTE_USERS`.
- [x] Documented in harness/README.md (setup, trust rules, voice flow) and readme.md.
- [x] Follow-up 2026-10-13: "I want it to be started with the plh command. and show the url in the pi cli". Services run `tailscale serve <web port>` in the foreground and stop it on exit; Pi prints `Phone: https://...` or `Phone access off: <reason>`. Tests: `TailscaleServeTest`, `tests/harness/startup-display.test.mjs`.
- [ ] On the phone: start plh, open the Phone URL, record, check the text lands in the box. Not run: Tailscale is stopped on the dev Mac.
