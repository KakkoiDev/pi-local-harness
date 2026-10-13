# 91: Rename task kind config to chore

Kind: code

Request 2026-10-13: "make best call decisions" on the open item "rename kind config to chore". Decision: rename. `config` named the wrong thing (task 65, a file removal, needed it); the kind means "tests must pass, no failing run needed".

- [x] Red (`tests/test_protocol.py`): a `Kind: chore` task commits after a green run without red; `Kind: config` is now unknown and the reason lists `Kind: code|chore|docs|planning`. Fails with `laya/protocol.py` stashed.
- [x] `laya/protocol.py` `KINDS`, `KIND_FIX` and the code-in-docs reason.
- [x] `readme.md`, task 54 table (dated note), task 65 `Kind: chore`.
- No alias for `config`: no task file in this repo or `~/pi-local-harness-data` uses it. A project that does gets the REVISE reason naming the fix.
