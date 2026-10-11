import unittest
import os
from sentinel import Sentinel

class TestSentinel(unittest.TestCase):
    def setUp(self):
        self.log_file = "test_session.log"
        self.sentinel = Sentinel(self.log_file, threshold=2, interval=1)

    def tearDown(self):
        if os.path.exists(self.log_file):
            os.remove(self.log_file)

    def test_detects_loop(self):
        with open(self.log_file, "w") as f:
            f.write("REASONING_STEP: I am thinking about X\n")
            f.write("REASONING_STEP: I am thinking about X\n")
        
        self.assertTrue(self.sentinel.check_for_loop())

    def test_ignores_different_steps(self):
        with open(self.log_file, "w") as f:
            f.write("REASONING_STEP: Step 1\n")
            f.write("REASONING_STEP: Step 2\n")
        
        self.assertFalse(self.sentinel.check_for_loop())

if __name__ == "__main__":
    unittest.main()
