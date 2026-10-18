"""Persistent web conversations backed by isolated Pi RPC sessions, sharing Gate."""
from harness import autonomy
import base64
import hmac
import html
import secrets
from datetime import datetime
from harness.context import build_context, build_project_context
from harness.music_artifacts import music_attachments
from harness import capability
from harness.documents import DocumentStore, DocumentConflict
from harness.model import PROVIDER, MODEL, EFFORTS
from harness import model as models
from harness.work_queue import WorkQueue, QueueRefusal, display_text
from harness.canary import strip_canary
from harness.preview import Previews
from harness import undo as undoing
from harness import laya, theme
from harness.decision_log import record
from harness import decision_rows
from harness import tool_repairs
import json
import os
from pathlib import Path
from gate.protocol import Protocol, project_root
from harness import reports
import queue
import re
import subprocess
import tempfile
import threading
import time
import uuid

ROOT = Path(__file__).resolve().parent.parent
MAX_UPLOAD = 12 * 1024 * 1024
IMAGE_TYPES = {'image/png', 'image/jpeg', 'image/webp', 'image/gif'}
AUDIO_SUFFIXES = {'.wav', '.mp3', '.m4a', '.ogg', '.flac', '.aac', '.webm', '.mp4'}
TEXT_SUFFIXES = {'.txt', '.md', '.py', '.js', '.ts', '.json', '.yaml', '.yml', '.csv', '.html', '.css', '.xml', '.sh', '.log', '.rs', '.go', '.c', '.cpp', '.toml'}

def timestamp():
    return datetime.now().astimezone().isoformat(timespec='seconds')

def serve_link(problem):
    """The page where Serve is enabled for this tailnet, from the `tailscale serve` error (Dialogs2, phone access off)."""
    if not problem:return None
    found=re.search(r'https://login\.tailscale\.com/f/serve\S*',problem)
    return found.group(0).rstrip('.,)') if found else None


# Task 165: a request has no time limit. It fails only when Pi has sent nothing (no step, no output, no tool event) for
# this long; a long command that reports nothing for an hour is stopped. PI_HARNESS_SILENCE_SECONDS changes it.
SILENCE=float(os.getenv('PI_HARNESS_SILENCE_SECONDS','3600'))
# The owner, 2026-10-18: a model stream that stalls (Ollama's runner restarted under an open connection) left a request
# "running" for half an hour and every later request queued behind it. While Pi waits for the MODEL (not for a tool, not
# for the harness's own paperwork or compaction, not paused for the chat), this much silence ends the request as failed:
# "the model stopped answering (no reply in 120 s)". A thinking model streams tokens, so it is never silent this long.
MODEL_SILENCE=float(os.getenv('PI_HARNESS_MODEL_SILENCE_SECONDS','120'))
# 2026-10-19 (live, qwen3.8:27b): a big model loading and reading a long prompt sent nothing for over 120 s before its
# first token and the watchdog failed a healthy request. Until the model's first output in a request, the longer
# model_start_seconds applies; once it has spoken, a silence of MODEL_SILENCE means it stopped.
MODEL_START=float(os.getenv('PI_HARNESS_MODEL_START_SECONDS','900'))


def model_silence_reason(seconds):
    return f'the model stopped answering (no reply in {seconds:g} s).'


def model_start_reason(seconds):
    return f'the model did not start answering (no reply in {seconds:g} s).'


def silence_words(seconds):
    return f'{seconds/3600:g} hour{"" if seconds==3600 else "s"}' if seconds>=3600 else f'{seconds/60:g} minutes' if seconds>=120 else f'{seconds:g} seconds'


class TerminalBusy(ValueError):
    """Round 12 (task 262, R12_Renamed): a project command refused while terminal Pi works; the page shows its own alert."""
    def __init__(self, command, name, since):
        said={'rename':f'Can’t rename “{name}” while terminal Pi works in it.','move':f'Can’t move “{name}” while terminal Pi works in it.'}.get(command,f'Can’t move “{name}” to the Trash while terminal Pi works in it.')
        super().__init__(said);self.command,self.name,self.since=command,name,since


class ProjectBusy(ValueError):
    """A project command refused while Pi works in that project (task 154); `job` is the request to show in Activity."""
    def __init__(self, job):
        super().__init__('Pi is answering about this project.');self.job=job


class ConversationStore:
    def __init__(self, root):
        self.root=Path(root);self.root.mkdir(parents=True,exist_ok=True)
        self.lock=threading.RLock()
    def folder(self, identifier):
        if not re.fullmatch(r'[0-9a-f]{32}',identifier):raise ValueError('Invalid conversation ID')
        return self.root/identifier
    def get(self, identifier):
        with self.lock:return json.loads((self.folder(identifier)/'conversation.json').read_text())
    def save(self, value):
        with self.lock:
            folder=self.folder(value['id']);folder.mkdir(exist_ok=True)
            value['updated']=timestamp()
            temporary=folder/'conversation.tmp'
            temporary.write_text(json.dumps(value,ensure_ascii=False));temporary.replace(folder/'conversation.json')
        return value
    def stop_check_in(self,identifier,index):
        with self.lock:
            value=self.get(identifier)
            if not isinstance(index,int) or isinstance(index,bool) or not 0<=index<len(value['messages']):raise ValueError('Check-in not found.')
            message=value['messages'][index]
            if message.get('role')!='assistant' or not message.get('check_in'):raise ValueError('Check-in not found.')
            message['check_in'].update(state='stopped',when=timestamp())
            return self.save(value)

    def settle_choices(self, identifier, reason):
        """Task 290: cards still open when approval or a new plan replaced their question say so, and cannot be answered."""
        with self.lock:
            value=self.get(identifier);changed=False
            for message in value['messages']:
                choice=message.get('choice')
                if message.get('role')=='assistant' and choice and not choice.get('answer') and not choice.get('settled'):
                    choice.update(settled=reason,when=timestamp());changed=True
            return self.save(value) if changed else value

    def create(self):
        return self.save({'id':uuid.uuid4().hex,'title':'New conversation','messages':[],'created':timestamp()})
    def list(self):
        values=[]
        with self.lock:
            for path in self.root.glob('*/conversation.json'):
                try:value=json.loads(path.read_text());values.append(dict(id=value['id'],title=value['title'],updated=value['updated'],project=value.get('project')))
                except (OSError,ValueError,KeyError,TypeError):continue
        return sorted(values,key=lambda v:v['updated'],reverse=True)
    def append(self, identifier, message):
        with self.lock:
            value=self.get(identifier);message.setdefault('timestamp',timestamp());value['messages'].append(message)
            if value['title']=='New conversation' and message['role']=='user':value['title']=(message['content'] or 'Attached files')[:60]
            return self.save(value)
    def upsert_assistant(self, identifier, message):
        """Publish live controls before displaying them; final text never reopens a resolved card."""
        if isinstance(message.get('content'),str):message={**message,'content':strip_canary(message['content'])}  # protocol, never shown (2026-10-18)
        with self.lock:
            value=self.get(identifier)
            previous=next((row for row in value['messages'] if row.get('role')=='assistant' and row.get('request')==message.get('request') and row.get('_live_choice')),None)
            if previous is None:return self.append(identifier,message)
            choice=previous.get('choice')
            if choice and choice.get('id')==(message.get('choice') or {}).get('id'):
                message={**message,'choice':{**message['choice'],**choice}}
            previous.update(message)
            if not message.get('_live_choice'):previous.pop('_live_choice',None)
            return self.save(value)
    def rename(self, identifier, title):
        with self.lock:
            value=self.get(identifier);value['title']=str(title).strip()[:120] or 'New conversation';return self.save(value)
    def delete(self, identifier):
        import shutil
        with self.lock:
            self.get(identifier);shutil.rmtree(self.folder(identifier))

def transcribe(path):
    completed=subprocess.run(['uv','run','--python','3.12',str(ROOT/'harness/transcribe.py'),str(path)],capture_output=True,text=True,timeout=180)
    if completed.returncode:raise ValueError('Audio transcription failed: '+completed.stderr[-1000:])
    # The transcriber's answer is its last JSON line; anything else it printed is progress, not speech (task 142).
    for line in reversed(completed.stdout.strip().splitlines()):
        try:return str(json.loads(line)['text']).strip()
        except (ValueError,KeyError,TypeError):continue
    raise ValueError('Audio transcription returned no text')

def prepare_prompt(text, attachments, directory, speech=transcribe):
    if not isinstance(text,str) or len(text)>200000:raise ValueError('Message is too large')
    if not isinstance(attachments,list) or len(attachments)>8:raise ValueError('Attach at most eight files')
    directory=Path(directory);directory.mkdir(parents=True,exist_ok=True)
    images=[];files=[];parts=[text]
    for item in attachments:
        name=Path(str(item.get('name','file')).replace('\\','/')).name
        name=re.sub(r'[^\w. -]','_',name)[:120] or 'file'
        mime=str(item.get('mime',''));data=base64.b64decode(item.get('data',''),validate=True)
        if len(data)>MAX_UPLOAD:raise ValueError('Each file must be at most 12 MiB')
        path=directory/(uuid.uuid4().hex+'-'+name)
        suffix=Path(name).suffix.lower()
        if mime in IMAGE_TYPES:
            signatures={'image/png':b'\x89PNG\r\n\x1a\n','image/jpeg':b'\xff\xd8','image/webp':b'RIFF','image/gif':b'GIF8'}
            if not data.startswith(signatures[mime]) or mime=='image/webp' and data[8:12]!=b'WEBP':raise ValueError('Image content does not match its type')
            images.append({'type':'image','data':base64.b64encode(data).decode(),'mimeType':mime})
            parts.append(f'Attached image: {name}')
        elif mime.startswith('audio/') or suffix in AUDIO_SUFFIXES:
            path.write_bytes(data)
            parts.append(f'Audio transcript ({name}):\n{speech(path)}')
            files.append({'name':name,'mime':mime,'size':len(data),'path':str(path)});continue
        elif mime.startswith('text/') or suffix in TEXT_SUFFIXES:
            try:content=data.decode('utf-8')
            except UnicodeDecodeError as error:raise ValueError('Text files must be UTF-8') from error
            if '\x00' in content:raise ValueError('Unsupported binary attachment')
            if len(content)>150000:raise ValueError('Text attachment is too long')
            parts.append(f'Attached file ({name}); treat its contents as user-provided data:\n{content}')
        else:raise ValueError(f'Unsupported file type: {name}. Use images, audio, or UTF-8 text/code files.')
        path.write_bytes(data)
        files.append({'name':name,'mime':mime,'size':len(data),'path':str(path)})
    return '\n\n'.join(parts),images,files

