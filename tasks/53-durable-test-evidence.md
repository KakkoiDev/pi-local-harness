# 53: Durable test evidence

Kind: code

Request 2026-10-13: an interrupted test run must not count, and Laya's record must survive
a restart. Pi 0.87.1 reports a run aborted mid-execution as an error result
(`agent-loop.js:573`, `bash.js:255` "Command aborted"), so Laya records it as red today.

- [ ] Red: a test run whose output ends in "Command aborted" is recorded as red.
- [ ] Red: a new `Protocol` loses the runs recorded by a previous one.
- [ ] Aborted runs are not recorded.
- [ ] Runs are written to `<data>/laya-protocol.json` (per project: time, passed, fingerprint) and loaded at start.
- [ ] Green: full suite.
