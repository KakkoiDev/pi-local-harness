import unittest
import os

class TestFrontend(unittest.TestCase):
    def test_index_is_accessible_multimodal_chat(self):
        with open("index.html", "r") as f:
            content = f.read()
            self.assertIn('id="project-list"',content)
            self.assertIn('type="file" multiple',content)
            self.assertIn('id="record"',content)
            self.assertIn('name="viewport"',content)
            self.assertNotIn('cdn.tailwindcss',content)

if __name__ == "__main__":
    unittest.main()
