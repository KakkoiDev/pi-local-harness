# 257: Return to the end of a running chat from Activity

Kind: code

Found during the requested bug hunt, 2026-10-18. The existing bug-173 end-to-end test fails consistently: returning to a running answer centers the request and leaves a 10–11px gap instead of reaching the end.

Scope: js/chat.mjs, js/workspace.mjs, js/chat-state.mjs, tests/harness/chat-navigation.test.mjs, docs/handoff/claude-return-2026-10-17.md.

- [x] Red: existing browser test reproduced twice, measured in an isolated diagnostic; unit cases for running, queued, completed and absent request elements.
- [x] Keep running/queued chats at the latest answer when opened from Activity; retain centering/highlight for historical completed requests.
- [x] Integration/E2E: actual Activity → Open in Chat journey passes its existing strict scroll assertions without weakening them; existing chat and design suites pass.
- [x] Green: focused Node tests and full workflow; document evidence and remaining bugs.

This changes behavior of an existing navigation action, not the UI design. No personal project, data, download or running service is changed.

Result: four focused Node tests passed. Both complete browser suites (design and chat) passed, including the unchanged bug-173 scroll assertions. Full Python/Node workflow passed before the chained commit. An initial new-module 404 was corrected by using the existing served chat-state module.
