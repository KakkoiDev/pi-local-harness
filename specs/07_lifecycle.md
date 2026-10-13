# Spec: The Operational Lifecycle

Current implementation: the global pi extension starts Gate/API and the Pi Workbench web server (`plh`; the portfolio webserver was removed in task 65), displays bound ports, loads memory, and starts deterministic monitoring. Whisper loads only for audio input. See `tasks/20-boot-sequence.md` and `harness/README.md`. The PostgreSQL, analytics, and supervisory dashboard architecture below remains a future proposal.

> 2026-10-13: everything below is the original proposal, not the running system. `sentinel.py` is retired (its checks live in `harness/watch.mjs` and `harness/memory.mjs`, see `specs/03_sentinel.md`); there is no PostgreSQL.

This specification defines how the entire "Guardian Trio" is initialized, executed, and terminated.

## 1. Boot Sequence (`./start.sh`)

The startup script orchestrates the launch of the high-reliability ecosystem. It initializes the components in a specific order to ensure dependencies are met.

### 1.1 Launch Order and Dependencies
1.  **`agent_api.py` (The Actor/Brain)**:
    - Starts the REST HTTP server.
    - Initializes the `ActionProposal` registries and `decision_engine`.
    - *Dependency*: Requires database availability (PostgreSQL) and LLM connectivity.
2.  **`sentinel.py` (The Watchdog)**:
    - Launches as a background daemon.
    - Starts monitoring the `session.log` for loop detection and stall detection.
3.  **`gate_monitor.py` (The Analytics Engine)**:
    - Aggregates `audit.jsonl` and `session.log` into a real-time stream.
    - Provides the data source for the Pilot Console.
4.  **`pilot_console.py` (The UI)**:
    - Servess the React-based Dashboard via a web server.
    - Connects to the `agent_api` via SSE for real-time visual feedback.

### 1.2 Failure Modes during Boot
- **DB Unavailable**: `agent_api` fails. The lifecycle aborts.
- **LLM Unreachable**: `agent_api` starts in "Degraded Mode" (offline tools only) or fails, depending on configuration.
- **Sentinel Failure**: If `sentinel.py` fails to start, the system triggers a `CRITICAL_RELIABILITY_WARNING` and continues (the watchdog is a safety mechanism, but its absence is a direct risk).

---

## 2. The Execution Loop (The Run)

A "Run" is the lifecycle of a single user request/workflow.

1.  **Ingestion**: User request enters via API or Pilot Console.
2.  **Planning Phase**: The Agent generates an execution plan.
3.  **The Interception Cycle (The Core Loop)**:
    - **Actor Proposes**: Agent generates `ActionProposal`.
    - **Gate**: (Interceptor) Validates proposal against `judges.md`.
    - **Action**: If allowed, the tool is executed. If blocked/revised, the loop returns to the Actor.
    - **Sentinel Monitor**: Continuous background check for loops/stalls.
    - **Gate Auditor**: (Post-turn) Analy
4.  **Conclusion**: The workflow reaches a terminal state (Success, Failure, or Escalation).

---

## 3. Shutdown & Cleanup

The system supports a graceful shutdown to prevent data loss and corruption.

### 3.1 Graceful Shutdown
Triggered by `SIGINT` (Ctrl+C) or a `SHUTDOWN` command.
- **Actor**: Holds current turns until completion or state-flush.
- **Gate**: Finalizes the current audit/judgment entries and flushes them to `audit.jsonl`.
- **Sentinel**: Closes the file handle for `session.log` and terminates.
- **Pilot Console**: Closes SSE connections and terminates.

### 3.2 Emergency Shutdown (Killswitch)
Triggered by a detected loop or failure in the Sentinel.
- **Immediate Termination**: All processes are killed.
- **State Preservation**: The current `active_run_id` is written to `shutdown_recovery.json` to allow for post-mortem analysis.