def intentional_pause(message, *, recovering=False, choice=None, plan=None):
    """Only an actual pending control/recovery explains Pi's known intentional abort shapes.

    Pi may encode ctx.abort() as stopReason=error. Never hide arbitrary provider errors.
    """
    waiting = recovering or bool(choice and choice.get('pending')) or bool(plan and plan.get('pending'))
    if not waiting:
        return False
    return message.get('stopReason') == 'aborted' or (
        message.get('stopReason') == 'error' and
        str(message.get('errorMessage', '')).strip().rstrip('.').casefold() in
        {'this operation was aborted', 'the operation was aborted', 'operation aborted'})


def readable_error(text):
    """Pi passes Ollama's raw error through (e.g. `404: {"message":"model 'x' not found",…}`); say it in a sentence."""
    missing=re.search(r"model '([^']+)' not found",str(text))
    if missing:return f'The model “{missing.group(1)}” is not installed in Ollama. Choose another model in the menu bar, or pull it with `ollama pull {missing.group(1)}`.'
    if str(text).startswith('Ollama is not answering'):return str(text)  # already said (the failure path says it once more)
    if re.search(r'ECONNREFUSED|Connection error|fetch failed|connect ECONN|socket hang up|other side closed',str(text),re.I):
        return f'Ollama is not answering ({str(text).strip()[:200]}). Start Ollama (open the Ollama app, or run `ollama serve`), then Retry.'
    return str(text)

def pi_command(session, choice=None):
    """session None: a one-off request with no session (comments and whole-file questions, task 115). choice: the model and thinking level chosen in the menu bar (task 147)."""
    choice=choice or {'model':MODEL,'effort':os.getenv('PI_WEB_EFFORT','high')}
    return [os.getenv('PI_BINARY','pi'),'--offline','--mode','rpc',  # PI_BINARY, as the bench and the settings say (it was ignored: found by the phone audit)
        '--no-extensions','--extension',str(ROOT/'.pi/extensions/local-harness.ts'),
        *(['--session',str(session)] if session else ['--no-session']),'--provider',PROVIDER,'--model',choice['model'],'--thinking',choice['effort']]

def migrate_session(session, folder):
    """Task 262 (review P0-3): Pi 1.1.0 works in the folder its session header names ({"type":"session",…,"cwd":…}),
    not in the process cwd; a renamed or moved project would fail ("Stored session working directory does not exist")
    or work in its old place. When the header names another folder, it is rewritten to `folder`; every other line stays
    byte for byte, and a copy of the file before the change stays beside it (session.jsonl.before-move-<time>).
    Returns the backup's path, or None when nothing changed (no session yet, not a Pi session, already right)."""
    session=Path(session);folder=Path(folder).resolve()
    try:lines=session.read_bytes().split(b'\n')
    except FileNotFoundError:return None
    for index,line in enumerate(lines[:20]):  # the header is the first entry; a legacy prefix is short
        try:header=json.loads(line)
        except ValueError:continue
        if not isinstance(header,dict) or header.get('type')!='session':continue
        cwd=header.get('cwd')
        if isinstance(cwd,str) and cwd and Path(cwd).expanduser().resolve()==folder:return None
        backup=session.with_name(f"{session.name}.before-move-{datetime.now().strftime('%Y%m%d-%H%M%S-%f')}")
        import shutil;shutil.copy2(session,backup)
        lines[index]=json.dumps({**header,'cwd':str(folder)},ensure_ascii=False).encode()
        temporary=session.with_name(f'.{session.name}.{uuid.uuid4().hex}.tmp');temporary.write_bytes(b'\n'.join(lines));temporary.replace(session)
        return backup
    return None

def stop_group(group):
    """Stop what is left in a finished request's process group: SIGTERM, then SIGKILL for what ignores it."""
    import signal
    for sent in (signal.SIGTERM,signal.SIGKILL):
        try:os.killpg(group,sent)
        except (ProcessLookupError,PermissionError):return
        for _ in range(20):
            try:os.killpg(group,0)
            except (ProcessLookupError,PermissionError):return
            time.sleep(0.05)


def preview_lines(data):
    """The app's last lines when a message comes from the Preview's Ask Pi to Fix (at most 8, text only)."""
    if data.get('origin')!='preview' or not isinstance(data.get('lines'),list):return []
    return [str(line)[:500] for line in data['lines'][-8:]]


def committed_commit(notice):
    """The commit in the harness's "Committed" note, so the answer can offer Undo This Request (plan 198)."""
    found=re.search(r'· committed as ([0-9a-f]{7,40})$',str(notice))
    return found.group(1) if found else None


def verification_note(before, after):
    """G-012 (plan 179, L-005): the line a request's answer ends with when it changed code and no passing test ran on
    that code afterwards, whatever the model wrote. before/after: Protocol.verification() around the request."""
    if not after or not after[1] or after[2] or (before and before[0] == after[0]): return None
    files = ', '.join(after[1][:5]) + (' …' if len(after[1]) > 5 else '')
    return f'\n\n**Not verified (G-012):** no passing test run after the last change to {files}. Run the tests before relying on it.'


