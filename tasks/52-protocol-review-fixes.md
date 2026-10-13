# 52: Review fixes for the protocol gate and workspace

Code review of tasks 45-51 (2026-10-13) found:

- [x] Red then green: `cd <project> && git commit`, `git -C <project> commit`, and `cd`-prefixed test runs used Pi's launch folder (plh starts in $HOME), bypassing the gate.
- [x] Red then green: projects inside a larger repository read repo-root-relative git paths, so the roadmap check could never pass.
- [x] Red then green: git timeouts or unreadable files raised through Laya as HTTP 400; the commit is now revised with the cause and the run is left unrecorded.
- [x] Red then green: changed files over 1 MiB are fingerprinted by size and mtime instead of being read on every run.
- [x] Red then green: two workspace polls with stale chat summaries created two chats for one project.
- [x] Comments describe behavior, not rationale.

Not changed: any failing run of a recognized runner counts as red (Pi reports only
error/no-error, so "command not found" cannot be told apart); a corrupt project chat
is skipped and replaced (chat writes are atomic, so this needs a manual edit).
