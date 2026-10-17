"""The paperwork, done by the harness (plan 184 part 4). Pi only writes content.

In a project with ROADMAP.md and tasks/, for each request (the extension tells Gate when one starts and ends):
- at the first change to a file that is not a plan file, the request gets its task: the one it names ("do task 2"),
  else a new `tasks/NNN-<words>.md` with the request quoted and a "Progress (kept by the harness)" section, and its line
  in ROADMAP.md;
- test runs Gate saw are written into the progress: "Red: `cmd` failed at 14:02", "Green: `cmd` passed at 14:10";
- at the end, when the change is verified (a passing run on exactly the final code, and the harness's own Red proof:
  the same command fails in a temporary copy without the change; a Markdown-only change needs none), the task gets "Done", its roadmap line is ticked when no box of the task is left
  open, and the files this request changed are committed locally (never pushed; the person's own edits stay out).
  Otherwise the task stays open with "Not verified at …".
"""
from datetime import datetime
import hashlib
import json
from pathlib import Path
import re
import subprocess
import threading
from harness.decision_log import record as record_decision

from . import rules
from .planning import approval, file_allowed
from .protocol import CheckFailed, changed_paths, is_documentation, project_root, task_kind, test_invocation

PROGRESS = '## Progress (kept by the harness)'


def short_title(text):
    """A short first sentence without request filler; the full request stays in the task."""
    title = str(text or '').strip().splitlines()[0] if str(text or '').strip() else ''
    title = re.split(r'(?<=[.!?])\s+|[。！？]', title, maxsplit=1)[0].strip()
    while True:
        shorter = re.sub(r'^(?:I want to|I would like to|Can you|Please|make a|create a)\s+', '', title, count=1, flags=re.I).strip()
        if shorter == title: break
        title = shorter
    title = title.rstrip('.:;!? ') or 'Request'
    title = title[0].upper() + title[1:]
    if len(title) > 48:
        words = title[:48].rsplit(' ', 1)
        title = (words[0] if len(words) > 1 else '') + '…'
    return title


def plan_path(path):
    return path == 'ROADMAP.md' or (path.startswith('tasks/') and path.endswith('.md'))


# Task 260: the common names of tests and test helpers in Python, JavaScript/TypeScript, Go, Ruby and Rust projects.
TEST_PATH = re.compile(r'(^|/)(?:tests?|specs?|__tests__|__mocks__|__snapshots__)/'
                       r'|(^|/)(?:tests?|conftest|spec_helper)\.[^/]+$'
                       r'|(^|/)test[_-][^/]*$'
                       r'|[._-](?:test|spec)s?\.[^/]+$')


def implementation_paths(paths):
    """Non-test artifacts: test-only edits do not implement an approved feature."""
    return [path for path in paths if not TEST_PATH.search(path)]


def copy_project(root, target):
    """Task 260: a copy of the project for the Red proof: tracked and untracked files git does not ignore, and links to
    the ignored top-level folders the tests may need (node_modules, a virtualenv). None, or why it could not be made."""
    import os, shutil
    def listed(*args):
        done = subprocess.run(['git', '-C', str(root), 'ls-files', '-z', *args], capture_output=True, timeout=60)
        return None if done.returncode else [name for name in done.stdout.decode(errors='surrogateescape').split('\0') if name]
    files = listed('-c', '-o', '--exclude-standard')
    if files is None: return 'the project could not be copied for the Red proof'
    target.mkdir(parents=True, exist_ok=True)
    for name in files:
        source, destination = root / name, target / name
        if not source.resolve().is_relative_to(root) and not source.is_symlink(): continue
        destination.parent.mkdir(parents=True, exist_ok=True)
        if source.is_symlink(): os.symlink(os.readlink(source), destination)
        elif source.is_file(): shutil.copy2(source, destination)
    for name in listed('-o', '-i', '--exclude-standard', '--directory') or []:
        name = name.rstrip('/')
        if not name or '/' in name or name in {'__pycache__', '.pytest_cache', '.mypy_cache', '.ruff_cache', '.git'}: continue
        if (root / name).exists() and not (target / name).exists(): (target / name).symlink_to(root / name)
    return None


BUILD = re.compile(r'^(?:(?:build|continue)(?: with)? the (?:approved|next approved|next) task|start building|continue)[.!]?$', re.I)


def fingerprint(root, path):
    try: return hashlib.sha256((root / path).read_bytes()).hexdigest()
    except OSError: return '<absent>'


def clock():
    return datetime.now().strftime('%H:%M')


