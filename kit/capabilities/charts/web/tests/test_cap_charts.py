"""Dashboard and charts (a capability chosen in Project Start): the pinned chart library, its licence and its place in
the offline shell."""
import hashlib
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PINNED = "48444a82d4edcb5bec0f1965faacdde18d9c17db3063d042abada2f705c9f54a"  # Chart.js 4.5.1 (the kit's libraries.json)


class ChartsTest(unittest.TestCase):
    def test_the_chart_library_is_the_pinned_version_with_its_licence(self) -> None:
        library = ROOT / "static/vendor/chart.js-4.5.1/chart.umd.min.js"
        self.assertEqual(hashlib.sha256(library.read_bytes()).hexdigest(), PINNED, "static/vendor/chart.js-4.5.1/chart.umd.min.js is not Chart.js 4.5.1")
        self.assertIn("MIT", (ROOT / "static/vendor/chart.js-4.5.1/LICENSE.md").read_text(encoding="utf-8"))

    def test_basecoat_s_chart_wrapper_comes_with_it(self) -> None:
        for name in ("chart.min.js", "all.min.js"):
            self.assertTrue((ROOT / "static/vendor/basecoat" / name).is_file(), f"static/vendor/basecoat/{name}")
        self.assertIn("MIT", (ROOT / "static/vendor/basecoat/LICENSE.md").read_text(encoding="utf-8"))

    def test_the_offline_shell_caches_them(self) -> None:
        worker = (ROOT / "static/sw.js").read_text(encoding="utf-8")
        for path in ("/static/vendor/chart.js-4.5.1/chart.umd.min.js", "/static/vendor/basecoat/chart.min.js"):
            self.assertIn(path, worker)


if __name__ == "__main__":
    unittest.main()
