# 358: Run real process-crash tests in the ordinary backend suite

Kind: code
No scenarios: test infrastructure and internal backend contracts only; no runtime or UI behavior changed.

- [x] Red: six tests fail because the intentional process-crash fixture does not exist.
- [x] Add isolated hard-exit fixture and test queued/claimed work, effect-before-result, completed work and Markdown replacement boundaries.
- [x] Confirm interrupted work never automatically repeats and another project still executes after restart.
- [x] Green: focused six tests and complete workflow pass; document broader parity gaps honestly.

## Evidence

Red: tests/test_process_crash_recovery.py failed six cases with the absent fixture. Green: all six pass after adding tests/fixtures/crash_queue.py, using real subprocess exit 79 and fresh WorkQueue instances. Ordinary unittest discovery includes the module; no browser/model/network is needed. This demonstrates process-crash conservative interruption, not power-loss durability, safe-tool replay, choice atomicity or full Pi Durable parity. Those remain task 357.

## For the person

Six real process-death checks now run with the backend test suite. They verify persisted queue work and complete Markdown records survive the tested boundaries without automatically repeating an uncertain effect.
Tried it: six focused cases passed in scratch folders; wider conformance and library extraction remain open.
