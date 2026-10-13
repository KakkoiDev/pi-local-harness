# 129: Gate events know their project and source

Kind: code

Request 2026-10-13: "design updated" (re-synced in task 126); build what the agent-scope brief asked for. Inventory of design vs code: 2026-10-13 review.

- [x] Red (python): ledger events store cwd → project and from Web/Terminal; /api/workspace carries today's Gate counts.
- [x] Gate Project popup and From column (browser).
- The extension sends `source` (web when it runs in a web worker, i.e. PI_HARNESS_SHARED_PORT is set); the ledger keeps cwd and source through the audit; `WebChat.gate_events()` maps cwd to the registered project by longest path. Gate rows are `div role="row"` (C_GateDesk) so the project can be a link. Event Info From reads "Web · request 14:02".
