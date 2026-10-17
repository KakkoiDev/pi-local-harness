"""Imported first by every test module: tests never reach the developer's real Ollama, tailnet or running harness.

Pi often runs these tests from inside plh, so the environment can hold phone-access settings (which would make
services.py start `tailscale serve` on the real tailnet), the live Gate port and token, and the chosen model.
"""
import os
from pathlib import Path

import sys

ROOT = Path(__file__).resolve().parents[1]
os.chdir(ROOT)  # tests open repo files by relative path; run them from anywhere
if str(ROOT) not in sys.path: sys.path.insert(0, str(ROOT))  # `from harness import …` works from any folder

# Task 263: also the live workbench's ports (a run from a workbench request failed test_plh) and Pi's own folder.
for name in [key for key in os.environ if key.startswith(('PI_HARNESS_', 'PI_WEB_REMOTE_'))] + ['PI_AGENT_DATA', 'PI_WEB_DATA', 'PI_WEB_EFFORT', 'PI_WEB_PORT', 'PI_GATE_PORT', 'PI_CODING_AGENT_DIR']:
    os.environ.pop(name, None)
os.environ['PI_OLLAMA_URL'] = 'http://127.0.0.1:9'  # a closed port: model capabilities fall back to the known default
os.environ['PI_TAILSCALE'] = 'false'                 # never the real tailscale binary
import tempfile  # noqa: E402
os.environ['PI_TRASH_DIR'] = tempfile.mkdtemp(prefix='pi-test-trash-')  # Move Project to Trash never reaches the Finder

os.environ['PI_LAYA_DATA'] = tempfile.mkdtemp(prefix='pi-test-laya-')  # tests never load the person's classifier
os.environ['PI_AGENT_DATA'] = tempfile.mkdtemp(prefix='pi-test-data-')  # code that falls back to the data folder never reaches ~/pi-local-harness-data
