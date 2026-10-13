# Task 15: Implement Gate Core (Gatekeeper & Auditor)

## 🎯 Goal
To implement the Gate compliance layer, which acts as a two-phase interceptor: The Gatekeeper (pre-action) and The Auditor (post-turn), ensuring all agent actions align with system policies and risk models.

## 🛠 Implementation Plan

### 1. Core Engine Development
- [x] Implement the `GateEngine` class that coordinates both phases.
- [x] Implement the `ActionProposal` data structure.
- [x] Implement the `ExecutionResult` data structure.

### 2. Phase 1: The Gatekeeper (Pre-Action)
- [x] Implement the Gatekeeper phase (`GateEngine.gatekeep`).
- [x] Implement the hierarchical check: Existence $\rightarrow$ Risk Class $\rightarrow$ Policy.
- [x] Define outcome values: `ALLOW`, `BLOCK`, `REVISE`, `ESCALATE`.
- [x] Implement `ALLOW` and `BLOCK` decisions.
- [ ] Implement actionable `REVISE` and `ESCALATE` decisions.

### 3. Phase 2: The Auditor (Post-Turn)
- [x] Implement the Auditor phase (`GateEngine.audit`).
- [x] Implement implementation integrity and drift detection logic.
- [x] Output `JudgmentEvent` logs.

### 4. Integration
- [x] Integrate the Gatekeeper into the `agent_api.py` tool-calling lifecycle.
- [x] Integrate the Auditor into pi tool completion (`tool_result`) and API tool calls.

## 🧪 Verification
- [ ] **Unit Tests**: Verify Gatekeeper logic (existence, risk, policy).
- [x] **Unit Tests**: Verify Auditor logic (drift detection, integrity).
- [ ] **Integration Test**: Verify a full turn: `Proposal` $\rightarrow$ `Gatekeeper (Allow)` $\rightarrow$ `Execution` $\rightarrow$ `Auditor (Verify)`.
- [ ] **Integration Test**: Verify a blocked turn: `Proposal` $\rightarrow$ `Gatekeeper (Block)` $\rightarrow$ `No Execution`.

Remaining: revision/escalation behavior and complete integration coverage. Current auditing compares proposal/result arguments and writes plain-text judgment events; the richer protocol remains task 18.
