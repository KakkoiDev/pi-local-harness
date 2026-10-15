import unittest
from pager import page


class PageTest(unittest.TestCase):
    def test_first_page(self):
        self.assertEqual(page(list(range(1, 11)), 1, 3), [1, 2, 3])


if __name__ == "__main__":
    unittest.main()
