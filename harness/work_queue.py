"""Durable bounded work for isolated local sessions; restarting never repeats an interrupted task."""
from harness.markdown_records import read_record,write_record
import copy
import json
import os
import re
from pathlib import Path
import threading
import time
import uuid
from urllib.parse import quote
from datetime import datetime
from gate.sandbox import shown  # task 311: a sandboxed test run shows the command Gate allowed
from harness.canary import strip_canary  # the owner, 2026-10-18: [CANARY] is protocol, never shown

def now():return datetime.now().astimezone().isoformat(timespec='seconds')

def display_text(text,streaming=False):
    if os.getenv('PI_HARNESS_BARE')=='1':return text
    text=re.sub(r'<channel\|>|<\|[^<>\n]*\|>','',text)
    if streaming:
        before,mark,tail=text.rpartition('<')
        if mark and (tail.startswith('|') or 'channel|>'.startswith(tail)):text=before
    return strip_canary(text,streaming)

class QueueRefusal(ValueError):
    """Task 325: an edit or removal the queue refused because the message moved on (it started, it was removed, or another
    window changed it). `reason` is 'started', 'removed', 'gone' or 'changed'; `job` is the message as it is now."""
    def __init__(self, message, reason, job=None):
        super().__init__(message);self.reason=reason;self.job=job

STARTED='Pi already started this message; your edit was not sent.'
CHANGED='This message changed in another window; your edit was not saved.'
STARTED_REMOVE='Pi already started this message, so it was not removed. Use Stop to stop it.'
CHANGED_REMOVE='This message changed in another window, so it was not removed. Read it again first.'

