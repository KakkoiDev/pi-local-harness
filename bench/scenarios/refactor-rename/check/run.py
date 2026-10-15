import subprocess, sys
from pathlib import Path
project = Path(sys.argv[1])
left = [str(p.relative_to(project)) for p in project.rglob("*.py") if "area_rect" in p.read_text()]
if left: print("area_rect still in", left); sys.exit(1)
code = "from geometry import rectangle_area, area_square\nfrom shapes import total_area\nassert rectangle_area(2, 3) == 6 and area_square(4) == 16 and total_area([(1, 2), (3, 4)]) == 14"
run = subprocess.run([sys.executable, "-c", code], cwd=project, capture_output=True, text=True)
print(run.stderr[-300:] or "ok"); sys.exit(run.returncode)
