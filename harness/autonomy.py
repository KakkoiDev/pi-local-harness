"""The live global Run on its own setting and one durable report per run."""
from datetime import datetime
import hashlib
import json
from pathlib import Path
import threading
import uuid

LOCK=threading.RLock()
KINDS=('done','decisions','external','problems')
RISKS=('For every project, until you turn it off, Pi will do all of this without asking: choose recommended answers, '
       'approve plans, continue tasks, publish, git push, download, send messages and issues, move files to the Trash and remove projects. '
       'What leaves this Mac (a publish, a push, a message) cannot be taken back by Undo. Every step goes into a report at the end of the run.')


def read(path,default=None):
    try:return json.loads(Path(path).read_text(encoding='utf-8'))
    except (OSError,ValueError):return default


def write(path,value):
    path=Path(path);path.parent.mkdir(parents=True,exist_ok=True)
    temporary=path.with_suffix('.tmp');temporary.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');temporary.replace(path)


def enabled(data):
    return bool(data and read(Path(data)/'config.json',{}).get('auto_accept') is True)


def set_enabled(data,value,confirmed=False):
    if not isinstance(value,bool):raise ValueError('auto_accept must be true or false.')
    if value and not confirmed:return {'confirm':True,'destructive':True,'title':'Turn on Run on Its Own?','detail':RISKS,'action':'Turn On'}
    with LOCK:
        path=Path(data)/'config.json';write(path,{**read(path,{}),'auto_accept':value})
    result={'changed':True,'enabled':value,'result':'Run on its own is '+('on.' if value else 'off.')}
    if not value:
        reports=RunReports(data)
        for identifier in list(reports.index()['active'].values()):
            report=reports.get(identifier)
            if report and not report.get('running'):result['report']=reports.finish(report['project'],'turned off')
    return result


def now():return datetime.now().astimezone().isoformat(timespec='seconds')


class RunReports:
    def __init__(self,data):self.folder=Path(data)/'auto-runs'

    def index(self):return read(self.folder/'index.json',{'active':{},'latest':None})

    @staticmethod
    def key(root):return hashlib.sha256(str(root).encode()).hexdigest()

    def file(self,identifier):
        if not isinstance(identifier,str) or len(identifier)!=32 or any(char not in '0123456789abcdef' for char in identifier):raise ValueError('Invalid run ID.')
        return self.folder/(identifier+'.json')

    def begin(self,root):
        with LOCK:
            index=self.index();key=self.key(root)
            if key in index['active']:
                identifier=index['active'][key];file=self.file(identifier);report=read(file);report['running']=True;write(file,report);return identifier
            identifier=uuid.uuid4().hex
            write(self.file(identifier),{'id':identifier,'project':str(root),'started':now(),'ended':None,'seen':False,'running':True,**{kind:[] for kind in KINDS}})
            index['active'][key]=identifier;index['latest']=identifier;write(self.folder/'index.json',index)
            return identifier

    def add(self,root,kind,value):
        if kind not in KINDS:raise ValueError('Unknown report section.')
        with LOCK:
            identifier=self.index()['active'].get(self.key(root))
            if not identifier:return
            file=self.file(identifier);report=read(file);report[kind].append({'when':now(),**value});write(file,report)

    def step_finished(self,root):
        with LOCK:
            identifier=self.index()['active'].get(self.key(root))
            if identifier:
                file=self.file(identifier);value=read(file);value['running']=False;write(file,value)

    def finish(self,root,outcome):
        with LOCK:
            index=self.index();identifier=index['active'].pop(self.key(root),None)
            if not identifier:return None
            file=self.file(identifier);report=read(file)
            from harness.reports import read as incidents
            for event in incidents(self.folder.parent):
                if event.get('time','')>=report['started'] and event.get('cwd')==str(root) and event.get('kind') in {'recovery','wake-up','gate-failed','stopped','unverified','paperwork'}:
                    report['problems'].append({'when':event['time'],'reason':event.get('detail',''),'kind':event['kind']})
            report.update(ended=now(),outcome=outcome,running=False);write(file,report);write(self.folder/'index.json',index)
            return self.get(identifier) if self.visible(report) else None

    @staticmethod
    def visible(value):
        routine=lambda problem: str(problem.get('reason','')).startswith('G-015 Project phase permissions: ') and any(phrase in str(problem.get('reason','')) for phrase in ('Not written: the project is in Discussion.', 'Not written: the project is in Planning.', 'Not proposed: the project is in Discussion.'))
        return (value.get('outcome') != 'nothing changed' or any(value.get(kind) for kind in ('done','decisions','external'))
                or any(not routine(problem) for problem in value.get('problems',[])))

    def get(self,identifier):
        with LOCK:
            value=read(self.file(identifier))
            return {**value,'counts':{kind:len(value[kind]) for kind in KINDS}} if value else None

    def list(self):
        """Finished unseen runs remain available even while a newer run is working."""
        return sorted((value for path in self.folder.glob('*.json') if path.stem!='index' and (value:=self.get(path.stem)) and self.visible(value)),key=lambda value:value['started'],reverse=True)

    def latest(self):
        identifier=self.index()['latest'];return self.get(identifier) if identifier else None

    def mark_seen(self,identifier):
        with LOCK:
            file=self.file(identifier);value=read(file)
            if not value:raise ValueError('Run not found.')
            value['seen']=True;write(file,value)
            return self.get(identifier)
