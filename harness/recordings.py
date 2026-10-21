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
    def __init__(self, root, *, clock=time.time, default_enabled=True, shared_settings=False):
        self.root, self.clock = Path(root).resolve(), clock
        self.default_enabled, self.shared_settings = default_enabled, shared_settings

    def directory(self, kind, project):
        if not isinstance(project, str) or not re.fullmatch(r'[A-Za-z0-9_-]{1,160}', project):
            raise ValueError('Invalid recording project.')
        self.root.mkdir(parents=True, exist_ok=True)
        directory = self.root/kind/project
        for path in (self.root/kind, directory):
            if path.is_symlink(): raise ValueError('Recording directory must not be a link.')
            path.mkdir(exist_ok=True)
        return directory

    @contextmanager
    def locked(self, project):
        directory = self.directory('recordings', project)
        descriptor = os.open((self.root if self.shared_settings else directory)/'.lock', os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW, 0o600)
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

    def settings_path(self, directory):
        return (self.root if self.shared_settings else directory)/'settings.json'

    def settings(self, directory):
        path = self.settings_path(directory)
        return self.read(path) if path.exists() or path.is_symlink() else {'enabled': self.default_enabled, 'generation': 0}

    def enabled(self, directory):
        return self.settings(directory).get('enabled') is True

    def set_enabled(self, project, value):
        if type(value) is not bool: raise ValueError('Recording needs an on or off value.')
        with self.locked(project) as directory:
            settings = self.settings(directory)
            self.write(self.settings_path(directory), {**settings, 'enabled': value, 'notice_seen': True, 'ever_enabled': settings.get('ever_enabled', False) or value, 'generation': settings.get('generation', 0)+1})

    def dismiss_notice(self, project):
        with self.locked(project) as directory:
            self.write(self.settings_path(directory), {**self.settings(directory), 'notice_seen': True})

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

    def append(self, project, flow, *, flow_id=None, generation=None, session=None):
        if not isinstance(flow, dict) or not isinstance(flow.get('steps'), list):
            raise ValueError('Recording needs a list of actions.')
        if generation is not None and len(flow['steps']) > 50:
            raise ValueError('Recording batch exceeds 50 actions.')
        sanitized = clean_flow(flow, max_steps=500)
        sanitized['steps'] = [step for step in sanitized['steps'] if step['type'] != 'navigate']
        if flow_id is not None and (not isinstance(flow_id, str) or not re.fullmatch(r'[0-9a-f]{32}', flow_id)):
            raise ValueError('Invalid recording flow.')
        with self.locked(project) as directory:
            settings = self.settings(directory)
            if not self.enabled(directory): return None
            if generation is not None and (type(generation) is not int or generation != settings.get('generation', 0)):
                return None
            if not sanitized['steps']: return None
            if flow_id:
                path = directory/('flow-'+flow_id+'.json')
                if not path.exists(): return None
                value = self.read(path)
                if value.get('generation', 0) != settings.get('generation', 0) or value.get('session') != session: return None
                if value.get('truncated'): return value
                room = max(0, 500-len(value['steps']))
                value['steps'].extend(sanitized['steps'][:room])
            else:
                value = {'id': uuid.uuid4().hex, 'at': self.clock(), 'generation': settings.get('generation', 0), 'session': session, 'steps': sanitized['steps']}
            value['truncated'] = len(value['steps']) >= 500
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
            return {'enabled': self.enabled(directory), 'ever_enabled': self.settings(directory).get('ever_enabled') is True, 'notice_seen': self.settings(directory).get('notice_seen') is True, 'generation': self.settings(directory).get('generation', 0), 'flows': len(flows), 'steps': sum(len(flow['steps']) for flow in flows)}

    def clear(self, project):
        with self.locked(project) as directory:
            settings = self.settings(directory)
            self.write(self.settings_path(directory), {**settings, 'generation': settings.get('generation', 0)+1})
            for path in directory.glob('flow-*.json'): self.retire(project, path)
