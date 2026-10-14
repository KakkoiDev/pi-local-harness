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

**Open** Enforced: Gate could send back shell commands that write a project's Markdown in place (a heredoc script, `sed
-i`, `>` or `>>` onto `ROADMAP.md` or `tasks/*.md`) with "use edit or write, so Gate can check the change"; and ask
before `chmod` on project files.
