"""The shared project phase. Pi produces content; only the person or auto moves the phase."""
from copy import deepcopy
from datetime import datetime
import hashlib
import json
from pathlib import Path
import threading

PHASES = ('discussion', 'planning', 'implementation')


class Phases:
    def __init__(self, data=None):
        self.data = Path(data) if data else None
        self.values = {}
        self.lock = threading.RLock()

    def file(self, root):
        key = hashlib.sha256(str(Path(root).resolve()).encode()).hexdigest()
        return self.data / 'phases' / (key + '.json') if self.data else None

    def get(self, root):
        with self.lock:
            file = self.file(root)
            try:
                value = json.loads(file.read_text(encoding='utf-8')) if file else self.values.get(str(Path(root).resolve()))
            except FileNotFoundError:
                value = None
            # A corrupt existing record must not silently replace an enforced phase.
            if value is None:
                return {'phase': 'discussion', 'history': []}
            if value.get('phase') not in PHASES or not isinstance(value.get('history'), list):
                raise ValueError('The saved project phase could not be read.')
            return deepcopy(value)

    def choose(self, root, phase, *, actor, planned=False, action='phase button'):
        if phase not in PHASES:
            raise ValueError('Choose Discussion, Planning or Implementation.')
        if actor not in ('person', 'auto'):
            raise ValueError('Only the person can choose the project phase.')
        with self.lock:
            before = self.get(root)
            if actor == 'auto' and (before['phase'], phase) != ('planning', 'implementation'):
                raise ValueError('Run on its own can only move Planning to Implementation.')
            if phase == 'implementation' and not planned:
                raise ValueError('No planned task yet. Plan one first.')
            if before['phase'] == phase:
                return before
            value = {'phase': phase, 'history': [*before['history'], {
                'phase': phase, 'actor': actor, 'action': action,
                'at': datetime.now().astimezone().isoformat(timespec='seconds'),
            }]}
            file = self.file(root)
            if file:
                file.parent.mkdir(parents=True, exist_ok=True)
                temporary = file.with_suffix('.tmp')
                temporary.write_text(json.dumps(value, ensure_ascii=False), encoding='utf-8')
                temporary.replace(file)
            else:
                self.values[str(Path(root).resolve())] = value
            return deepcopy(value)
