"""Dashboard and charts (a capability chosen in Project Start): the pinned chart library, its licence and its place in
the offline shell."""
import hashlib
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PINNED = "48444a82d4edcb5bec0f1965faacdde18d9c17db3063d042abada2f705c9f54a"  # Chart.js 4.5.1 (the kit's libraries.json)


class ChartsTest(unittest.TestCase):
    def test_the_chart_library_is_the_pinned_version_with_its_licence(self) -> None:
        library = ROOT / "static/vendor/chart.umd.min.js"
        self.assertEqual(hashlib.sha256(library.read_bytes()).hexdigest(), PINNED, "static/vendor/chart.umd.min.js is not Chart.js 4.5.1")
        self.assertIn("MIT", (ROOT / "static/vendor/chart.LICENSE.md").read_text(encoding="utf-8"))

    def test_the_offline_shell_caches_it(self) -> None:
        self.assertIn("/static/vendor/chart.umd.min.js", (ROOT / "static/sw.js").read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
