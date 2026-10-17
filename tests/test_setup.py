"""plh setup (plan 198, the toolchain): the browser Pi drives is Chromium's headless shell, fetched once into the
harness's toolchain folder, checked against Google's own MD5. Measured 2026-10-15 on this Mac with Pi's browser tool:
525 ms and about 420 MB per look, against 837 ms and 922 MB for the full Chromium."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:  # run as tests.<module> from the repository root
    from tests import isolation  # noqa: F401
import base64
import hashlib
import http.server
import io
import tempfile
import threading
import unittest
import zipfile
from pathlib import Path

from harness import setup


def archive(platform):
    data = io.BytesIO()
    with zipfile.ZipFile(data, 'w') as zipped:
        info = zipfile.ZipInfo(f'chrome-headless-shell-{platform}/chrome-headless-shell'); info.external_attr = 0o755 << 16
        zipped.writestr(info, '#!/bin/sh\necho fake shell\n')
        zipped.writestr(f'chrome-headless-shell-{platform}/LICENSE', 'license')
    return data.getvalue()


class Server(http.server.BaseHTTPRequestHandler):
    body, md5 = b'', ''
    def do_GET(self):
        self.send_response(200); self.send_header('Content-Length', str(len(self.body))); self.send_header('x-goog-hash', 'crc32c=AAAAAA=='); self.send_header('x-goog-hash', f'md5={self.md5}')
        self.end_headers(); self.wfile.write(self.body)
    def log_message(self, *args): pass


class SetupTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup); self.data = Path(self.temp.name)
        Server.body = archive('mac-arm64'); Server.md5 = base64.b64encode(hashlib.md5(Server.body).digest()).decode()
        self.server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Server); threading.Thread(target=self.server.serve_forever, daemon=True).start()
        self.addCleanup(self.server.shutdown)
        self.base = f'http://127.0.0.1:{self.server.server_port}'

    def test_the_pinned_version_and_the_address_for_this_machine(self):
        self.assertRegex(setup.HEADLESS_SHELL, r'^\d+\.\d+\.\d+\.\d+$')
        self.assertEqual(setup.platform('Darwin', 'arm64'), 'mac-arm64'); self.assertEqual(setup.platform('Darwin', 'x86_64'), 'mac-x64'); self.assertEqual(setup.platform('Linux', 'x86_64'), 'linux64')
        self.assertTrue(setup.shell_url('mac-arm64').endswith(f'/{setup.HEADLESS_SHELL}/mac-arm64/chrome-headless-shell-mac-arm64.zip'))

    def test_it_installs_into_the_toolchain_folder_where_the_browser_tool_looks(self):
        said = setup.browser(self.data, base=self.base, machine='mac-arm64')
        binary = self.data / 'toolchain/chrome-headless-shell/chrome-headless-shell'
        self.assertTrue(binary.is_file()); self.assertTrue(binary.stat().st_mode & 0o100, 'executable')
        self.assertIn(setup.HEADLESS_SHELL, said)
        self.assertIn('already installed', setup.browser(self.data, base=self.base, machine='mac-arm64'), 'once is enough')

    def test_a_download_that_does_not_match_googles_md5_is_refused_and_nothing_is_installed(self):
        Server.md5 = base64.b64encode(hashlib.md5(b'something else').digest()).decode()
        with self.assertRaisesRegex(ValueError, 'does not match'): setup.browser(self.data, base=self.base, machine='mac-arm64')
        self.assertFalse((self.data / 'toolchain/chrome-headless-shell').exists())

    def test_plh_setup_runs_the_setup_not_pi(self):
        import os, subprocess, sys
        run = subprocess.run([sys.executable, str(Path(__file__).resolve().parent.parent / 'plh.py'), 'setup', 'nothing'], capture_output=True, text=True, timeout=60,
                             env={**os.environ, 'PI_AGENT_DATA': str(self.data), 'PATH': '/usr/bin:/bin'})
        self.assertEqual(run.returncode, 2, run.stderr); self.assertIn('Unknown setup step “nothing”. Steps: browser, music, laya.', run.stdout)



class MusicSetupTest(unittest.TestCase):
    def test_music_installs_locked_runtime_into_toolchain_without_copying_dependencies(self):
        from unittest.mock import patch
        with tempfile.TemporaryDirectory() as directory:
            with patch.object(setup.subprocess,'run') as run:
                said=setup.music(Path(directory))
            target=Path(directory)/'toolchain/music'
            self.assertTrue((target/'package-lock.json').is_file())
            self.assertTrue((target/'bootstrap.mjs').is_file())
            self.assertFalse((target/'node_modules').exists())
            self.assertEqual(run.call_args.args[0],['npm','ci','--ignore-scripts','--no-audit','--no-fund'])
            self.assertEqual(run.call_args.kwargs['cwd'],target)
            self.assertIn('blips',said)


if __name__ == '__main__':
    unittest.main()
