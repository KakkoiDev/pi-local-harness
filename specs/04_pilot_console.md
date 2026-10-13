# Spec: The Pilot Console (The Supervisory UI)

> 2026-10-13: proposal, not built. The Pi Workbench (tasks 68-90) covers supervision of one agent: Activity (jobs, phases, commands) and Gate (gate and audit per tool call). The multi-agent dashboard below stays open as task 17.

## Overview
The Pilot Console is a centralized, web-based dashboard designed for human oversight. It provides a high-level "Command and Control" view of the entire Agentic Ecosystem.

## 1. Core Modules

### 1.1 The Reasoning Feed
A real-time, streaming log of the Actor's internal thoughts (`REASONING_STEP`) and external tool calls. This provides the "transparency" required for responsible agent usage.

### 1.2 The Compliance Dashboard
A live visualization of the Gate component's performance:
- **Real-time Decision Stream**: A feed of `ALLOW`, `BLOCK`, `REVISE`, and `ESCALATE` verdicts.
- **Compliance Score**: A rolling metric representing the ratio of valid-to-invalid requests.
- **Risk Heatmap**: Shows which tool classes or agent roles are currently triggering the most violations.

### 1.3 The Sentinel Monitor
A health-check dashboard for the background processes:
- **Agent Heartbeat**: The time since the last meaningful reasoning step.
- **Process Status**: Up/Down status of `Agent-API`, `Sentinel`, and `Gate-Monitor`.
- **Loop/Stall Alerts**: Real-time notification of reasoning loops or process stalls.

### 1.4 The Meta-Chat (Human-in-the-loop)
The primary interface for communicating with the agent.
- **Direct Commands**: Allows the operator to issue "system-level" instructions (e.g., "Stop current task", "Reset memory").
- **Escalation Interface**: A dedicated view for reviewing `PENDING` tasks (Escalations) where the operator must provide `APPROVE`, `DENY`, or `REVISE`.

## 2. Technical Implementation

### 2.1 Connectivity
- **Protocol**: Uses Server-Sent Events (SSE) for real-time streaming of logs and metrics.
- **Interaction**: Forms a WebSocket or REST connection to the `agent_api` to dispatch human commands.

### 2.2 Visualization
- **Frontend Framework**: React 19 + Tailwind CSS.
- **Data Source**: Aggregated data from the `audit.jsonl` log and real-time status from the `gate_monitor`.

---

## 3. User Personas

| Persona | Primary Use Case | Key Views |
|---|---|---|
| **Developer** | Debugging tool calls and reasoning | Reasoning Feed + Log Viewer |
| **Operator** | Managing task workflows and decisions | Approval Interface + Command Terminal |
| **Auditor** | Reviewing compliance and history | Compliance Dashboard + Audit Log |
