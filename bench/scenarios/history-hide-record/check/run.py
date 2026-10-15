import json, subprocess, sys
from pathlib import Path
project, harness = Path(sys.argv[1]), Path(sys.argv[2])
script = Path(__file__).with_name('check.mjs')
out = subprocess.run(['node', str(script), str(project), str(harness)], capture_output=True, text=True, timeout=600)
print((out.stdout + out.stderr).strip()[-1500:]); sys.exit(out.returncode)
