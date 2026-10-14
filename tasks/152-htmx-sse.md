# 152: Plan the move to htmx 4 with server-sent events

Kind: planning

Request 2026-10-14: "plan, don't do it yet, just prepare the documentation for the projects: … migrate to latest HTMX version, use SSE".

- [x] Facts checked: no htmx today (dropped after task 32); the page polls JSON every 1.8–2 s; an unused NDJSON send route bypasses the queue; htmx 4.0.0 released 2026-08-28 (npm tag `next`), its `hx-sse` extension on fetch streams; htmx 2.0.11 and `htmx-ext-sse` 2.2.4 are the 2.x line.
- [x] Plan: [docs/plans/152-htmx-4-sse.md](../docs/plans/152-htmx-4-sse.md) (decisions, wire format, eleven steps, risks).
- [ ] The person answers the open questions (htmx 4.0.0 or 2.0.11; keep the JSON APIs for scripts and tests).
- [ ] Start after plan 151's components exist for the parts each step moves.
