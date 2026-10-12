import unittest
import os
from sentinel import Sentinel

class TestSentinel(unittest.TestCase):
    def setUp(self):
        self.log_file = "test_session.log"
        self.sentinel = Sentinel(self.log_file, loop_threshold=0.85, stall_timeout=60, interval=1)

    def tearDown(self):
        if os.path.exists(self.log_file):
            os.remove(self.log_file)

    def test_detects_loop(self):
        with open(self.log_file, "w") as f:
            f.write("REASONING_STEP: I am thinking about X\n")
            f.write("REASONING_STEP: I am thinking about X\n")
            f.write("REASONING_STEP: I am thinking about X\n")
        
        with open(self.log_file, "r") as f:
            lines = f.readlines()
        self.assertTrue(self.sentinel.check_for_loop(lines))

    def test_ignores_different_steps(self):
        with open(self.log_file, "w") as f:
            f.write("REASONING_STEP: Apple\n")
            f.write("REASONING_STEP: Banana\n")
            f.write("REASONING_STEP: Cherry\n")
        
        with open(self.log_file, "r") as f:
            lines = f.readlines()
        self.assertFalse(self.sentinel.check_for_loop(lines))

if __name__ == "__main__":
    unittest.main()
