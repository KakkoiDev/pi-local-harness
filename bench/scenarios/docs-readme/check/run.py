import re, sys
from pathlib import Path
project = Path(sys.argv[1])
try: text = (project / "README.md").read_text()
except OSError: print("no README.md"); sys.exit(1)
missing = [what for what, ok in [("names page()", "page(" in text), ("shows an example result", bool(re.search(r"\[\s*\d+\s*,\s*\d+", text))), ("says how to run the tests", "unittest" in text or "pytest" in text)] if not ok]
print(", ".join(missing) or "ok"); sys.exit(1 if missing else 0)
