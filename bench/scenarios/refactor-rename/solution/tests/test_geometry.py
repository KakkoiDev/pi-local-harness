import unittest
from geometry import rectangle_area, area_square
from shapes import total_area


class GeometryTest(unittest.TestCase):
    def test_areas(self):
        self.assertEqual(rectangle_area(2, 3), 6)
        self.assertEqual(area_square(4), 16)
        self.assertEqual(total_area([(1, 2), (3, 4)]), 14)
