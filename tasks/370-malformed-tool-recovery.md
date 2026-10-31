# 370: Recover malformed tool JSON beyond truncated input

Kind: code

Request 2026-10-31: landing-page still failed on an invalid-character tool parser error, then worked on manual retry. Task 369 only recognized unexpected-end errors.

- [x] Red: reproduce invalid-character parser errors missing bounded recovery and readable error handling.
- [x] Recognize provider JSON syntax failures narrowly; keep arbitrary schema and connection failures unchanged.
- [x] Retry at most once before potential mutations; keep phase and approval controls authoritative.
- [x] Green: workflow, all browser suites, real Pi recovery, commit, push, install and smoke.

## Scenarios

### US-377 malformed planning JSON recovers without a retry click
Given the provider rejects tool JSON with an invalid-character error before a tool can mutate anything
When the harness retries with reduced context
Then a plan appears and still waits for my explicit approval

### US-378 an invalid tool call fails clearly and Retry still works
Given a malformed tool response remains unrecovered
When the request settles
Then I see a readable failure without raw arguments and Retry can get an answer

## Verification

The new invalid-character Node and Python regressions failed before implementation. Focused tests, required workflow and all six browser suites pass, including real Pi J18 with a scripted provider and browser US-378. The owner reported live-model success after manual Retry; no additional live-model run is claimed.
