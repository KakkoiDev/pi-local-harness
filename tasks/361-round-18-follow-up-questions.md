# 361: Add round18's ten follow-up product questions

Kind: docs
No scenarios: designer review brief and pending-question record only; no UI/runtime change.

Request 2026-10-21: “add 10 product questions to round 18 and give me the prompt the transmit to agent”.

- [x] Red: dedicated round18 follow-up question brief is absent.
- [x] Record ten questions with recommendations clearly pending owner approval.
- [x] Link the round18 handoff and document designer validation, commit and push requirements.
- [x] Green: question/link coverage checked; the complete workflow is chained before this documentation commit.

## For the person

The original prompt is design/briefs/round-18-follow-up-questions.md. The owner subsequently delegated recommendations; design/briefs/round-19.md and its final follow-up record those decisions. The designer implemented them in round19, merged at 2e7407f6. Runtime work remains open in task333 and the other implementation tasks.

Verification: ten-question coverage, local links and diff whitespace checks pass. First full workflow failed because the configured optional Ruff binary no longer exists. Standard rerun passed Node but failed test_lanes.WebLaneTest.test_a_chat_and_a_comment_run_at_the_same_time_and_stop_on_their_own on lock cleanup; that exact test passed in isolation (0.314 s). Full workflow is not green; commit/push withheld and Green remains open. No runtime code changed.

Closeout: the initial failures above are historical. The optional Ruff tool is unavailable and remains explicitly skipped without downloads. Current documentation coverage and links pass; the final workflow is required by the commit chain, so any failure prevents this commit.
