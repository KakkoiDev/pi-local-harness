import unittest
from pager import page


class PageTest(unittest.TestCase):
    def test_pages(self):
        self.assertEqual(page(list(range(1, 11)), 2, 3), [4, 5, 6])