class Paperwork:
    def __init__(self, protocol, data=None, identity=('Pi Workbench', 'pi-workbench@localhost')):
        self.protocol, self.data, self.identity = protocol, data, identity
        self.requests = {}
        self.lock = threading.RLock()
        self.choices = {}
        self.plans = {}
        self.projects = None
        from .phases import Phases
        self.phases = Phases(data, identity=self.project_key)
        from harness.autonomy import RunReports
        self.runs=RunReports(data) if data else None

    @property
    def projects(self): return self._projects

    @projects.setter
    def projects(self, store):
        self._projects=store
        if store:store.before_project_move=self.prepare_project_move

    def prepare_project_move(self, root):
        # Migrate old path records while registration still points at their original path.
        self.phases.get(root)
        self.plan_state(root)
        self.waiting_choice(root)

    def project_key(self, root):
        identifier=self.projects.project_identity(root) if self.projects else None
        return 'project:'+identifier if identifier else str(Path(root).resolve())

    def project_root(self, path):
        """Registration defines the boundary; plan-file discovery supports standalone terminal projects."""
        return (self.projects.containing_project(path) if self.projects else None) or project_root(path)

    def choice_file(self,root):
        if not self.data:return None
        return Path(self.data)/'planning'/(hashlib.sha256(self.project_key(root).encode()).hexdigest()+'.json')

    def waiting_choice(self,root):
        file=self.choice_file(root)
        try:value=json.loads(file.read_text(encoding='utf-8')) if file else self.choices.get(self.project_key(root))
        except FileNotFoundError:
            legacy=Path(self.data)/'planning'/(hashlib.sha256(str(Path(root).resolve()).encode()).hexdigest()+'.json')
            if legacy==file:return None
            try:value=json.loads(legacy.read_text(encoding='utf-8'))
            except (OSError,ValueError):return None
            self.save_choice(root,value)
        except (OSError,ValueError):return None
        return value if value and value.get('pending') else None

    def choice_pending(self,request,choice,*,system=False):
        with self.lock:
            item=self.requests.get(request)
            if not item:raise ValueError('No active request for this choice.')
            # Task 260: a question never creates a task; the choice keeps the request's task, if it has one.
            previous=self.waiting_choice(item['root'])
            choice=dict(choice)
            if not system:
                choice.pop('judgement',None)
                if previous and all(previous.get(key)==choice.get(key) for key in ('question','options')) and previous.get('judgement'):
                    choice['judgement']=previous['judgement']
            if not previous or any(previous.get(key)!=choice.get(key) for key in ('question','options')):
                record_decision(self.data,request,'recommendation','code' if system else 'model',{'option':0},rule='choice.recommendation' if system else None)
            value={**choice,'task':item['task'],'before':item['before'],'pending':True}
            self.save_choice(item['root'],value)
            return {key:value[key] for key in ['question','options','recommended','task','pending',*(['system_owned'] if value.get('system_owned') else [])]}

    def confirmed_value(self,root,digest):
        file=self.choice_file(root)
        try:value=json.loads(file.read_text(encoding='utf-8')) if file else self.choices.get(self.project_key(root),{})
        except (OSError,ValueError):return False
        return bool(value and not value.get('pending') and value.get('answer')=='Continue with the stated value' and value.get('state') in ('chosen','given') and value.get('judgement')=={'kind':'assumed_value','digest':digest})

    def save_choice(self,root,value):
        file=self.choice_file(root)
        if file:
            file.parent.mkdir(parents=True,exist_ok=True)
            temporary=file.with_suffix('.tmp');temporary.write_text(json.dumps(value,ensure_ascii=False),encoding='utf-8');temporary.replace(file)
        else:self.choices[self.project_key(root)]=value

    def pause(self,request):
        with self.lock:
            item=self.requests.pop(request,None)
            if item and item.get('auto_run'):self.runs.finish(item['root'],'waiting for person')

    def decision(self,request,question,answer,state='chosen'):
        """An answered choice is evidence, kept in the task rather than inferred from Pi's prose."""
        if state not in {'chosen','auto','given'}:raise ValueError('A decision must be chosen, auto or given.')
        clean=lambda value:' '.join(str(value).split())
        if not clean(question) or not clean(answer):raise ValueError('A decision needs a question and an answer.')
        with self.lock:
            item=self.requests.get(request)
            if not item:raise ValueError('No active request for this decision.')
            waiting=self.waiting_choice(item['root']) or {}
            labels=[option['label'] for option in waiting.get('options',[])]
            record_decision(self.data,request,'question_answer','code' if state=='auto' else 'person',{'option':labels.index(clean(answer))} if clean(answer) in labels else 'other',rule='auto.recommendation' if state=='auto' else None,automatic=state=='auto')
            if not item['task'] and item.get('candidate'):item['task']=item['candidate']
            if self.phases.get(item['root'])['phase']=='discussion' or not item['task']:
                # Discussion choices, and choices of a request without a task (task 260: a question never creates one),
                # live in harness data, never in the project's plan files.
                waiting=self.waiting_choice(item['root']) or {}
                value={**waiting,'task':None,'question':clean(question),'answer':clean(answer),'state':state,'pending':False,
                       'at':datetime.now().astimezone().isoformat(timespec='seconds')}
                self.save_choice(item['root'],value)
                if state=='auto' and self.runs:self.runs.add(item['root'],'decisions',value)
                return {key:value[key] for key in ['task','question','answer','state']}
            was_approved=self.plan_status_for_item(item)
            path=item['root']/item['task'];text=path.read_text(encoding='utf-8')
            line=f"- {clean(question)}: {clean(answer)} ({state} {datetime.now().astimezone().isoformat(timespec='seconds')})\n"
            section=re.search(r'^## Decisions\s*\n',text,re.M)
            if not section:text=text.rstrip()+'\n\n## Decisions\n\n'+line
            else:
                end=re.search(r'^## ',text[section.end():],re.M)
                position=section.end()+end.start() if end else len(text)
                text=text[:position].rstrip()+'\n'+line+'\n'+text[position:]
            path.write_text(text,encoding='utf-8')
            if was_approved:
                plan=self.plan_state(item['root']);plan['digest']=self.plan_digest(item['root'],plan['tasks']);self.plan_state(item['root'],plan)
            waiting=self.waiting_choice(item['root'])
            if waiting and waiting['question']==clean(question):self.save_choice(item['root'],{**waiting,'pending':False,'answer':clean(answer),'state':state})
            if state=='auto' and self.runs:self.runs.add(item['root'],'decisions',{'task':item['task'],'question':clean(question),'answer':clean(answer)})
            return {'task':item['task'],'question':clean(question),'answer':clean(answer),'state':state}

    def plan_state(self, root, value=None):
        file = Path(self.data)/'plans'/(hashlib.sha256(self.project_key(root).encode()).hexdigest()+'.json') if self.data else None
        if value is not None:
            if file:
                file.parent.mkdir(parents=True, exist_ok=True)
                temporary=file.with_suffix('.tmp'); temporary.write_text(json.dumps(value,ensure_ascii=False),encoding='utf-8'); temporary.replace(file)
            else:self.plans[self.project_key(root)]=value
            return value
        try:return json.loads(file.read_text(encoding='utf-8')) if file else self.plans.get(self.project_key(root),{})
        except FileNotFoundError:
            legacy=Path(self.data)/'plans'/(hashlib.sha256(str(Path(root).resolve()).encode()).hexdigest()+'.json')
            if legacy==file or not legacy.exists():return {}
            value=json.loads(legacy.read_text(encoding='utf-8'));return self.plan_state(root,value)
        except (OSError,ValueError):return {}

    def phase(self, root, phase=None, *, action='phase button'):
        """Trusted person controls only. No Pi tool exposes phase selection."""
        root=Path(root).resolve()
        if self.project_root(root)!=root:raise ValueError('Choose a registered project or a folder with ROADMAP.md and tasks/.')
        with self.lock:
            plan=self.plan_state(root)
            paths=(plan.get('tasks',[]) if not plan.get('finished') else [])+plan.get('waiting',[])
            if phase=='implementation':
                if not paths:raise ValueError('No planned task yet. Plan one first.')
                waiting=plan.get('approved') and plan.get('check_in') and not plan.get('finished')  # task 260: a check-in never strands the plan
                if plan.get('pending') or not (self.active_scope(root) or waiting):raise ValueError('No approved task is in progress. Choose Planning, then Start Building on the plan.')
            if phase:self.phases.choose(root,phase,actor='person',planned=bool(paths),action=action)
            value=self.phases.get(root);tasks=[]
            for path in paths:
                file=root/path
                if not file.resolve().is_relative_to(root) or file.is_symlink():raise ValueError('The plan links outside this project.')
                text=file.read_text(encoding='utf-8');title=re.search(r'^# (?:\d+: )?(.+)',text,re.M);done=re.search(r'^Done when:\s*(.+)',text,re.M)
                tasks.append({'path':path,'title':title[1] if title else path,'done_when':done[1] if done else ''})
            card={'check_in':plan['card']} if plan.get('check_in') and plan.get('card') else {}  # task 260: a reload can show the waiting check-in
            return {**value,'tasks':tasks,'pending':bool(plan.get('pending') or plan.get('finished') and plan.get('waiting')),'finished':bool(plan.get('finished')),**card}

    def start_building(self, root, selected=None):
        """Explicit Start Building confirmation, separate from choosing a phase."""
        import uuid
        root=Path(root).resolve()
        if self.project_root(root)!=root:raise ValueError('Choose a registered project or a folder with ROADMAP.md and tasks/.')
        with self.lock:
            plan=self.plan_state(root)
            if not plan.get('pending') and not plan.get('finished'):return self.phase(root,'implementation',action='Start Building')
            available=(plan.get('tasks',[]) if not plan.get('finished') else [])+plan.get('waiting',[])
            if selected is None:selected=available
            if not isinstance(selected,list) or not selected or len(set(selected))!=len(selected) or any(path not in available for path in selected):raise ValueError('Choose at least one task from the waiting plan.')
            if plan.get('pending') and plan.get('digest')!=self.plan_digest(root,plan['tasks']):raise ValueError('The plan changed. Propose it again before approval.')
            selected=[path for path in available if path in selected]
            plan.update(tasks=selected,waiting=[path for path in available if path not in selected],pending=True,digest=self.plan_digest(root,selected))
            self.plan_state(root,plan)
            request='build-'+uuid.uuid4().hex
            self.requests[request]={'root':root,'text':'Start Building','before':{},'task':None}
            try:self.approve_plan(request)
            finally:self.requests.pop(request,None)
            return self.phase(root)

    def accept_task(self, root, action='accept', state='chosen'):
        if action not in ('accept','stop') or state not in ('chosen','auto'):raise ValueError('Unknown check-in action.')
        root=Path(root).resolve()
        with self.lock:
            plan=self.plan_state(root)
            if not plan.get('check_in'):raise ValueError('No task is waiting for validation.')
            if action=='stop':
                record_decision(self.data,None,'task_acceptance','person','stop',rule='G-015')
                return {'finished':False,'stopped':True}
            if not plan.get('verified') and state=='auto':raise ValueError('Review the unverified task before accepting it.')
            # Task 260: accepted from any phase, so leaving Implementation during a check-in never strands the plan.
            if not plan.get('verified'):
                # An unverified task is not skipped: accepting retries the same task (the card names it).
                plan.update(check_in=False,accepted=state);plan.pop('card',None);self.plan_state(root,plan)
                record_decision(self.data,None,'task_acceptance','person','retry',rule='G-015')
                return {'finished':False,'next':plan['tasks'][plan.get('index',0)],'total':len(plan['tasks']),'retry':True}
            index=plan.get('index',0)+1
            finished=index>=len(plan['tasks'])
            plan.update(check_in=False,finished=finished,accepted=state,index=plan.get('index',0) if finished else index);plan.pop('card',None)
            self.plan_state(root,plan)
            record_decision(self.data,None,'task_acceptance','code' if state=='auto' else 'person','accept',rule='G-015',automatic=state=='auto')
            return {'finished':finished,'next':None if finished else plan['tasks'][index],'total':len(plan['tasks'])}

    def active_scope(self, root):
        """Only the saved, unchanged approved task grants write permission; request wording cannot pick another."""
        plan = self.plan_state(root)
        if not plan.get('approved') or plan.get('finished') or plan.get('check_in'): return ''
        tasks = plan.get('tasks', []); index = plan.get('index', 0)
        if not isinstance(index, int) or not 0 <= index < len(tasks): return ''
        path = root / tasks[index]
        if not path.resolve().is_relative_to(root.resolve()) or path.is_symlink(): return ''
        try: text = path.read_text(encoding='utf-8')
        except OSError: return ''
        if not re.search(r'^Plan approved: (?:chosen|auto) ', text, re.M): return ''
        return text if plan.get('digest') == self.plan_digest(root, tasks) else ''

    def plan_digest(self, root, tasks):
        # Progress, approval stamps and the harness's roadmap ticks do not change the approved scope.
        texts=[]
        for path in ['ROADMAP.md',*tasks]:
            try:text=(root/path).read_text(encoding='utf-8')
            except OSError:return None
            if path=='ROADMAP.md':
                goal=re.search(r'^## Goal\s*\n(.*?)(?=^## |\Z)',text,re.M|re.S)
                text=goal[1] if goal else text
            text=re.sub(r'^## (?:Progress \(kept by the harness\)|For the person)\s*\n.*?(?=^## |\Z)','',text,flags=re.M|re.S)
            if path.endswith('-ready-to-publish.md'):
                text=re.sub(r'^## Last audit\s*\n.*?(?=^## |\Z)','',text,flags=re.M|re.S)
                text=re.sub(r'^(- \[[ x]\] [^:\n]+):.*$',r'\1',text,flags=re.M)
            text=re.sub(r'^Plan approved:.*\n?', '', text, flags=re.M)
            text=re.sub(r'- \[[ x]\]', '- []', text)
            texts.append('\n'.join(line.rstrip() for line in text.splitlines() if line.strip()))
        return hashlib.sha256('\n'.join(texts).encode()).hexdigest()

    def plan_status_for_item(self,item):
        plan=self.plan_state(item['root'])
        return bool(not item.get('new_plan') and not plan.get('finished') and plan.get('approved') and item.get('task')==plan['tasks'][plan.get('index',0)] and re.search(r'^Plan approved: (?:chosen|auto) ',(item['root']/item['task']).read_text(encoding='utf-8'),re.M) and plan.get('digest')==self.plan_digest(item['root'],plan['tasks']))

    def plan_status(self, request, small_fix=False):
        from .planning import requires_plan
        item=self.requests.get(request)
        if not item:return {'required':False,'approved':False}
        item={**item,'task':item.get('task') or item.get('candidate')}  # task 260: a question still sees the approved task in progress
        root=item['root'];state=self.plan_state(root);task=item.get('task');text=''
        if task and (root/task).is_file():text=(root/task).read_text(encoding='utf-8')
        required=requires_plan(item['text'],text,small_fix=small_fix,first=not bool(re.search(r'^\s*- \[x\]',(root/'ROADMAP.md').read_text(encoding='utf-8') if (root/'ROADMAP.md').is_file() else '',re.M)))
        approved=self.plan_status_for_item(item)
        return {'required':required or bool(state.get('pending') or state.get('check_in') or task in state.get('tasks',[])), 'approved':approved,'task':task}

    def propose_plan(self, request, content=None):
        """Preview the actual Markdown plan; the model cannot approve its own proposal."""
        with self.lock:
            item=self.requests.get(request)
            if not item:raise ValueError('No active request for this plan.')
            root=item['root']
            if content:
                clean=lambda value:" ".join(str(value).split())
                if self.phases.get(root)['phase']!='planning':raise ValueError('Choose Planning to lay out tasks.')
                goal=content.get('goal');values=content.get('tasks')
                if not isinstance(goal,str) or not goal.strip() or not isinstance(values,list) or not values:raise ValueError('Provide a goal and task content.')
                prepared=[]
                for task in values:
                    if not isinstance(task,dict) or task.get('kind','code') not in ('code','docs','chore'):raise ValueError('Choose code, docs or chore for the task kind.')
                    if any(not isinstance(task.get(key),str) or not task[key].strip() for key in ('title','done_when','content')):raise ValueError('Each task needs a title, Done when and content.')
                    files=task.get('files')
                    if not isinstance(files,list) or not files or any(not isinstance(path,str) or not path or Path(path).is_absolute() or '..' in Path(path).parts or '\n' in path or ',' in path for path in files):raise ValueError('Each task needs project-relative files.')
                    if re.search(r'^\s*- \[[ xX]\]|^(?:Kind:|Files:|Plan approved:|Request |## (?:Progress|For the person))',task['content'],re.M):raise ValueError('Provide content without checkboxes; the harness lays out the steps.')
                    prepared.append(task)
                if (root/'tasks').is_symlink() or not (root/'tasks').resolve().is_relative_to(root):raise ValueError('Task files must stay inside the project.')
                (root/'tasks').mkdir(exist_ok=True)
                roadmap=root/'ROADMAP.md';text=roadmap.read_text() if roadmap.exists() else '# Roadmap\n'
                match=re.search(r'^## Goal\s*\n.*?(?=^## |\Z)',text,re.M|re.S)
                goal_text='## Goal\n\n'+goal.strip()+'\n\n'
                text=text[:match.start()]+goal_text+text[match.end():] if match else text.rstrip()+'\n\n'+goal_text
                number=max([int(m[1]) for path in (root/'tasks').glob('*.md') if (m:=re.match(r'^(\d+)',path.name))]+[0])+1
                for task in prepared:
                    path=f'tasks/{number:03d}-'+re.sub(r'[^a-z0-9]+','-',task['title'].lower()).strip('-')[:48]+'.md'
                    steps='- [ ] Red: a test fails for this change.\n- [ ] Green: the test passes with this change.\n' if task.get('kind','code')=='code' else '- [ ] Verify the change.\n'
                    (root/path).write_text(f"# {number:03d}: {clean(task['title'])}\n\nKind: {task.get('kind','code')}\nFiles: {', '.join(task['files'])}\n\nDone when: {clean(task['done_when'])}\n\n{task['content'].strip()}\n\n{steps}\n## Decisions\n\n",encoding='utf-8')
                    text+=f"- [ ] [{number:03d}-{clean(task['title'])}]({path})\n";number+=1
                roadmap.write_text(text,encoding='utf-8')
            from kit.publish_audit import ensure_task
            ensure_task(root,reset=True)
            gaps=rules.plan_gaps(root)
            if gaps:raise ValueError('; '.join(gaps))
            roadmap=(root/'ROADMAP.md').read_text(encoding='utf-8')
            paths=re.findall(r'^\s*- \[ \].*?\((tasks/[^)]+\.md)\)',roadmap,re.M)
            tasks=[]
            for path in paths:
                if not (root/path).resolve().is_relative_to(root):raise ValueError('Task must stay inside the project.')
                text=(root/path).read_text(encoding='utf-8')
                if 'Kind: audit' in text or 'Kind: planning' in text:continue
                title=re.search(r'^# (?:\d+: )?(.+)',text,re.M)
                done=re.search(r'^Done when:\s*(.+)',text,re.M)
                if not title or not done:raise ValueError('Each task needs a title and Done when.')
                decisions=re.search(r'^## Decisions\s*\n(.*?)(?=^## |\Z)',text,re.M|re.S)
                tasks.append({'path':path,'title':title[1],'done_when':done[1],'decisions':decisions[1].strip() if decisions else ''})
            if not tasks:raise ValueError('The plan needs at least one open task.')
            goal=re.search(r'^## Goal\s*\n(.*?)(?=^## |\Z)',roadmap,re.M|re.S)
            first=root/tasks[0]['path']
            first_text=first.read_text(encoding='utf-8')
            if not re.search(r'^Request ',first_text,re.M):
                first.write_text(first_text.rstrip()+'\n\nRequest '+datetime.now().strftime('%Y-%m-%d')+': “'+item['text']+'”\n',encoding='utf-8')
            state={'tasks':[task['path'] for task in tasks],'pending':True,'approved':False,'before':item['before'],'digest':self.plan_digest(root,[task['path'] for task in tasks])}
            self.plan_state(root,state);item['task']=tasks[0]['path']
            record_decision(self.data,request,'plan_layout','code',len(tasks),rule='G-010')
            return {'root':str(root),'goal':goal[1].strip() if goal else '', 'tasks':tasks,'pending':True}

    def approve_plan(self, request, state='chosen'):
        if state not in {'chosen','auto'}:raise ValueError('Approval must come from the person or auto-accept.')
        with self.lock:
            item=self.requests[request];root=item['root'];plan=self.plan_state(root)
            if not plan.get('pending'):raise ValueError('No plan is waiting for approval.')
            if state=='auto' and self.phases.get(root)['phase']!='planning':raise ValueError('Run on its own can only move Planning to Implementation.')
            if plan['digest']!=self.plan_digest(root,plan['tasks']):raise ValueError('The plan changed. Propose it again before approval.')
            for path in plan['tasks']:
                file=root/path;text=re.sub(r'^Plan approved:.*\n?', '',file.read_text(encoding='utf-8'),flags=re.M)
                lines=text.splitlines();lines.insert(1,'\nPlan approved: '+state+' '+datetime.now().astimezone().isoformat(timespec='seconds'))
                file.write_text('\n'.join(lines)+'\n',encoding='utf-8')
            for file in (root/'tasks').glob('*.md'):
                text=file.read_text(encoding='utf-8')
                if 'Kind: planning' in text:
                    file.write_text(text.replace('- [ ]','- [x]'),encoding='utf-8')
                    roadmap=root/'ROADMAP.md';roadmap.write_text(re.sub(r'^(\s*)- \[ \](.*\(tasks/'+re.escape(file.name)+r'\))',r'\1- [x]\2',roadmap.read_text(encoding='utf-8'),flags=re.M),encoding='utf-8')
            plan.update(pending=False,approved=True,index=0,check_in=False,finished=False)
            self.plan_state(root,plan);item['task']=plan['tasks'][0]
            item['new_plan']=False
            self.phases.choose(root,'implementation',actor='auto' if state=='auto' else 'person',planned=True,action='Start Building')
            if state=='auto' and self.runs:self.runs.add(root,'decisions',{'question':'Plan approval','answer':'Approved recommended plan','tasks':plan['tasks']})
            record_decision(self.data,request,'plan_approval','code' if state=='auto' else 'person','approved',rule='G-015',automatic=state=='auto')
            return self.plan_status(request)

    # -- a request's life -------------------------------------------------------------------------------------------
    def start(self, request, cwd, text):
        """Remember what was already changed, so only this request's changes are its own."""
        root = self.project_root(cwd) if cwd else None
        if not root: return None
        try: before = {path: fingerprint(root, path) for path in (changed_paths(root) or {})}
        except CheckFailed: before = {}
        with self.lock:
            item={'root':root,'text':str(text or '').strip(),'before':before,'task':None}
            from harness.context import mentioned
            named=mentioned(item['text'],[path.relative_to(root).as_posix() for path in (root/'tasks').glob('*.md')])
            item['task']=next(iter(named),None)
            plan=self.plan_state(root)
            active=plan['tasks'][plan.get('index',0)] if plan.get('approved') and not plan.get('finished') and not plan.get('check_in') and 0<=plan.get('index',0)<len(plan.get('tasks',[])) else None
            if item['task'] in plan.get('tasks',[])+plan.get('waiting',[]) and item['task']!=active:
                item['task']=None;item['other_task']=True  # task 260: naming a planned task that is not in progress does not make it this request's
            from harness.autonomy import enabled
            if self.runs and enabled(self.data):item['auto_run']=self.runs.begin(root)
            self.requests[request]=item
            from .planning import approval
            plan=self.plan_state(root)
            from .planning import FEATURE, PLAN
            item['new_plan']=bool(self.phases.get(root)['phase']=='planning' and (FEATURE.search(item['text']) or PLAN.search(item['text'])))
            if active and not item['new_plan'] and not item['task'] and not item.get('other_task'):
                # Task 260: Build/Continue works on the task in progress; any other message (a question) attaches to it
                # only at its first write, so a question never ends the task or raises a check-in.
                if BUILD.match(item['text']) or approval(item['text']):item['task']=active
                else:item['candidate']=active
            waiting=self.waiting_choice(root)
            prefix=f"Choice: {waiting['question']} → " if waiting else ''
            if waiting and item['text'].startswith(prefix) and item['text'][len(prefix):].strip():
                item['task']=waiting.get('task') or item['task']
                # Task 260: the paused request's own changes, code included, stay the resumed request's.
                item['before']=dict(waiting['before']) if isinstance(waiting.get('before'),dict) else item['before']
                item['new_plan']=False
                self.decision(request,waiting['question'],item['text'][len(prefix):],'chosen')
        return str(root)

    def changes(self, item):
        """Paths this request changed (relative to the project), plan files included."""
        root, before = item['root'], item['before']
        try: now = changed_paths(root) or {}
        except CheckFailed: return []
        return sorted(path for path in now if path not in before or fingerprint(root, path) != before[path])

    def observe(self, request):
        """After a tool ran: the note for Pi the first time the request gets its task, else None."""
        with self.lock:
            item = self.requests.get(request)
            if not item or item.get('observed'): return None
            content = [path for path in self.changes(item) if not plan_path(path)]
            if not content: return None
            made=False
            if not item['task'] and item.get('candidate'):item['task']=item['candidate']
            if not item['task']:item['task'],made=self.task_for(item)
            item['made']=made;item['observed']=True
            from kit.publish_audit import ensure_task
            ensure_task(item['root'],reset=True)
            self.progress(item, f'Started at {clock()}: {", ".join(content[:6])}{" …" if len(content) > 6 else ""}')
            return (f"This request's task is {item['task']} ({'made' if made else 'named in the request'}); the harness keeps it and "
                    "ROADMAP.md up to date and commits when the change is verified. Write content only: no task files, boxes or commits. "
                    f"Before you finish, add a `## For the person` section to {item['task']}: two or three short lines for someone who does not "
                    "read code, what changed and then \"Tried it: …\".")

    def ran(self, request, command, passed):
        """A test run Gate saw: written into the task's progress."""
        with self.lock:
            item = self.requests.get(request)
            if not item or not item['task'] or not test_invocation(command): return
            text = (item['root'] / item['task']).read_text(encoding='utf-8')
            if not passed and '- [x] Red:' not in text:
                self.progress(item, f'Red: `{command}` failed at {clock()}')
            if passed:
                item['test_command'] = command  # the harness proves Red with it at the end, if Pi did not show it
                answer = self.protocol.verification(item['root'])
                if answer and answer[2]:
                    line = f'- [x] Green: `{command}` passed at {clock()}'
                    if '- [x] Green:' in text: self.write(item, re.sub(r'- \[x\] Green: .*', line.replace('\\', r'\\'), text, count=1))
                    else: self.progress(item, line[6:])

    def end(self, request, review=True):
        with self.lock:
            item=self.requests.get(request)
            result=self._end(request,review)
            if item and result and result.get('outcome')=='not verified' and item.get('planned'):
                # Task 260: only the task in progress gets a check-in; accepting an unverified one retries it.
                plan=self.plan_state(item['root'])
                card={'root':str(item['root']),'task':item['task'],'verified':False,'reason':result.get('reason'),'next':item['task'],'retry':True,'question':'Retry Task','number':plan['tasks'].index(item['task'])+1,'total':len(plan['tasks'])}
                plan.update(check_in=True,verified=False,card=card);self.plan_state(item['root'],plan)
                result['check_in']=card
            if item and item.get('auto_run') and result and result.get('outcome')!='continue':
                from harness.autonomy import enabled
                outcome=result['outcome']
                if outcome in {'committed','not verified','plan incomplete'}:
                    self.runs.add(item['root'],'done',{'task':result.get('task'),'verified':outcome=='committed','commit':result.get('commit'),'reason':result.get('reason')})
                if outcome not in {'committed','nothing changed'}:self.runs.add(item['root'],'problems',{'reason':result.get('reason',outcome)})
                self.runs.step_finished(item['root'])
                if not (outcome=='committed' and result.get('check_in',{}).get('next') and enabled(self.data)):
                    result['report']=self.runs.finish(item['root'],'roadmap done' if outcome=='committed' and result.get('check_in') and not result['check_in']['next'] else outcome)
            return result

    def _end(self, request, review=True):
        """The request is over: mark it done and commit, or leave it open and say why. None outside a project."""
        with self.lock:
            item = self.requests.get(request)
            if not item: return None
            if review and not item.get('sample_checked'):
                item['sample_checked'] = True
                instruction = self.sample_cleanup(item)
                if instruction: return {'outcome': 'continue', 'instruction': instruction, 'task': item['task']}
            gaps = rules.plan_gaps(item['root']) if item['task'] and any(not plan_path(path) and not is_documentation(path) for path in self.changes(item)) else []
            if review and gaps and not item.get('plan_checked'):
                item['plan_checked'] = True
                return {'outcome': 'continue', 'kind': 'plan', 'task': item['task'], 'instruction': 'G-014: fill the plan before finishing. '+ '; '.join(gaps)}
            self.requests.pop(request, None)
            if not item['task']: return {'outcome': 'nothing changed'}
            root, task = item['root'], item['task']
            changed = self.changes(item)
            text = (root / task).read_text(encoding='utf-8')
            planned = item['planned'] = self.plan_status_for_item(item)
            plan = self.plan_state(root)
            in_plan = task in plan.get('tasks', []) + plan.get('waiting', [])
            content = [path for path in changed if not plan_path(path)]
            if not planned and not item.get('made') and (in_plan or not content):
                # Task 260: a request that is not building the task in progress never relabels or completes a task: a
                # question changes nothing; edits of the plan files (Planning) are kept in a plain commit.
                paperwork = [path for path in changed if plan_path(path)]
                if content:
                    reason = 'this task is in the plan but is not the task in progress; it completes only when it is built'
                    saved = self.commit(root, changed, self.subject(item, ', not verified'), f'Not verified: {reason}.')
                    return {'outcome': 'not verified', 'task': task, 'reason': reason, **saved}
                if not paperwork: return {'outcome': 'nothing changed'}
                saved = self.commit(root, paperwork, self.subject(item, ', plan'))
                return {'outcome': saved.pop('outcome', 'committed'), 'task': task, **saved}
            # Task 260: only the task's Files are its work; anything else stays out of its commit and is named.
            outside = [path for path in content if not file_allowed(text, path)]
            inside = [path for path in changed if path not in outside]
            code = [path for path in inside if not plan_path(path) and not is_documentation(path)]
            if gaps:
                reason = '; '.join(gaps)
                self.write(item,text.rstrip('\n')+f'\n\nPlan incomplete (G-014): {reason} The task stays open.\n')
                saved = self.commit(root,sorted(set(inside)|{task,'ROADMAP.md'}),self.subject(item,', plan incomplete'),f'Plan incomplete (G-014): {reason}')
                return {'outcome':'plan incomplete','task':task,'reason':reason,**saved}
            from harness.audit import verified as audit_verified
            publish = task.endswith('-ready-to-publish.md')
            if publish and (re.search(r'^- \[ \]',text,re.M) or not audit_verified(root,self.data,task)):
                reason='publication checks are still open; run /audit and fix every failed check'
                saved=self.commit(root,sorted(set(inside)|{task,'ROADMAP.md'}),self.subject(item,', not verified'),reason)
                return {'outcome':'not verified','task':task,'reason':reason,**saved}
            if outside:
                reason = (f"changes outside the task's Files: {', '.join(outside[:8])}{' …' if len(outside) > 8 else ''} "
                          "(left out of the commit; add them to Files: in Planning, or to .gitignore when a tool makes them)")
                self.write(item, text.rstrip('\n') + f'\n\nNot verified at {clock()}: {reason}. The task stays open.\n')
                saved = self.commit(root, sorted(set(inside) | {task, 'ROADMAP.md'}), self.subject(item, ', not verified'), f'Not verified: {reason}.')
                return {'outcome': 'not verified', 'task': task, 'reason': reason, **saved}
            kind = task_kind(root, task)
            if planned and not publish and kind == 'code' and not implementation_paths(code):
                # An empty implementation is not documentation work. Keep existing task/roadmap
                # evidence and HEAD intact; end() persists the truthful unverified check-in.
                return {'outcome': 'not verified', 'task': task,
                        'reason': 'no implementation change for the approved code task; paperwork or tests alone do not complete it'}
            if planned and not publish and kind in ('docs', 'chore') and not [path for path in inside if not plan_path(path)]:
                # Task 260: a docs or chore task is done only when one of its files changed.
                return {'outcome': 'not verified', 'task': task,
                        'reason': f'no change to the files of this {kind} task; paperwork alone does not complete it'}
            if not code and not planned and item.get('made'):
                text = re.sub(r'^Kind:\s*\S+', 'Kind: docs', text, count=1, flags=re.MULTILINE); self.write(item, text)
            if code:
                answer = self.protocol.verification(root)
                reason = None
                if not (answer and answer[2]): reason = 'no test passed on the final code (Green)'
                else:
                    # Task 260: Red is always proved by the harness (a copy of the project without the change must fail
                    # the same test command); a failed run Pi showed earlier is never enough on its own.
                    proof = self.prove_red(item, code)
                    if proof is True: self.progress(item, f"Red (proved by the harness): without the change, `{item['test_command']}` fails")
                    else: reason = proof
                if reason:
                    # Committed too, marked (2026-10-15): every change can be undone the same way; the task stays open.
                    self.write(item, text.rstrip('\n') + f'\n\nNot verified at {clock()}: {reason}. The task stays open.\n')
                    saved = self.commit(root, sorted(set(inside) | {task, 'ROADMAP.md'}), self.subject(item, ', not verified'), f'Not verified: {reason}.')
                    return {'outcome': 'not verified', 'task': task, 'reason': reason, **saved}
            planned=self.plan_status_for_item(item)
            if planned:
                self.write(item,re.sub(r'- \[ \]', '- [x]', (root/task).read_text(encoding='utf-8')))
            self.progress(item, f'Done at {clock()}: verified and committed')
            text = (root / task).read_text(encoding='utf-8')
            roadmap = (root / 'ROADMAP.md').read_text(encoding='utf-8')
            if not re.search(r'- \[ \]', text):
                before_roadmap=roadmap
                roadmap = re.sub(rf'^(\s*)- \[ \](.*\(tasks/{re.escape(Path(task).name)}\))', r'\1- [x]\2', roadmap, count=1, flags=re.MULTILINE)
                (root / 'ROADMAP.md').write_text(roadmap, encoding='utf-8')
                if roadmap!=before_roadmap:record_decision(self.data,request,'box_ticked','code',1,rule='G-010')
            saved = self.commit(root, sorted(set(inside) | {task, 'ROADMAP.md'}), self.subject(item))
            result={'outcome': saved.pop('outcome', 'committed'), 'task': task, **saved}
            if result['outcome']=='committed':record_decision(self.data,request,'step_done','code','verified_and_committed',rule='G-013')
            if planned and result['outcome']=='committed':
                plan=self.plan_state(root);index=plan['tasks'].index(task);next_task=plan['tasks'][index+1] if index+1<len(plan['tasks']) else None
                result['check_in']={'root':str(root),'task':task,'verified':True,'verification':item.get('test_command','Documentation change'),'next':next_task,'title':self.subject(item).rsplit(' (task ',1)[0],'number':index+1,'total':len(plan['tasks']),'question':'Accept and Continue' if next_task else 'Accept Task'}
                plan.update(index=index,check_in=True,finished=False,verified=True,card=result['check_in']);self.plan_state(root,plan)
            return result

    def sample_cleanup(self, item):
        """Once, before the first code request is committed: name the sample left from the starter's first commit."""
        root = item['root']
        if not any(not plan_path(path) and not is_documentation(path) for path in self.changes(item)): return None
        def git(*args):
            result = subprocess.run(['git', '-C', str(root), *args], capture_output=True, text=True, timeout=10)
            return result.stdout if result.returncode == 0 else ''
        history = git('log', '--reverse', '--format=%H%x00%s').splitlines()
        if not history: return None
        baseline, subject = history[0].split('\0', 1)
        if subject != 'Start from the Pi Workbench starter': return None
        for revision in git('log', '--author=^Pi Workbench <', '--format=%H', baseline+'..HEAD').splitlines():
            paths = git('diff-tree', '--no-commit-id', '--name-only', '-r', revision).splitlines()
            if any(not plan_path(path) and not is_documentation(path) for path in paths): return None
        registry = json.loads((Path(__file__).resolve().parent.parent/'kit/starters.json').read_text(encoding='utf-8'))
        original = set(git('ls-tree', '-r', '--name-only', baseline).splitlines())
        spec = next((entry for entry in registry.values() if entry['identify'] in original), None)
        if not spec: return None
        remaining = []
        for name in spec['sample_files']:
            path = root/name
            if path.is_file() and not path.is_symlink() and path.resolve().is_relative_to(root) and path.read_text(encoding='utf-8',errors='replace') == git('show', baseline+':'+name): remaining.append(name+' (unchanged sample)')
        for pattern in spec['rename']:
            for path in sorted(root.glob(pattern)):
                if not path.is_file() or path.is_symlink() or not path.resolve().is_relative_to(root): continue
                text = path.read_text(encoding='utf-8',errors='replace'); name = path.relative_to(root).as_posix()
                if path.suffix == '.json' or path.name.endswith('.webmanifest'):
                    try: values = json.loads(text)
                    except ValueError: continue
                    if not isinstance(values,dict): continue
                    keys = [key for key,value in values.items() if key.startswith('notes.') or key in {'app.name','name','short_name'} and value == 'Notes']
                    if keys: remaining.append(name+' ('+', '.join(keys)+')')
                elif re.search(r'\bnotes?\b', text, re.I): remaining.append(name+' (notes sample text)')
        if not remaining: return None
        return ('This project started from the sample notes app. Replace or remove what the new app does not use: '+
                '; '.join(remaining)+'. Keep the skeleton ('+', '.join(spec['skeleton'])+
                '). Adapt domain-specific parts of storage as needed. Update sw.js’s file list, the manifest’s name and the README to the new app. Run the tests again after cleanup.')

    def subject(self, item, mark=''):
        text = (item['root'] / item['task']).read_text(encoding='utf-8')
        title = re.match(r'# \d+: (.*)', text)
        return f"{title.group(1) if title else Path(item['task']).stem} (task {Path(item['task']).name[:3]}{mark})"

    def commit(self, root, paths, message, body=''):
        """One commit for the request's files, by the harness: {'message', 'commit'} (the handle for Undo This Request),
        or {'outcome': 'commit failed', 'reason'}."""
        name, email = self.identity
        done = subprocess.run(['git', '-C', str(root), '-c', f'user.name={name}', '-c', f'user.email={email}', 'commit', '-q', '-m', message,
                               *(['-m', body] if body else []), '--', *paths], capture_output=True, text=True, timeout=60) if self.add(root, paths) else None
        if not done or done.returncode:
            return {'outcome': 'commit failed', 'reason': (done.stderr if done else 'git add failed').strip()[-500:]}
        head = subprocess.run(['git', '-C', str(root), 'rev-parse', '--short=12', 'HEAD'], capture_output=True, text=True, timeout=30).stdout.strip()
        self.protocol.clear(root)  # task 260: runs before this commit can never be Red or Green for later work
        return {'message': message, 'commit': head}

    def prove_red(self, item, code):
        """Task 260: in a temporary copy of the project (never the person's files), run the request's last passing test
        command: with the change it must pass; with the request's code changes set back to HEAD (tests stay) it must
        fail. True, or the reason it is not proved."""
        import os, tempfile
        root, command = item['root'], item.get('test_command')
        if not command: return 'no test passed on the final code (Green)'
        changes = implementation_paths(code)
        if not changes: return 'only tests changed: nothing to prove'
        if any(path in item['before'] for path in changes): return 'a changed file had other edits before the request, so Red cannot be proved'
        environment = {**os.environ, 'PYTHONDONTWRITEBYTECODE': '1'}
        with tempfile.TemporaryDirectory(prefix='pi-red-proof-') as temporary:
            copy = Path(temporary).resolve() / root.name
            problem = copy_project(root, copy)
            if problem: return problem
            run = lambda: subprocess.run(command, shell=True, cwd=copy, capture_output=True, timeout=600, env=environment).returncode == 0
            if not run(): return f'the tests fail with the change (`{command}`)'
            for path in changes:
                original = subprocess.run(['git', '-C', str(root), 'show', f'HEAD:./{path}'], capture_output=True)
                target = copy / path
                if original.returncode == 0: target.parent.mkdir(parents=True, exist_ok=True); target.unlink(missing_ok=True); target.write_bytes(original.stdout)
                else: target.unlink(missing_ok=True)
            if run(): return f'the tests pass without the change too (`{command}`): they do not test it'
        return True

    def reopen(self, root, task):
        """Task 260, person only (never a Pi tool): reopen a task the harness marked done without real evidence. Its boxes
        and roadmap line open again, the approved plan points at it, and a harness commit records it (Undo works)."""
        root = Path(root).resolve()
        if self.project_root(root) != root: raise ValueError('Choose a registered project or a folder with ROADMAP.md and tasks/.')
        if not isinstance(task, str) or not re.fullmatch(r'tasks/[^/]+\.md', task): raise ValueError('Choose a task file under tasks/.')
        path = root / task
        if path.is_symlink() or not path.resolve().is_relative_to(root) or not path.is_file(): raise ValueError('This task does not exist in the project.')
        with self.lock:
            if any(item['root'] == root for item in self.requests.values()): raise ValueError('Pi is working in this project. Reopen the task when it is done.')
            text = path.read_text(encoding='utf-8')
            head, progress, rest = text.partition(PROGRESS)
            text = re.sub(r'^(\s*)- \[x\]', r'\1- [ ]', head, flags=re.M | re.I) + progress + rest
            path.write_text(text, encoding='utf-8')
            item = {'root': root, 'task': task, 'text': 'Reopen', 'before': {}}
            self.progress(item, f'Reopened at {clock()} by the person: the earlier completion is not accepted; the task is open again')
            roadmap = root / 'ROADMAP.md'
            roadmap.write_text(re.sub(rf'^(\s*)- \[[xX]\](.*\(tasks/{re.escape(Path(task).name)}\))', r'\1- [ ]\2', roadmap.read_text(encoding='utf-8'), flags=re.M), encoding='utf-8')
            plan = self.plan_state(root)
            tasks = plan.get('tasks', []) if not plan.get('finished') else []
            if task not in tasks: tasks = [task] + [path for path in tasks if path != task]
            if not re.search(r'^Plan approved: (?:chosen|auto) ', path.read_text(encoding='utf-8'), re.M):
                plan.update(tasks=tasks, pending=True, approved=False, index=0, check_in=False, finished=False, digest=self.plan_digest(root, tasks))
            else:
                plan.update(tasks=tasks, index=tasks.index(task), approved=True, pending=False, check_in=False, finished=False, digest=self.plan_digest(root, tasks))
            plan.pop('card', None); self.plan_state(root, plan)
            record_decision(self.data, None, 'task_reopen', 'person', 'reopen', rule='G-015')
            saved = self.commit(root, [task, 'ROADMAP.md'], self.subject(item, ', reopened'), 'Reopened by the person: the earlier completion was not verified.')
            return {'task': task, 'index': plan['index'], 'approved': plan['approved'], **saved}

    # -- the files ------------------------------------------------------------------------------------------------
    def task_for(self, item):
        """(task path, made) for the request: a task it names that exists, else a new one with its roadmap line."""
        from harness.context import mentioned  # the same reading of "task 2" as the context Pi gets
        root = item['root']
        names = sorted(path.relative_to(root).as_posix() for path in (root / 'tasks').glob('*.md'))
        named = [name for name in mentioned(item['text'], names) if name.startswith('tasks/')]
        if named:
            text = (root / named[0]).read_text(encoding='utf-8')
            if PROGRESS not in text: (root / named[0]).write_text(text.rstrip('\n') + f'\n\n{PROGRESS}\n', encoding='utf-8')
            return named[0], False
        number = max([int(match.group(1)) for name in names if (match := re.match(r'tasks/(\d+)-', name))] or [0]) + 1
        title = short_title(item['text'])
        words = re.findall(r'[a-z0-9]+', title.lower())[:5] or ['request']
        path = f'tasks/{number:03d}-{"-".join(words)}.md'
        quoted = item['text']
        (root / path).write_text(f'# {number:03d}: {title}\n\nKind: code\n\nRequest {datetime.now():%Y-%m-%d}: “{quoted}”\n\nDone when: {title}.\n\n{PROGRESS}\n', encoding='utf-8')
        roadmap = root / 'ROADMAP.md'
        roadmap.write_text(roadmap.read_text(encoding='utf-8').rstrip('\n') + f'\n- [ ] [{number:03d}-{title}]({path})\n', encoding='utf-8')
        return path, True

    def progress(self, item, line):
        path = item['root'] / item['task']
        text = path.read_text(encoding='utf-8')
        if PROGRESS not in text: text = text.rstrip('\n') + f'\n\n{PROGRESS}\n'
        self.write(item,text.rstrip('\n') + f'\n- [x] {line}\n')

    def write(self, item, text):
        path=item['root']/item['task'];before=path.read_text(encoding='utf-8') if path.exists() else ''
        path.write_text(text,encoding='utf-8')
        ticks=len(re.findall(r'^\s*- \[x\]',text,re.M))-len(re.findall(r'^\s*- \[x\]',before,re.M))
        if ticks>0:record_decision(self.data,next((key for key,value in self.requests.items() if value is item),None),'box_ticked','code',ticks,rule='G-010')

    @staticmethod
    def add(root, paths):
        return subprocess.run(['git', '-C', str(root), 'add', '-A', '--', *paths], capture_output=True, timeout=60).returncode == 0
