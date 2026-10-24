# location-share core-loop investigation — 25 October 2026

Read-only inspection of the owner’s project and harness records. No project file, conversation or task was changed, and no project test/package installer was executed. No private transcript or raw tool arguments are reproduced here.

## Observed

- The project remains essentially its browser starter: git has its initial starter and approved-plan commits, with only a generated stylesheet untracked at inspection. The Preview still showing notes agrees with the absence of implementation commits.
- The registered project uses static + phone packages and offline, multiplayer, install and QR capabilities. Its approved plan instead calls for React Native scaffolding, native map components and a Socket.io server. Those are a different architecture from the installed browser starter. The current phone package is browser installation (PWA); native Capacitor packaging remains separate planned work. Approval happened through Run on its own; it does not prove the architecture was the person’s intended choice.
- Later replies continue to propose setup and approvals despite Implementation being selected. The per-turn context producer provides file snapshots and recipes but no explicit authoritative current phase, approval state or current task. Persistent instructions describe phase rules but cannot supply the current state.
- The session contains multiple 8,192-token output-limit stops, truncated JSON tool-call parser failures and streams without a finish reason. These are distinct from a deliberate pause for the person. Task 367 addresses empty output-limit recovery; Nonempty truncated answers can also be treated as completed; that case and the other error classes still need specific reproduction before changing retry policy.
- The model’s prose says work was created when no corresponding implementation commit exists. A successful chat response is not evidence of a built app. The authoritative check-in/test/commit evidence must remain separate from generated prose.

## Next

Task 368: refresh an authoritative execution brief from Gate on each input; keep it outside selected-file trimming, include the active approved task/status and existing package/capability facts, and test what the real provider receives. Do not silently replace the user’s approved plan or modify this project to make the test pass.

Further audit: explicitly requested builds that end in setup prose need a bounded harness check/recovery grounded in task and file-change evidence, while ordinary questions in Implementation must remain answerable without forcing a build. Truncated tool-call and malformed-stream retries need idempotency/cancellation tests. Stack migrations need an explicit recorded product decision, rather than accidental starter replacement.

Context inspection: the existing “What Pi uses” receipt shows selected files; it does not expose the complete effective model input or live tool declarations. A designer brief should cover an inspectable execution brief, current task/phase, effective model window/output allowance, selected files versus history, recovery omissions, and safe copy/export excluding credentials. No new inspector UI is claimed shipped.
