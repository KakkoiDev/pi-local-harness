# 363: Verify and bound simultaneous model generation

Kind: code

Request 2026-10-23: "Add a short can parallelize capability smoke test per exact model digest, backend/version and serving configuration; bounded concurrent chats and actions; default GPT-OSS 20B and specialized task review prompts. Commit and push."

- [x] Red: streaming evidence, stale/error handling, total bounds, workspace and history isolation.
- [x] Implement configuration-specific smoke records, managed serving, bounded scheduling and task review roles.
- [x] Green: workflow and browser suites, bounded live smoke if resources permit.

## Scenarios

### US-355 Model names show configuration-specific parallel capability
Given installed local models with unknown, supported, unsupported or failed smoke results
When I open the model menu
Then each name shows its capability and only current verified configurations enable parallel work

## For the person
Parallel work uses measured token progress and at most two separate projects; GPT-OSS 20B is the default.
Tried it: workflow verification, all browser suites and live native/proxy two-stream checks passed.
The managed server uses 8K contexts; long histories and answer quality remain unproven by this smoke.

## Verification notes

Focused Python tests: 55 passed before the final additional edge cases; new capability/admission/cancellation tests: 17 passed.
Node suite: 225 passed, 2 pre-existing skips; bounded review lock regression passes.
Live native and production proxy smoke: supported on isolated Ollama 0.40.7, GPT-OSS digest a0b38d0b19f7c5dd3589e5e6598edfed41c81969d73f9e4774011c1328e9dad8, two 8K slots, current matching admission 2. Temporary instance stopped; old 16-slot evidence not imported. Raw local evidence /private/tmp/plh-production-parallel-20261023/.
Browser US-355 and golden journey 15/15 passed. Final frozen-source workflow verification passed (Python and Node); all browser suites exited 0, including 101 stories and the 15-step golden journey. Cancellation, queued-admission races, empty output, inherited-setting privacy and nested workspace exclusion are covered.

Cancellation follow-up: Stop now survives the interval between a queue claim and process startup, and a broken input pipe caused by Stop stays “stopped”. Regression tests cover both. Model switching and measurement also wait for already-claimed jobs; nested/aliased workspaces retain exclusion. Browser helper imports no longer auto-start a duplicate story suite during the golden journey.
