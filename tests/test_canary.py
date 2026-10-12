import unittest
import os
from datetime import datetime
from sentinel import Sentinel

class TestCanary(unittest.TestCase):
    def setUp(self):
        self.log_file = "test_canary_session.log"
        self.sentinel = Sentinel(self.log_file, loop_threshold=0.85, stall_timeout=60, escalation_timeout=180, interval=1)

    def tearDown(self):
        if os.path.exists(self.log_file):
            os.remove(self.log_file)

    def test_canary_present(self):
        ts_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        with open(self.log_file, "w") as f:
            f.write(f"[{ts_str}] AGENT_RESPONSE: [CANARY] Hello there!\n")

        with open(self.log_file, "r") as f:
            lines = f.readlines()
        self.assertTrue(self.sentinel.check_for_canary(lines))

    def test_canary_missing(self):
        ts_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        with open(self.log_file, "w") as f:
            f.write(f"[{ts_str}] AGENT_RESPONSE: I forgot the token!\n")

        with open(self.log_file, "r") as f:
            lines = f.readlines()
        self.assertFalse(self.sentinel.check_for_canary(lines))

    def test_canary_not_in_response_is_fine(self):
        # Canary is only for AGENT_RESPONSE lines.
        # If it's a tool call or reasoning step, it's fine to not have it.
        ts_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        with open(self.log_file, "w") as f:
            f.write(f"[{ts_str}] TOOL_CALL: read_file\n")

        with open(self.log_file, "r") as f:
            lines = f.readlines()
        self.assertTrue(self.sentinel.check_for_canary(lines))

    def test_get_last_activity_with_agent_response(self):
        ts_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        with open(self.log_file, "w") as f:
            f.write(f"[{ts_str}] AGENT_RESPONSE: [CANARY] hi\n")

        last_ts = self.sentinel.get_last_activity()
        self.assertIsNotNone(last_ts)
        self.assertEqual(last_ts.strftime('%Y-%m-%d %H:%M:%S'), ts_str)

if __name__ == "__main__":
    unittest.main()
