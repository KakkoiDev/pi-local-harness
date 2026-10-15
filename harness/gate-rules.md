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
- G-008 Plan files change through edit or write: ROADMAP.md and tasks/*.md are changed with edit, write or task_box (ticks a box by its label), never by a shell command (redirects, sed -i, tee, scripts), so Gate checks the change.
- G-009 Plan files keep their content: A write over an existing ROADMAP.md or task file may not drop ticked boxes or more than 5 lines; change it with edit.
- G-010 Red and Green are ticked after the runs: A task's Red box is ticked only after Gate saw a test run fail, its Green box only when the last test run passed.
- G-011 A Gate failure blocks only that call: If Gate cannot check a tool call (an error, not a decision) after retries, that call does not run and is reported; the run continues. Never work around Gate with another tool.
- G-012 Unverified changes are marked: A request that changed code and ran no passing test after the last change ends marked "Not verified", whatever the answer says.
