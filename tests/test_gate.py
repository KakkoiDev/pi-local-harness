import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
import unittest
import os
from gate.engine import GateEngine
from gate.models import ActionProposal, ExecutionResult, ActionOutcome, ToolRiskCategory

class TestGateEngine(unittest.TestCase):
    def setUp(self):
        self.log_file = "test_gate_audit.log"
        self.policy_path = "specs/judges.md"
        self.engine = GateEngine(self.policy_path, self.log_file)

    def tearDown(self):
        if os.path.exists(self.log_file):
            os.remove(self.log_file)

    def test_gatekeeper_allow_read(self):
        proposal = ActionProposal(tool_name="read_file", args={"path": "test.txt"}, reason="Need to read file")
        outcome = self.engine.gatekeep(proposal, auth_level="standard")
        self.assertEqual(outcome, ActionOutcome.ALLOW)

    def test_gatekeeper_block_high_risk(self):
        proposal = ActionProposal(tool_name="execute_command", args={"cmd": "rm -fr *"}, reason="Running a command")
        outcome = self.engine.gatekeep(proposal, auth_level="standard")
        self.assertEqual(outcome, ActionOutcome.BLOCK)

    def test_gatekeeper_allow_high_risk_admin(self):
        proposal = ActionProposal(tool_name="execute_command", args={"cmd": "ls"}, reason="Running a command")
        outcome = self.engine.gatekeep(proposal, auth_level="admin")
        self.assertEqual(outcome, ActionOutcome.ALLOW)

    def test_auditor_success(self):
        proposal = ActionProposal(tool_name="read_file", args={"path": "test.txt"}, reason="Read")
        execution = ExecutionResult(tool_name="read_file", args={"path": "test.txt"}, output="content", exit_code=0)
        event = self.engine.audit(proposal, execution)
        self.assertEqual(event.status, "SUCCESS")
        self.assertFalse(event.drift_detected)

    def test_auditor_drift(self):
        proposal = ActionProposal(tool_name="read_file", args={"path": "test.txt"}, reason="Read")
        # Drifting arg
        execution = ExecutionResult(tool_name="read_file", args={"path": "wrong.txt"}, output="content", exit_code=0)
        event = self.engine.audit(proposal, execution)
        self.assertEqual(event.status, "DRIFT_DETECTED")
        self.assertTrue(event.drift_detected)

if __name__ == "__main__":
    unittest.main()
