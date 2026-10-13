"""Durable FIFO work for one local agent; restarting never repeats an interrupted task."""
from harness.markdown_records import read_record,write_record
import copy
import json
from pathlib import Path
import threading
import time
import uuid
from urllib.parse import quote
from datetime import datetime

def now():return datetime.now().astimezone().isoformat(timespec='seconds')

class WorkQueue:
    def __init__(self, path, execute, busy=lambda:False, start=True):
        self.path=Path(path);self.path.parent.mkdir(parents=True,exist_ok=True)
        self.execute=execute;self.busy=busy;self.condition=threading.Condition();self.closed=False
        self.records=self.path.parent/'activity';self.records.mkdir(exist_ok=True)
        documents=sorted(self.records.glob('*.md'));legacy=not documents and self.path.exists()
        self.jobs=sorted([read_record(path) for path in documents],key=lambda job:(job['created'],job.get('order',0))) if documents else json.loads(self.path.read_text()) if self.path.exists() else []
        for index,job in enumerate(self.jobs):
            job.setdefault('order',index)
            if job['status']=='running':job.update(status='interrupted',progress='Agent stopped before this task completed; review before retrying.')
        self.save()
        if legacy:self.path.rename(self.path.with_name(self.path.name+'.before-markdown-'+uuid.uuid4().hex[:8]))
        self.last_persist=0
        self.thread=None
        if start:self.thread=threading.Thread(target=self.run,daemon=True);self.thread.start()
    def save(self, current=None):
        for job in ([current] if current is not None else self.jobs):
            data=job['data'];origin=data.get('document') or data.get('document_comment',{}).get('path')
            body=f"# {data.get('message') or 'Attached files'}\n\nStatus: **{job['status']}**\n\nProject: {job['project']}\n\nChat: [Open chat](/?chat={job['chat']})\n"
            if origin:body+=f"\nDocument: [Open document](/?document={quote(origin,safe='')})\n"
            body+=f"\nCreated: {job['created']}\n\n## Request\n\n{data.get('message','')}\n\n## Result\n\n{job.get('text') or job.get('progress','')}\n"
            if job.get('thinking'):body+='\n## Reasoning\n\n'+job['thinking']+'\n'
            record=copy.deepcopy(job)
            if record['data'].get('attachments'):
                payload=self.records/(job['id']+'.attachments.json')
                temporary=payload.with_suffix('.tmp');temporary.write_text(json.dumps(record['data'].pop('attachments')));temporary.replace(payload)
                record['data']['attachment_file']=payload.name
            write_record(self.records/(job['id']+'.md'),record,body)
    def hydrate(self, job):
        job=copy.deepcopy(job)
        name=job['data'].pop('attachment_file',None)
        if name:
            if Path(name).name!=name:raise ValueError('Invalid attachment record')
            job['data']['attachments']=json.loads((self.records/name).read_text())
        return job
    def add(self, project, chat, data):
        with self.condition:
            if self.closed:raise ValueError('Queue is shutting down')
            if sum(job['status']=='queued' for job in self.jobs)>=100:raise ValueError('Queue is full')
            # Chat messages sent while the chat's earlier message still waits join it: one request, not many (the person, 2026-10-13).
            plain=lambda value:not value.get('document') and not value.get('document_comment')
            waiting=next((item for item in reversed(self.jobs) if item['status']=='queued' and item['chat']==chat and plain(item['data'])),None) if plain(data) else None
            if waiting and len(waiting['data'].get('attachments',[]))+len(data.get('attachments',[]))<=8:
                joined=[part for part in (waiting['data'].get('message','').strip(),data.get('message','').strip()) if part]
                waiting['data']['message']='\n\n'.join(joined);waiting['data']['attachments']=[*waiting['data'].get('attachments',[]),*copy.deepcopy(data.get('attachments',[]))]
                self.save(waiting);return {**self.public(waiting),'merged':True}
            job={'id':uuid.uuid4().hex,'order':max((item.get('order',0) for item in self.jobs),default=-1)+1,'project':project,'chat':chat,'data':copy.deepcopy(data),'created':now(),'status':'queued','progress':'Waiting for the agent','text':'','thinking':''}
            self.jobs.append(job);self.save(job);self.condition.notify_all();return self.public(job)
    def public(self, job):
        return {**{key:copy.deepcopy(value) for key,value in job.items() if key!='data'},'record':'activity/'+job['id']+'.md','document':job['data'].get('document') or job['data'].get('document_comment',{}).get('path'),'comment_id':job['data'].get('document_comment',{}).get('id'),'message':job['data'].get('message',''),'files':[item.get('name','file') for item in job['data'].get('attachments',[])]}
    def list(self):
        with self.condition:return [self.public(job) for job in self.jobs]
    def cancel(self, identifier):
        with self.condition:
            job=next((job for job in self.jobs if job['id']==identifier),None)
            if not job:raise ValueError('Task not found')
            if job['status']!='queued':raise ValueError('Only queued tasks can be cancelled here; use Stop for active work')
            job.update(status='cancelled',progress='Cancelled before execution');self.save(job);return self.public(job)
    def update(self, job, event):
        with self.condition:
            kind=event.get('type')
            if kind=='status':job['progress']=event['text']
            if kind=='context':job['context']={'included':event['included'],'omitted':event['omitted'],'chars':event['chars']}
            elif kind=='message_update':
                delta=event['assistantMessageEvent']
                if delta['type']=='text_start':job['text']=''
                if delta['type']=='text_delta':job['text']=(job['text']+delta.get('delta',''))[-50000:];job['progress']='Responding'
                if delta['type']=='thinking_delta':job['thinking']=(job['thinking']+delta.get('delta',''))[-50000:];job['progress']='Thinking'
            elif kind=='tool_execution_start':
                job['progress']='Using '+event['toolName']
                if event.get('toolCallId'):args=event.get('args') or {};job.setdefault('tools',[]).append({'id':event['toolCallId'],'name':event['toolName'],'detail':str(next((args[key] for key in ('command','path','pattern') if key in args),''))[:300],'status':'running'});job['tools']=job['tools'][-200:]
            elif kind=='tool_execution_end':
                job['progress']='Tool failed; reconsidering' if event.get('isError') else 'Tool finished'
                for tool in job.get('tools',[]):
                    if tool['id']==event.get('toolCallId'):tool['status']='failed' if event.get('isError') else 'done'
            elif kind=='extension_ui_request' and event.get('method')=='notify':job['progress']=event.get('message','')
            if time.monotonic()-self.last_persist>=2:self.save(job);self.last_persist=time.monotonic()
    def run_one(self):
        with self.condition:
            if self.closed or self.busy():return False
            job=next((item for item in self.jobs if item['status']=='queued'),None)
            if not job:return False
            job.update(status='running',started=now(),progress='Loading project context');self.save(job)
        try:
            self.execute(self.hydrate(job),lambda event:self.update(job,event))
            with self.condition:job.update(status='completed',finished=now(),progress='Completed')
        except Exception as error:
            with self.condition:job.update(status='stopped' if str(error)=='Stopped' else 'failed',finished=now(),progress=str(error))
        finally:
            with self.condition:
                job['data'].pop('attachments',None);job['data'].pop('attachment_file',None);self.save(job)
        return True
    def run(self):
        while not self.closed:
            if not self.run_one():
                with self.condition:self.condition.wait(timeout=1)
    def close(self):
        with self.condition:self.closed=True;self.condition.notify_all()
        if self.thread:self.thread.join(timeout=6)
