# 226: The installed copy starts: kit/ and messages/ are installed

Kind: code

The person, 2026-10-15: "harness is broken": plh stopped at `ModuleNotFoundError: No module named 'new_project'`. The
harness imports the project starters from kit/ (task 200) and reads the Japanese text from messages/ (tasks 215, 220),
but harness/install.py copied neither into ~/.local/share/pi-local-harness. The tests ran from the checkout, where both
exist, so nothing caught it.

- [x] Red: tests/test_auto_update.py, the installed copy alone imports what services.py imports, and has
  kit/new_project.py and messages/ja.json.
- [x] install.py copies kit/ and messages/.
- [x] Reinstalled from the fixed checkout.
