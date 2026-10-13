import os
from datetime import datetime
from typing import Any, Dict, Optional
from .shell_guard import destructive_reason
from .models import ActionProposal, ExecutionResult, JudgmentEvent, ActionOutcome, ToolRiskCategory

class GateEngine:
    def __init__(self, policy_path: str, log_file: str):
        self.policy_path = policy_path
        self.log_file = log_file
        self.policies = {
            "tools": {
                "read_file": ToolRiskCategory.READ_ONLY,
                "write_file": ToolRiskCategory.REVERSIBLE_WRITE,
                "execute_command": ToolRiskCategory.REVERSIBLE_WRITE
            },
            "auth_levels": {
                "standard": [ToolRiskCategory.READ_ONLY, ToolRiskCategory.REVERSIBLE_WRITE],
                "admin": [ToolRiskCategory.READ_ONLY, ToolRiskCategory.REVERSIBLE_WRITE, ToolRiskCategory.HIGH_RISK]
            }
        }

    def rejection_reason(self, proposal: ActionProposal, auth_level: str = "standard"):
        """Stateless explanation shared by the pre-action decision and model feedback."""
        if proposal.tool_name not in self.policies['tools']:
            return f"Unknown tool: {proposal.tool_name}. Use a supported tool."
        if proposal.tool_name == 'execute_command':
            command = proposal.args.get('command', proposal.args.get('cmd', proposal.args.get('script', '')))
            if not isinstance(command, str):
                return 'Shell command must be a string.'
            reason = destructive_reason(command)
            if reason:
                return reason
        risk = self.policies['tools'][proposal.tool_name]
        if risk not in self.policies['auth_levels'].get(auth_level, []):
            return f"Profile {auth_level} does not authorize {proposal.tool_name}."
        return None

    def gatekeep(self, proposal: ActionProposal, auth_level: str = "standard") -> ActionOutcome:
        """Pre-action check."""
        tool_name = proposal.tool_name
        reason = self.rejection_reason(proposal, auth_level)
        if reason:
            print(f"[Gate] BLOCK: {reason}")
            return ActionOutcome.BLOCK
        
        print(f"[Gate] ✅ Action '{tool_name}' allowed.")
        return ActionOutcome.ALLOW

    def audit(self, proposal: ActionProposal, execution: ExecutionResult, postcondition_ok=True) -> JudgmentEvent:
        """Post-turn check."""
        print(f"[Gate-Auditor] 🔍 Auditing action: {proposal.tool_name}")
        
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
