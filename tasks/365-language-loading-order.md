# 365: Keep the latest language choice when translations load late

Kind: code

Request 2026-10-24: implement as many tasks as possible; release checks exposed stale language rendering.

- [x] Red: a delayed Japanese dictionary cannot install a translator after the person switched to English.
- [x] Apply only the latest language request; stale requests never attach observers or change the title.
- [x] Green: unit, browser story, full workflow and browser suites.

## Scenarios

### US-360 a delayed translation cannot undo my newer language choice
Given a Japanese translation is still loading
When I choose English before that download finishes
Then existing and newly added controls stay in English

## Verification

The delayed-dictionary unit and browser regressions both failed before the fix. Latest-choice, overlapping-load and stale-error checks now pass. Full Python/Node workflow and every browser suite passed, including the golden journey.
