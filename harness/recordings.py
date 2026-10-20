"""Task 333's local storage boundary. The transport must resolve a registered project first.

Client metadata never becomes a filename or timestamp. Capture is not evidence of
person approval; applications can synthesize DOM events.
"""
from contextlib import contextmanager
import fcntl
import json
import os
from pathlib import Path
import re
import time
import uuid
from harness.vendor.test_core_recording.flows import clean_flow

DAY = 24 * 60 * 60


class Recordings:
    def __init__(self, root, *, clock=time.time):
        self.root, self.clock = Path(root).resolve(), clock
        self.root.mkdir(parents=True, exist_ok=True)

    def directory(self, kind, project):
        if not isinstance(project, str) or not re.fullmatch(r'[A-Za-z0-9_-]{1,160}', project):
            raise ValueError('Invalid recording project.')
        directory = self.root/kind/project
        for path in (self.root/kind, directory):
            if path.is_symlink(): raise ValueError('Recording directory must not be a link.')
            path.mkdir(exist_ok=True)
        return directory

    @contextmanager
    def locked(self, project):
        directory = self.directory('recordings', project)
        descriptor = os.open(directory/'.lock', os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW, 0o600)
        with os.fdopen(descriptor, 'r+') as lock:
            fcntl.flock(lock, fcntl.LOCK_EX)
            yield directory

    @staticmethod
    def read(path):
        descriptor = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)
        with os.fdopen(descriptor) as source:
            value = json.load(source)
        if not isinstance(value, dict): raise ValueError('Invalid recording record.')
        return value

    @staticmethod
    def write(path, value):
        temporary = path.with_name('.'+uuid.uuid4().hex+'.tmp')
        descriptor = os.open(temporary, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
        with os.fdopen(descriptor, 'w') as target:
            json.dump(value, target, ensure_ascii=True); target.flush(); os.fsync(target.fileno())
        os.replace(temporary, path)

    def enabled(self, directory):
        path = directory/'settings.json'
        if not path.exists() and not path.is_symlink(): return True
        return self.read(path).get('enabled') is True

    def set_enabled(self, project, value):
        if type(value) is not bool: raise ValueError('Recording needs an on or off value.')
        with self.locked(project) as directory:
            self.write(directory/'settings.json', {'enabled': value})

    def retire(self, project, path):
        trash = self.directory('recording-trash', project)
        if path.is_symlink(): raise ValueError('Recording must not be a link.')
        path.rename(trash/(uuid.uuid4().hex+'.json'))

    def retained(self, project, directory):
        flows = []
        for path in directory.glob('flow-*.json'):
            value = self.read(path)
            if type(value.get('at')) not in (int, float): raise ValueError('Invalid recording time.')
            flows.append((path, value))
        flows.sort(key=lambda item: (item[1]['at'], item[0].name))
        for path, value in list(flows):
            if self.clock()-value['at'] >= 7*DAY:
                self.retire(project, path); flows.remove((path, value))
        while len(flows) > 20:
            path, _ = flows.pop(0); self.retire(project, path)
        return [value for _, value in flows]

    def append(self, project, flow):
        sanitized = clean_flow(flow, max_steps=500)
        # Only the server assigns identity, time and project. Never preserve URL origins.
        sanitized['steps'] = [step for step in sanitized['steps'] if step['type'] != 'navigate']
        with self.locked(project) as directory:
            if not self.enabled(directory): return None
            if not sanitized['steps']: return None
            value = {'id': uuid.uuid4().hex, 'at': self.clock(), 'steps': sanitized['steps']}
            self.write(directory/('flow-'+value['id']+'.json'), value)
            self.retained(project, directory)
            return value

    def history(self, project):
        with self.locked(project) as directory:
            return self.retained(project, directory)

    def recent(self, project):
        with self.locked(project) as directory:
            flows = self.retained(project, directory)
            return next((flow for flow in reversed(flows) if 0 <= self.clock()-flow['at'] <= 1800), None)

    def status(self, project):
        with self.locked(project) as directory:
            flows = self.retained(project, directory)
            return {'enabled': self.enabled(directory), 'flows': len(flows), 'steps': sum(len(flow['steps']) for flow in flows)}

    def clear(self, project):
        with self.locked(project) as directory:
            for path in directory.glob('flow-*.json'): self.retire(project, path)
