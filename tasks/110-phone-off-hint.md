# 110: Startup says how to turn on phone access

Kind: code

Request 2026-10-13 (UI review of http://127.0.0.1:3000): "I thought we implemented a tailscale option to access from other devices, but didn't see the url in the terminal when started plh." Cause: `remote_hosts`/`remote_users` unset. 2026-10-13: set on this Mac for kakkoidevs-mac-mini.tailc6310e.ts.net / KakkoiDev@github (backup config.json.before-tailscale-20261013).

- [x] Red: with no remote hosts, the startup lines include "Phone access off: set remote_hosts and remote_users in config.json".
- [x] Verify on this Mac. Found: Serve is not enabled on the tailnet; `tailscale serve` printed the enable link on stdout (discarded) and waited, so the services announced a phone URL that could not load. Fixed: `tailscale_serve` reads the output for 2s and reports "Serve is not enabled … enable it once at <link>" (red: tests/test_remote_access.py `test_serve_that_waits_for_enabling_is_reported_and_stopped`). Checked on this Mac with a second services copy on port 3200: remote_error with the link, no serve left running, no serve config left.
- [~] Blocked: the user enables Serve once at the link (tailnet admin setting), then restarts plh; the Phone line then appears.
