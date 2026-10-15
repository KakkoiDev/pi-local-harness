# 243: Build round 9: updates, other devices, the Terminal app kind, Settings

Kind: code

The designer's answer to design/briefs/round-9.md (2026-10-16): canvas page "Updates & devices" (it opens with an
answers board) and IMPLEMENTATION.md's round 9 section. Build from the boards, not from this list.

- [ ] Updates (task 219): a dot on the π title (and π on the phone) when a new version is known; the menu item
  "● New version"; every state drawn: updating, updated, up to date, can't reach GitHub, both blocked cases (the built
  sentences + "Nothing was changed." + a button asking Pi to do the safe thing). The data: harness/updates.py `check()`
  through a new `/api/updates` route; once a day, quietly (the new setting below).
- [ ] Other devices (plan 221): the π tile as the app icon (manifest icons, favicon); the install sheet with the
  brief's copy, once, only away from the Mac (not on 127.0.0.1 / localhost). The menu-bar or tray item (what Pi is
  doing, Gate's count; Open Pi Workbench, Open on Phone…, Copy Address, Start at Login; Check for Updates…; Quit, which
  asks first if Pi is working) belongs to the installers (plan 221): write it down there, build it with them.
- [ ] Terminal app kind (task 217): third of the four kinds; help line "Runs in a terminal window, keys and text only:
  a quiz, a calculator, a script. The Preview shows it here."; its Preview shows the run command instead of an address
  and Restart instead of Reload; sizes 80 × 24, 120 × 40, Fit; on the phone a key row (Esc, Tab, arrows, Ctrl, Return)
  above the keyboard.
- [ ] Settings (task 215): Language first, on the desk and the phone; add Show lessons, the 10-second worker wait and
  "Check for updates once a day" (find the first two in harness/settings.py; they are terminal settings today);
  "Phone access" is not a setting (Open on Phone… shows it or why it is off).
- [ ] Settled, nothing to build: the model-gone line stays as built; Chat's Compact Now / New Conversation… / Earlier
  Conversations › come off the boards (they were never built); the Preview gives way as a tab (built in task 222).
- [ ] Tests in tests/browser/design.cjs for each board built; Japanese for every new string.
