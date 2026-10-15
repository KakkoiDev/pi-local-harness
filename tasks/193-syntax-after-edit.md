# 193: A syntax check after every edit

Kind: code

Strategy 2 of the ones picked on 2026-10-15, borrowed from OpenCode (language-server diagnostics after each edit), in a
dependency-free form: a small model learns about a broken edit at once, not three steps later.

- [x] Red (python, test_gate_rules): after a write or edit, Gate's audit checks Python (compile), JSON (parse) and
  JavaScript (`node --check`); a file that does not parse is named with its line and reported (`syntax`); a good edit
  or a Markdown file says nothing. Red (node, extension test against the real Gate): Pi reads "broken.py does not parse:
  … at line 1. Fix it before going on." in the same tool result.
- [x] `syntax_problem` in gate/ledger.py; the audit's note joins the paperwork's note.
