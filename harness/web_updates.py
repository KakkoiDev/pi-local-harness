"""The web update window: the source clone's safe updater, with one remembered daily check."""
import threading
import time
from pathlib import Path

from harness import autonomy, updates
from harness.settings import DEFAULTS


class UpdateService:
    def __init__(self,data,source,check=updates.check,apply=updates.apply,clock=time.time):
        self.data,self.source=Path(data),Path(source)
        self.check_source,self.apply_source,self.clock=check,apply,clock
        self.lock=threading.RLock()
        self.path=self.data/'update-check.json'
        self.busy=False

    def settings(self,changes=None):
        with autonomy.LOCK:
            path=self.data/'config.json';saved=autonomy.read(path,{})
            if changes is not None:
                for key,value in changes.items():
                    if key=='updates_daily' and isinstance(value,bool):continue
                    if key=='language' and value in ('en','ja','system'):continue
                    if key=='detail' and value in ('beginner','expert'):continue  # task 273: Settings › Pi › Detail
                    raise ValueError('Invalid workbench setting.')
                saved.update(changes);autonomy.write(path,saved)
            return {key:saved.get(key,DEFAULTS[key]) for key in ('updates_daily','language','detail')}

    def status(self):
        return {**autonomy.read(self.path,{'state':'unchecked'}),'busy':self.busy}

    def check(self,daily=False):
        with self.lock:
            previous=self.status()
            if daily and (not self.settings()['updates_daily'] or self.clock()-previous.get('checked',0)<86400):return previous
            self.busy=True
            try:
                found=self.check_source(self.source)
                autonomy.write(self.path,{**found,'checked':self.clock()})
            finally:self.busy=False
            return self.status()

    def update(self):
        with self.lock:
            self.busy=True
            try:
                found=self.apply_source(self.source)
                autonomy.write(self.path,{**found,'checked':self.clock()})
            finally:self.busy=False
            return self.status()

    def daily(self):
        # A remote fetch must not hold up opening the workbench or its polling loop.
        if not self.busy and self.settings()['updates_daily'] and self.clock()-self.status().get('checked',0)>=86400:
            threading.Thread(target=self.check,kwargs={'daily':True},daemon=True).start()
        return self.status()
