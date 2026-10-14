# 141: New File help and Open on Phone when phone access is off

Kind: code

Request 2026-10-13: "design updated" (re-synced in task 126); build what the agent-scope brief asked for. Inventory of design vs code: 2026-10-13 review.

- [x] Red (browser): New File help per Dialogs2 (built in the audit, task 150, and already asserted in design.cjs); Open on Phone enabled with phoneError: "Phone access is off." with the enable link, Copy Link, Done (design.cjs fakes a failed `tailscale serve` through `/api/config`). The browser assertions were written after the code, so they were not seen failing first.
- [x] Server: `services.py` keeps the `tailscale serve` error on `WebHandler.phone_error`; `/api/config` adds `phoneError` and `phoneEnable` (`serve_link`, unit-tested in `tests/test_remote_access.py`). Without an enable link the detail names the error itself.
- [x] Green: verify_workflow, design.cjs.

Progress 2026-10-13: Open on Phone shows the phone address as a QR code (`#phone-qr`, the terminal's `harness/vendor/qrcode.mjs`, served to the page), as the person asked and round 3 draws.
