"""Small single-user Markdown workspace: one person (and Pi in comment threads), no accounts, collaboration or sync."""
from harness.markdown_records import read_record,write_record
import hashlib
import json
import re
import os
import shutil
import subprocess
import sys
import threading
import uuid
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'kit'))
import new_project as starter  # noqa: E402  (kit/new_project.py: the starters)
from datetime import datetime

class DocumentConflict(ValueError):pass

def to_trash(path):
    """Move to Trash for a whole project (task 154): the Mac Trash through the Finder, so Put Back works; elsewhere the
    freedesktop Trash. Tests replace this function."""
    path=Path(path)
    if os.environ.get('PI_TRASH_DIR'):  # tests: a folder of their own, never the person's Trash
        trash=Path(os.environ['PI_TRASH_DIR']);trash.mkdir(parents=True,exist_ok=True);shutil.move(str(path),str(trash/path.name));return
    if sys.platform=='darwin':
        script='on run argv\ntell application "Finder" to delete (POSIX file (item 1 of argv) as alias)\nend run'
        result=subprocess.run(['osascript','-e',script,str(path)],capture_output=True,text=True,timeout=60)
        if result.returncode:raise ValueError('The Finder could not move the folder to the Trash: '+(result.stderr.strip() or 'unknown error'))
        return
    trash=Path(os.environ.get('XDG_DATA_HOME',Path.home()/'.local'/'share'))/'Trash'/'files';trash.mkdir(parents=True,exist_ok=True)
    target=trash/path.name
    while target.exists():target=trash/(path.name+'-'+uuid.uuid4().hex[:6])
    shutil.move(str(path),str(target))

def slug(text):
    value=re.sub(r'[^\w -]','',str(text)).strip()[:80]
    if not value or value in {'.','..'}:raise ValueError('Give the project or page a name')
    return value

