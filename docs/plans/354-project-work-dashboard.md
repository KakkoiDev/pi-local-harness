# 354: All-project work dashboard

Owner request, 20 October 2026: one centralized dashboard showing what is being worked on per project, where agents are working, and where the person is needed for decisions, errors and recovery. Support the current agent honestly; accommodate multiple agents later without implying they exist today.

## Product requirements

- A global overview grouped by stable registered-project identity, covering active requests, queued work and unresolved attention items. Include terminal work only where host records provide reliable identity; explicitly disclose coverage gaps.
- For each project: saved phase, current request/task, agent identity and role when recorded, queued count, latest recorded activity/time and outcome. Show the task and tool/file location only when actually recorded and safe to display. Missing evidence means unknown, never invented progress, ETA or percentage.
- Put actionable attention first: unanswered decisions, plan approval, task validation, failed/interrupted requests and recoverable service errors. Distinguish waiting for a person from queued or running. A historical Gate refusal that the agent recovered from is not an unresolved incident.
- Each attention item explains what happened, what action is available and the exact project/request it affects. Deep-link to the existing authoritative question, plan, check-in, chat, Actions or error detail. Initially resolve there rather than duplicating approval controls.
- Opening or viewing an item does not resolve it. Answered/replaced questions disappear from the actionable list; resolved errors retain history. A running project may simultaneously need help elsewhere.
- Use existing queue, saved phase and authoritative choice/check-in state. A read-only code projection owns status and prioritization; model prose does not decide status, severity or completion. Preserve run/request IDs and evidence links.
- Live changes survive reload and multiple windows. Disconnected/stale data is visibly distinct from idle. Reconnect reconciles from saved state; dashboard failures never block chat. No private project content is copied into another project's model context.
- Future multiple agents: project -> request/task -> agent/run identity and ownership. Show concurrent runs and who is waiting on whom only when recorded. No scheduler, delegation, automatic retry or phase change is authorized by this dashboard.

## Design before implementation

Designer brief: `design/briefs/project-work-dashboard.md`. Use existing Pi Workbench 1-bit components and app-level Activity/Gate conventions. The designer decides entry point, hierarchy, copy, layout and responsive treatment. No new production UI is implemented by this plan.

## Implementation sequence

1. Inventory authoritative sources and gaps, including retention, terminal ownership, pending choices and error recovery. Define a bounded, stable-ID snapshot and lifecycle table; no model-based summarization is needed for status.
2. Test the read-only projection first: running plus waiting, independent projects, stale/replaced choices, recovered refusals, interrupted runs/restarts, unknown agent/location, duplicate events, bounded history and deleted/moved projects.
3. After designs arrive, implement the overview and deep links, with accessible navigation and Japanese strings. Reuse existing authoritative action endpoints; stale views must never answer another request's question.
4. Test routes and real browser journeys below, including reload, two windows, disconnected/reconnected service and phone layouts. Run workflow and all browser suites before shipping.

## Acceptance journeys to carry into implementation

- Two projects with running/queued work: overview shows the correct task and known agent per project; opening a row lands on that exact request's chat/Actions.
- One project awaits a choice while another runs: both states remain visible; answering the authoritative card clears only the relevant attention item across two windows and reload.
- A question is replaced before it is opened: dashboard refreshes or explains the stale link; it never offers an answer to the superseded card.
- Plan approval and task validation: dashboard links to existing explicit controls; viewing alone changes no state or phase.
- A failed or interrupted run: reason and recovery location are available; successful retry resolves attention while preserving failure history. Recovered Gate refusal does not remain a false alarm.
- Service connection drops and reconnects: stale data is labelled; no false idle/completed state; normal chat works after recovery.
- Phone and keyboard use: attention and active projects remain reachable, focus survives updates, and project switches preserve scope.
- Future synthetic concurrent-agent records: ownership remains distinct; absent agent identity is shown as unknown rather than fabricated.