class WorkQueue:
    # Only configuration-specific verified progress permits concurrent jobs. Every lane counts toward the same limit.
    def __init__(self, path, execute, busy=lambda:False, start=True, mode=lambda:('one at a time',1),workspace=lambda project:project):
        self.path=Path(path);self.path.parent.mkdir(parents=True,exist_ok=True)
        self.execute=execute;self.workspace=workspace;self.busy=busy;self.mode=mode;self.condition=threading.Condition();self.closed=False
        self.records=self.path.parent/'activity';self.records.mkdir(exist_ok=True)
        documents=sorted(self.records.glob('*.md'));legacy=not documents and self.path.exists()
        self.jobs=sorted([read_record(path) for path in documents],key=lambda job:(job['created'],job.get('order',0))) if documents else json.loads(self.path.read_text()) if self.path.exists() else []
        for index,job in enumerate(self.jobs):
            job.setdefault('order',index)
            if job['data'].get('attachments'):self.store_attachments(job,job['data'].pop('attachments'))  # older records kept them inline
            elif job['data'].get('attachment_file') and 'attachment_names' not in job['data']:
                try:job['data']['attachment_names']=[item.get('name','file') for item in self.load_attachments(job)]
                except (OSError,ValueError):job['data']['attachment_names']=[]
            if job['status']=='running':job.update(status='interrupted',progress='Agent stopped before this task completed; review before retrying.')
        self.save()
        if legacy:self.path.rename(self.path.with_name(self.path.name+'.before-markdown-'+uuid.uuid4().hex[:8]))
        self.last_persist=0
        self.workers=[];self.owners={}  # job id → the thread that runs it (reap: no job stays running without one)
        self.thread=None
        if start:self.thread=threading.Thread(target=self.run,daemon=True);self.thread.start()
    def save(self, current=None):
        for job in ([current] if current is not None else self.jobs):
            data=job['data'];origin=data.get('document') or (data.get('document_comment') or {}).get('path')
            body=f"# {data.get('message') or 'Attached files'}\n\nStatus: **{job['status']}**\n\nProject: {job['project']}\n\nChat: [Open chat](/?chat={job['chat']})\n"
            if origin:body+=f"\nDocument: [Open document](/?document={quote(origin,safe='')})\n"
            body+=f"\nCreated: {job['created']}\n\n## Request\n\n{data.get('message','')}\n\n## Result\n\n{display_text(job.get('text',''),streaming=job['status']=='running') or job.get('progress','')}\n"
            if job.get('thinking'):body+='\n## Reasoning\n\n'+job['thinking']+'\n'
            record=copy.deepcopy(job)
            write_record(self.records/(job['id']+'.md'),record,body)
    # Attachments live in one payload file per job, written when the job is added or joined, read when it runs and deleted
    # when it ends. The job itself only keeps the file name and the attachment names (no megabytes rewritten on every save).
    def payload(self, job):
        name=job['data'].get('attachment_file')
        if not name:return None
        if Path(name).name!=name:raise ValueError('Invalid attachment record')
        return self.records/name
    def load_attachments(self, job):
        path=self.payload(job);return json.loads(path.read_text()) if path and path.exists() else []
    def store_attachments(self, job, attachments):
        path=self.records/(job['id']+'.attachments.json');temporary=path.with_suffix('.tmp')
        temporary.write_text(json.dumps(attachments));temporary.replace(path)
        job['data'].update(attachment_file=path.name,attachment_names=[item.get('name','file') for item in attachments])
    def drop_attachments(self, job):
        path=self.payload(job)
        if path:path.unlink(missing_ok=True)
        for key in ('attachment_file','attachment_names'):job['data'].pop(key,None)
    def hydrate(self, job):
        job=copy.deepcopy(job);attachments=self.load_attachments(job)
        for key in ('attachment_file','attachment_names'):job['data'].pop(key,None)
        if attachments:job['data']['attachments']=attachments
        return job
    def add(self, project, chat, data):
        with self.condition:
            if self.closed:raise ValueError('Queue is shutting down')
            if sum(job['status']=='queued' for job in self.jobs)>=100:raise ValueError('Queue is full')
            # Chat messages sent while the chat's earlier message still waits join it: one request, not many (the person, 2026-10-13).
            # Task 290: an answer to a question, Start Building and Continue are requests of their own, never joined.
            plain=lambda value:self.role(value)=='chat' and not value.get('choice_answer') and not value.get('control')
            waiting=next((item for item in reversed(self.jobs) if item['status']=='queued' and item['chat']==chat and plain(item['data'])),None) if plain(data) else None
            incoming=copy.deepcopy(data.get('attachments',[]))
            if waiting and len(waiting['data'].get('attachment_names',[]))+len(incoming)<=8:
                joined=[part for part in (waiting['data'].get('message','').strip(),data.get('message','').strip()) if part]
                waiting['data']['message']='\n\n'.join(joined)
                if incoming:self.store_attachments(waiting,[*self.load_attachments(waiting),*incoming])  # earlier attachments survive a restart
                waiting['version']=waiting.get('version',1)+1  # task 325: an edit from a window that saw the earlier text is refused
                self.save(waiting);return {**self.public(waiting),'merged':True}
            job={'id':uuid.uuid4().hex,'order':max((item.get('order',0) for item in self.jobs),default=-1)+1,'project':project,'chat':chat,'data':{key:copy.deepcopy(value) for key,value in data.items() if key!='attachments'},'created':now(),'status':'queued','progress':'Waiting for the agent','text':'','thinking':'','version':1}
            if incoming:self.store_attachments(job,incoming)
            # Task 290: Pi waits for the answer, so it goes before the chat's other waiting messages (FIFO otherwise).
            ahead=next((index for index,item in enumerate(self.jobs) if item['status']=='queued' and item['chat']==chat and self.role(item['data'])=='chat'),None) if data.get('choice_answer') else None
            if ahead is not None:job.update(created=self.jobs[ahead]['created'],order=self.jobs[ahead].get('order',0)-.5)
            self.save(job)  # written before it joins the list: a record that cannot be saved never enters the queue
            if ahead is None:self.jobs.append(job)
            else:self.jobs.insert(ahead,job)
            self.condition.notify_all();return self.public(job)
    @staticmethod
    def role(data):
        return 'worker' if data.get('worker') else 'comment' if data.get('document_comment') else 'document' if data.get('document') else 'chat'
    def runnable(self, job, *, running=None, mode=None):
        """Whether a queued request may start now, given what runs (call with the condition held)."""
        if running is None:running=[item for item in self.jobs if item['status']=='running']
        mode,slots=self.mode() if mode is None else mode
        limit=max(1,int(slots or 1)) if mode=='parallel' else 1
        if len(running)>=limit:return False
        # Chats can run tools too: all requests retain the workspace exclusion, including symlink aliases.
        # Same-history requests never resume or append one Pi session concurrently.
        def conflict(other):
            if not job['project'] or not other['project']:return False
            left,right=Path(self.workspace(other['project'])),Path(self.workspace(job['project']))
            return left==right or left in right.parents or right in left.parents
        if any(item['chat']==job['chat'] or conflict(item) for item in running):return False
        return True
    def project_agents(self, projects):
        """A project owns one agent lane, not one permanently running process.

        Availability is advisory: dispatch rechecks capability and ownership at claim time.
        Older runnable work reserves its slot so the composer never promises to jump it.
        """
        with self.condition:
            running=[job for job in self.jobs if job['status']=='running']
            blocked=self.closed or self.busy()
            mode=self.mode()
            result={}
            def available(job):
                try:return self.runnable(job,running=running,mode=mode)
                except (ValueError,OSError):return False  # A removed/unplugged folder cannot break workspace polling.
            if not blocked:
                for job in self.jobs:
                    if job['status']=='queued' and available(job):running.append(job)
            for project in projects:
                identifier=project['id']
                owned=[job for job in self.jobs if job['project']==identifier]
                probe={'project':identifier,'chat':project.get('chat')}
                result[identifier]={'id':identifier,
                    'running':[job['id'] for job in owned if job['status']=='running'],
                    'queued':[job['id'] for job in owned if job['status']=='queued'],
                    'available':not blocked and not project.get('missing') and available(probe)}
            return result

    def claim(self, job):
        """Mark a request running. False when its record cannot be saved: it fails instead of blocking its lane."""
        job.update(status='running',started=now(),progress='Loading project context')
        try:self.save(job);return True
        except OSError as error:
            job.update(status='failed',finished=now(),progress=f'Could not save the request record: {error}')
            try:self.save(job)
            except OSError:pass
            return False
    def finish(self, job):
        """Run a claimed request to its end; the record says how it ended."""
        try:
            self.execute(self.hydrate(job),lambda event:self.update(job,event))
            with self.condition:
                # Task 290: a request that paused for a question or a plan waits for the person; it is not Completed.
                plan=job.get('plan') or {}
                # The owner's review list (2026-10-18): the person answered the card while this worker was still
                # shutting down; the answer is its own request, so this one is done, never left Waiting for you.
                if job.get('resumed'):job.update(status='completed',finished=now(),progress=job.pop('resumed'))
                elif (job.get('choice') or {}).get('pending'):job.update(status='waiting',finished=now(),progress='Stopped by a question: waiting for your answer')
                elif plan.get('pending') and not plan.get('approved'):job.update(status='waiting',finished=now(),progress='Stopped for the plan: waiting for Start Building')
                else:job.update(status='completed',finished=now(),progress='Completed')
        except Exception as error:
            stopped=str(error)=='Stopped'  # task 290: the person's Stop, never a question's pause
            with self.condition:job.update(status='stopped' if stopped else 'failed',finished=now(),progress='Stopped by you' if stopped else str(error))
        finally:
            with self.condition:
                job['text']=display_text(job.get('text',''));self.drop_attachments(job);self.save(job);self.condition.notify_all()
    def dispatch(self):
        """Start every queued request that may run now, each in its own thread; FIFO within each lane."""
        started=[]
        with self.condition:
            self.reap()
            if self.closed or self.busy():return 0
            for job in self.jobs:
                if job['status']=='queued' and self.runnable(job) and self.claim(job):started.append(job)
        for job in started:
            thread=threading.Thread(target=self.finish,args=(job,),daemon=True);self.owners[job['id']]=thread;thread.start();self.workers.append(thread)
        self.workers=[thread for thread in self.workers if thread.is_alive()]
        return len(started)
    def reap(self):
        """The owner, 2026-10-18: a request marked running whose worker is gone must never hold its lane. finish() settles
        every request it runs; this settles one whose thread ended anyway (call with the condition held)."""
        for job in self.jobs:
            owner=self.owners.get(job['id'])
            if owner is not None and not owner.is_alive():
                self.owners.pop(job['id'],None)
                if job['status']=='running':
                    job.update(status='failed',finished=now(),progress='The worker for this request ended without finishing it.')
                    try:self.save(job)
                    except OSError:pass
    def public(self, job):
        return {'role':self.role(job['data']),**{key:copy.deepcopy(value) for key,value in job.items() if key!='data'},'text':display_text(job.get('text',''),streaming=job.get('status')=='running'),'record':'activity/'+job['id']+'.md','document':job['data'].get('document') or (job['data'].get('document_comment') or {}).get('path'),'comment_id':(job['data'].get('document_comment') or {}).get('id'),'message':job['data'].get('message',''),**({'retry_of':job['data']['retry_of']} if job['data'].get('retry_of') else {}),'files':list(job['data'].get('attachment_names',[])),'editable':self.editable(job['data'])}
    def list(self):
        with self.condition:return [self.public(job) for job in self.jobs]
    def retry(self, identifier, note=''):
        """Ask Pi to Retry… (plan 184, A_Retry): queue a request that stopped again, with the person's note; the stopped
        run keeps its record."""
        with self.condition:
            job=next((job for job in self.jobs if job['id']==identifier),None)
            if not job:raise ValueError('Task not found')
            if job['status'] not in ('failed','stopped','interrupted'):raise ValueError('Ask Pi to Retry is only for a request that stopped')
            data={key:copy.deepcopy(value) for key,value in job['data'].items()}
            note=str(note or '').strip()
            if note:data['message']=f"{data.get('message','').rstrip()}\n\nNote from the person: {note}"
            data['retry_of']=identifier
        return self.add(job['project'],job['chat'],data)
    def resume_waiting(self, chat, progress):
        """Task 290: the person answered the question or acted on the plan a request paused for; it is complete."""
        with self.condition:
            for job in self.jobs:
                if job['chat']==chat and job['status']=='waiting':job.update(status='completed',progress=progress[:300]);self.save(job)
                elif job['chat']==chat and job['status']=='running' and self.role(job['data'])=='chat' and ((job.get('choice') or {}).get('pending') or (job.get('plan') or {}).get('pending')):job['resumed']=progress[:300]  # finish() completes it
    def cancel(self, identifier):
        with self.condition:
            job=next((job for job in self.jobs if job['id']==identifier),None)
            if not job:raise ValueError('Task not found')
            if job['status']!='queued':raise ValueError('Only queued tasks can be cancelled here; use Stop for active work')
            job.update(status='cancelled',progress='Cancelled before execution');self.drop_attachments(job);self.save(job);return self.public(job)
    # Task 325 (the owner: "I want to be able to read and update/remove queued messages to the agent"): the person edits or
    # removes a message that still waits. Both run with the condition held, as the worker's claim does, so a message being
    # started cannot change, and a removed one can never start. `version` is the one the person's window showed.
    @staticmethod
    def editable(data):
        return WorkQueue.role(data)=='chat' and not data.get('choice_answer') and not data.get('control')
    def waiting(self, identifier, version, edit=True):
        """The queued job the person's window showed at `version`, or QueueRefusal (call with the condition held)."""
        job=next((job for job in self.jobs if job['id']==identifier),None)
        if not job:raise QueueRefusal('This message is no longer in the queue.','gone')
        if job['status']=='cancelled':raise QueueRefusal('This message was removed; your edit was not sent.' if edit else 'This message was already removed.','removed',self.public(job))
        if job['status']!='queued':raise QueueRefusal(STARTED if edit else STARTED_REMOVE,'started',self.public(job))
        if isinstance(version,bool) or not isinstance(version,int):raise ValueError('Reload the page: this window does not know which version of the message it shows.')
        if job.get('version',1)!=version:raise QueueRefusal(CHANGED if edit else CHANGED_REMOVE,'changed',self.public(job))
        return job
    def edit(self, identifier, version, message, remove_files=()):
        """Replace a waiting message's text and drop some of its attachments (their indexes); it keeps its place."""
        if not isinstance(message,str):raise ValueError('Message must be text')
        if len(message)>200000:raise ValueError('Message is too large')
        if not isinstance(remove_files,(list,tuple)) or not all(isinstance(index,int) and not isinstance(index,bool) for index in remove_files):raise ValueError('Choose the attachments to remove by their place in the list.')
        with self.condition:
            job=self.waiting(identifier,version)
            if not self.editable(job['data']):raise ValueError('Only a chat message can be edited; remove this request instead.')
            attachments=self.load_attachments(job) if remove_files else None
            if remove_files and not all(0<=index<len(attachments) for index in remove_files):raise ValueError('That attachment is no longer on this message.')
            kept=[item for index,item in enumerate(attachments) if index not in set(remove_files)] if remove_files else None
            if not message.strip() and not (kept if remove_files else job['data'].get('attachment_names')):raise ValueError('Write a message or keep an attachment. To drop the whole message, use Remove.')
            job['data']['message']=message.strip()
            if remove_files:
                if kept:self.store_attachments(job,kept)
                else:self.drop_attachments(job)
            job.update(version=version+1,edited=now());self.save(job);return self.public(job)
    def remove(self, identifier, version):
        """The person removes a waiting message: it never runs, and its attachments are released."""
        with self.condition:
            job=self.waiting(identifier,version,edit=False)
            job.update(status='cancelled',finished=now(),progress='Removed by you before it started',removed=True,version=version+1)
            self.drop_attachments(job);self.save(job);self.condition.notify_all();return self.public(job)
    def update(self, job, event):
        with self.condition:
            kind=event.get('type')
            if kind=='status':job['progress']=event['text']
            if kind=='context':
                job['context']={'included':event['included'],'omitted':event['omitted'],'reasons':event.get('reasons',{}),'chars':event['chars'],'excluded':event.get('excluded',[]),'excluded_count':event.get('excluded_count',0)}
                job.setdefault('context_turns',[]).append({'time':now(),**copy.deepcopy(job['context'])})
            elif kind in ('choice','plan','check_in','report','decision'):job[kind]={key:value for key,value in event.items() if key!='type'}
            elif kind=='also_read':job['also_read']=list(event.get('files',[]))[:20]  # task 136
            elif kind=='paused':job['paused']=bool(event.get('paused'))  # task 164: waiting while Pi answers the chat
            elif kind=='assistant_final':job['text']=display_text(event['text'])[-50000:]
            elif kind=='message_update':
                delta=event['assistantMessageEvent']
                if delta['type']=='text_start':job['text']=''
                if delta['type']=='text_delta':job['text']=(job['text']+delta.get('delta',''))[-50000:];job['progress']='Responding'
                if delta['type']=='thinking_delta':job['thinking']=(job['thinking']+delta.get('delta',''))[-50000:];job['progress']='Thinking'
            elif kind=='tool_execution_start':
                job['progress']='Using '+event['toolName']
                if event.get('toolCallId'):args=event.get('args') or {};job.setdefault('tools',[]).append({'id':event['toolCallId'],'name':event['toolName'],'detail':shown(str(next((args[key] for key in ('command','path','pattern') if key in args),'')))[:300],'status':'running'});job['tools']=job['tools'][-200:]
            elif kind=='tool_execution_end':
                job['progress']='Tool failed; reconsidering' if event.get('isError') else 'Tool finished'
                for tool in job.get('tools',[]):
                    if tool['id']==event.get('toolCallId'):tool['status']='failed' if event.get('isError') else 'done'
            elif kind=='extension_ui_request' and event.get('method')=='notify' and event.get('message')!='Harness settled':job['progress']=event.get('message','')  # plan 184: that one is a signal, not a phase
            if kind=='context' or time.monotonic()-self.last_persist>=2:self.save(job);self.last_persist=time.monotonic()
    def run_one(self):
        """Run the next request that may start, to its end, in this thread (tests and simple callers)."""
        with self.condition:
            if self.closed or self.busy():return False
            job=next((item for item in self.jobs if item['status']=='queued' and self.runnable(item)),None)
            if not job:return False
            if not self.claim(job):return True
        self.finish(job)
        return True
    def run(self):
        while not self.closed:
            try:ran=self.dispatch()
            except Exception as error:  # one bad record must never stop the worker for every later request
                print(f'Work queue: {error!r}',flush=True);ran=False
            if not ran:
                with self.condition:self.condition.wait(timeout=1)
    def close(self):
        with self.condition:self.closed=True;self.condition.notify_all()
        if self.thread:self.thread.join(timeout=6)
        for thread in list(self.workers):thread.join(timeout=6)  # requests end (their process is stopped by the caller) before the records go
