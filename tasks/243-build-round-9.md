# 243: Build round 9: updates, other devices, the Terminal app kind, Settings

Kind: code

The design is in the repo (read docs/handoff/gpt-sol.md, "Reading the design", first). Build from these files; the list
below only says which board serves which box:

- Words: design/IMPLEMENTATION.md, section `## 2026-10-16 · Round 9: updates, other devices, Terminal app, Language`.
- Boards (design/canvas/, page `r9`): R9_Answers (read first), R9_UpdateMenu (π › Check for Updates…, the dot),
  R9_Update (what is new, Update / Later), R9_UpdateStates (updating, updated, up to date, offline, blocked ×2),
  R9_Devices (app icon, Dock icon, menu-bar item, Quit), R9_PreviewTerminal (a Terminal app in the Preview),
  R9_Settings (Settings, Language first); phone: Ph9_Pi (π sheet: Check for Updates…, Add to Home Screen…),
  Ph9_Update (update sheet), Ph9_Install (Add to Home Screen, once, away from the Mac), Ph9_PreviewTerminal (the key
  row). Changed existing boards: C_MenuBar, P_NewProject, P_NewProjectStatic, Ph8_NewProject, Ph8_Settings.
- Components: design/system/components/Dialog/README.md (sections "Settings (round 9)" and "Check for Updates… (round
  9)"), MenuBar/README.md (π menu), PhoneBar/README.md, PreviewWindow/README.md.
- Code to extend: harness/updates.py (check/apply), harness/web_chat.py (a new `/api/updates` route), js/chat.mjs and
  index.html (π menu, Settings), js/preview.mjs (the Terminal app's Preview), harness/settings.py (settings),
  messages/ja.json, tests/browser/design.cjs.

- [x] Updates (task 219): a dot on the π title (and π on the phone) when a new version is known; the menu item
  "● New version"; every state drawn: updating, updated, up to date, can't reach GitHub, both blocked cases (the built
  sentences + "Nothing was changed." + a button asking Pi to do the safe thing). The data: harness/updates.py `check()`
  through a new `/api/updates` route; once a day, quietly (the new setting below).
- [x] Other devices (plan 221): the π tile as the app icon (manifest icons, favicon); the install sheet with the
  brief's copy, once, only away from the Mac (not on 127.0.0.1 / localhost). The menu-bar or tray item (what Pi is
  doing, Gate's count; Open Pi Workbench, Open on Phone…, Copy Address, Start at Login; Check for Updates…; Quit, which
  asks first if Pi is working) belongs to the installers (plan 221): write it down there, build it with them.
- [x] Terminal app kind (task 217): third of the four kinds; help line "Runs in a terminal window, keys and text only:
  a quiz, a calculator, a script. The Preview shows it here."; its Preview shows the run command instead of an address
  and Restart instead of Reload; sizes 80 × 24, 120 × 40, Fit; on the phone a key row (Esc, Tab, arrows, Ctrl, Return)
  above the keyboard.
- [ ] Settings (task 215): Language first, on the desk and the phone; add Show lessons, the 10-second worker wait and
  "Check for updates once a day" (find the first two in harness/settings.py; they are terminal settings today);
  "Phone access" is not a setting (Open on Phone… shows it or why it is off).
- [x] Settled, nothing to build: the model-gone line stays as built; Chat's Compact Now / New Conversation… / Earlier
  Conversations › come off the boards (they were never built); the Preview gives way as a tab (built in task 222).
- [x] Tests in tests/browser/design.cjs for each board built; Japanese for every new string.


## Pending by the person's decision

“Show lessons” and “Wait 10 seconds before Gate starts the worker” do not exist in this checkout's settings or terminal UI. The person chose to leave these two controls pending and build the rest (2026-10-16). Their Settings box remains open.

## Verification and result

The failing tests first showed the missing web update service and window, Terminal metadata and bridge, and per-request shared language. Their focused Python and Node checks now pass. The full Python/Node workflow passes. Scratch browser checks cover every update state, the install sheet, icons, immediate Settings, terminal sizes, Restart and phone keys, with English and Japanese controls. A real cached Textual server was also checked in scratch: Return reaches its stdin socket, and both shared Japanese and Preview's English override reach the app. No packages were downloaded.

The installer-owned Dock/menu-bar/tray behavior is recorded in plan 221 for the installer work. Settings saves language and daily update checks for web and terminal; the two controls above remain deferred by the person. Startup project loading now preserves a newer view click. Design sample cards live beside the polling message list so chat refresh cannot remove test fixtures.
