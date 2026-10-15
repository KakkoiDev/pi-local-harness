# 202: The harness runs the project's app, for the Preview beside the chat

Kind: code

Plan 198 ("Preview and undo for people who do not read code"). Request 2026-10-15: "I like the idea of having the
preview in the pi harness directly." The view itself waits for the designer: [design/briefs/app-preview.md](../design/briefs/app-preview.md).

- [x] Brief for the designer: the Preview (beside the chat or a third view; Phone · Tablet · Full; Open on Phone…;
  English · 日本語), its states in plain words, "what was done" lines with Undo This Request…, the lesson line.
- [x] Red (python, `tests/test_preview.py`): the run command by kind of project; a project with no app says so; a plain
  site starts, answers and stops; an app that exits is stopped with its last lines, and its log kept; closing stops
  every app; the workbench's `preview(project, status|start|stop)` checks the project and the action.
- [x] `harness/preview.py`: a project on the stack runs `uv run uvicorn app.main:app --reload` on a free local port,
  with Tailwind built once first and then watching the templates, in one process group (stopping it stops both); a
  plain site (`index.html`) is served as files. States: none, starting, running, stopped (with the last 8 lines).
  Logs in `<data>/.previews/<project>.log`. uv is found by full path, since plh may start with a short PATH.
- [x] Found while trying it for real: without a pin, pytailwindcss downloads Tailwind's *latest* binary into every new
  project. Now `TAILWINDCSS_VERSION=v4.3.3` and one shared, checksum-checked copy in `<data>/toolchain/tailwindcss`
  (`kit/toolchain.json`). First start of a new project 12 s (one download), then about 1.5 s.
- [x] `GET /api/preview?project=`, `POST /api/preview/start` and `/api/preview/stop`. Green: verify_workflow.
- [ ] The view, once the canvas has it (a later task).
