"""The one model this harness runs, read from harness/model.json. config.json cannot override it."""
import json
from pathlib import Path

_PIN = json.loads(Path(__file__).with_name('model.json').read_text())
PROVIDER = _PIN['provider']
MODEL = _PIN['model']
QUALIFIED = f'{PROVIDER}/{MODEL}'