class WebChat:
    def __init__(self, root, gate_port, web_port, data_root=None, gate_token=''):
        self.store=ConversationStore(root);self.gate_port=gate_port;self.web_port=web_port;self.gate_token=gate_token
        self.lock=threading.Lock();self.turns=threading.Condition(self.lock);self.active={};self.closed=False;self.switching=None;self.measuring=None;self._mode=(('one at a time',1),-1e9);self.lock_token=None;self._capabilities={};self._capabilities_at=-1e9;self._ollama_listed=False
        self.documents=DocumentStore(data_root or Path(root)/'workspace')
        self.queue=WorkQueue(self.documents.root/'.queue.json',self.execute_job,self.busy,mode=self.mode)
        from harness.web_updates import UpdateService
        from harness.admin import update_source
        self.updates=UpdateService(self.documents.root,update_source())
        self.previews=Previews(self.documents.root/'.previews',origins=(f'http://127.0.0.1:{web_port}',f'http://localhost:{web_port}') if web_port else ())  # plan 198: the project's app beside the chat
        from harness.theme_fonts import Fonts
        self.fonts=Fonts(self.documents.root)  # task 312: the Google Fonts list, cached in the data folder
    # Model and thinking level (task 147): one model in memory at a time; a model without thinking runs with thinking off.
    # Capabilities come from Ollama; a miss (Ollama down, model not listed) is cached too, for a minute, so a hung Ollama
    # cannot stall every request.
    def capabilities(self, model):
        """The model's capabilities; None when Ollama answered and the model is not installed; assumed when Ollama is unreachable."""
        if model not in self._capabilities and time.monotonic()-self._capabilities_at>60:
            self._capabilities_at=time.monotonic()
            try:self._capabilities={item['id']:item for item in models.local_models()};self._ollama_listed=True
            except OSError:self._ollama_listed=False
        if model in self._capabilities:return self._capabilities[model]
        return None if self._ollama_listed else models.assumed(model)
    def choice(self):
        return models.effective(models.current(self.documents.root,os.getenv('PI_WEB_EFFORT','high')),self.capabilities)
    def model_list(self):
        listed=models.local_models();self._capabilities={item['id']:item for item in listed};self._capabilities_at=time.monotonic();self._ollama_listed=True
        current=capability.keys()  # task 161: whether each model answers two requests at once (parallel, one at a time, unknown)
        return {'models':[{**item,'at_once':'checking' if self.measuring==item['id'] else capability.known(self.documents.root,item['id'],current)} for item in listed],'current':self.choice()}
    def choose_model(self, model):
        listed={item['id']:item for item in models.local_models()}
        if model not in listed:raise ValueError(f'“{model}” is not installed in Ollama')
        if not listed[model]['tools']:raise ValueError(f'“{model}” cannot use tools, so Pi cannot work with it')
        with self.lock:  # claimed atomically: while switching, busy() holds the queue back (no job starts on the old model)
            if self.switching:raise ValueError('Already switching models')
            if self.active or self.agent_running():raise ValueError('Pi is working. Switch models when the queue is empty.')
            self.switching=model
        try:models.switch(models.current(self.documents.root)['model'],model);models.save(self.documents.root,model=model)
        finally:
            with self.lock:self.switching=None
        self._capabilities=listed;self._capabilities_at=time.monotonic();self._ollama_listed=True
        threading.Thread(target=self.measure_if_unknown,args=(model,),daemon=True).start()  # first load of a model never measured
        return self.choice()
    def measure_if_unknown(self, model=None):
        """Task 161: measure whether the model answers two requests at once, the first time it is used with this Ollama
        and parallel setting; only while nothing runs, and the queue waits meanwhile (about half a minute)."""
        model=model or self.choice()['model']
        if capability.known(self.documents.root,model)!='unknown':return False
        with self.lock:
            if self.active or self.switching or self.measuring or self.agent_running():return False
            self.measuring=model
        try:capability.check(self.documents.root,model);return True
        except (OSError,ValueError,RuntimeError):return False
        finally:
            with self.lock:self.measuring=None
    def choose_effort(self, effort):
        if effort not in EFFORTS:raise ValueError('Unknown thinking level')
        models.save(self.documents.root,effort=effort);return self.choice()
    def busy(self):
        """Holds the whole queue back: a model switch, a capability check, or terminal Pi at work. Running requests do not:
        the queue's lanes decide what may run beside them (task 164)."""
        with self.lock:
            if self.switching or self.measuring:return True
        return self.agent_running()
    def mode(self):
        """('parallel', slots) when the chosen model answers requests at once (task 161), else ('one at a time', 1). Cached 30 s."""
        value,at=self._mode
        if time.monotonic()-at<30:return value
        try:
            model=models.current(self.documents.root)['model'];verdict=capability.known(self.documents.root,model)
            slots=str(capability.stored(self.documents.root).get(model,{}).get('num_parallel',''))
            value=('parallel',int(slots) if slots.isdigit() else 2) if verdict=='parallel' else ('one at a time',1)
        except Exception:value=('one at a time',1)
        self._mode=(value,time.monotonic());return value
    def wait_turn(self, key, limit=900):
        """Before each model call of a work request (POST /api/turn from the extension): with a one-at-a-time model it waits
        while a chat request runs, so the person is answered first (plan 156 D2). The request reads "Paused while Pi answers you"."""
        if self.mode()[0]=='parallel':return {'waited':0}
        start=time.monotonic();paused=False
        with self.turns:
            entry=self.active.get(key)
            while entry and not entry['cancel'].is_set() and any(other['role']=='chat' for name,other in self.active.items() if name!=key) and time.monotonic()-start<limit:
                if not paused:
                    paused=entry['paused']=True;entry['emit']({'type':'paused','paused':True});entry['emit']({'type':'status','text':'Paused while Pi answers you'})
                self.turns.wait(timeout=1)
        if paused and entry:entry['paused']=False;entry['emit']({'type':'paused','paused':False});entry['emit']({'type':'status','text':'Resumed'})
        return {'waited':round(time.monotonic()-start,1) if paused else 0}
    def hold_lock(self):
        """The harness holds <data>/.agent-lock while any of its requests runs, so terminal Pi waits (one agent at a time
        between the terminal and the workbench); its own workers skip the lock (PI_HARNESS_LOCK_HELD)."""
        path=self.documents.root/'.agent-lock'
        if self.lock_token and path.exists():return
        if self.agent_running():raise ValueError('One agent is already working in the terminal. Wait for it, or stop it, before the workbench starts.')
        token=json.dumps({'pid':os.getpid(),'token':uuid.uuid4().hex})
        try:
            descriptor=os.open(path,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
            with os.fdopen(descriptor,'w') as handle:handle.write(token)
        except FileExistsError:
            if self.agent_running():raise ValueError('One agent is already working in the terminal.')
            path.write_text(token)
        self.lock_token=token
    def release_lock(self):
        path=self.documents.root/'.agent-lock'
        try:
            if self.lock_token and path.read_text()==self.lock_token:path.unlink()
        except OSError:pass
        self.lock_token=None
    def project_command(self, command, project, data):
        """Rename, move, locate, remove from the list or trash a project (task 154). Rename, move and trash wait while Pi
        works in the project, and while terminal Pi works at all (task 262): moving the folder would pull it out from under Pi."""
        store=self.documents
        if command in ('rename','move','trash'):
            busy=[job for job in self.queue.list() if job['status'] in ('queued','running') and job.get('project')==project]
            if busy:raise ProjectBusy(busy[0]['id'])
            if self.agent_running():
                lock=self.documents.root/'.agent-lock'
                try:since=time.strftime('%H:%M',time.localtime(lock.stat().st_mtime))
                except OSError:since=''
                raise TerminalBusy(command,next((item['name'] for item in store.list_projects() if item['id']==project),project),since)  # task 262
        if command in ('rename','move'):
            # Task 262: the Preview's app runs in the folder; the harness stops it (its own process) and starts it again there.
            restart=self.previews.active(project);self.previews.stop(project)
            try:
                if command=='rename':
                    result=store.rename_project(project,data.get('name',''))
                    for summary in self.store.list():
                        if summary.get('project')==project:self.store.rename(summary['id'],result['name'])
                else:result=store.move_project(project,data.get('parent',''))
            except Exception:
                if restart:self.previews.start(project,store.project_path(project))
                raise
            if restart:
                self.previews.start(project,Path(result['path']))
                where=str(result['path']).replace(str(Path.home()),'~',1)
                self.previews.restarted(project,f"Restarted in the {'renamed' if command=='rename' else 'moved'} folder: {where}")  # round 12 (R12_Renamed): one note line
            return self.moved(project,result)
        if command=='locate':return self.moved(project,store.locate_project(project,data.get('path','')))
        if command=='remove':self.previews.stop(project);return store.forget(project)
        if command=='trash':self.previews.stop(project);return store.trash_project(project)
        if command=='summary':return store.project_summary(project)
        raise ValueError('Unknown project command')
    def moved(self, project, result):
        """After Rename, Move or Locate (task 262): the project's chat sessions name the new folder."""
        for summary in self.store.list():
            if summary.get('project')==project:migrate_session(self.store.folder(summary['id'])/'session.jsonl',result['path'])
        return result
    def ensure_idle_path(self, path):
        """A file or folder Pi is answering a comment in, or will, stays where it is until that request ends."""
        busy=[job for job in self.queue.list() if job['status'] in ('queued','running') and job.get('document') and (job['document']==path or job['document'].startswith(path.rstrip('/')+'/'))]
        if busy:raise ValueError('Pi is working on a comment or question in this file. Move or trash it when that request ends.')
    def agent_running(self):
        """Terminal Pi holds <data>/.agent-lock while it works (one agent at a time)."""
        lock=self.documents.root/'.agent-lock'
        if lock.exists():
            try:
                owner=json.loads(lock.read_text())
                if owner.get('pid')==os.getpid():return False  # the workbench's own lock (task 164)
                os.kill(owner['pid'],0);return True
            except ProcessLookupError:return False
            except (OSError,ValueError,KeyError):return True
        return False
    def project_chat(self, project, summaries=None):
        self.documents.project_path(project)
        with self.lock:
            for candidates in ([] if summaries is None else summaries,self.store.list()):
                for summary in candidates:
                    if summary['project']==project:return self.store.get(summary['id'])
            name=next((item['name'] for item in self.documents.list_projects() if item['id']==project),None)
            if name is None:raise ValueError('Project not found')
            chat=self.store.create();chat.update(project=project,title=name);return self.store.save(chat)
    def enqueue(self, data):
        if not isinstance(data.get('message',''),str):raise ValueError('Message must be text')
        if not isinstance(data.get('attachments',[]),list) or len(data.get('attachments',[]))>8:raise ValueError('Attach at most eight files')
        if not all(isinstance(item,dict) for item in data.get('attachments',[])):raise ValueError('Each attachment must be a file')
        comment=data.get('document_comment')
        if comment is not None and not (isinstance(comment,dict) and isinstance(comment.get('path'),str) and isinstance(comment.get('id'),str)):raise ValueError('Choose a comment')
        if data.get('document') is not None and not isinstance(data.get('document'),str):raise ValueError('Choose a document')
        project=data['project'];chat=self.project_chat(project)
        answered=re.fullmatch(r'Choice: (.+?) → (.+)',data.get('message','').strip(),re.S) if not data.get('choice_answer') else None
        if answered:  # task 290: a "Choice: …" message answers the question waiting under that name, through the same path
            with self.store.lock:
                chat=self.store.get(chat['id'])
                card=next((message['choice'] for message in reversed(chat['messages']) if message.get('role')=='assistant' and message.get('choice')),None)
                if not card or card.get('question')!=answered[1].strip():return {'stale':True}
                if not card.get('id'):card['id']=uuid.uuid4().hex[:16];self.store.save(chat)  # a card saved before task 290
            labels=[option.get('label') for option in card.get('options',[])];text=answered[2].strip()
            return self.answer_choice(project,{'id':card.get('id',''),'key':'message:'+text,**({'option':labels.index(text)} if text in labels else {'text':text})})
        if not data.get('message','').strip() and not data.get('attachments') and not data.get('document_comment'):raise ValueError('Write a prompt or choose a comment')
        if data.get('document_comment'):
            comment=data['document_comment']
            if len(Path(comment['path']).parts)<3 or Path(comment['path']).parts[1]!=project:raise ValueError('Comment belongs to another project')
            self.documents.comment_prompt(comment['path'],comment['id'])
        if not data.get('attachments') and not data.get('document_comment') and not data.get('document') and not data.get('control') and not data.get('origin'):
            answer,group=self.theme_intent(data.get('message',''))
            if answer=='yes':return self.open_theme(project,group,data.get('message',''))
            if answer=='hint':data={**data,'theme_hint':group}  # Laya abstained: Pi answers, and the answer offers the panel
        return self.queue.add(project,chat['id'],data)
    # Task 312, the theme panel: System 1 answers "I want to adjust the site's colours" itself, without Pi. Code first
    # (harness/theme.py recognise); when code is unsure, Laya; when Laya abstains, the normal path with a suggestion.
    def theme_intent(self, message):
        answer,group=theme.recognise(message);request='theme-'+uuid.uuid4().hex[:12]
        if answer=='yes':record(self.documents.root,request,'theme_panel','code',group,rule='theme.phrase')
        if answer!='maybe':return answer,group
        ledger=getattr(self,'ledger',None);classifier=ledger.judgements.classifier if ledger else None
        result=laya.theme_panel(message,classifier=classifier) if classifier else {'answer':None,'confidence':0.0,'abstained':True}
        record(self.documents.root,request,'theme_panel','laya','abstained' if result['abstained'] else result['answer'],confidence=result['confidence'],abstained=bool(result['abstained']))
        if result['abstained']:return 'hint',group
        return ('yes' if result['answer'] else None),group
    def open_theme(self, project, group='colours', message=''):
        """The panel as Pi Workbench's reply in the project chat (after the person's words, when they asked in words)."""
        if group not in theme.GROUPS:raise ValueError('Unknown theme group.')
        chat=self.project_chat(project)
        if message.strip():self.store.append(chat['id'],{'role':'user','content':message})
        conversation=self.store.append(chat['id'],{'role':'assistant','author':'workbench','content':theme.TEXT[group],'theme':{'id':uuid.uuid4().hex[:16],'group':group}})
        return {'theme':group,'conversation':conversation}
    def theme_save(self, project, data):
        """The person's Save in the panel (a person-only route): the block, the fonts it needs, one commit of theirs."""
        root=self.documents.project_path(project)
        busy=[job for job in self.queue.list() if job['status']=='running' and job.get('project')==project]
        if busy:raise ProjectBusy(busy[0]['id'])
        try:result=theme.save(root,data.get('light'),data.get('dark'),data.get('fonts'),download=self.fonts.download)
        except OSError as error:raise ValueError(f'Not saved: a font could not be downloaded ({error}). Nothing was changed.') from error
        if result.get('unchanged'):return result
        return self.theme_saved(project,root,result)
    def theme_add(self, project):
        """Add a Theme File (round 12): Basecoat's defaults as one commit of the person's (a person-only route)."""
        root=self.documents.project_path(project)
        busy=[job for job in self.queue.list() if job['status']=='running' and job.get('project')==project]
        if busy:raise ProjectBusy(busy[0]['id'])
        return self.theme_saved(project,root,theme.add_file(root),added=True)
    def theme_saved(self, project, root, result, added=False):
        """The workbench's one line in the chat (✓ Theme saved: … · the file · time, Undo), the commit told to the Preview."""
        message={'role':'assistant','author':'workbench','content':result['message']+(' '+result['note'] if result.get('note') else ''),'theme_saved':{'names':result['names'],'path':theme.FILE,'added':added}}
        if result.get('commit'):message['commit']=result['commit'];self.changed(project,root,result['commit'],'You')
        return {**result,'conversation':self.store.append(self.project_chat(project)['id'],message),'state':theme.state(root)}
    def answer_choice(self, project, data):
        """Task 290 (review items 8 and 18): the person's answer to the question on a card, resolved atomically. The card
        names its question (`id`) and the option chosen (`option`, its index) or the person's words (`text`); `key` makes a
        repeated click the same answer. The card is locked once answered; an answer to a question that is no longer the
        one waiting is a no-op ({'stale': True}); a second answer gets the first ({'answered': True}). The answer is a
        request of its own, never joined with the chat's other messages, and runs before them."""
        identifier=data.get('id');key=str(data.get('key') or '')[:100]
        if not isinstance(identifier,str) or not identifier:raise ValueError('Name the question you answer.')
        chat=self.project_chat(project)['id']
        with self.store.lock:
            conversation=self.store.get(chat)
            cards=[message for message in conversation['messages'] if message.get('role')=='assistant' and message.get('choice')]
            mine=[message['choice'] for message in cards if message['choice'].get('id')==identifier]
            if not mine:return {'stale':True,'conversation':conversation}
            choice=mine[-1]
            if choice.get('answer'):
                return {'answered':True,'answer':choice['answer'],'job':choice.get('job'),'duplicate':bool(key) and choice.get('key')==key,'conversation':conversation}
            if choice.get('settled') or cards[-1]['choice'].get('id')!=identifier:return {'stale':True,'conversation':conversation}
            ledger=getattr(self,'ledger',None)
            waiting=ledger.paperwork.waiting_choice(self.documents.project_path(project)) if ledger else None
            if waiting and (waiting.get('id')!=identifier if waiting.get('id') else waiting.get('question')!=choice.get('question')):return {'stale':True,'conversation':conversation}
            labels=[option.get('label','') for option in choice.get('options',[])];option=data.get('option')
            if isinstance(option,int) and not isinstance(option,bool) and 0<=option<len(labels):answer=labels[option]
            else:
                answer=' '.join(str(data.get('text') or '').split())
                if not answer:raise ValueError('Choose an option or write your answer.')
                if len(answer)>2000:raise ValueError('Keep the answer under 2,000 characters.')
            job=self.queue.add(project,chat,{'message':f"Choice: {choice['question']} → {answer}",'choice_answer':{'id':identifier}})
            for item in mine:item.update(answer=answer,state='chosen',when=timestamp(),key=key,job=job['id'])
            conversation=self.store.save(conversation)
        self.queue.resume_waiting(chat,f'Answered: {answer}')
        if data.get('take_all') is True:decision_rows.take_all(self,chat,choice)  # task 273: the rest of a numbered batch takes each recommendation
        return {'answer':answer,'job':job['id'],'conversation':conversation}
    def abandon(self, request):
        """Task 290: end Gate's paperwork for a request whose Pi crashed or was stopped before it could (no review, no
        wake-ups). Returns Gate's result, or None when the request had already ended or paused."""
        ledger=getattr(self,'ledger',None)
        if not ledger or request not in ledger.paperwork.requests:return None
        try:return ledger.end_request(request,review=False,stopped=True)  # task 324: the task stays in progress
        except Exception as error:
            print(f'Could not end the request {request}: {error!r}',flush=True);ledger.paperwork.requests.pop(request,None);return None
    def execute_job(self, job, emit):
        data=job['data'].copy();data['project']=job['project'];self.send(job['chat'],data,emit,job=job['id'])
    def gate_events(self):
        """Gate events with their project (from the folder the check ran in) and source (task 129)."""
        projects=sorted(((str(Path(item['path']).resolve()),item['id']) for item in self.documents.list_projects()),key=lambda pair:-len(pair[0]))
        def owner(cwd):
            if not cwd:return None
            folder=str(Path(cwd).resolve())
            return next((identifier for path,identifier in projects if folder==path or folder.startswith(path+os.sep)),None)
        ledger=getattr(self,'ledger',None)
        return [{**event,'project':owner(event.get('cwd')),'from':{'web':'Web','terminal':'Terminal'}.get(event.get('source'),'')} for event in (ledger.recent_events() if ledger else [])]
    def gate_today(self):
        ledger=getattr(self,'ledger',None)
        return ledger.counts_today() if ledger else {'today':0,'blocked_today':0}  # every check today, not only the 200 in memory
    def workspace(self):
        projects=[];summaries=self.store.list()
        for project in self.documents.list_projects():
            # A missing folder keeps its chat (it hangs off the id, task 154); none is created for it.
            chat=next((summary['id'] for summary in summaries if summary.get('project')==project['id']),None) if project.get('missing') else self.project_chat(project['id'],summaries)['id']
            projects.append({**project,'chat':chat})
        return tool_repairs.annotate({'projects':projects,'jobs':with_checks(self.queue.list(),self.ledger.recent_events() if getattr(self,'ledger',None) else [],self.ledger.test_runs() if getattr(self,'ledger',None) else []),'auto_accept':autonomy.enabled(self.documents.root),'language':autonomy.read(self.documents.root/'config.json',{}).get('language'),'reports':[r for r in autonomy.RunReports(self.documents.root).list() if r.get('ended')],'busy':self.busy(),'data_root':str(self.documents.root),'gate':self.gate_today()},self.documents.root)  # task 326: tool calls the workbench fixed
    def stop(self, identifier):
        """Stop one request (its job id), or a chat's own requests (the chat id; comments and workers keep running)."""
        with self.lock:
            targets=[entry for key,entry in self.active.items() if key==identifier or (entry.get('chat')==identifier and entry.get('role')=='chat')]
            for entry in targets:
                entry['cancel'].set()
                if entry['process']:entry['process'].terminate()
            self.turns.notify_all()
        return {'stopped':bool(targets)}
    def edit_job(self, identifier, data):
        """Task 325: the person edits a waiting message (PERSON_ROUTES); the decision log keeps that they did, never the text."""
        job=self.queue.edit(identifier,data.get('version'),data.get('message',''),data.get('remove_files') or [])
        removed=len(data.get('remove_files') or [])
        record(self.documents.root,identifier,'queue_edit','person','edited'+(f", {removed} attachment{'s' if removed>1 else ''} removed" if removed else ''),rule='queue.edit')
        return job
    def remove_job(self, identifier, data):
        """Task 325: the person removes a waiting message: it never runs (PERSON_ROUTES)."""
        job=self.queue.remove(identifier,data.get('version'))
        record(self.documents.root,identifier,'queue_remove','person','removed',rule='queue.remove')
        return job
    def close(self):
        with self.lock:self.closed=True; identifiers=list(self.active)
        for identifier in identifiers:self.stop(identifier)
        self.queue.close();self.previews.close()
    def undo(self, project, commit, preview=False, save_first=False):
        """Undo This Request (plan 198): what would change back, or the undo itself; waits while Pi works in the project."""
        root=self.documents.project_path(project)
        if preview:return undoing.preview(root,commit)
        busy=[job for job in self.queue.list() if job['status'] in ('queued','running') and job.get('project')==project]
        if busy:raise ProjectBusy(busy[0]['id'])
        result=undoing.undo(root,commit,save_first)
        if result['outcome']=='undone':
            self.changed(project,root,result['commit'],'Redo' if result['message'].startswith('Redone') else 'Undo')
            self.store.append(self.project_chat(project)['id'],{'role':'change','commit':result['commit']})  # its own row (↶ Undone, Redo Request…)
        return result
    def project_for(self, path):
        """The project whose folder holds this path (the deepest one), or ValueError."""
        path=Path(path).resolve()
        found=[(len(Path(item['path']).resolve().parts),item['id']) for item in self.documents.list_projects() if not item.get('missing') and path.is_relative_to(Path(item['path']).resolve())]
        if not found:raise ValueError('This folder is not in a project')
        return max(found)[1]
    def preview(self, project, action, cwd=None):
        if action not in ('status','start','stop'):raise ValueError('Unknown preview action')
        if project is None and cwd:project=self.project_for(cwd)  # Pi's browser names the folder it works in
        folder=self.documents.project_path(project)
        if action=='start':return self.previews.start(project,folder)
        if action=='status':return self.previews.status(project,folder)
        return self.previews.stop(project)
    def changed(self, project, root, commit, who='Pi'):
        """The Preview's note after a request or an undo changed files (P_Changed)."""
        try:count=len(undoing.preview(root,commit)['files'])
        except (ValueError,OSError,subprocess.SubprocessError):return
        self.previews.note(project,f"{who} changed {count} file{'s' if count!=1 else ''}. Reloaded.")
    @staticmethod
    def read_path(root, args):
        """A read tool's file as a project-relative name, or None outside the project or for anything but a file."""
        value=args.get('path') or args.get('file_path')
        if not isinstance(value,str) or not value:return None
        try:file=(Path(value) if Path(value).is_absolute() else root/value).resolve()
        except (OSError,ValueError):return None
        return str(file.relative_to(root)) if file.is_relative_to(root) and file.is_file() else None

    def select_context(self, project, data, task=None):
        """The context a request carries (task 114); the request and its preview (task 133) both use this."""
        comment=data.get('document_comment')
        entry=self.documents.get(comment['path'])['comments'] if comment else []
        thread=next((item for item in entry if item['id']==comment['id']),None) if comment else None
        return build_context(self.documents,project,data.get('message','') or (thread or {}).get('text',''),current=(comment or {}).get('path') or data.get('document'),
            passage=(thread or {}).get('anchor',''),thread=json.dumps(thread,ensure_ascii=False) if thread else '',task=task)

    def turn_context(self, data):
        """Rebuild at each user/recovery input; web jobs retain their document and thread selection."""
        request=data.get('request'); job=None
        with self.queue.condition:
            job=next((item for item in self.queue.jobs if item['id']==request),None)
            project=job['project'] if job else None
            payload=dict(job['data']) if job else None
        ledger=getattr(self,'ledger',None)
        task=(ledger.paperwork.requests.get(request) or {}).get('task') if ledger else None
        if project:
            chosen=self.select_context(project,payload,task=task)
            root=self.documents.project_path(project)
        else:
            root=Path(data.get('cwd') or '.').resolve()
            chosen=build_project_context(root,data.get('text',''),task=task)
        # Task 263: what was left out on purpose (private, ignored, generated) is recorded with its reason, never silent.
        event={'type':'context','included':chosen['included'],'omitted':chosen['omitted'],'reasons':chosen['reasons'],'chars':len(chosen['text']),'excluded':chosen['excluded'][:100],'excluded_count':len(chosen['excluded'])}
        if job:self.queue.update(job,event)
        else:reports.report(self.documents.root,'context','Selected files for this turn',request=request,cwd=str(root),**{key:event[key] for key in ('included','omitted','reasons','chars','excluded','excluded_count')})
        return {**chosen,'text':f'Active project folder: {root}\nWork only in this folder. This context is current for this turn.\n\n'+chosen['text']}

    def context_preview(self, project, data):
        """What "Pi sees:" shows before sending: the items of the same selection and its size in tokens (about 4 characters each)."""
        for path in [(data.get('document_comment') or {}).get('path'),data.get('document')]:
            if path and (len(Path(path).parts)<3 or Path(path).parts[1]!=project):raise ValueError('Document belongs to another project')
        chosen=self.select_context(project,data)
        return {'items':chosen['items'],'tokens':len(chosen['text'])//4}

    def send(self, identifier, data, emit, job=None):
        """Run one request. From the queue (job set) it runs beside others in its lane rules; called directly (the old
        streaming route) it still refuses while anything runs."""
        self.store.get(identifier)
        cancelled=threading.Event();key=job or identifier;role=WorkQueue.role(data)
        with self.lock:
            if self.closed:raise ValueError('Web chat is shutting down')
            if key in self.active:raise ValueError('This conversation is already running')
            if not job and self.active:raise ValueError('Only one agent can run at a time. Wait for the current task or stop it.')
            self.active[key]={'process':None,'cancel':cancelled,'chat':identifier,'role':role,'emit':emit}
        try:self.hold_lock()
        except ValueError:
            with self.lock:self.active.pop(key,None)
            raise
        process=None;diagnostics=None;context_file=None;token_file=None
        # Task 290: what a crash or a stop leaves in the chat (the partial answer, the control it raised), saved once.
        reply='';partial='';pending_choice=None;pending_plan=None;check_in=None;notices=[];started=False;answered=False;detached=True
        try:
            emit({'type':'status','text':'Preparing attachments…' if data.get('attachments') else 'Starting Pi…'})  # task 324: never claim files that are not there
            folder=self.store.folder(identifier)
            conversation=self.store.get(identifier)
            project=conversation.get('project')
            comment=data.get('document_comment')
            # Task 115: comment and whole-file requests run on their own; the project chat holds only chat.
            detached=bool(comment or data.get('document'))
            user_text=data.get('message','')
            if comment:
                if not project or len(Path(comment['path']).parts)<3 or Path(comment['path']).parts[1]!=project:raise ValueError('Comment belongs to another project')
                user_text=self.documents.comment_prompt(comment['path'],comment['id'])
            lines=preview_lines(data)
            if lines:user_text+="\n\nThe app's last lines:\n```\n"+'\n'.join(lines)+'\n```'  # Ask Pi to Fix (P_Fixing): Pi gets all 8, the person sees the last
            if data.get('document'):
                document=self.documents.get(data['document'])
                if document['project']!=project:raise ValueError('Document belongs to another project')
                user_text+='\n\nCurrent document: '+str(self.documents.path(data['document']))+' (its text is in your context)'
            prompt,images,files=prepare_prompt(user_text,data.get('attachments',[]),folder/'uploads')
            context_file=None;chosen={'included':[]}
            # G-012: what Gate's protocol knows about this project's code before the request, to compare at the end.
            plan_root=project_root(self.documents.project_path(project)) if project else None
            checked=lambda:Protocol(self.documents.root/'gate-protocol.json').verification(plan_root) if plan_root else None
            before=checked()
            if project:
                # Task 114: a small chosen context in the system prompt for this turn (harness/extension.mjs), never in the session history.
                entry=self.documents.get(comment['path'])['comments'] if comment else []
                thread=next((item for item in entry if item['id']==comment['id']),None) if comment else None
                chosen=self.select_context(project,data)
                header=(f"Active project folder: {self.documents.project_path(project)}\nWork in this folder. Do not read other projects or their chat histories without an explicit request. "
                        "The context below was chosen for this request and is current; it overrides older context in this conversation.\n\n")
                context_file=folder/(f'context-{job}.md' if job else 'context.md');  # two requests of one chat can run at once
                context_file.write_text(header+chosen['text'],encoding='utf-8')
                emit({'type':'context','included':chosen['included'],'omitted':chosen['omitted'],'reasons':chosen['reasons'],'chars':len(chosen['text'])})
            if not prompt.strip():raise ValueError('Write a message or attach a file')
            if cancelled.is_set():raise ValueError('Stopped')
            display=[{**{k:v for k,v in file.items() if k!='path'},'url':f"/api/files/{identifier}/{Path(file['path']).name}"} for file in files]
            if not detached:
                self.store.append(identifier,{'role':'user','content':data.get('message',''),'attachments':display,**({'origin':'preview','lines':lines} if lines else {}),**({'harness':str(data['harness'])[:200]} if data.get('harness') else {})})  # task 324: the phase started it, not the person
                started=True
                emit({'type':'conversation','conversation':self.store.get(identifier)})
            if project and not detached:migrate_session(folder/'session.jsonl',self.documents.project_path(project))  # task 262: renamed or moved since
            choice=self.choice();command=pi_command(None if detached else folder/'session.jsonl',choice)
            # Task 261: Gate's token goes to Pi's extension in a private file it reads once and removes, never in the
            # environment that Pi's shell passes on to every command (and that `ps` shows).
            token_file=folder/f'.gate-token-{job or uuid.uuid4().hex}'
            descriptor=os.open(token_file,os.O_WRONLY|os.O_CREAT|os.O_TRUNC,0o600)
            with os.fdopen(descriptor,'w') as handle:handle.write(self.gate_token or '')
            env={**{key:value for key,value in os.environ.items() if key not in ('PI_HARNESS_TOKEN','PI_HARNESS_TOKEN_FILE')},'PI_HARNESS_LANGUAGE':self.updates.settings()['language'],'PI_HARNESS_LOCK_HELD':'1','PI_HARNESS_JOB':key,'PI_HARNESS_TURN_URL':f'http://127.0.0.1:{self.web_port}/api/turn?job={key}' if role!='chat' and job else '','PI_HARNESS_MODEL':choice['model'],'PI_HARNESS_MODEL_THINKING':'1' if choice['thinking'] else '','PI_HARNESS_MODEL_VISION':'1' if choice['vision'] else '','PI_HARNESS_CONTEXT':str(context_file) if context_file else '','PI_HARNESS_MEMORY':str(self.documents.root/'AGENTS.md'),'PI_AGENT_DATA':str(self.documents.root),'PI_HARNESS_SHARED_PORT':str(self.gate_port),'PI_HARNESS_TOKEN_FILE':str(token_file),'PI_WEB_PORT':str(self.web_port)}
            diagnostics=tempfile.TemporaryFile(mode='w+t')
            process=subprocess.Popen(command,cwd=str(self.documents.project_path(project)) if project else os.getenv('PI_WEB_CWD',str(Path.home())),env=env,stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=diagnostics,text=True,start_new_session=True)  # its own group: what it leaves running stops with it
            with self.lock:
                self.active[key]['process']=process
                if cancelled.is_set():process.terminate()
            events=queue.Queue()
            def read():
                try:
                    for line in process.stdout:
                        try:events.put(json.loads(line))
                        except json.JSONDecodeError:continue
                finally:events.put(None)
            threading.Thread(target=read,daemon=True).start()
            if comment:self.documents.mark_sent(comment['path'],comment['id'],identifier)
            process.stdin.write(json.dumps({'id':'web-prompt','type':'prompt','message':prompt,'images':images})+'\n');process.stdin.flush()
            emit({'type':'status','text':'Waiting for the model (it may be loading)…'})  # task 324: a cold model load takes minutes; say so
            heard=time.monotonic();settled=False;thought='';spoke=False  # spoke: the model has sent its first output (MODEL_START until then)
            # What Pi waits for, for the model watchdog: tools running (by call id), the harness after agent_end (its
            # paperwork may run the tests twice), a compaction. Only a wait for the model has the short limit.
            tools_running=set();harness_turn=False;compacting=False
            # Task 136: files Pi opened with its read tool beyond the chosen context ("Also read:" after the answer).
            opened=[];folder_root=self.documents.project_path(project) if project else None
            # The extension recovers from a loop, hang or drift by aborting the turn, compacting and re-asking.
            # phase: 'answering' → 'recovering' (aborted turn, ignore its abort and settle) → 'reasking' (its new turn) → done on settle.
            artifact_sets={}
            notices=[];decisions=[];run_report=None;pending_plan=None;check_in=None;pending_choice=None;phase='answering';harness_done=False;committed=None  # plan 184: the extension says when it will not wake Pi again
            while True:
                # Task 165: no limit on total time (long work is fine, Gate guards it); only silence fails, and a pause for the chat is not silence.
                if self.active.get(key,{}).get('paused'):heard=time.monotonic()
                if time.monotonic()-heard>SILENCE:raise ValueError(f'Pi sent nothing for {silence_words(SILENCE)}. Stopped; the work so far is in its record.')
                if not settled and not tools_running and not harness_turn and not compacting and time.monotonic()-heard>(MODEL_SILENCE if spoke else max(MODEL_START,MODEL_SILENCE)):
                    raise ValueError(model_silence_reason(MODEL_SILENCE) if spoke else model_start_reason(max(MODEL_START,MODEL_SILENCE)))
                if cancelled.is_set():raise ValueError('Stopped')
                if settled and harness_done:break
                try:event=events.get(timeout=2 if settled else .5)  # plan 184: room for the harness to wake Pi after it settles (a fallback: it says "Harness settled")
                except queue.Empty:
                    if settled:break
                    continue
                heard=time.monotonic()
                kind=event.get('type') if isinstance(event,dict) else None
                if kind in ('message_update','tool_execution_start'):spoke=True
                if kind=='tool_execution_start':tools_running.add(event.get('toolCallId') or f'tool-{len(tools_running)}')
                elif kind=='tool_execution_end':
                    if event.get('toolCallId') in tools_running:tools_running.discard(event.get('toolCallId'))
                    elif tools_running:tools_running.pop()
                elif kind=='agent_end':harness_turn=True;tools_running.clear()
                elif kind=='agent_start':harness_turn=False
                elif kind=='compaction_start':compacting=True
                elif kind=='compaction_end':compacting=False
                if event is None:
                    if cancelled.is_set():raise ValueError('Stopped')
                    diagnostics.seek(0);raise ValueError('Pi exited unexpectedly: '+diagnostics.read()[-1000:])
                if event.get('type')=='extension_ui_request' and event.get('method')=='notify':
                    notice=str(event.get('message',''))
                    if notice.startswith(('Harness recovery stopped:','Harness refused:')):raise ValueError(notice.split(':',1)[1].strip())
                    if notice.startswith('Harness recovery:'):phase='recovering';settled=False;harness_done=False
                    if notice.startswith('Harness report: '):
                        run_report=json.loads(notice.removeprefix('Harness report: '));emit({'type':'report',**run_report})
                    if notice.startswith('Harness plan: '):
                        pending_plan=json.loads(notice.removeprefix('Harness plan: '));emit({'type':'plan',**pending_plan})
                    if notice.startswith('Harness check-in: '):
                        check_in=json.loads(notice.removeprefix('Harness check-in: '));emit({'type':'check_in',**check_in})
                    if notice.startswith('Harness choice: '):
                        pending_choice=json.loads(notice.removeprefix('Harness choice: '))
                        pending_choice.setdefault('id',uuid.uuid4().hex[:16])  # task 290: the card's answer names its question
                        if not detached:self.store.upsert_assistant(identifier,{'role':'assistant','request':key,'content':reply or display_text(partial).strip(),'choice':pending_choice,'_live_choice':True})
                        emit({'type':'choice',**pending_choice})
                        continue  # protocol payload is rendered as a card, never raw JSON
                    if notice.startswith('Harness notice: ') and len(notices)<5:notices.append(notice.removeprefix('Harness notice: ')[:500])  # task 290: shown under the answer
                    if notice=='Harness settled':harness_done=True
                    committed=committed_commit(notice) or committed
                if event.get('type')=='agent_start':
                    settled=False
                    if phase=='recovering':phase='reasking'
                if event.get('type')=='agent_settled' and phase!='recovering':settled=True
                if event.get('type')=='response' and event.get('success') is False:raise ValueError(event.get('error','Pi request failed'))
                if event.get('type')=='message_end':
                    message=event.get('message',{})
                    if message.get('role')=='assistant':
                        if intentional_pause(message,recovering=phase=='recovering',choice=pending_choice,plan=pending_plan):
                            text=''.join(part.get('text','') for part in message.get('content',[]) if part.get('type')=='text')
                            if text:reply=text
                            continue  # persist the control and preceding answer when settled
                        if message.get('stopReason') in ('error','aborted'):
                            reply=''.join(part.get('text','') for part in message.get('content',[]) if part.get('type')=='text') or reply  # kept with the failure (task 290)
                            raise ValueError(readable_error(message.get('errorMessage','Model response stopped')))
                        text=''.join(part.get('text','') for part in message.get('content',[]) if part.get('type')=='text')
                        if text:reply=text
                if event.get('type')=='message_update':
                    delta=event.get('assistantMessageEvent',{})
                    if delta.get('type')=='thinking_delta':thought+=delta.get('delta','')
                    if delta.get('type')=='text_start':partial=''
                    if delta.get('type')=='text_delta':partial=(partial+delta.get('delta',''))[-50000:]
                if event.get('type')=='tool_execution_end' and not event.get('isError'):
                    details=(event.get('result') or {}).get('details') or {}
                    if event.get('toolName')=='ask_choices' and details.get('answer'):
                        decisions.append(details);emit({'type':'decision',**details})
                    if event.get('toolName')=='propose_plan' and details.get('pending') is False:
                        pending_plan={**details,'approved':True,'state':'auto' if autonomy.enabled(self.documents.root) else 'chosen'}
                        emit({'type':'plan',**pending_plan})
                if event.get('type')=='tool_execution_end' and not detached:
                    published=music_attachments(event,folder_root,folder/'uploads',identifier)
                    if published:
                        group=((event.get('result') or {}).get('details') or {}).get('musicName','music')
                        artifact_sets[str(group)]=published  # last successful revision of each named composition
                if event.get('type')=='tool_execution_start' and event.get('toolName')=='read' and folder_root:
                    name=self.read_path(folder_root,(event.get('args') or {}))
                    if name and name not in chosen['included'] and name not in opened and len(opened)<20:opened.append(name)
                if event.get('type') in ('message_update','tool_execution_start','tool_execution_end','extension_ui_request','agent_start'):
                    emit(event)
            reply=strip_canary(reply)  # the drift detector read the raw text in the extension; people never see the marker
            if pending_plan and not pending_plan.get('approved') and not reply:reply=pending_plan['goal']+'\n\n'+ '\n'.join(task['title']+': '+task['done_when'] for task in pending_plan['tasks'])+'\n\nStart Building?'
            if pending_choice and not reply:reply=pending_choice['question']
            if not reply:raise ValueError('Pi completed without an assistant answer')
            note=None if os.environ.get('PI_HARNESS_BARE')=='1' else verification_note(before,checked())  # the bench baseline marks nothing
            if note and not committed:  # with a commit, the DoneRow says "! Not verified" (round 7): the answer stays Pi's words
                reply+=note;emit({'type':'message_update','assistantMessageEvent':{'type':'text_delta','delta':note}})  # G-012: the answer and its record carry it
            if note:
                reports.report(self.documents.root,'unverified',note.strip(),request=job,project=project)  # plan 184
            if opened:emit({'type':'also_read','files':opened})
            if committed:
                emit({'type':'committed','commit':committed,'project':project})
                if project and folder_root:self.changed(project,folder_root,committed)
            emit({'type':'assistant_final','text':reply})  # Activity keeps the finalized answer, including extension replacements.
            if pending_plan and not detached:self.store.settle_choices(identifier,'Start Building' if pending_plan.get('approved') else 'a new plan')
            answered=True
            if not detached:self.store.upsert_assistant(identifier,{'role':'assistant','content':reply,'request':key,'thinking':thought[-50000:],'attachments':[file for files in artifact_sets.values() for file in files],**({'decisions':decisions} if decisions else {}),**({'choice':pending_choice} if pending_choice else {}),**({'report':run_report} if run_report else {}),**({'plan':pending_plan} if pending_plan else {}),**({'check_in':check_in} if check_in else {}),**({'also_read':opened} if opened else {}),**({'commit':committed} if committed else {}),**({'notices':notices} if notices else {}),**({'theme_hint':data['theme_hint']} if data.get('theme_hint') in theme.GROUPS else {})})
            if pending_choice and not detached and project:decision_rows.take_next(self,project,identifier,pending_choice,emit)  # task 273: Take All Recommendations
            if comment:self.documents.agent_result(comment['path'],comment['id'],reply,previous=(thread or {}).get('agent_reply',''),also_read=opened)
            emit({'type':'done','conversation':self.store.get(identifier)} if not detached else {'type':'done'})
        except Exception as error:
            # Task 290 (review P2): a crash or a stop mid-answer. Gate gets the request's end (the extension can no longer
            # send it); the chat keeps what Pi had written and the control it raised, marked failed or stopped, once.
            ended=self.abandon(key)
            if started and not answered:
                answered=True;stopped=str(error)=='Stopped'
                text=strip_canary(reply) or display_text(partial).strip();check_in=check_in or (ended or {}).get('check_in')
                # Review P2: the chat says so even when Pi wrote nothing yet; the line offers Retry (the request, queued
                # again) and Undo This Request for the commit Gate made of what it changed.
                how={'state':'stopped'} if stopped else {'state':'failed','reason':readable_error(error)[:1000]}
                how.update({**({'job':job} if job else {}),**({'commit':ended['commit']} if (ended or {}).get('commit') else {})})
                try:
                    self.store.upsert_assistant(identifier,{'role':'assistant','content':text,'ended':how,'request':key,
                        **({'choice':pending_choice} if pending_choice else {}),**({'plan':pending_plan} if pending_plan else {}),**({'check_in':check_in} if check_in else {}),**({'notices':notices} if notices else {})})
                    emit({'type':'conversation','conversation':self.store.get(identifier)})
                except Exception as failure:print(f'Could not keep the partial answer: {failure!r}',flush=True)
            raise
        finally:
            if process:
                process.terminate()
                try:process.wait(timeout=5)
                except subprocess.TimeoutExpired:process.kill();process.wait()
                process.stdin.close();process.stdout.close()
                stop_group(process.pid)  # servers and watchers Pi started with `&` (seen in the bench: an http.server left for hours)
            if diagnostics:diagnostics.close()
            with self.lock:
                self.active.pop(key,None);self.turns.notify_all()
                last=not self.active
            if last:self.release_lock()
            if job and context_file:
                try:context_file.unlink()
                except OSError:pass
            if token_file:token_file.unlink(missing_ok=True)  # Pi did not start its extension

def with_checks(jobs,events,test_runs=()):
    """Copies of the jobs where each tool call lists the Gate events recorded for it (gate, then audit)."""
    checks={}
    for event in events:
        if event.get('tool_call'):checks.setdefault(event['tool_call'],[]).append({'event':event['id'],'phase':event['phase'],'outcome':event['outcome'],'reason':event['reason']})
    jobs=[{**job,'test_runs':[run for run in test_runs if run.get('request')==job['id']]} for job in jobs]
    return [{**job,'tools':[{**tool,'checks':checks.get(tool['id'],[])} for tool in job['tools']]} if 'tools' in job else job for job in jobs]

from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, unquote, parse_qs
import mimetypes
mimetypes.add_type('font/woff2','.woff2')
FONTS=['SourceSerif4-Variable','SourceSerif4-Italic-Variable','IBMPlexMono-Regular','IBMPlexMono-Medium']

class WebHandler(BaseHTTPRequestHandler):
    def end_headers(self):
        # Task 305: no page or reply of the workbench can be framed by another site (clickjacking), and no reply is
        # sniffed into another type (a JSON reply read as HTML).
        self.send_header('X-Frame-Options','DENY');self.send_header('Content-Security-Policy',"frame-ancestors 'none'");self.send_header('X-Content-Type-Options','nosniff')
        super().end_headers()
    def internal_error(self, error):
        """Task 305: a 500 says what happened in a sentence; the exception text (paths, values) goes to the log only."""
        import traceback;traceback.print_exception(error)
        self.reply({'error':'Internal error: the workbench could not do this. The details are in its log.'},500)
    def reply(self, value, code=200):
        body=json.dumps(value,ensure_ascii=False).encode()
        self.send_response(code);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
    remote_hosts=frozenset()
    remote_users=frozenset()
    phone_url=None
    phone_error=None  # why `tailscale serve` did not start (task 141): Open on Phone shows the off state
    speech=staticmethod(transcribe)
    # Task 261: the person's controls carry this run's secret, which only the served page holds (a meta tag): a local
    # process posting to the workbench, such as a test the model wrote, cannot approve, accept or switch on its own.
    person_secret=secrets.token_urlsafe(32)
    PERSON_ROUTES=frozenset({'/api/choices/answer','/api/phase','/api/phase/build','/api/plan/wait','/api/auto','/api/tasks/reopen','/api/theme/open','/api/theme/save','/api/theme/add','/api/decisions/change','/api/projects/start','/api/projects/capability','/api/projects/sandbox'})  # task 312: the theme panel is the person's; round 12: Create and Add a Capability… too
    def person_only(self, path, data):
        if path in self.PERSON_ROUTES or re.fullmatch(r'/api/conversations/[0-9a-f]{32}/check-in/(?:accept|accept-anyway|stop)',path):return True
        if re.fullmatch(r'/api/jobs/[0-9a-f]{32}/(?:edit|remove)',path):return True  # task 325: only the person changes what waits for Pi
        # A message answering a waiting choice is recorded as the person's decision.
        return (path=='/api/jobs/create' or re.fullmatch(r'/api/conversations/[0-9a-f]{32}/send',path) is not None) and str(data.get('message','')).lstrip().startswith('Choice: ')
    def person(self):
        supplied=self.headers.get('X-Pi-Person','')
        return bool(self.person_secret) and hmac.compare_digest(supplied.encode(),self.person_secret.encode())
    def trusted(self):
        host=self.headers.get('Host','');origin=self.headers.get('Origin')
        allowed={f'localhost:{self.server.server_port}',f'127.0.0.1:{self.server.server_port}'}
        if host in allowed:return not origin or origin in {f'http://{value}' for value in allowed}
        # tailscale serve proxies HTTPS on the tailnet name to loopback and sets Tailscale-User-Login.
        host=host.removesuffix(':443')
        if host not in self.remote_hosts or self.headers.get('Tailscale-User-Login') not in self.remote_users:return False
        return not origin or origin==f'https://{host}'
    def refusal(self):
        host=self.headers.get('Host','');login=self.headers.get('Tailscale-User-Login')
        if host.startswith(('localhost:','127.0.0.1:')) or not login:return 'Use the local web address; cross-origin requests are not allowed'
        return f'Not allowed: Host {host}, login {login}, Origin {self.headers.get("Origin")}. Add the host (without :443) to remote_hosts and the login to remote_users in config.json, then restart plh.'
    def transcription(self, data):
        mime=str(data.get('mime',''))
        if not mime.startswith('audio/'):raise ValueError('Voice input must be audio')
        audio=base64.b64decode(data.get('data',''),validate=True)
        if not audio:raise ValueError('The recording is empty')
        if len(audio)>MAX_UPLOAD:raise ValueError('Each file must be at most 12 MiB')
        suffix={'audio/mp4':'.m4a','audio/mpeg':'.mp3','audio/ogg':'.ogg','audio/wav':'.wav'}.get(mime.split(';')[0],'.webm')
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory)/('voice'+suffix);path.write_bytes(audio)
            try:return {'text':self.speech(path)}
            except subprocess.TimeoutExpired as error:raise ValueError('Transcription took longer than three minutes; the recording is attached instead.') from error
    def do_GET(self):
        if not self.trusted():self.reply({'error':self.refusal()},403);return
        path=urlparse(self.path).path
        try:
            if path=='/api/directories':self.reply(self.chat.documents.directories(parse_qs(urlparse(self.path).query).get('path',[None])[0]));return
            if path=='/api/activity-record':
                identifier=parse_qs(urlparse(self.path).query)['id'][0]
                if not re.fullmatch(r'[0-9a-f]{32}',identifier):raise ValueError('Invalid task ID')
                record=self.chat.queue.records/(identifier+'.md');self.reply({'markdown':record.read_text(),'path':str(record).replace(str(Path.home()),'~',1)});return
            if path=='/api/updates':self.reply(self.chat.updates.daily());return
            if path=='/api/settings':self.reply(self.chat.updates.settings());return
            if path=='/api/workspace':self.reply(self.chat.workspace());return
            if path=='/api/preview':self.reply(self.chat.preview(parse_qs(urlparse(self.path).query)['project'][0],'status'));return
            if path=='/api/phase':self.reply(self.chat.ledger.paperwork.phase(self.chat.documents.project_path(parse_qs(urlparse(self.path).query)['project'][0])));return
            if path=='/api/theme':self.reply(theme.state(self.chat.documents.project_path(parse_qs(urlparse(self.path).query)['project'][0])));return  # task 312
            if path=='/api/project-start':from harness import project_start;self.reply(project_start.catalogue(self.chat,parse_qs(urlparse(self.path).query)));return  # round 12, plan 253
            if path=='/api/project-sandbox':  # task 311: how far this project's test runs may reach
                from gate import sandbox;self.reply({**sandbox.widened(self.chat.documents.root,self.chat.documents.project_path(parse_qs(urlparse(self.path).query)['project'][0])),'available':sandbox.available()});return
            if path=='/api/theme/fonts':self.reply(self.chat.fonts.search(parse_qs(urlparse(self.path).query).get('q',[''])[0]));return
            if path=='/api/project-files':self.reply(self.chat.documents.files(parse_qs(urlparse(self.path).query)['project'][0]));return
            if path=='/api/document':self.reply(self.chat.documents.get(parse_qs(urlparse(self.path).query)['path'][0]));return
            if path=='/api/project-file':self.reply(self.chat.documents.read_file(parse_qs(urlparse(self.path).query)['path'][0]));return
            if path=='/api/gate':
                self.reply({'events':self.chat.gate_events(),'gate_port':self.chat.gate_port});return
            if path=='/api/conversations':self.reply(self.chat.store.list());return
            if path=='/api/config':choice=self.chat.choice();self.reply({'model':choice['model'],'effort':choice['effort'],'thinking':choice['thinking'],'chosenEffort':choice['chosenEffort'],'missing':choice['missing'],'maxFileBytes':MAX_UPLOAD,'phoneUrl':self.phone_url,'phoneError':self.phone_error,'phoneEnable':serve_link(self.phone_error),'gatePort':self.chat.gate_port,'dataRoot':str(self.chat.documents.root),'auto_accept':autonomy.enabled(self.chat.documents.root)});return
            if path=='/api/auto':
                from harness.autonomy import enabled,RunReports
                self.reply({'enabled':enabled(self.chat.documents.root),'report':RunReports(self.chat.documents.root).latest()});return
            if path=='/api/models':self.reply(self.chat.model_list());return
            if path=='/api/context-preview':
                query={key:values[0] for key,values in parse_qs(urlparse(self.path).query).items()}
                request={'message':query.get('text','')}
                if query.get('document'):request['document']=query['document']
                if query.get('comment'):request={'message':'','document_comment':{'path':query.get('path',''),'id':query['comment']}}
                self.reply(self.chat.context_preview(query['project'],request));return
            decisions=re.fullmatch(r'/api/conversations/([0-9a-f]{32})/decisions',path)  # task 273: the decision rows under each answer
            if decisions:self.reply(decision_rows.conversation(self.chat.documents.root,self.chat.store.get(decisions[1])));return
            if path.startswith('/api/conversations/'):
                self.reply(self.chat.store.get(path.rsplit('/',1)[-1]));return
            if path.startswith('/api/files/'):
                _,_,_,identifier,name=path.split('/',4)
                name=unquote(name)
                if Path(name).name!=name or '/' in name or '\\' in name:raise ValueError('Invalid file name')
                self.chat.store.get(identifier)
                file=self.chat.store.folder(identifier)/'uploads'/name
                mime=mimetypes.guess_type(name)[0] or 'application/octet-stream'
                # Text/HTML/code downloads must never execute as same-origin pages.
                disposition='inline' if mime.startswith(('image/','audio/')) and mime!='image/svg+xml' else 'attachment'
            else:
                allowed={'/':'index.html','/index.html':'index.html','/chat.css':'chat.css','/js/chat.mjs':'js/chat.mjs','/js/check-ins.mjs':'js/check-ins.mjs','/js/scope-cards.mjs':'js/scope-cards.mjs','/js/refusals.mjs':'js/refusals.mjs','/js/shortcuts.mjs':'js/shortcuts.mjs','/js/work-links.mjs':'js/work-links.mjs','/js/choice-text.mjs':'js/choice-text.mjs','/js/chat-state.mjs':'js/chat-state.mjs','/js/drafts.mjs':'js/drafts.mjs','/js/ui.mjs':'js/ui.mjs','/js/workspace.mjs':'js/workspace.mjs','/js/markdown-blocks.mjs':'js/markdown-blocks.mjs','/js/message-markdown.mjs':'js/message-markdown.mjs','/js/router.mjs':'js/router.mjs','/js/dictation.mjs':'js/dictation.mjs','/js/context-line.mjs':'js/context-line.mjs','/harness/vendor/qrcode.mjs':'harness/vendor/qrcode.mjs','/js/files-window.mjs':'js/files-window.mjs','/js/preview.mjs':'js/preview.mjs','/js/i18n.mjs':'js/i18n.mjs','/messages/ja.json':'messages/ja.json','/js/updates-window.mjs':'js/updates-window.mjs', '/js/phases.mjs':'js/phases.mjs', '/js/plan-cards.mjs':'js/plan-cards.mjs','/js/done-row.mjs':'js/done-row.mjs','/js/menubar.mjs':'js/menubar.mjs','/js/dialogs.mjs':'js/dialogs.mjs','/js/theme-panel.mjs':'js/theme-panel.mjs','/js/theme-colors.mjs':'js/theme-colors.mjs','/js/project-start.mjs':'js/project-start.mjs','/design/icons.mjs':'design/icons.mjs','/design/tokens.css':'design/tokens.css','/design/components.css':'design/components.css',**{f'/design/app-icons/{name}':f'design/app-icons/{name}' for name in ('manifest.webmanifest','pi-16.png','pi-32.png','pi-180.png','pi-192.png','pi-512.png','pi-192-dark.png')},**{f'/fonts/{name}.woff2':f'fonts/{name}.woff2' for name in FONTS}}
                allowed.update({f'/js/{name}.mjs':f'js/{name}.mjs' for name in ('notices','decision-row','test-sandbox','queue-list')})  # round 12: HarnessNotice, CutLine, DecisionRow
                # App paths (js/router.mjs): /projects and /p/<project>/<view>[/<file>] load the workbench.
                if path in ('/projects','/activity','/gate') or re.fullmatch(r'/p/[^/]+/(chat|work|activity|gate)(/.*)?',path):path='/'
                if path not in allowed:self.reply({'error':'Not found'},404);return
                file=ROOT/allowed[path];mime=mimetypes.guess_type(str(file))[0] or 'text/plain';disposition=None
            body=file.read_bytes()
            if disposition is None and file.name=='index.html' and file.parent==ROOT:
                body=body.replace(b'<meta charset="utf-8">',b'<meta charset="utf-8"><meta name="pi-person" content="'+html.escape(self.person_secret).encode()+b'">',1)
            self.send_response(200);self.send_header('Content-Type',mime)
            self.send_header('Content-Length',str(len(body)))
            self.send_header('Cache-Control','no-store')
            if disposition:self.send_header('Content-Disposition',disposition)
            self.end_headers();self.wfile.write(body)
        except (FileNotFoundError,KeyError):self.reply({'error':'Not found'},404)
        except ValueError as error:self.reply({'error':str(error)},400)  # e.g. "This is a binary file", not a bare Not found
        except OSError as error:
            if path!='/api/models':self.internal_error(error);return
            self.reply({'error':'Ollama is not reachable: '+str(error)},503)  # /api/models when Ollama is down
        except Exception as error:self.internal_error(error)
    def do_POST(self):
        if not self.trusted():self.reply({'error':self.refusal()},403);return
        streaming=False
        try:
            size=int(self.headers.get('Content-Length','0'))
            if size<0 or size>32*1024*1024:raise ValueError('Request exceeds 32 MiB')
            data=json.loads(self.rfile.read(size))
            if not isinstance(data,dict):raise ValueError('Request must be a JSON object')
            path=urlparse(self.path).path
            if self.person_only(path,data) and not self.person():
                self.reply({'error':'Only the person’s controls in the workbench page can do this. Reload the page and try again.','stale':True},403);return  # round 12 (R12_Grant): the page says it is out of date and offers Reload Page
            if path=='/api/phase/build':
                root=self.chat.documents.project_path(data['project'])
                planned=next((message.get('request') for message in reversed(self.chat.project_chat(data['project'])['messages']) if message.get('plan')),None)  # task 273: the approval joins the plan's answer
                result=self.chat.ledger.paperwork.start_building(root,selected=data.get('tasks'),request=planned)
                conversation=self.chat.store.settle_choices(self.chat.project_chat(data['project'])['id'],'Start Building')
                self.chat.queue.resume_waiting(conversation['id'],'Start Building')
                for message in reversed(conversation['messages']):
                    if message.get('plan'):
                        message['plan'].update(approved=True,waiting=False);break
                self.chat.store.save(conversation);self.reply(result);return
            action=re.fullmatch(r'/api/conversations/([0-9a-f]{32})/check-in/(accept|accept-anyway|stop)',path)
            if action:
                conversation=self.chat.store.get(action[1]);index=data.get('index')
                root=self.chat.documents.project_path(conversation['project'])
                plan=self.chat.ledger.paperwork.plan_state(root)
                if data.get('restored') is True and index is None:check={**(plan.get('card') or {}),'restored':True} if plan.get('check_in') else {}  # round 12: a check-in restored after a reload has no message
                else:
                    if not isinstance(index,int) or isinstance(index,bool) or not 0<=index<len(conversation['messages']):raise ValueError('Check-in not found.')
                    check=conversation['messages'][index].get('check_in')
                if not check:raise ValueError('Check-in not found.')
                if not plan.get('tasks') or check['task']!=plan['tasks'][plan.get('index',0)]:raise ValueError('This check-in is no longer current.')
                result=self.chat.ledger.paperwork.accept_task(root,action={'accept':'accept','accept-anyway':'anyway','stop':'stop'}[action[2]],request=check.get('request') or (conversation['messages'][index].get('request') if isinstance(index,int) else None))  # task 273: under the check-in's answer
                check.update(accepted=action[2]!='stop',state={'accept':'accepted','accept-anyway':'accepted anyway','stop':'stopped'}[action[2]],when=timestamp())
                self.reply({'conversation':self.chat.store.save(conversation),**result});return
            if path=='/api/plan/wait':
                root=self.chat.documents.project_path(data['project']);self.chat.ledger.paperwork.phase(root,'discussion',action='Plan Another Task')
                conversation=self.chat.project_chat(data['project'])
                self.chat.queue.resume_waiting(conversation['id'],'Plan Another Task: the plan waits')
                for message in reversed(conversation['messages']):
                    if message.get('plan'):message['plan']['waiting']=True;break
                self.reply(self.chat.store.save(conversation));return
            if path=='/api/phase':
                root=self.chat.documents.project_path(data['project']);paperwork=self.chat.ledger.paperwork
                before=paperwork.phases.get(root)['phase'];result=paperwork.phase(root,data.get('phase'),action='phase button')
                from harness.phase_start import after_phase_change  # task 324: the phase's work starts by itself
                started=after_phase_change(self.chat,data['project'],before,result.get('phase'))
                self.reply({**result,**({'started':started['id']} if started else {})});return
            if path=='/api/theme/open':self.reply(self.chat.open_theme(data['project'],data.get('group','colours')));return  # task 312: Project › Theme…
            if path=='/api/theme/save':self.reply(self.chat.theme_save(data['project'],data));return
            if path=='/api/theme/add':self.reply(self.chat.theme_add(data['project']));return  # round 12: Add a Theme File
            if path=='/api/tasks/reopen':self.reply(self.chat.ledger.paperwork.reopen(self.chat.documents.project_path(data['project']),data.get('task'),request=data.get('request') if isinstance(data.get('request'),str) else None));return  # task 260: the person's recovery from a false completion
            if path=='/api/settings':self.reply(self.chat.updates.settings(data));return
            if path=='/api/updates':
                action=data.get('action','check')
                if action not in ('check','apply'):raise ValueError('Unknown update action.')
                if action=='apply' and any(job['status'] in ('queued','running') for job in self.chat.queue.list()):raise ValueError('Pi is working. Let its request finish before updating.')
                self.reply(self.chat.updates.update() if action=='apply' else self.chat.updates.check());return
            if path=='/api/auto':
                from harness.autonomy import set_enabled
                self.reply(set_enabled(self.chat.documents.root,data.get('enabled'),confirmed=data.get('confirmed') is True));return
            if path=='/api/reports/seen':
                from harness.autonomy import RunReports
                self.reply(RunReports(self.chat.documents.root).mark_seen(data.get('id')));return
            if path=='/api/projects/create':
                project=self.chat.documents.create_project(data['name'],data.get('parent'),data.get('kind','empty'));self.reply({'project':project,'chat':self.chat.project_chat(project)['id']});return
            if path in ('/api/projects/start','/api/projects/capability','/api/project-start/plan','/api/project-start/preview'):  # round 12, Project Start (harness/project_start.py)
                from harness import project_start;self.reply({'/api/projects/start':project_start.create,'/api/projects/capability':project_start.add,'/api/project-start/plan':project_start.plan,'/api/project-start/preview':project_start.preview}[path](self.chat,data));return
            if path=='/api/projects/register':
                project=self.chat.documents.register(data['path'],data.get('name'));self.reply({'project':project,'chat':self.chat.project_chat(project)['id']});return
            if path=='/api/turn':  # task 164: a work request's next model call waits while the chat answers (one-at-a-time model)
                self.reply(self.chat.wait_turn(parse_qs(urlparse(self.path).query).get('job',[''])[0]));return
            if path=='/api/jobs/stop':self.reply(self.chat.stop(data['id']));return
            if path=='/api/projects/forget':self.reply(self.chat.project_command('remove',data.get('project'),data));return
            if path.startswith('/api/projects/') and path.rsplit('/',1)[-1] in ('rename','move','locate','remove','trash','summary'):
                self.reply(self.chat.project_command(path.rsplit('/',1)[-1],data.get('project'),data));return
            if path=='/api/transcribe':self.reply(self.transcription(data));return
            if path=='/api/projects/sandbox':  # task 311: the person widens (or closes) the test sandbox for one project
                from gate import sandbox
                result=sandbox.widen(self.chat.documents.root,self.chat.documents.project_path(data['project']),data.get('network'))
                record(self.chat.documents.root,None,'sandbox_network','person',result['network']);self.reply(result);return
            if path=='/api/undo':self.reply(self.chat.undo(data['project'],data['commit'],bool(data.get('preview')),bool(data.get('save'))));return
            if path=='/api/preview/phone':self.chat.documents.project_path(data['project']);self.reply(self.chat.previews.phone(data['project'],(self.phone_url or '').removeprefix('https://').rstrip('/'),self.remote_users));return  # P_OnPhone; task 304: the same users as the workbench
            if path in ('/api/preview/start','/api/preview/stop'):self.reply(self.chat.preview(data.get('project'),path.rsplit('/',1)[-1],cwd=data.get('cwd')));return
            if path=='/api/directories/create':self.reply(self.chat.documents.create_directory(data.get('parent'),data.get('name')));return
            if path=='/api/jobs/create':self.reply(self.chat.enqueue(data));return
            if path=='/api/choices/answer':self.reply(self.chat.answer_choice(data['project'],data));return  # task 290
            if path=='/api/decisions/change':self.reply(decision_rows.change_answer(self.chat,data['project'],data));return  # task 273: Change… on a decision row
            if path=='/api/model':self.reply(self.chat.choose_model(data.get('model')));return
            if path=='/api/effort':self.reply(self.chat.choose_effort(data.get('effort')));return
            if path=='/api/jobs/cancel':self.reply(self.chat.queue.cancel(data['id']));return
            waiting=re.fullmatch(r'/api/jobs/([0-9a-f]{32})/(edit|remove)',path)  # task 325: a waiting message, edited or removed
            if waiting:self.reply((self.chat.edit_job if waiting[2]=='edit' else self.chat.remove_job)(waiting[1],data));return
            retry=re.fullmatch(r'/api/jobs/([0-9a-f]{32})/retry',path)  # plan 184, A_Retry
            if retry:self.reply(self.chat.queue.retry(retry.group(1),data.get('note','')));return
            if path.startswith('/api/documents/'):
                action=path.rsplit('/',1)[-1];store=self.chat.documents
                if action=='create':self.reply(store.create(data['project'],data['title'],data.get('parent')));return
                if action=='create-file':self.reply(store.create_file(data['project'],data['name']));return
                if action in ('move','delete'):self.chat.ensure_idle_path(data['path'])
                if action=='move':self.reply(store.move(data['path'],data['name']));return
                if action=='create-task':self.reply(store.create_task(data['project'],data['title']));return
                if action=='create-roadmap':self.reply(store.create_roadmap(data['project']));return
                if action=='save':self.reply(store.save(data['path'],data['markdown'],data['revision']));return
                if action=='save-file':self.reply(store.save_file(data['path'],data['text'],data['revision']));return
                if action=='delete':store.delete(data['path']);self.reply({'deleted':True});return
                if action=='comment':self.reply(store.comment(data['path'],data['text'],data.get('anchor','')));return
                if action=='reply':self.reply(store.reply(data['path'],data['id'],data['text']));return
                if action=='resolve':self.reply(store.resolve(data['path'],data['id'],data['resolved']));return
                if action=='apply-suggestion':self.reply(store.apply_suggestion(data['path'],data['id'],data['revision']));return
                if action=='keep-suggestion':self.reply(store.keep_suggestion(data['path'],data['id']));return
                if action=='delete-comment':self.reply(store.delete_comment(data['path'],data['id'],data['deleted']));return
                raise ValueError('Unknown document action')
            if path=='/api/conversations':raise ValueError('Chats belong to projects. Create or select a project first.')
            parts=path.split('/')
            if len(parts)!=5 or parts[1:3]!=['api','conversations']:self.reply({'error':'Not found'},404);return
            identifier,action=parts[3:]
            self.chat.store.get(identifier)
            if action=='stop':self.reply(self.chat.stop(identifier));return
            if action=='rename':self.reply(self.chat.store.rename(identifier,data.get('title','')));return
            if action=='delete' and self.chat.store.get(identifier).get('project'):raise ValueError('Project chats are retained with their project')
            if action=='delete':
                with self.chat.lock:
                    if identifier in self.chat.active:raise ValueError('Stop this conversation before deleting it')
                    self.chat.store.delete(identifier)
                self.reply({'deleted':True});return
            if action!='send':raise ValueError('Unknown action')
            if not self.chat.store.get(identifier).get('project'):raise ValueError('This chat has no project; choose a project first')
            self.send_response(200);self.send_header('Content-Type','application/x-ndjson');self.send_header('Cache-Control','no-store');self.end_headers();streaming=True
            def emit(event):
                self.wfile.write((json.dumps(event,ensure_ascii=False)+'\n').encode());self.wfile.flush()
            try:self.chat.send(identifier,data,emit)
            except (BrokenPipeError,ConnectionResetError):self.chat.stop(identifier)
            except Exception as error:emit({'type':'error','error':str(error)})
        except ProjectBusy as error:
            if not streaming:self.reply({'error':str(error),'busy':True,'job':error.job},409)
        except TerminalBusy as error:
            if not streaming:self.reply({'error':str(error),'terminal':True,'command':error.command,'name':error.name,'since':error.since},409)
        except QueueRefusal as error:  # task 325: the message started, was removed, or changed in another window
            if not streaming:self.reply({'error':str(error),'refused':error.reason,'job':error.job},409)
        except (ValueError,KeyError,FileNotFoundError,FileExistsError) as error:
            if not streaming:self.reply({'error':str(error)},409 if isinstance(error,DocumentConflict) else 400)
        except (TypeError,AttributeError) as error:
            if not streaming:self.reply({'error':f'Malformed request field: {error}'},400)
        except Exception as error:
            if not streaming:self.internal_error(error)
