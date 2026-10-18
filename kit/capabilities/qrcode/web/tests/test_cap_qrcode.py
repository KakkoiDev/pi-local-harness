"""Share by QR code (a capability chosen in Project Start): the pinned QR code library, its licence and its place in the
offline shell."""
import hashlib
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PINNED = "ea91d7118a5395289170da848b7c6758b996163bfbccf312591ab65a4911b7c0"  # qrcode-generator 2.0.4 (the kit's libraries.json)


class QrCodeTest(unittest.TestCase):
    def test_the_qr_library_is_the_pinned_version_with_its_licence(self) -> None:
        library = ROOT / "static/vendor/qrcode.mjs"
        self.assertEqual(hashlib.sha256(library.read_bytes()).hexdigest(), PINNED, "static/vendor/qrcode.mjs is not qrcode-generator 2.0.4")
        self.assertIn("MIT", (ROOT / "static/vendor/qrcode.LICENSE").read_text(encoding="utf-8"))

    def test_the_offline_shell_caches_it(self) -> None:
        self.assertIn("/static/vendor/qrcode.mjs", (ROOT / "static/sw.js").read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
