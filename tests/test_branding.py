import unittest
import os

class TestBranding(unittest.TestCase):
    def test_header_branding(self):
        with open("js/components.js", "r") as f:
            content = f.read()
            # We expect CreativeDev and NOT KAKKOI
            self.assertIn("CreativeDev", content)
            self.assertNotIn("KAKKOI", content)

if __name__ == "__main__":
    unittest.main()
