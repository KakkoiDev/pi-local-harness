"""Durable FIFO work for one local agent; restarting never repeats an interrupted task."""
import copy
import json
from pathlib import Path
import threading
import time
import uuid
from datetime import datetime

def now():return datetime.now().astimezone().isoformat(timespec='seconds')

class WorkQueue:
    def __init__(self, path, execute, busy=lambda:False, start=True):
        self.path=Path(path);self.path.parent.mkdir(parents=True,exist_ok=True)
        self.execute=execute;self.busy=busy;self.condition=threading.Condition();self.closed=False
        self.jobs=json.loads(self.path.read_text()) if self.path.exists() else []
        for job in self.jobs:
            if job['status']=='running':job.update(status='interrupted',progress='Agent stopped before this task completed; review before retrying.')
        self.save()
        self.thread=None
        if start:self.thread=threading.Thread(target=self.run,daemon=True);self.thread.start()
    def save(self):
        temporary=self.path.with_suffix('.tmp');temporary.write_text(json.dumps(self.jobs,ensure_ascii=False));temporary.replace(self.path)
    def add(self, project, chat, data):
        with self.condition:
            if self.closed:raise ValueError('Queue is shutting down')
            if sum(job['status']=='queued' for job in self.jobs)>=100:raise ValueError('Queue is full')
            job={'id':uuid.uuid4().hex,'project':project,'chat':chat,'data':copy.deepcopy(data),'created':now(),'status':'queued','progress':'Waiting for the agent','text':'','thinking':''}
            self.jobs=[item for item in self.jobs if item['status'] in {'queued','running'}]+[item for item in self.jobs if item['status'] not in {'queued','running'}][-99:]
            self.jobs.append(job);self.save();self.condition.notify_all();return self.public(job)
    def public(self, job):
        return {**{key:copy.deepcopy(value) for key,value in job.items() if key!='data'},'message':job['data'].get('message',''),'files':[item.get('name','file') for item in job['data'].get('attachments',[])]}
    def list(self):
        with self.condition:return [self.public(job) for job in self.jobs]
    def cancel(self, identifier):
        with self.condition:
            job=next((job for job in self.jobs if job['id']==identifier),None)
            if not job:raise ValueError('Task not found')
            if job['status']!='queued':raise ValueError('Only queued tasks can be cancelled here; use Stop for active work')
            job.update(status='cancelled',progress='Cancelled before execution');self.save();return self.public(job)
    def update(self, job, event):
        with self.condition:
            kind=event.get('type')
            if kind=='status':job['progress']=event['text']
            elif kind=='message_update':
                delta=event['assistantMessageEvent']
                if delta['type']=='text_start':job['text']=''
                if delta['type']=='text_delta':job['text']=(job['text']+delta.get('delta',''))[-50000:];job['progress']='Responding'
                if delta['type']=='thinking_delta':job['thinking']=(job['thinking']+delta.get('delta',''))[-50000:];job['progress']='Thinking'
            elif kind=='tool_execution_start':job['progress']='Using '+event['toolName']
            elif kind=='tool_execution_end':job['progress']='Tool failed; reconsidering' if event.get('isError') else 'Tool finished'
            elif kind=='extension_ui_request' and event.get('method')=='notify':job['progress']=event.get('message','')
    def run_one(self):
        with self.condition:
            if self.closed or self.busy():return False
            job=next((item for item in self.jobs if item['status']=='queued'),None)
            if not job:return False
            job.update(status='running',started=now(),progress='Loading project context');self.save()
        try:
            self.execute(job,lambda event:self.update(job,event))
            with self.condition:job.update(status='completed',finished=now(),progress='Completed')
        except Exception as error:
            with self.condition:job.update(status='failed',finished=now(),progress=str(error))
        finally:
            with self.condition:
                job['data'].pop('attachments',None);self.save()
        return True
    def run(self):
        while not self.closed:
            if not self.run_one():
                with self.condition:self.condition.wait(timeout=1)
    def close(self):
        with self.condition:self.closed=True;self.condition.notify_all()
        if self.thread:self.thread.join(timeout=6)
