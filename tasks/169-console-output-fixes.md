# 169: Console output: a missing config.json is fine; the queue names projects

Kind: code

Found 2026-10-14 while collecting console output for the terminal brief.

- [x] Red (python): `/doctor` no longer reports a missing config.json as a problem (plh writes it with the defaults at its next start); `/queue` shows project names and "10-14 10:31" instead of ids and full timestamps.
- [x] Green: verify_workflow.
