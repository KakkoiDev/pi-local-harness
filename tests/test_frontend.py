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

    def test_project_pages_contain_components_and_htmx(self):
        pages = ["project-ai.html", "project-db.html"]
        for page in pages:
            with open(page, "r") as f:
                content = f.read()
                self.assertIn("<portfolio-header>", content)
                self.assertIn("<portfolio-footer>", content)
                self.assertIn('hx-select="#main-content"', content)

    def test_components_js_definitions(self):
        with open("js/components.js", "r") as f:
            content = f.read()
            self.assertIn("customElements.define('portfolio-header'", content)
            self.assertIn("customElements.define('portfolio-footer'", content)
            self.assertIn("customElements.define('project-card'", content)

if __name__ == "__main__":
    unittest.main()
