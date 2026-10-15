import unittest
from pager import page


class Hidden(unittest.TestCase):
    def test_pages(self):
        items = list(range(1, 11))
        self.assertEqual([page(items, n, 3) for n in (1, 2, 3, 4, 5)], [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10], []])
        self.assertEqual(page(items, 2, 5), [6, 7, 8, 9, 10])
