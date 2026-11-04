# 373: Pi cannot read secret files, and test runs cannot either

Kind: code
No scenarios: the person sees and types the same; Pi's reads of secret files are refused with a rule message, and test runs see fewer of the person's files.

Request 2026-11-04: "do recommended actions" of docs/reports/outside-tools-study-2026-10-30.md, rank 2: a Gate rule for
protected reads plus a wider `SECRET_FOLDERS` (OS-3), which fixes F2 and F3.

- [x] Red (unit, G-018): with a fake HOME, `read_file` of a key in `~/.ssh`, of `~/.npmrc`, or of a symlink in a project
  that points into `~/.ssh`, and shell reads such as `cat ~/.npmrc`, `head -n 5 .zsh_history` (from HOME) or
  `grep -r x ~/.aws`, are refused with "Ask the person to paste the value you need"; reads of project files and of
  `~/.npmrc-notes.txt` are allowed.
- [x] Red (unit): `SECRET_FOLDERS` holds the wider list of the study (`.npmrc` to `Library/Cookies`), and a sandboxed
  test run cannot read a fake `~/.npmrc`, `~/.zsh_history`, `~/.claude.json` or Chrome profile file.
- [x] G-018 in `gate/rules.py`, checked by `GateEngine.rejection` with the call's folder; one list,
  `gate.sandbox.SECRET_FOLDERS`, for Gate and the sandbox; `harness/gate-rules.md` regenerated.
- [x] Green: `python3 tests/verify_workflow.py`.

Limits: a deny list is never complete. The rule reads the words of a command, so a path built at run time (a glob,
a variable, `cd ~ && cat .npmrc`) is not seen. A recursive read of a folder that contains a secret folder (Pi's
grep, find or ls of `~` or `..`, `rg ... ~`, `find ~`, `grep -r x ..`, `ls -R ~`) is refused (review, 2026-11-04), which
also refuses ordinary searches of HOME; one with no folder named (`rg x` run from HOME) is not seen. The sandbox
remains the backstop, for test runs only.

## Verification

Red first: with only the new `cwd` argument, the rule tests failed (`None != 'G-018'`), and the sandbox test failed on
the old list. Both pass now and fail again with the wider list reverted. Fake HOME and fake files only. npm still works
in the sandbox with a fake `~/.npmrc` hidden (it reads its defaults). The prompt summary budget in
`tests/test_gate_rules.py` went from 3000 to 3200 characters: the summary was at 2976 and G-018's line is 128.
