# 176: Gate says which edit does not match, and why

Kind: code

Found 2026-10-15 while checking Pi's run on task 173: Gate answered an edit with "Edit must identify one exact
occurrence." and nothing else. Pi could not tell which edit or why, so it wrote a Python script that duplicated the task
file, then overwrote the whole file with a rewritten version (losing its own root-cause analysis), and no checkbox got
ticked.

- [x] Red (python, test_gate_enforcement): the reason names the edit (`edits[1]`), the file, a short quote of the text,
  and whether it is missing ("Read the file again and copy the text exactly") or appears N times ("add surrounding lines
  to make it unique").
- [x] `gate/ledger.py` `apply_edits` says so.
