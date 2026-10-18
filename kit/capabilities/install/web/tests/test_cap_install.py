"""Installs on a phone (a capability chosen in Project Start): the manifest names the app, its icons exist, and the page
registers the service worker that caches the shell."""
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class InstallTest(unittest.TestCase):
    def test_the_manifest_names_the_app_and_its_icons_exist(self) -> None:
        manifest = json.loads((ROOT / "static/manifest.webmanifest").read_text(encoding="utf-8"))
        for key in ("name", "short_name", "start_url"):
            self.assertTrue(str(manifest.get(key, "")).strip(), f"the manifest needs {key}")
        self.assertIn(manifest.get("display"), ("standalone", "fullscreen", "minimal-ui"), "it opens like an app")
        icons = manifest.get("icons") or []
        self.assertTrue(icons, "the manifest needs an icon")
        for icon in icons:
            self.assertTrue((ROOT / str(icon["src"]).lstrip("/")).is_file(), f"missing icon {icon['src']}")

    def test_the_page_registers_the_service_worker_that_caches_the_shell(self) -> None:
        self.assertIn("serviceWorker.register", (ROOT / "app/templates/base.html").read_text(encoding="utf-8"))
        worker = (ROOT / "static/sw.js").read_text(encoding="utf-8")
        self.assertRegex(worker, r"\bSHELL\s*=\s*\[", "sw.js needs its literal SHELL list")
        self.assertTrue(re.search(r"caches\.(open|match)", worker), "sw.js caches the shell")


if __name__ == "__main__":
    unittest.main()
