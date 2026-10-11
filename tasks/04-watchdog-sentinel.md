# Task: Implement External Sentinel (Watchdog)

## Description
Implement a separate "System 1" monitoring process to act as an external watchdog. This process will monitor the agent's activity and use a fast decision engine (Laya/Ollama) to detect reasoning loops and trigger a hard reset if a loop is identified.

## Requirements
- **Sentinel Script:** A Python-based service (`sentinel.py`) that runs as a separate process.
- **Observability:** The script must monitor a `session.log` file (which the Agent will append to) or the `incident_log.md`.
- **Detection Engine:** The script must send batches of recent activity to the local Ollama/Laya endpoint to perform high-speed classification.
- **Intervention:** If a loop is detected, the script must be capable of signaling a "Break" (e.g., via a signal or by writing to a "kill-switch" file that the agent checks).
- **Integration:** Update `AGENT.md` to include the "External Sentinel" as the primary mechanism for loop prevention.

## Status
- [ ] Initialize `sentinel.py` and the `session.log` mechanism
- [ ] Implement the classification logic (System 1 pass)
- [ ] Implement the "Kill Switch" / Reset trigger
- [ ] Test the loop detection with a simulated "loop"
