"""Initialize PLH configuration without changing ordinary Pi defaults."""
import os
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent.parent))
from plh import configuration
data=Path(os.getenv("PI_AGENT_DATA",str(Path.home()/"pi-local-agent-data")))
configuration(data)
print(f"PLH config: {data}/config.json; ordinary Pi settings unchanged.")
