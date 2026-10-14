# Documentation

Start here if you are an agent (or a person) about to change this repository.

- [contributing-for-agents.md](contributing-for-agents.md): where things live, the commands, the order of work Gate enforces, rules and recipes. Read it first.
- [../readme.md](../readme.md): what the app does and how to install and run it.
- [../harness/README.md](../harness/README.md): operations details (services, ports, data folder, validation).
- [../design/README.md](../design/README.md): the designer's source of truth and how it is synced.

Plans for larger projects (not started; each needs the person's go-ahead):

- [plans/151-ui-component-library.md](plans/151-ui-component-library.md): one render function per designer card, a `/ui` catalogue, behaviours split from markup.
- [plans/152-htmx-4-sse.md](plans/152-htmx-4-sse.md): htmx 4 with server-sent events instead of JSON polling; depends on plan 151.
- [plans/156-chat-orchestrates-worker.md](plans/156-chat-orchestrates-worker.md): each project gets a chat (first mate) and a worker; Gate starts the worker; one-at-a-time and parallel modes from a measured model capability.
- [plans/158-terminal-console.md](plans/158-terminal-console.md): terminal Pi as the harness console: slash commands, raw data, self-knowledge, admin changes (settings, models, Ollama) with confirmation, backup and log.
