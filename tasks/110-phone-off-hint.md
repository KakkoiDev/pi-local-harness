# 110: Startup says how to turn on phone access

Kind: code

Request 2026-10-13 (UI review of http://127.0.0.1:3000): "I thought we implemented a tailscale option to access from other devices, but didn't see the url in the terminal when started plh." Cause: `remote_hosts`/`remote_users` unset. 2026-10-13: set on this Mac for kakkoidevs-mac-mini.tailc6310e.ts.net / KakkoiDev@github (backup config.json.before-tailscale-20261013).

- [ ] Red: with no remote hosts, the startup lines include "Phone access off: set remote_hosts and remote_users in config.json".
- [ ] Verify on this Mac: restart plh, the Phone URL line appears.
