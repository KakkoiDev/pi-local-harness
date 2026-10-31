# 371: Render triple-backtick code in chat

Kind: code

Request 2026-10-31: Markdown in chat should handle triple-backtick blocks, including the escaped Markdown snippet in the landing-page reply.

- [x] Red: reproduce a fence directly after prose, a wholly escaped fence, and escaped fences inside table cells.
- [x] Render code as inert text using the existing code-block presentation; preserve normal code escapes and the stored message.
- [x] Keep table columns intact when fenced code contains pipes; cover reload and a phone viewport.
- [x] Green: unit tests, required workflow and all six browser suites; commit, push, install and smoke.

## Scenarios

### US-379 chat renders triple-backtick code blocks including escaped snippets
Given Pi replies with real and escaped fenced snippets, including code in a table cell
When I read the reply and reload it on a phone-sized screen
Then the code is readable, source escapes are preserved, table columns stay intact, and HTML inside the code never executes

## Verification

Fenced-code unit regressions failed before implementation. The focused browser story reproduced asset delivery and combined escaped-block/table defects, which were fixed. Unit tests, required workflow and all six browser suites pass; US-379 covers rendering, inert HTML, preserved source escapes, table pipes, reload and phone width. No stored message or owner project was edited.
