# 213: Unverified changes are committed too, marked, so every request can be undone

Kind: code

Decision 2026-10-15 ("do recommended"): the designer's DoneRow shows "! Not verified" with Undo This Request…, and only
a commit can be undone, so the harness commits unverified changes too, marked.

- [x] Red (python, `tests/test_paperwork.py`, `tests/test_undo.py`; node, `tests/harness/notices.test.mjs`): an
  unverified request is committed as "<title> (task 003, not verified)" with "Not verified: <reason>." in its body; its
  task and roadmap line stay open; its commit is returned; the undo preview says `verified: false`; the terminal says
  "Committed, not verified." with the commit.
- [x] The web answer no longer carries the G-012 line when the request has a commit: the DoneRow says "! Not verified"
  and "Pi did not try it after the last change." (DoneRow card). Without a commit, the line stays in the answer.
- [x] G-013, AGENTS.md's paperwork paragraph and `harness/gate-rules.md` say so. The bench counts a run as verified
  only by a commit not marked "not verified".
- [x] Green: verify_workflow, both browser suites.
