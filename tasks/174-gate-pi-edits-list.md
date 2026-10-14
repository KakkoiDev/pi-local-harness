# 174: Gate checks Pi 1.1's edits list; Gate's errors reach Pi

Kind: bug

Report 2026-10-14 (a Pi run in the web chat, writing task 173): every `edit` came back "Gate HTTP 400", and Pi worked
around Gate by appending to ROADMAP.md with a shell command. Cause: Pi 1.1's edit tool sends
`{path, edits: [{oldText, newText}, …]}`; Gate's ledger read `args['oldText']`, raised KeyError, and the Gate server
answers any error with 400. The extension then dropped Gate's message, so Pi only saw the status code.

- [x] Red (python, test_gate_enforcement): an edits list is allowed and its result verified on disk; an ambiguous,
  missing, overlapping or empty edit is sent back to revise; edits as a JSON string and the older single
  oldText/newText shape still work.
- [x] `gate/ledger.py` `apply_edits`: each edits[].oldText must occur once in the original and not overlap, applied as
  Pi applies them; the expected file's hash is what the audit checks.
- [x] Red (node, extension test against the real Gate): a Gate error reads "Gate HTTP 400: <Gate's reason>"; an edit
  with a list is allowed and verified.
- [x] The extension passes Gate's error text on.
