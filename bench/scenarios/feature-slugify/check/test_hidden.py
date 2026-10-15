import unittest
from text import slugify


class Hidden(unittest.TestCase):
    def test_rules(self):
        self.assertEqual(slugify("Hello World"), "hello-world")
        self.assertEqual(slugify("Café au lait"), "cafe-au-lait")
        self.assertEqual(slugify("a  &  b"), "a-b")
        self.assertEqual(slugify("  --Rock'n'Roll!--  "), "rock-n-roll")
        self.assertEqual(slugify("Ünïcödé 2026"), "unicode-2026")
        self.assertEqual(slugify("!!!"), "untitled")
        self.assertEqual(slugify(""), "untitled")
