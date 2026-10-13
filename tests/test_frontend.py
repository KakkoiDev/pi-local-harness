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
            self.assertLess(content.index('/design/tokens.css'),content.index('/design/components.css'))
            self.assertLess(content.index('/design/components.css'),content.index('/chat.css'))

    def test_no_browser_modal_dialogs(self):
        import pathlib, re
        for script in pathlib.Path('js').glob('*.mjs'):
            self.assertIsNone(re.search(r'\b(confirm|prompt|alert)\(',script.read_text()),f'{script}: use ask() or #name-dialog')

    def test_design_fonts_ship_with_licences(self):
        import pathlib, sys
        sys.path.insert(0,'harness');from web_chat import FONTS
        for name in FONTS:self.assertEqual(pathlib.Path('fonts',name+'.woff2').read_bytes()[:4],b'wOF2',name)
        licences=pathlib.Path('fonts/OFL.txt').read_text()
        for holder in ('Pixelify Sans Project Authors','Adobe','IBM Corp.'):self.assertIn(holder,licences)
        self.assertIn('SIL Open Font License, Version 1.1',licences)

if __name__ == "__main__":
    unittest.main()
