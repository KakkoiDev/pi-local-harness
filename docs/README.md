# Documentation

Start here if you are an agent (or a person) about to change this repository. First of all: [../CONSTITUTION.md](../CONSTITUTION.md), how the project uses AI (System 1 decides, System 2 produces).

- [contributing-for-agents.md](contributing-for-agents.md): where things live, the commands, the order of work Gate enforces, rules and recipes. Read it first.
- [../README.md](../README.md): what the app does and how to start; [reference.md](reference.md): how it works in detail.
- [../harness/README.md](../harness/README.md): operations details (services, ports, data folder, validation).
- [../design/README.md](../design/README.md): the designer's source of truth and how it is synced.
- [user-stories.md](user-stories.md): every user story with its acceptance, surfaces and end-to-end test (the `stories` browser suite, `tests/harness/stories.test.mjs`), and the coverage table.
- [lessons/README.md](lessons/README.md): mistakes the local model made, the evidence, and what the harness now does about each (enforced, checked, made easy, or only told).

Plans for larger projects (not started; each needs the person's go-ahead):

- [plans/151-ui-component-library.md](plans/151-ui-component-library.md): one render function per designer card, a `/ui` catalogue, behaviours split from markup.
- [plans/152-htmx-4-sse.md](plans/152-htmx-4-sse.md): htmx 4 with server-sent events instead of JSON polling; depends on plan 151.
- [plans/156-chat-orchestrates-worker.md](plans/156-chat-orchestrates-worker.md): each project gets a chat (first mate) and a worker; Gate starts the worker; one-at-a-time and parallel modes from a measured model capability.
- [plans/158-terminal-console.md](plans/158-terminal-console.md): terminal Pi as the harness console: slash commands, raw data, self-knowledge, admin changes (settings, models, Ollama) with confirmation, backup and log.
- [plans/179-gate-rules.md](plans/179-gate-rules.md): Gate's rules as one always-enforced registry in code (each with a message, a lesson and a test), listed by `/gate rules`, summarised into the prompt from the same source; AGENT.md keeps only what cannot be enforced.
- [plans/184-autopilot.md](plans/184-autopilot.md): Pi only writes content; the harness makes and ticks the task, commits when verified, wakes Pi when it loops, hangs or stops with work open, reports every incident, and offers Ask Pi to Retry… only for a genuine stop.
- [plans/189-bench.md](plans/189-bench.md): fixed scenarios run with the real model through the harness; one result line per run (model, harness build, solved, verified, wake-ups, refusals) for improving the product.
- [plans/198-one-stack.md](plans/198-one-stack.md): an opinionated harness: one stack (HTMX 4, Basecoat, Python, SQLite, PWA) the harness knows completely (template, generators, current reference, checks, Gate rules), logic as pure tested blocks; measured on the bench.
- [plans/236-plan-mode.md](plans/236-plan-mode.md): plan mode, always on: Pi asks about every decision with choices (the recommended first, "Something else…" last), proposes a plan, waits for a yes, builds task by task with check-ins; Auto-accept runs it alone.
- [handoff/gpt-sol.md](handoff/gpt-sol.md): the prompt for an agent taking over tasks 227-242.

Review and return handoff (2026-10-17):

- [handoff/claude-return-2026-10-17.md](handoff/claude-return-2026-10-17.md): work delivered since Claude’s handoff, commit references, verification limits and remaining work.
- [reviews/2026-10-17-test-project-log-review.md](reviews/2026-10-17-test-project-log-review.md): privacy-edited review of the two test-project sessions and the capability-first Project Start direction.
- [bench/2026-10-16-pong/README.md](bench/2026-10-16-pong/README.md): yesterday’s Pong comparison, retained per-run evidence and development-build caveats.
- [plans/253-one-app-many-packages.md](plans/253-one-app-many-packages.md): one Python/HTMX application foundation, exported through full-stack, browser-only and mobile adapters; proposal and proof sequence.

## Core libraries

- [Claude Code handoff and exact dependency pins](handoff/core-libraries.md)
- [gaming-core inventory and future Pi integration](handoff/gaming-core.md)
