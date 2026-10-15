# 204: Pi's browser opens the project's own app (target "app")

Kind: code

Plan 198. Request 2026-10-15: "go for it" (build while the course is written): the browser tool, pointed at the app
the Preview runs (task 202), so Pi checks the app it builds the way the person will see it.

- [x] Red (node, `tests/harness/browser.test.mjs`; python, `tests/test_preview.py`): `target: "app"` is accepted; it
  opens the app's address (with `path`) after asking for it once; "no app to show" comes back as the tool's error; the
  tool gets the app from the extension; the workbench finds the project from the folder Pi works in (the deepest
  project holding it) and refuses a folder outside every project.
- [x] `harness/browser.mjs`: target "app" in the input check, `look` and the tool's description; `WebChat.project_for`;
  `POST /api/preview/start` takes `{cwd}`; the extension starts the app through the workbench and waits until it runs
  (up to two minutes: a new project's first start installs its packages), or says why it stopped.
- [x] The page-layout guide names target "app" (kept under the guides' 700-character limit).
- [x] Green: verify_workflow. Not tried with the real Pi yet: the extension's wait loop has no test of its own; the
  first bench scenario on the stack will exercise it.
