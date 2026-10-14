# 156: Plan the chat orchestrating a worker

Kind: planning

Request 2026-10-14: "each projects have 2 agents: a chat agent and a work agent. the chat agent is a little bit like firstmate … can order the worker to start working on something. the choice to start the worker should be gated by a system 1 decision. … while the woker is busy, the chat agent is still available for a chat. … switch the way the harness behave depending on if the model can handle parallel runs or not." Follow-up: "I was thinking about the gate deciding automatically … What are the pros and cons?", "The chat gets priority", "Yes to avoid workers overriding each other", and on the capability: "the first time ever the model is loaded (missing data) and have a plh cli way of updating it later".

- [x] Plan: `docs/plans/156-chat-orchestrates-worker.md` (roles, one-at-a-time and parallel modes, proposal → worker card → summary, Gate's start rules, capability check, phases, phase 2 pool, risks).
- [x] Brief: `design/briefs/chat-orchestration.md` part B (cards, paused state, model menu note, phone).
- [x] Decided: the chat gets priority at the worker's next step (D2); one worker per project (D3).
- [x] Decided D1: the soft gate (Gate decides by rule; an automatic start waits 10 s with Not Now; softer cases ask). The person: "ok for the soft gate".
- [ ] Boards for part B from the designer.
