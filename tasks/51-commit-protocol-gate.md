# 51: Laya enforces the request-to-task protocol

Request 2026-10-13: Laya must check that the model followed AGENT.md: test red, code
implementation, test green, check task, check roadmap, commit. Decisions: enforce in
folders with ROADMAP.md + tasks/; Markdown/tasks-only commits skip red/green but still
need the task and roadmap checks.

- [x] Red: 9 protocol tests (full cycle, named missing steps, red without implementation, stale green, piped/masked runs, docs-only, new cycle after commit, subdirectory and `sh -c` commits, unaffected folders).
- [x] Red: the extension shows a REVISE reason that is not the destructive-command text.
- [x] `laya/protocol.py`: git-state fingerprint of changed code files; test runs recorded at audit with their exit code; commit gate in `ProposalLedger.propose`.
- [x] Green: Python 77/77, Node 22/22.
- [x] Document in README, AGENT.md, and the runtime memory template; update roadmap.

Limits: state is in memory (service restart restarts the cycle); a test run that edits
untracked, non-ignored files changes the fingerprint; commits outside Pi tools or through
unrecognized wrappers are not seen. Existing `~/pi-local-harness-data/AGENTS.md` copies are
not rewritten; the REVISE reason states the missing steps.
