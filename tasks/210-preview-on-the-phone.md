# 210: The Preview on the phone, and Open on Phone…

Kind: code

Round 7 (IMPLEMENTATION.md point 5; boards Ph_Preview, Ph_PreviewMenu, P_OnPhone). The person: "do the phone tasks now."

- [x] Server (python, `tests/test_preview.py`): the app's own tailnet address while it runs, `https://<host>:8443/`
  (`tailscale serve --https=8443 localhost:<port>`); only a running app; served once; one app on that address at a time
  (another project's is stopped); stopping the app stops it; "Phone access is off" when the workbench is not on the
  tailnet. `tailscale serve`'s arguments checked with a stand-in script. `POST /api/preview/phone`.
- [x] Open on Phone… (P_OnPhone): the Phone dialog, reused, with the app's title, QR, address and Copy, and the
  designer's two sentences; when phone access is not set up, the dialog says how (it showed an empty QR before, found
  while trying it).
- [x] On the phone (Ph_Preview): Preview in the view menu with the app's state as key text (Ph_PreviewMenu: "▶ Running",
  "○ Not started", …); the app takes the full width with no frame; no size row; the foot is the state, the app's
  language and Open App (Safari: Add to Home Screen installs it).
- [x] From another device (the workbench opened on a phone over the tailnet), the frame and Open in Browser use the
  app's tailnet address: 127.0.0.1 is the phone itself there.
- [x] Japanese for the new strings. Tried in the browser at 375 and 1440 wide, with a stand-in `tailscale` (the QR for
  https://mac.test:8443/). Browser suites pass (design.cjs line 388/694: the same intermittent Activity-navigation
  timeout as before this work).
- [ ] Not tried on a real phone over the real tailnet.

## Scenarios

### US-new on a real phone over the tailnet, Open on Phone’s address opens the running app
Given a project’s app running in the Preview, and phone access on
When I choose Open on Phone… and open the address on my phone
Then the app loads on the phone
