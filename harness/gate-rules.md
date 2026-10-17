<!-- Generated from gate/rules.py by `python3 -m gate.rules`; do not edit. -->
Gate enforces these rules on every tool call (they cannot be turned off; /gate rules explains each).
When a rule sends an action back, do what its message says; never work around it with another tool.
- G-001 Known tools only: Gate checks read, write and shell tools; any other tool is refused.
- G-002 Permission level: A profile may only use the risk levels it is allowed (standard: reads and reversible writes).
- G-003 No catastrophic shell commands: Recursive deletes of roots, home or parent folders, disk erasure, raw device writes, broad recursive chmod/chown and broad find -delete are refused.
- G-004 Edits match exactly once: Each edit's old text must appear exactly once in the file, without overlaps; copy it from the file as it is now.
- G-005 Commit order: git commit needs, since the last commit: a failing test run, the change, a passing run on that code, a ticked box in the task and in ROADMAP.md (Markdown-only commits skip the tests).
- G-006 Runs as approved: The tool that ran must be the one Gate approved, with the same arguments.
- G-007 Written file matches: After a write or edit, the file on disk must be exactly what Gate approved.
- G-008 Plan files change through edit or write: ROADMAP.md and tasks/*.md are changed with edit or write (System 1 owns task layouts and ticks), never by a shell command (redirects, sed -i, tee, scripts), so Gate checks the change.
- G-009 Plan files keep their content: A write over an existing ROADMAP.md or task file may not drop ticked boxes or more than 5 lines; change it with edit.
- G-010 Red and Green are ticked after the runs: System 1 lays out and ticks task boxes from recorded evidence. Pi supplies content, never task checkboxes.
- G-011 A Gate failure blocks only that call: If Gate cannot check a tool call (an error, not a decision) after retries, that call does not run and is reported; the run continues. Never work around Gate with another tool.
- G-012 Unverified changes are marked: A request that changed code and ran no passing test after the last change ends marked "Not verified", whatever the answer says.
- G-013 The harness commits: Within a request, Pi does not run git commit: the harness makes the task, ticks its progress and commits locally: a verified change marked done, an unverified one marked "not verified" with its task left open.
- G-014 Plans are complete: A code request needs a real Goal, no starter placeholder task, and a checkbox and Done when: line in every linked task. Ask once to fill the gaps; otherwise mark Plan incomplete.
- G-015 Project phase permissions: Discussion reads; Planning writes ROADMAP.md and tasks/; Implementation writes approved task files. Only you or auto changes phase.
- G-016 Ask instead of assuming: An assumption in Pi’s text or reasoning since the last user answer must become an ask_choices question before writing content.
- G-017 Decisions are settled: Decisions lines must be answers the harness recorded, before code changes.
