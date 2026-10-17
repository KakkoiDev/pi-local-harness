# 262: Renamed or moved projects keep working; project ids never collide

Kind: code

Request 2026-10-18 (Claude's review, docs/reviews/2026-10-18-claude-review.md P0-3, item 16 and two P2 lines): "A
renamed or moved project keeps Pi's old session folder"; "Creating a project with a renamed project's old name opens the
old project's chat"; "Rename is allowed while terminal Pi works"; the Preview kept serving the old folder.

Pi 1.1.0 takes its working folder from the session header (`{"type":"session",…,"cwd":…}`, the first line of
`<chat>/session.jsonl`), not from the process cwd (`dist/main.js` 552-565, `core/session-manager.js` `open`). Checked
with the real `pi` 1.1.0 binary, `PI_CODING_AGENT_DIR` in scratch, RPC `get_state` and `bash pwd` only (no model call):
a header naming a missing folder exits with "Stored session working directory does not exist"; a header naming an
existing old folder runs there whatever the process cwd; after rewriting only the header's `cwd`, Pi runs in the new
folder and keeps every message (`messageCount` unchanged). So the harness migrates the header, keeping a backup copy.

- [x] Red (unit): a chat whose session header names another folder is migrated before Pi starts (header cwd = the
      project's folder, the rest of the file unchanged, a `session.jsonl.before-move-<time>` backup next to it).
- [x] Red (unit): Rename and Move migrate the project chat's session header at once, with the backup.
- [x] Red (unit): every created or registered project gets a uuid id; a project created with a renamed project's old
      name, or with another project's id as its name, gets its own id and chat; existing folder-name ids keep working
      (migration registers them under their folder name at start).
- [x] Red (unit): Rename, Move and Move to Trash are refused while terminal Pi holds `.agent-lock`.
- [x] Red (unit): a running Preview follows Rename and Move: the old server is stopped by the harness's handle and
      started again in the new folder; a stopped Preview stays stopped; Move to Trash and Remove from List stop it.
- [x] Red (unit): Gate's test-run history (`gate-protocol.json`, keyed by folder) follows Rename and Move.
- [x] Migrate the session header before launch (`harness/web_chat.py`) and in Rename/Move (`WebChat.project_command`).
- [x] uuid ids on create/register; start-up migration of unregistered data-folder projects (`harness/documents.py`).
- [x] Refuse project commands while any agent works (`agent_running()`), with a clear message.
- [x] Restart the Preview in the new folder on Rename/Move (`Previews.active`, `WebChat.project_command`).
- [x] Move Gate's runs to the new folder (`after_project_move`).
- [x] Document terminal Pi's sessions (harness/GUIDE.md).
- [x] Green: `python3 tests/verify_workflow.py`, `node --test tests/harness/*.test.mjs`.

Terminal Pi (plh) keeps its own sessions in `~/.pi/agent/sessions/<encoded folder>/`, keyed by the folder, outside
the workbench's data. After a rename or move, `pi -c` in the new folder starts a new session; resuming an old one
(`pi -r`) asks which folder to continue in. The harness does not rewrite those files (they are Pi's, not the
workbench's); the guide says so.

Browser suites (design, chat) pass with the scratch Playwright setup (project ids are uuids in them now).

Not verified: the real Pi was run only through RPC
`get_state` and `bash`, never a model turn; Open on Phone is not turned on again after a restart; other path-keyed
records (test-runs.jsonl rows, audit log cwd) keep the old folder as history.

## Needs design

- The Preview restarts silently after a rename or move (its usual "starting" state); a note such as "Started again in
  the renamed folder" is not drawn. Open on Phone ends with the old app and is not turned on again.
- The refusal while terminal Pi works is the existing project-command error alert; no dedicated card.
