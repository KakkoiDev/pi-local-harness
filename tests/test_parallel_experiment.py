"""Overlap analysis for experiments/parallel_inference/run.py."""
import unittest
from experiments.parallel_inference.run import overlap, verdict

class OverlapTest(unittest.TestCase):
    def test_serialized_requests_do_not_overlap(self):
        first = {'first_token': 1.0, 'end': 5.0}; second = {'first_token': 5.2, 'end': 9.0}
        self.assertEqual(overlap(first, second), 0.0)
        self.assertEqual(verdict(first, second), 'serialized')

    def test_concurrent_generation_overlaps(self):
        first = {'first_token': 1.0, 'end': 5.0}; second = {'first_token': 1.2, 'end': 5.5}
        self.assertAlmostEqual(overlap(first, second), 3.8 / 4.0)
        self.assertEqual(verdict(first, second), 'parallel')

    def test_partial_overlap_is_reported_as_such(self):
        first = {'first_token': 0.0, 'end': 4.0}; second = {'first_token': 3.0, 'end': 8.0}
        self.assertAlmostEqual(overlap(second, first), 0.25)
        self.assertEqual(verdict(first, second), 'partial')

if __name__ == '__main__':
    unittest.main()
