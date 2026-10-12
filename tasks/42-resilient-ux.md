# 42: Draft safety and resilient live UX

Durable drafts, recoverable save conflicts, stable live polling, connection retry, immediate queue feedback, and comprehensive browser regressions.

- [x] Write regression checks and confirm the existing UX fails them.
- [x] Implement and verify desktop/mobile interactions.
- [x] Update docs, run full regressions, and commit.

Verified: durable Japanese chat/document drafts; stale revisions preserve drafts across reload; draft download/discard; live polling preserves reasoning disclosure and reply drafts; reconnect; keyboard search; correct project restoration; queue cancel/Stop; and all four tabs without overflow at 320, 390, 768, and 1440 pixels. Full Python suite, Node harness regressions, and Chromium boundary-fixture browser flows pass. Physical-device and non-Chromium testing are not claimed.
