# L-003: An edit did not match; a script rewrote the file

**Seen** 2026-10-15, web chat, finishing task 173. Gate sent an edit of the task file back: "Edit must identify one
exact occurrence" (event 289). Pi switched to a Python script. Its `s += s.rstrip()` appended the file to itself, and
its checkbox replacement looked for `- [ ] Red:` while the file said `- [ ] Red (browser…`, so no box was ticked
(events 290–293). It then overwrote the file (L-004) and removed its group write permission (`chmod g-w`, event 298,
never asked for).

**Why it matters** The model reads a refusal it does not understand as an obstacle and switches to a tool Gate checks
less closely (a shell script edits files without Gate knowing what it changes).

**Done** Checked: Gate's reason now names the edit, the file and the text, and says whether it is missing ("Read the
file again and copy the text exactly") or appears N times ("add surrounding lines") (task 176,
`tests/test_gate_enforcement.py`).

Enforced (plan 179, rule G-008): shell commands that write `ROADMAP.md` or `tasks/*.md` (redirects, `tee`, `sed -i`,
`perl -i`, scripts that open them for writing) are sent back: "Use the edit tool (or write for a new file), so Gate can
check the change." Test: `tests/test_gate_rules.py`.

**Open** `chmod` on project files is not checked (Gate cannot ask the person yet; a refusal would loop).
