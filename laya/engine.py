import os
from datetime import datetime
from typing import Any, Dict, Optional
from .models import ActionProposal, ExecutionResult, JudgmentEvent, ActionOutcome, ToolRiskCategory

class LayaEngine:
    def __init__(self, policy_path: str, log_file: str):
        self.policy_path = policy_path
        self.log_file = log_file
        self.policies = {
            "tools": {
                "read_file": ToolRiskCategory.READ_ONLY,
                "write_file": ToolRiskCategory.REVERSIBLE_WRITE,
                "execute_command": ToolRiskCategory.HIGH_RISK,
                "get_news": ToolRiskCategory.READ_ONLY
            },
            "auth_levels": {
                "standard": [ToolRiskCategory.READ_ONLY, ToolRiskCategory.REVERSIBLE_WRITE],
                "admin": [ToolRiskCategory.READ_ONLY, ToolRiskCategory.REVERSIBLE_WRITE, ToolRiskCategory.HIGH_RISK]
            }
        }

    def gatekeep(self, proposal: ActionProposal, auth_level: str = "standard") -> ActionOutcome:
        """Pre-action check."""
        tool_name = proposal.tool_name
        
        # 1. Existence Check
        if tool_name not in self.policies["tools"]:
            print(f"[Laya-Gatekeeper] ❌ Tool '{tool_name}' not recognized.")
            return ActionOutcome.BLOCK

        risk_category = self.policies["tools"][tool_name]

        # 2. Policy Check
        allowed_risks = self.policies["auth_levels"].get(auth_level, [])
        if risk_category not in allowed_risks:
            print(f"[Laya-Gatekeeper] ❌ Action '{tool_name}' (Risk: {risk_category.name}) denied for auth: {auth_level}")
            return ActionOutcome.BLOCK

        print(f"[Laya-Gatekeeper] ✅ Action '{tool_name}' allowed.")
        return ActionOutcome.ALLOW

    def audit(self, proposal: ActionProposal, execution: ExecutionResult, postcondition_ok=True) -> JudgmentEvent:
        """Post-turn check."""
        print(f"[Laya-Auditor] 🔍 Auditing action: {proposal.tool_name}")
        
        # 1. Implementation Integrity Check
        # Did the tool actually do what the actor said it would?
        integrity_ok = proposal.tool_name == execution.tool_name and proposal.args == execution.args
        
        # 2. Drift Detection
        drift_detected = not integrity_ok

        status = ("DRIFT_DETECTED" if drift_detected else "EXECUTION_FAILED" if execution.exit_code != 0
                  else "POSTCONDITION_FAILED" if not postcondition_ok else "SUCCESS")
        
        event = JudgmentEvent(
            timestamp=datetime.now(),
            proposal=proposal,
            execution=execution,
            status=status,
            reasoning={"SUCCESS": "Original proposal and execution match; applicable postconditions passed.",
                       "DRIFT_DETECTED": "Execution tool or arguments differ from the approved proposal.",
                       "EXECUTION_FAILED": "The tool reported a failed execution.",
                       "POSTCONDITION_FAILED": "The resulting file does not match the approved content."}[status],
            drift_detected=drift_detected
        )
        
        self._write_judgment(event)
        return event

    def _write_judgment(self, event: JudgmentEvent):
        with open(self.log_file, "a") as f:
            f.write(f"{event.timestamp.isoformat()} | {event.status} | {event.proposal.tool_name} | Drift: {event.drift_detected}\n")
