# 80: Pi Workbench 1-bit, Open on Phone

Kind: code

Request 2026-10-13: "implement this new design." Build step 13 of [design/IMPLEMENTATION.md](../design/IMPLEMENTATION.md) § 12, the phone URL part (§ 9 "Phone URL for Open on Phone…", § 5 `open-on-phone`).

- [x] Red (`tests/test_remote_access.py`): when `tailscale serve` runs, `/api/config` has `phoneUrl` `https://<first remote host>`; when it fails, `phoneUrl` is null.
- [x] Red (`tests/browser/chat.cjs`): without a phone URL, Open on Phone… is disabled; with one (config response rewritten in a second page), it opens `#phone-dialog` with the canvas copy, the address in `#phone-url`, Copy, and Done on Return.
- [x] `harness/services.py`, `harness/web_chat.py`: `WebHandler.phone_url`, set from the same value plh prints as `Phone:`.
- [x] `index.html`, `js/chat.mjs`, `chat.css`: the dialog from [Dialogs2] "Open on phone"; Copy writes the address and shows a toast.
- Not done, needs a decision: suggested changes (Keep Mine / Apply Change) and Laya results per tool call. See ROADMAP.
- Not tested: Copy (headless clipboard).
