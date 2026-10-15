import unittest
from geometry import area_rect, area_square
from shapes import total_area


class GeometryTest(unittest.TestCase):
    def test_areas(self):
        self.assertEqual(area_rect(2, 3), 6)
        self.assertEqual(area_square(4), 16)
        self.assertEqual(total_area([(1, 2), (3, 4)]), 14)
