# Designer prompt: centralized project work dashboard

Design a global overview for **Pi WorkStation**, using Pi Workbench 1-bit and existing app-level Activity/Gate conventions. Read `docs/plans/354-project-work-dashboard.md` and `design/briefs/agent-scope-and-context.md`. Coordinate with round 16 Actions observability; this dashboard is the cross-project overview, Actions is detailed run evidence.

The person wants to see everything currently being worked on per project, where agents are working, and where their help is needed for decisions or errors. Prioritize a quick answer to “What needs me?” and “What is happening?”. Use terse, nontechnical copy and existing components first.

Draw desktop, tablet and phone. Decide the global entry point and relationship with Projects/Activity; do not introduce conflicting navigation. Show a project with running work, queued requests, another waiting for an answer, a plan awaiting approval, a task awaiting validation, and a failed/interrupted request. A project may be active and need attention simultaneously. Show task/request identity, actual agent identity when known, latest recorded tool/file activity and freshness; avoid unsupported progress percentages and ETAs.

Draw empty/idle, loading, unavailable/stale connection, reconnect, unknown location/agent, moved/deleted project and long project/task names. Draw two-window updates and a question resolved or replaced before its dashboard link is followed. Attention clears on authoritative resolution, never merely on opening the dashboard. Keep history reachable.

Use deep links to existing question, plan, check-in and recovery controls for the first version. Do not duplicate approval controls or ask the person to administer guardrails. No automatic retries, agent delegation or phase changes. Leave future multiple-agent ownership legible without suggesting multi-agent execution already ships.

Deliver named boards, exact copy, interaction/focus rules, Japanese-ready string inventory, responsive states and component changes. Tie each board to the acceptance journeys in plan 354. New UI waits for these designs.
