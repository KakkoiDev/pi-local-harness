import unittest
import os

class TestSOP(unittest.TestCase):
    def test_request_to_task_pipeline_exists(self):
        with open("AGENT.md", "r") as f:
            content = f.read()
            self.assertIn("Request-to-Task Pipeline", content)

if __name__ == "__main__":
    unittest.main()
