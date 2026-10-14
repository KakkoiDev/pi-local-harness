# 181: Terminal Pi turns are marked "Not verified" too (G-012)

Kind: code

Follows task 179: G-012 marked web requests only.

- [x] Red (python): Gate's ledger answers `verification(cwd)` for the project around a folder (none outside a project).
  Red (node, extension test against the real Gate): a terminal turn that changes code and runs no passing test ends
  with "! Not verified." naming the files and G-012.
- [x] Gate serves `POST /verification`; the extension reads it before the turn starts (awaited) and when it settles, and
  shows the notice (display only; Pi does not read it). Web workers skip it: the web marks its own requests.
