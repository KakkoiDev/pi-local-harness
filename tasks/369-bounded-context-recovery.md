# 369: Keep recovery from exhausting a small model window

Kind: code

Request 2026-10-31: landing-page cannot produce a plan. Four canary recoveries repeatedly inserted AGENTS.md into history; later plan calls failed with incomplete JSON near the isolated server’s 8192-token limit. Recovery must remain usable when Pi cannot compact the session.

- [x] Red: reproduce canary replay, legacy instruction duplication and incomplete tool-call failure.
- [x] Keep memory in the refreshed system prompt; missing markers are diagnostics, not a reason to regenerate a usable answer.
- [x] Shorten old recovery payloads only in effective context; preserve the saved session and current request, phase and approvals.
- [x] Fall back to recent context when compaction cannot run; do not enlarge or restart the serving configuration silently.
- [x] Recover incomplete tool JSON once only when no potentially mutating call completed; repeated errors fail clearly.
- [x] Green: required workflow and all browser suites including real Pi; commit, push, install and smoke.

## Scenarios

### US-372 a missing diagnostic marker does not regenerate my answer
Given Pi answered without the diagnostic marker
When the turn completes
Then my answer is kept without aborting, compacting or asking it again

### US-373 old recovery instructions do not fill the next model request
Given saved history contains repeated recovery messages with AGENTS.md
When the next model request is assembled
Then duplicated memory is removed from the effective history while saved history and my requests are unchanged

### US-374 an incomplete planning call recovers without a retry click
Given Planning receives an incomplete tool JSON response before any mutating tool completes
When the harness retries once with reduced context
Then a valid plan can appear without changing phase or inventing approval

### US-375 compaction failure falls back to recent context
Given Pi cannot compact a small session
When the harness resumes
Then it uses reduced context with current instructions and keeps the saved conversation

### US-376 an exhausted incomplete tool call fails clearly and Retry still works
Given the automatic recovery did not produce a complete tool call
When the request settles
Then it fails with a readable message without raw arguments and I can Retry successfully

## Verification

Red: canary replay, duplicate memory and missing parser recovery failed before implementation. Focused Node regressions pass. The required workflow (Python and Node) and all six browser suites pass, including real Pi J17 with a scripted provider and the exhausted-error Retry story US-376. The provider error fixture uses HTTP 400 to exercise Pi’s error event without SDK-level transport retries hiding it; it reproduces the parser error text, not a live Ollama parser. No live GPT-OSS success or automatic context-window growth is claimed.
