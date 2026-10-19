# Brief: round 14 (draft): test blocks next to App Blocks

Date: 2026-10-19. The person wants "blocks of reusable tests", built like a UI library: every App Block gets a test
block, and small local models write tests by picking blocks, never by inventing selectors or waits. Full rationale:
docs/plans/328-test-core.md ("Test blocks") and tasks/329.

## Please design

1. **The fixed step vocabulary**, in English and Japanese, per App Block group: the Given (world), When (person's
   action) and Then (what a person sees) phrases each block offers, with their parameters, e.g. DataTable: "Given a
   table with {n} rows", "When I sort by {column}", "Then row {n} shows {text}". Short, unambiguous, one meaning each.
2. **A test-block card** for each App Block, in the same form as the App Block cards: the steps it offers, the states
   it can check (empty, loading, error, success), keyboard and phone variants, and its self-test.
3. **The scenario view in a task** (the workbench, 1-bit): how Given/When/Then scenarios appear in a task file, on the
   plan card and on the check-in (each scenario's test: passed, failed, missing; "Removed: <control> and its test").
4. **The test playground**: a page like the Blocks Playground where each test block runs live against its App Block
   demo, showing each step highlighting the control it uses.
5. **The step picker** when Pi writes scenarios: how an unknown step is refused with the nearest known steps (for the
   person's eyes in Activity, not as a question card).
