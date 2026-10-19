# 275: The shared app source: one tree every package builds from

Kind: code
No scenarios: it reorganises the web starter's files and adds a purity check; the new project's app looks and behaves exactly as before.

Plan 253 ("one app, many packages"), section "The shared app source". The web starter becomes the shared layout so every
new project can be packaged as full stack, frontend only or mobile without a rewrite. kit/starter-static and existing
apps are not migrated (plan 253; decision 9).

Files: kit/starter/ (app/logic, app/data, app/web, app/platform.py, tests/logic, tests/contract, packaging.json),
kit/starters.json, kit/new_project.py, kit/README.md, tests/test_new_project.py (or the existing starter tests).

- [ ] Red: a test creates a scratch project from the web starter and fails because app/platform.py, app/web/create_app(platform),
  app/data taking a connection (not a path), tests/contract/ and packaging.json do not exist; a second test fails
  because app/logic/notes.py may import from app.data (no purity check yet).
- [ ] Move the starter's code into app/logic (pure), app/data (queries over a given sqlite3.Connection), app/web (routes,
  templates); `create_app(platform)` replaces `create_app(database)`; app/platform.py declares Storage, Auth, Network as
  `typing.Protocol` (Routing is the ASGI app itself).
- [ ] A purity test in the starter's skeleton: an `ast` scan refuses imports of os, pathlib, sqlite3, socket,
  subprocess, httpx, fastapi, starlette or app.data/app.web/app.platform from app/logic.
- [ ] packaging.json in the skeleton: `{"targets": ["server"], "capabilities": []}`; written by the harness from the
  person's choices (New Project, later Project Start), never by Pi: Gate refuses Pi's writes to it.
- [ ] kit/starters.json sample and skeleton lists updated; strict pyright passes on the new layout.
- [ ] Green: the starter's own tests (logic, contract with a fake platform, app, files, i18n) pass in a scratch project;
  the new-project tests pass; the full workflow passes.

Acceptance: a new Web app project has the shared layout, its logic is provably pure, the app runs exactly as before
through the server adapter (task 276), and nothing outside kit/ and its tests changed.
