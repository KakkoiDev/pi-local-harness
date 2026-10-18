"""A capability whose test fails (tests only): the base check must stop on it."""
import unittest


class BrokenTest(unittest.TestCase):
    def test_this_capability_always_fails(self) -> None:
        self.assertEqual(1 + 1, 3, "this capability is broken on purpose")


if __name__ == "__main__":
    unittest.main()
