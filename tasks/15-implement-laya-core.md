# Task 15: Implement Laya Core (Gatekeeper & Auditor)

## 🎯 Goal
To implement the Laya compliance layer, which acts as a two-phase interceptor: The Gatekeeper (pre-action) and The Auditor (post-turn), ensuring all agent actions align with system policies and risk models.

## 🛠 Implementation Plan

### 1. Core Engine Development
- [ ] Implement the `LayaEngine` class that coordinates both phases.
- [ ] Implement the `ActionProposal` data structure.
- [ ] Implement the `ExecutionResult` data structure.

### 2. Phase 1: The Gatekeeper (Pre-Action)
- [ ] Implement the `Gatekeeper` class.
- [ ] Implement the hierarchical check: Existence $\rightarrow$ Risk Class $\rightarrow$ Policy.
- [ ] Support outcomes: `ALLOW`, `BLOCK`, `REVISE`, `ESCALATE`.

### 3. Phase 2: The Auditor (Post-Turn)
- [ ] Implement the `Auditor` class.
- [ ] Implement implementation integrity and drift detection logic.
- [ ] Output `JudgmentEvent` logs.

### 4. Integration
- [ ] Integrate the Gatekeeper into the `agent_api.py` tool-calling lifecycle.
- [ ] Integrate the Auditor into the turn-completion lifecycle.

## 🧪 Verification
- [ ] **Unit Tests**: Verify Gatekeeper logic (existence, risk, policy).
- [ ] **Unit Tests**: Verify Auditor logic (drift detection, integrity).
- [ ] **Integration Test**: Verify a full turn: `Proposal` $\rightarrow$ `Gatekeeper (Allow)` $\rightarrow$ `Execution` $\rightarrow$ `Auditor (Verify)`.
- [ ] **Integration Test**: Verify a blocked turn: `Proposal` $\rightarrow$ `Gatekeeper (Block)` $\rightarrow$ `No Execution`.
