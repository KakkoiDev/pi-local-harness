# Master Specification: The Guardian-AEMA Framework

## 1. System Overview: The Guardian Trio
The system is designed as a high-reliability, multi-agent ecosystem comprising three specialized layers that ensure the **Actor** remains compliant, the **Sentinel** ensures continuity, and the **Pilot Console** provides human oversight.

### 1.1 The Actor (The Worker)
The Actor is the LLM-driven engine that performs tasks. It communicates its intent via structured `ActionProposal` packets.

### 1.2 Laya (The Compliance Layer)
A dual-phase interceptor that gates the Actor's actions.
* **Phase 1: The Gatekeeper (Pre-Action):** Intercepts proposed tool calls to validate policy (e.g., prevents unauthorized `edit` operations).
* **Phase 2: The Auditor (Post-Turn):** AnalyIdxes the consequence of the turn (file changes + reasoning) to issue a final `JudgmentEvent`.

### 1.3 The Sentinel (The Reliability Layer)
A continuous background daemon monitoring the `session.log`.
* **Loop Detection:** Uses similarity thresholds to flag reasoning loops.
* **Stall Detection:** Triggers an alarm if no reasoning/command output is detected for >60 seconds.

### 1.4 The Pilot Console (The Supervisory UI)
A web-based dashboard for real-time monitoring, reasoning visualization, and meta-cognition.

---

## 2. The Unified Data Model (The Protocol)
All system components communicate via a standard set of JSON-serialized messages.

### 2.1 ActionProposal
`{ intent, reasoning, tool_call, authorization, reruns, classification }`

### 2.2 JudgmentEvent
`{ proposal_id, decision (Allow|Block|Revise|Escalate), reasoning, verification_evidence }`

### 2.3 Audit Log
A append-only `audit.jsonl` containing every judgment, tool result, and decision.

---

## 3. The Evaluation Framework (The Learning Loop)
Enables testing through "Golden Datasets" to ensure regression-free development.

* **Capture:** Extracting a "True Event" (Input + Trace + Ground Truth) from the audit log.
* **Replay:** Re-injecting the event state into the agent to verify compliance.
* **Regression Testing:** Automated verification that updated code does not violate historic "Ground Truth" cases.

---

## 4. Operational Lifecycle
* **Boot Sequence (`./start.sh`):** 
  1. Launch Actor-API.
  2. Launch Sentinel (Background).
  3. Launch Laya-Monitor (Background).
  4. Launch Pilot Console (Frontend).
* **Shutdown:** Graceful flush of the audit log followed by process termination.