class DocumentStore:
    def __init__(self, root):
        self.root=Path(root).resolve();self.root.mkdir(parents=True,exist_ok=True)
        self.projects=self.root/'projects';self.projects.mkdir(exist_ok=True)
        self.lock=threading.RLock()
        self.before_project_move=lambda root:None
        self.after_project_move=lambda old,new:None  # task 262: Gate's history keyed by folder follows the project
        self.registry_file=self.root/'.projects.json'
        self.registry=json.loads(self.registry_file.read_text()) if self.registry_file.exists() else {}
        self.discover(legacy=True)
    def discover(self, legacy=False):
        """Task 262: every project has a registry entry, so its id is stable and never another project's. A folder that
        appears in <data>/projects gets a uuid. legacy (at start): folders from before ids were registered keep their
        folder name as id (their chat, comments and Activity hang off it) unless another project already holds it."""
        with self.lock:
            known={Path(value['path']).resolve() for value in self.registry.values()};changed=False
            for path in sorted(self.projects.iterdir()):
                if not path.is_dir() or path.is_symlink() or path.name.startswith('.') or path.resolve() in known:continue
                # From the folder's path, so another process reading the data folder (the console) finds the same id.
                key=path.name if legacy and path.name not in self.registry else uuid.uuid5(uuid.NAMESPACE_URL,'pi-workbench:'+str(path.resolve())).hex
                if key in self.registry:key=uuid.uuid4().hex
                self.registry[key]={'name':path.name,'path':str(path.resolve())};changed=True
            if changed:self.save_registry()
    def path(self, relative):
        path=Path(relative)
        if path.is_absolute() or path.suffix.lower()!='.md' or '..' in path.parts:raise ValueError('Invalid Markdown page path')
        if len(path.parts)<3 or path.parts[0]!='projects':raise ValueError('Invalid project page')
        project=self.project_path(path.parts[1]);resolved=(project/Path(*path.parts[2:])).resolve()
        if not resolved.is_relative_to(project):raise ValueError('Page is outside the project folder')
        return resolved
    def sidecar(self, relative):
        directory=self.root/'.comments';directory.mkdir(exist_ok=True)
        if not directory.resolve().is_relative_to(self.root):raise ValueError('Comments directory is outside the workspace')
        path=directory/(hashlib.sha256(relative.encode()).hexdigest()+'.md')
        if not path.resolve().is_relative_to(directory.resolve()):raise ValueError('Comment record is outside the workspace')
        return path
    @staticmethod
    def thread(entry):
        """A comment's follow-ups as one conversation: replies carry an author (you or pi) and stay in order.
        Older records kept Pi's answer apart in agent_reply; it is placed after the replies written before the request was sent."""
        replies=[{**item,'author':item.get('author','you')} for item in entry.get('replies',[])]
        if entry.get('agent_reply') and not any(item['author']=='pi' for item in replies):
            sent=entry.get('sent_at','');at=next((index for index,item in enumerate(replies) if sent and item.get('created','')>sent),len(replies))
            replies.insert(at,{'author':'pi','text':entry['agent_reply'],'created':''})
        return {**entry,'replies':replies}
    def comments(self, relative, raw=False):
        path=self.sidecar(relative)
        if path.exists():
            values=read_record(path)['comments'];return values if raw else [self.thread(entry) for entry in values]
        legacy=path.with_suffix('.json')
        if legacy.exists():
            if not legacy.resolve().is_relative_to(path.parent.resolve()):raise ValueError('Comment record is outside the workspace')
            values=json.loads(legacy.read_text());self.write_comments(relative,values);legacy.rename(legacy.with_name(legacy.name+'.before-markdown'))
            return values if raw else [self.thread(entry) for entry in values]  # the first read is normalised like every later one
        return []
    def get(self, relative):
        with self.lock:
            path=self.path(relative);text=path.read_text(encoding='utf-8')
            title=next((line[2:].strip() for line in text.splitlines() if line.startswith('# ')),path.stem)
            parts=Path(relative).parts
            return {'path':relative,'title':title,'project':parts[1],'markdown':text,
                    'revision':hashlib.sha256(text.encode()).hexdigest(),'comments':self.comments(relative)}
    def list(self):
        values=[]
        for project in self.list_projects():
            for file in self.files(project['id']):
                if file['path'].endswith('.md'):
                    try:page=self.get(file['path']);values.append({k:page[k] for k in ('path','title','project','revision')})
                    except (ValueError,OSError):continue
        return values
    def create(self, project, title, parent=None):
        with self.lock:
            self.discover()
            if project in self.registry and not self.registry[project].get('removed'):directory=self.project_path(project)
            else:  # a page in a project that does not exist yet: a new folder in the data folder, with its own id (task 262)
                directory=self.projects/slug(project)
                if directory.exists():raise ValueError(f'A folder named “{directory.name}” already exists; open its project instead.')
                directory.mkdir(parents=True);project=self.register(str(directory),directory.name,fresh=True)
            if parent:
                parent_path=self.path(parent)
                directory=parent_path.parent/parent_path.stem
            project_root=self.project_path(project)
            relative='projects/'+project+'/'+str((directory/(slug(title)+'.md')).relative_to(project_root))
            path=self.path(relative);path.parent.mkdir(parents=True,exist_ok=True)
            with path.open('x',encoding='utf-8') as handle:handle.write('# '+str(title).strip()+'\n\n')
            return self.get(relative)
    def create_file(self, project, name):
        """New File…: any name inside the project, Markdown when it has no extension, never overwriting."""
        name=str(name).strip().rstrip('/')
        parts=Path(name).parts
        if not name or Path(name).is_absolute() or any(part in {'.','..','.git'} for part in parts):raise ValueError('Give the file a name inside the project folder')
        if not Path(name).suffix:name+='.md'
        root=self.project_path(project);file=(root/name).resolve()
        if not file.is_relative_to(root):raise ValueError('Give the file a name inside the project folder')
        with self.lock:
            file.parent.mkdir(parents=True,exist_ok=True)
            try:
                with file.open('x',encoding='utf-8') as handle:handle.write('# '+file.stem+'\n\n' if file.suffix.lower()=='.md' else '')
            except FileExistsError as error:raise ValueError(f'“{name}” already exists') from error
            created='projects/'+project+'/'+str(file.relative_to(root));self.sidecar(created).unlink(missing_ok=True)  # a new file starts without threads
        return {'path':created}
    def create_task(self, project, title):
        """New Task…: tasks/NNN-slug.md with the next number, the task template, and a line in ROADMAP.md."""
        title=str(title).strip()
        stem=re.sub(r'[^\w]+','-',title.lower()).strip('-')[:60]
        if not stem:raise ValueError('Give the task a name')
        root=self.project_path(project);tasks=root/'tasks'
        with self.lock:
            tasks.mkdir(exist_ok=True)
            numbers=[int(match.group(1)) for item in tasks.iterdir() if (match:=re.match(r'(\d+)-',item.name))]
            number=f'{max(numbers,default=0)+1:03d}';name=f'{number}-{stem}.md'
            with (tasks/name).open('x',encoding='utf-8') as handle:handle.write(f'# {title}\n\nKind: code\n\n- [ ] Define the outcome\n- [ ] Implement\n- [ ] Verify\n')
            roadmap=root/'ROADMAP.md'
            if roadmap.is_file():
                text=roadmap.read_text(encoding='utf-8')
                roadmap.write_text(text+('' if text.endswith('\n') or not text else '\n')+f'- [ ] [{number}-{title}](tasks/{name})\n',encoding='utf-8')
            starter.ensure_task(root,reset=True)
        return {'path':f'projects/{project}/tasks/{name}'}
    def save(self, relative, markdown, revision):
        if not isinstance(markdown,str) or len(markdown)>150000:raise ValueError('Page must be at most 150,000 characters')
        with self.lock:
            current=self.get(relative)
            if current['revision']!=revision:raise DocumentConflict('This page changed on disk. Reload or copy your draft before merging; your edit was not written.')
            path=self.path(relative);temporary=path.with_name('.'+path.name+'.'+uuid.uuid4().hex+'.tmp')
            temporary.write_text(markdown,encoding='utf-8');temporary.replace(path)
            return self.get(relative)
    def project_file(self, relative, folders=False):
        """Any existing file inside its project folder (not only Markdown), or a folder when asked: rename, move and trash work on all of them."""
        path=Path(relative)
        if path.is_absolute() or '..' in path.parts or len(path.parts)<3 or path.parts[0]!='projects' or '.git' in path.parts:raise ValueError('Invalid project file')
        project=self.project_path(path.parts[1]);file=(project/Path(*path.parts[2:])).resolve()
        if not file.is_relative_to(project) or file==project or not (file.is_file() or folders and file.is_dir()):raise ValueError('File not found')
        return project,file
    def move(self, relative, name):
        """Rename or Move…: a file or folder gets a new name or path inside the same project; a file keeps its extension when none is given; never overwriting. Comments follow their files."""
        project,file=self.project_file(relative,folders=True);name=str(name).strip().rstrip('/');base='projects/'+Path(relative).parts[1]+'/'
        if not name or Path(name).is_absolute() or any(part in {'.','..','.git'} for part in Path(name).parts):raise ValueError('Give it a name inside the project folder')
        if file.is_file() and not Path(name).suffix:name+=file.suffix
        target=(project/name).resolve()
        if not target.is_relative_to(project) or target==project:raise ValueError('Give it a name inside the project folder')
        if file.is_dir() and target.is_relative_to(file):raise ValueError('A folder cannot move inside itself')
        moved=base+str(target.relative_to(project))
        with self.lock:
            if target.exists():raise ValueError(f'“{name}” already exists')
            inside=[item for item in ([file] if file.is_file() else file.rglob('*')) if item.is_file()]
            notes={base+str(item.relative_to(project)):self.comments(base+str(item.relative_to(project))) for item in inside}
            target.parent.mkdir(parents=True,exist_ok=True);file.rename(target)
            for old,comments in notes.items():
                new=moved+old[len(base+str(file.relative_to(project))):]
                self.sidecar(new).unlink(missing_ok=True)  # a thread left at the new path by an older file must not attach to this one
                if comments:self.write_comments(new,comments)
                self.sidecar(old).unlink(missing_ok=True)
        return {'path':moved}
    def delete(self, relative):
        """Move to Trash: the file or folder goes to <data>/.trash/<id>-<name>, its comment threads beside it in
        <id>-<name>.comments/, so they never come back on a new file with the same name. Works across drives."""
        with self.lock:
            project,file=self.project_file(relative,folders=True);trash=self.root/'.trash';trash.mkdir(exist_ok=True)
            if not trash.resolve().is_relative_to(self.root):raise ValueError('Trash directory is outside the workspace')
            base='projects/'+Path(relative).parts[1]+'/';entry=trash/(uuid.uuid4().hex+'-'+file.name)
            sidecars=[self.sidecar(base+str(item.relative_to(project))) for item in ([file] if file.is_file() else file.rglob('*')) if item.is_file()]
            shutil.move(str(file),str(entry))
            kept=[sidecar for sidecar in sidecars if sidecar.exists()]
            if kept:
                folder=entry.with_name(entry.name+'.comments');folder.mkdir()
                for sidecar in kept:shutil.move(str(sidecar),str(folder/sidecar.name))
    def write_comments(self, relative, comments):
        path=self.sidecar(relative)
        body='# Comments on '+relative+'\n'
        for entry in comments:
            body+='\n## Thread '+entry['id']+'\n\n'+('Deleted' if entry.get('deleted') else 'Resolved' if entry['resolved'] else 'Open')+' · '+entry['created']+'\n\n> '+entry['anchor'].replace('\n','\n> ')+'\n\n'+entry['text']+'\n'
            for reply in self.thread(entry)['replies']:body+='\n### '+('Pi' if reply['author']=='pi' else 'Reply')+'\n\n'+reply['text']+'\n'
            suggestion=entry.get('suggestion')
            if isinstance(suggestion,dict):body+='\n### Suggested change'+(' (applied)' if suggestion.get('applied') else ' (kept the original)' if suggestion.get('kept') else '')+'\n\n'+str(suggestion.get('replacement',''))+'\n'
        write_record(path,{'document':relative,'comments':comments},body)
    def comment(self, relative, text, anchor=''):
        if not isinstance(text,str) or not text.strip() or len(text)>10000:raise ValueError('Write a comment of at most 10,000 characters')
        with self.lock:
            page=self.get(relative);anchor=str(anchor).strip()
            if len(anchor)>2000:raise ValueError('Select an anchor of at most 2,000 characters')
            if not anchor or anchor not in page['markdown']:raise ValueError('Select an anchor from the current document before adding a text comment')
            if page['markdown'].count(anchor)>1:raise ValueError('This anchor appears more than once. Select a longer, unique passage.')
            comments=self.comments(relative)
            entry={'id':uuid.uuid4().hex,'text':text.strip(),'anchor':str(anchor)[:2000],'created':datetime.now().astimezone().isoformat(timespec='seconds'),'resolved':False,'agent_reply':'','replies':[]}
            comments.append(entry);self.write_comments(relative,comments);return entry
    def resolve(self, relative, identifier, resolved):
        with self.lock:
            self.get(relative);comments=self.comments(relative)
            entry=next((item for item in comments if item['id']==identifier),None)
            if not entry:raise ValueError('Comment not found')
            entry['resolved']=bool(resolved);self.write_comments(relative,comments);return entry
    def delete_comment(self, relative, identifier, deleted):
        with self.lock:
            self.get(relative);comments=self.comments(relative)
            entry=next((item for item in comments if item['id']==identifier),None)
            if not entry:raise ValueError('Comment not found')
            if deleted and entry.get('chat_id'):raise ValueError('This comment was sent to Pi and cannot be deleted. Resolve it instead.')
            entry['deleted']=datetime.now().astimezone().isoformat(timespec='seconds') if deleted else None
            self.write_comments(relative,comments);return entry
    def reply(self, relative, identifier, text):
        if not isinstance(text,str) or not text.strip() or len(text)>10000:raise ValueError('Write a reply of at most 10,000 characters')
        with self.lock:
            self.get(relative);comments=self.comments(relative)
            entry=next((item for item in comments if item['id']==identifier),None)
            if not entry:raise ValueError('Comment not found')
            entry.setdefault('replies',[]).append({'author':'you','text':text.strip(),'created':datetime.now().astimezone().isoformat(timespec='seconds')})
            self.write_comments(relative,comments);return entry
    def pending_suggestion(self, entry):
        suggestion=entry.get('suggestion')
        if not isinstance(suggestion,dict) or not isinstance(suggestion.get('anchor'),str) or not suggestion['anchor'] or not isinstance(suggestion.get('replacement'),str):raise ValueError('This comment has no suggested change')
        if suggestion.get('applied') or suggestion.get('kept'):raise ValueError('This suggested change was already applied or kept')
        return suggestion
    def apply_suggestion(self, relative, identifier, revision):
        """Replace the suggestion's anchor with its replacement (revision-checked like save), then resolve the comment."""
        with self.lock:
            page=self.get(relative)
            if page['revision']!=revision:raise DocumentConflict('This page changed on disk. Reload before applying the change.')
            comments=self.comments(relative);entry=next((item for item in comments if item['id']==identifier),None)
            if not entry:raise ValueError('Comment not found')
            suggestion=self.pending_suggestion(entry)
            if page['markdown'].count(suggestion['anchor'])!=1:raise ValueError('The suggested passage is no longer in the page exactly once. Edit the page by hand.')
            self.save(relative,page['markdown'].replace(suggestion['anchor'],suggestion['replacement'],1),revision)
            suggestion['applied']=datetime.now().astimezone().isoformat(timespec='seconds');entry['resolved']=True
            self.write_comments(relative,comments);return self.get(relative)
    def keep_suggestion(self, relative, identifier):
        with self.lock:
            self.get(relative);comments=self.comments(relative);entry=next((item for item in comments if item['id']==identifier),None)
            if not entry:raise ValueError('Comment not found')
            self.pending_suggestion(entry)['kept']=datetime.now().astimezone().isoformat(timespec='seconds')
            self.write_comments(relative,comments);return entry
    def agent_result(self, relative, identifier, text, previous='', also_read=()):
        """Append Pi's answer to the thread (InlineThread: follow-up answers are appended, earlier ones stay).
        The answer is the one Pi wrote itself into agent_reply during this run, otherwise its final message."""
        with self.lock:
            comments=self.comments(relative,raw=True)
            entry=next((item for item in comments if item['id']==identifier),None)
            if not entry:raise ValueError('The commented page was moved or deleted while Pi worked; the answer is kept in Activity.')
            written=entry.get('agent_reply','');answer=written if written not in ('',previous) else str(text)[:50000]
            replies=self.thread({**entry,'agent_reply':previous})['replies']
            replies.append({'author':'pi','text':answer,'created':datetime.now().astimezone().isoformat(timespec='seconds'),**({'also_read':list(also_read)} if also_read else {})})
            entry.update(replies=replies,agent_reply=answer);self.write_comments(relative,comments)
    def mark_sent(self, relative, identifier, chat):
        with self.lock:
            comments=self.comments(relative)
            entry=next((item for item in comments if item['id']==identifier),None)
            if not entry:raise ValueError('The comment is gone: its page was moved or deleted after it was sent.')
            entry['chat_id']=chat;entry['sent_at']=datetime.now().astimezone().isoformat(timespec='seconds');self.write_comments(relative,comments)
    def comment_prompt(self, relative, identifier):
        page=self.get(relative);entry=next((item for item in page['comments'] if item['id']==identifier),None)
        if not entry:raise ValueError('Comment not found')
        if entry['resolved']:raise ValueError('This comment is already resolved')
        if entry.get('deleted'):raise ValueError('This comment is deleted. Restore it first.')
        return (f"Act on this project-page comment. Read the current page before editing; the page and the project context are in your context.\n"
                f"Page file: {self.path(relative)}\nComment ID: {identifier}\nSelected text: {entry['anchor']}\n"
                f"The thread so far, oldest first:\n"+'\n'.join(('Pi' if item['author']=='pi' else 'Person')+': '+item['text'] for item in [{'author':'you','text':entry['text']},*entry['replies']])+"\n"
                f"Answer the latest message from the person. The page text is in your context.\n\n"
                f"Make the requested changes and verify them. Record your result in the agent_reply field of this comment in the comments frontmatter array of {self.sidecar(relative)}. "
                "Preserve other comments and fields. Do not mark completed without evidence. Explain any blocker in your reply. "
                f"If the request only rewrites the selected text, do not edit the page: add a suggestion field to this comment, "
                f"{{\"anchor\": <the selected text exactly>, \"replacement\": <the new text>}}, and say so in agent_reply. The person applies it with Apply Change.")
    def project_path(self, project):
        if not isinstance(project,str) or Path(project).name!=project or project in {'.','..'}:raise ValueError('Invalid project')
        if project not in self.registry:self.discover()
        if project not in self.registry or self.registry[project].get('removed'):raise ValueError('Project not found')
        path=Path(self.registry[project]['path']).resolve()
        if not path.is_dir():raise ValueError('Project not found')
        return path
    def list_projects(self):
        with self.lock:
            # A registered folder that is gone (unplugged drive, renamed) is listed as missing instead of failing the whole workspace.
            # Removed entries stay in the registry (Remove from List, Move to Trash) so adding the folder again brings its id back.
            self.discover()
            return [{'id':key,'name':value['name'],'path':value['path'],**({} if Path(value['path']).is_dir() else {'missing':True})} for key,value in self.registry.items() if not value.get('removed')]
    def project_identity(self, root):
        root=Path(root).expanduser().resolve()
        return next((item['id'] for item in self.list_projects() if Path(item['path']).resolve()==root),None)
    def containing_project(self, path):
        """Resolve registered project boundaries even when its plan is absent or broken."""
        path=Path(path).expanduser().resolve()
        matches=[Path(item['path']).resolve() for item in self.list_projects() if path.is_relative_to(Path(item['path']).resolve())]
        return max(matches,key=lambda value:len(value.parts)) if matches else None
    def register(self, directory, name=None, fresh=False):
        """Add Existing Folder…: the folder's project id (a uuid). fresh (New Project…): a new folder, never a removed
        project brought back, even at the same path."""
        supplied=Path(directory).expanduser()
        if not supplied.is_absolute():raise ValueError('Choose an absolute folder path')
        path=supplied.resolve()
        if not path.is_dir():raise ValueError('Choose an existing folder')
        with self.lock:
            for project in self.list_projects():
                if Path(project['path']).resolve()==path:return project['id']
            for key,value in ([] if fresh else self.registry.items()):
                if value.get('removed') and Path(value['path']).resolve()==path:
                    # Added again after Remove from List or Put Back: the same id, so its chat and comments come back.
                    value.pop('removed');value['name']=slug(name or path.name);self.save_registry();return key
            identifier=uuid.uuid4().hex
            self.registry[identifier]={'name':slug(name or path.name),'path':str(path)}
            self.save_registry()
            return identifier
    def save_registry(self):
        temporary=self.registry_file.with_suffix('.tmp');temporary.write_text(json.dumps(self.registry,ensure_ascii=False,indent=2));temporary.replace(self.registry_file)
    def entry(self, project):
        """The registry entry of a project (every project has one, task 262)."""
        if project not in self.registry:self.project_path(project)  # discovers a new folder, or refuses
        if self.registry[project].get('removed'):raise ValueError('Project not found')
        return self.registry[project]
    def present(self, project):
        """A project whose folder is there; Rename, Move and Move to Trash need it."""
        entry=self.entry(project);path=Path(entry['path'])
        if not path.is_dir():raise ValueError('The project folder is missing. Locate it first.')
        return entry,path.resolve()
    def forget(self, project):
        """Remove from List: the project leaves the list; the folder itself is never touched. Adding the folder again
        (Add Existing Folder…) brings back the same project with its chat and comments."""
        with self.lock:
            entry=self.entry(project);entry['removed']=True;self.save_registry()
        return {'project':project,'path':entry['path']}
    def rename_project(self, project, name):
        """Rename Project…: the folder is renamed in place; the app shows the folder's name. The id, and so the address,
        chat, comments and Activity, stay."""
        with self.lock:
            entry,path=self.present(project);name=slug(name);target=path.parent/name
            if target==path:return {'project':project,'name':name,'path':str(path),'previous':name}
            if target.exists() and target.resolve()!=path:raise ValueError(f'A folder named “{name}” already exists in {path.parent}.')
            self.before_project_move(path)
            previous=path.name;path.rename(target)
            entry.update(name=name,path=str(target));self.save_registry();self.after_project_move(path,target)
            return {'project':project,'name':name,'path':str(target),'previous':previous}
    def move_project(self, project, parent):
        """Move Project…: the folder moves into another folder, across drives too. The id stays."""
        supplied=Path(str(parent)).expanduser()
        if not supplied.is_absolute():raise ValueError('Choose an absolute folder path')
        parent=supplied.resolve()
        if not parent.is_dir():raise ValueError('Choose an existing folder')
        with self.lock:
            entry,path=self.present(project)
            if parent==path or parent.is_relative_to(path):raise ValueError('A project cannot move inside itself')
            target=parent/path.name
            if target.exists():raise ValueError(f'{parent} already has a folder named “{path.name}”.')
            self.before_project_move(path)
            previous=str(path.parent);shutil.move(str(path),str(target))
            entry['path']=str(target);self.save_registry();self.after_project_move(path,target)
            return {'project':project,'name':entry['name'],'path':str(target),'previous':previous}
    def locate_project(self, project, directory):
        """Locate Folder…: a project whose folder went missing points at where it is now. Nothing on disk changes."""
        supplied=Path(str(directory)).expanduser()
        if not supplied.is_absolute():raise ValueError('Choose an absolute folder path')
        path=supplied.resolve()
        if not path.is_dir():raise ValueError('Choose an existing folder')
        with self.lock:
            entry=self.entry(project)
            if Path(entry['path']).is_dir():raise ValueError('The project folder is not missing. Use Move Project… instead.')
            if any(key!=project and not value.get('removed') and Path(value['path']).resolve()==path for key,value in self.registry.items()):raise ValueError('That folder is already a project.')
            self.before_project_move(Path(entry['path']));old=Path(entry['path'])
            entry.update(name=slug(path.name),path=str(path));self.save_registry();self.after_project_move(old,path)
            return {'project':project,'name':entry['name'],'path':str(path)}
    def project_summary(self, project):
        """What Move to Trash will move: counts of files and folders (the alert names them), the path and its parent."""
        path=self.project_path(project);files=folders=0
        for _,dirs,names in os.walk(path):
            dirs[:]=[name for name in dirs if name not in ('.git','.venv','node_modules','__pycache__')]  # the person's files, not tools' (they go to the Trash too)
            folders+=len(dirs);files+=len(names)
            if files+folders>100000:break
        return {'project':project,'path':str(path),'parent':str(path.parent),'files':files,'folders':folders}
    def trash_project(self, project):
        """Move Project to Trash…: the whole folder goes to the Trash on the Mac (Put Back works). The project leaves the
        list; its chat and comments are kept, so adding the folder again after Put Back brings everything back."""
        with self.lock:
            entry,path=self.present(project)
            if path==self.root or self.root.is_relative_to(path):raise ValueError('This folder holds the workbench data and cannot be trashed')
            to_trash(path)
            entry['removed']=True;self.save_registry()
            return {'project':project,'path':str(path)}
    def create_project(self, name, parent=None, kind='empty'):
        """kind (round 7, P_NewProject): 'web' and 'static' are the kit's starters (kit/new_project.py); 'empty' is a
        folder with a roadmap. Each starts with a repository: the harness commits each verified request."""
        if kind not in ('web','static','tui','empty'):raise ValueError('Choose Web app, App with no server, Terminal app or Empty folder')
        name=slug(name)
        base=Path(parent).expanduser().resolve() if parent else self.projects
        if parent and not Path(parent).expanduser().is_absolute():raise ValueError('Choose an absolute parent folder')
        if not base.is_dir():raise ValueError('Parent folder not found')
        path=base/name
        with self.lock:
            if path.exists():raise ValueError('Project already exists; add its existing folder instead')
            plan=starter.initial_plan(name)
            if kind=='empty':
                path.mkdir();(path/'tasks').mkdir()
                for relative,text in plan.items():(path/relative).write_text(text,encoding='utf-8')
                starter.start_history(path,'Start the project')
            else:starter.new_project(path,static=kind=='static',tui=kind=='tui',files=plan)
            return self.register(str(path),name,fresh=True)  # task 262: its own uuid, never the folder name
    def directories(self, directory=None):
        path=Path(directory or Path.home()).expanduser().resolve()
        if not path.is_dir():raise ValueError('Folder not found')
        entries=[]
        for child in sorted(path.iterdir(),key=lambda item:item.name.lower()):
            if child.is_dir() and not child.name.startswith('.'):
                entries.append({'name':child.name,'path':str(child.resolve())})
        return {'path':str(path),'parent':str(path.parent),'directories':entries}
    def create_directory(self, parent, name):
        """New Folder… in the folder browser (Ph8_ChooseFolder): one new folder in `parent`, never an existing one."""
        base=Path(parent).expanduser().resolve();name=str(name or '').strip()
        if not base.is_dir():raise ValueError('Folder not found')
        if not name or name in {'.','..'} or '/' in name or '\\' in name or name.startswith('.'):raise ValueError('Choose a folder name without “/” that does not start with a dot.')
        path=base/name
        if path.exists():raise ValueError(f'“{name}” already exists here.')
        path.mkdir();return {'path':str(path)}
    def files(self, project):
        return self.inventory(self.project_path(project),project)
    @staticmethod
    def inventory(path, project=''):
        path=Path(path);result=[]
        ignored={'.git','node_modules','.venv','__pycache__'}
        import os
        for directory,dirs,files in os.walk(path,followlinks=False):
            dirs[:]=sorted(d for d in dirs if d not in ignored and not (Path(directory)/d).is_symlink())
            for name in sorted(files):
                file=Path(directory)/name
                if file.is_symlink():continue
                entry={'path':'projects/'+project+'/'+str(file.relative_to(path)),'name':str(file.relative_to(path)),'size':file.stat().st_size}
                if entry['name']=='ROADMAP.md' or entry['name'].startswith('tasks/') and name.endswith('.md'):entry.update(DocumentStore.progress(file))
                result.append(entry)
                if len(result)>=2000:return result
        return result
    @staticmethod
    def progress(file):
        """Plan group meta: checkbox progress (done/total over - [ ], - [x], - [~]) and a - [~] Blocked: line."""
        try:text=file.read_text(encoding='utf-8',errors='ignore') if file.stat().st_size<=512000 else ''
        except OSError:text=''
        boxes=re.findall(r'^\s*[-*+] \[([ xX~])\]',text,re.M)
        return {'done':sum(box in 'xX' for box in boxes),'total':len(boxes),'blocked':bool(re.search(r'^\s*[-*+] \[~\] Blocked:',text,re.M))}
    def create_roadmap(self, project):
        """Create Roadmap (empty Plan): ROADMAP.md and tasks/001-first-task.md, nothing else."""
        root=self.project_path(project)
        with self.lock:
            if (root/'ROADMAP.md').exists():raise ValueError('This folder already has a ROADMAP.md')
            name=self.registry.get(project,{}).get('name',root.name)
            (root/'ROADMAP.md').write_text(f'# {name} roadmap\n\n## Goal\n\nDescribe what we are building.\n\n## Tasks\n\n- [ ] [001-Plan this app](tasks/001-first-task.md)\n',encoding='utf-8')
            (root/'tasks').mkdir(exist_ok=True)
            first=root/'tasks'/'001-first-task.md'
            if not first.exists():first.write_text('# 001: Plan this app\n\nKind: planning\n\n- [ ] Discuss who uses it, screens, rules, data and language\n- [ ] Write the Goal and real tasks, each with Done when\n- [ ] Ask for plan approval before code\n\nDone when: The person has approved the app plan.\n',encoding='utf-8')
            starter.ensure_task(root)
        return {'path':f'projects/{project}/ROADMAP.md'}
    def read_file(self, relative):
        path=Path(relative)
        if path.is_absolute() or '..' in path.parts or len(path.parts)<3 or path.parts[0]!='projects':raise ValueError('Invalid project file')
        project=self.project_path(path.parts[1]);file=(project/Path(*path.parts[2:])).resolve()
        if not file.is_relative_to(project) or not file.is_file():raise ValueError('File not found')
        if file.stat().st_size>512000:raise ValueError('This file is too large for the text viewer')
        try:text=file.read_text(encoding='utf-8')
        except UnicodeDecodeError as error:raise ValueError('This is a binary file, not a text/code file') from error
        if '\x00' in text:raise ValueError('Binary file')
        return {'path':relative,'text':text,'revision':hashlib.sha256(text.encode()).hexdigest()}
    def save_file(self, relative, text, revision):
        with self.lock:
            current=self.read_file(relative)
            if current['revision']!=revision:raise DocumentConflict('File changed on disk; reload before saving.')
            if not isinstance(text,str) or len(text.encode())>512000:raise ValueError('File is too large')
            _,file=self.project_file(relative);temporary=file.with_name('.'+file.name+'.'+uuid.uuid4().hex+'.tmp')  # the real file, also through an in-project link
            temporary.write_text(text,encoding='utf-8');temporary.replace(file)
            return self.read_file(relative)
    def snapshot(self, project):
        path=self.project_path(project)
        parts=[f'Active project folder: {path}\nUse this folder as the working directory. Read and update its ROADMAP.md and tasks as work proceeds. Do not import other project histories or read other project folders without an explicit user request. Current files below override older snapshots in this chat.']
        inventory=self.files(project)
        parts.append('Current file inventory:\n'+'\n'.join(item['name'] for item in inventory[:200]))
        context_files=[item for item in inventory if item['name'].lower() in {'roadmap.md','readme.md'} or item['name'].startswith('tasks/') and item['name'].endswith('.md')]
        budget=60000
        for item in context_files:
            text=self.read_file(item['path'])['text'];fragment=text[:min(budget,12000)]
            parts.append(f"Current {item['name']}:\n{fragment}")
            budget-=len(fragment)
            if budget<=0:break
        return '\n\n'.join(parts)
