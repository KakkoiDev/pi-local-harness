import unittest
import os
from datetime import datetime, timedelta
from sentinel import Sentinel

class TestSentinel(unittest.TestCase):
    def setUp(self):
        self.log_file = "test_session.log"
        # Using a small stall timeout for testing
        self.stall_timeout = 2
        self.escalation_timeout = 10
        self.sentinel = Sentinel(self.log_file, loop_threshold=0.85, stall_timeout=self.stall_timeout, escalation_timeout=self.escalation_timeout, interval=1)

    def tearDown(self):
        if os.path.exists(self.log_file):
            os.remove(self.log_file)

    def test_detects_loop(self):
        with open(self.log_file, "w") as f:
            f.write("REASONING_STEP: I am thinking about X\n" * 2)
            f.write("REASONING_STEP: I am thinking about X\n" * 2)
            f.write("REASONING_STEP: I am thinking about X\n" * 2)

        with open(self.log_file, "r") as f:
            lines = f.readlines()
        self.assertTrue(self.sentinel.check_for_loop(lines))

    def test_ignores_different_steps(self):
        with open(self.log_file, "w") as f:
            f.write("REASONING_STEP: Apple\n")
            f.write("text: Banana\n") # This is not a REASONING_STEP or TOOL_CALL line
            f.write("REASONING_STEP: Cherry\n")

        with open(self.log_file, "r") as f:
            lines = f.readlines()
        self.assertFalse(self.sentinel.check_for_loop(lines))

    def test_last_activity_parsing(self):
        ts_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        with open(self.log_file, "w") as f:
            f.write(f"[{ts_str}] REASONING_STEP: test\n")

        last_ts = self.sentinel.get_last_activity()
        self.assertIsNotNone(last_ts)
        self.assertEqual(last_ts.strftime('%Y-%m-%d %H:%M:%S'), ts_str)

    def test_stall_detection_logic(self):
        # 1. Test Warning State (Elapsed > stall_timeout, but < escalation_timeout)
        # We use a timestamp from 5 seconds ago.
        # Since stall_timeout is 2 and escalation_timeout is 10, 5 is in the middle.
        five_secs_ago = datetime.now() - timedelta(seconds=5)
        ts_str_5 = five_secs_ago.strftime('%Y-%m-%d %H:%M:%S')

        with open(self.log_file, "w") as f:
            f.write(f"[{ts_str_5}] REASONING_STEP: warning_state\n")

        last_ts_5 = self.sentinel.get_last_activity()
        elapsed_5 = (datetime.now() - last_ts_5).total_seconds()

        self.assertTrue(elapsed_5 > self.stall_timeout)
        self.assertTrue(elapsed_5 < self.escalation_timeout)

        # 2. Test Escalation State (Elapsed > escalation_timeout)
        # We use a timestamp from 15 seconds ago.
        fifteen_secs_ago = datetime.now() - timedelta(seconds=15)
        ts_str_15 = fifteen_secs_ago.strftime('%Y-%m-%d %H:%M:%S')

        with open(self.log_file, "w") as f:
            f.write(f"[{ts_str_15}] REASONING_STEP: escalation_state\n")

        last_ts_15 = self.sentinel.get_last_activity()
        elapsed_15 = (datetime.now() - last_ts_15).total_seconds()

        self.assertTrue(elapsed_15 > self.escalation_timeout)

    def test_recent_activity_is_not_stall(self):
        # Simulate activity from 0.5 seconds ago
        half_sec_ago = datetime.now() - timedelta(seconds=0.5)
        ts_str = half_sec_ago.strftime('%Y-%m-%d %H:%M:%S')

        with open(self.log_file, "w") as f:
            f.write(f"[{ts_str}] REASONING_STEP: recent\n")

        last_ts = self.sentinel.get_last_activity()
        elapsed = (datetime.now() - last_ts).total_seconds()
        self.assertLess(elapsed, self.stall_timeout)

if __name__ == "__main__":
    unittest.main()
