# 209: New Project… makes a Web app, an App with no server, or an empty folder

Kind: code

Round 7 (point 13; boards P_NewProject, P_NewProjectStatic).

- [x] Server (python, `tests/test_project_kinds.py`): `kind` = web | static | empty; the two apps from the kit's
  starters with the roadmap in their first commit; every new project starts with a repository; an unknown kind is
  refused. The Trash alert counts the person's files, not `.git`'s.
- [x] The dialog: "What are you making?" with System 1 radios (Web app the default), the "Not sure?" help, and the line
  that says what Create makes, per kind. Settings → Appearance uses the same Radio.
- [x] Browser suite (design.cjs): the three kinds and their lines; the chat suite's projects are Empty folders. Tried
  in the browser: a no-server project from the dialog, its Preview opening by itself.
