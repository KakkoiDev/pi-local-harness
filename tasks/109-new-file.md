# 109: New File… replaces New Page…

Kind: code

Request 2026-10-13 (UI review of http://127.0.0.1:3000): "when I click New page, is it creating a data page for AI interaction of a file in the actual project?" (answer: a real file in the project) and "New Page... is hard to understand, how about new file?". Decision: any name, `.md` by default, folders allowed.

- [x] Red: `notes` creates `notes.md`, `docs/plan.md` creates the folder, `script.py` keeps its extension; no path escapes the project.
- [x] Red: New Task… creates `tasks/NNN-slug.md` with the next number and a template (Kind, checkboxes).
- [x] Label and dialog help name the real file and project.
- `DocumentStore.create_file` / `create_task` (`/api/documents/create-file`, `create-task`); the old `create` stays for the API tests. New Task appends `- [ ] [NNN-Title](tasks/NNN-slug.md)` to ROADMAP.md when it exists. Dialog help updates as you type (Dialogs2 › New Page). The `+` actions on the Plan and Files groups (task 97) will open the same dialogs. Red: tests/test_documents.py NewFileAndTaskTest; browser: design.cjs.
