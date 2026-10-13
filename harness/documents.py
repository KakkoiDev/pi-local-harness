"""Small single-user Markdown workspace. No identities, collaboration, or sync."""
from harness.markdown_records import read_record,write_record
import hashlib
import json
import re
import threading
import uuid
from pathlib import Path
from datetime import datetime

class DocumentConflict(ValueError):pass

def slug(text):
    value=re.sub(r'[^\w -]','',str(text)).strip()[:80]
    if not value or value in {'.','..'}:raise ValueError('Give the project or page a name')
    return value

class DocumentStore:
    def __init__(self, root):
        self.root=Path(root).resolve();self.root.mkdir(parents=True,exist_ok=True)
        self.projects=self.root/'projects';self.projects.mkdir(exist_ok=True)
        self.lock=threading.RLock()
        self.registry_file=self.root/'.projects.json'
        self.registry=json.loads(self.registry_file.read_text()) if self.registry_file.exists() else {}
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
    def comments(self, relative):
        path=self.sidecar(relative)
        if path.exists():return read_record(path)['comments']
        legacy=path.with_suffix('.json')
        if legacy.exists():
            if not legacy.resolve().is_relative_to(path.parent.resolve()):raise ValueError('Comment record is outside the workspace')
            values=json.loads(legacy.read_text());self.write_comments(relative,values);legacy.rename(legacy.with_name(legacy.name+'.before-markdown'));return values
        return []
    def get(self, relative):
        with self.lock:
            path=self.path(relative);text=path.read_text(encoding='utf-8')
            title=next((line[2:].strip() for line in text.splitlines() if line.startswith('# ')),path.stem)
            parts=Path(relative).parts
            return {'path':relative,'title':title,'project':parts[1] if len(parts)>2 else 'Pages','markdown':text,
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
            directory=self.project_path(project) if (project in self.registry or (self.projects/project).exists()) else self.projects/slug(project)
            directory.mkdir(parents=True,exist_ok=True)
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
        return {'path':'projects/'+project+'/'+str(file.relative_to(root))}
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
        return {'path':f'projects/{project}/tasks/{name}'}
    def save(self, relative, markdown, revision):
        if not isinstance(markdown,str) or len(markdown)>150000:raise ValueError('Page must be at most 150,000 characters')
        with self.lock:
            current=self.get(relative)
            if current['revision']!=revision:raise DocumentConflict('This page changed on disk. Reload or copy your draft before merging; your edit was not written.')
            path=self.path(relative);temporary=path.with_name('.'+path.name+'.'+uuid.uuid4().hex+'.tmp')
            temporary.write_text(markdown,encoding='utf-8');temporary.replace(path)
            return self.get(relative)
    def delete(self, relative):
        with self.lock:
            self.get(relative);trash=self.root/'.trash';trash.mkdir(exist_ok=True)
            if not trash.resolve().is_relative_to(self.root):raise ValueError('Trash directory is outside the workspace')
            self.path(relative).replace(trash/(uuid.uuid4().hex+'-'+Path(relative).name))
    def write_comments(self, relative, comments):
        path=self.sidecar(relative)
        body='# Comments on '+relative+'\n'
        for entry in comments:
            body+='\n## Thread '+entry['id']+'\n\n'+('Deleted' if entry.get('deleted') else 'Resolved' if entry['resolved'] else 'Open')+' · '+entry['created']+'\n\n> '+entry['anchor'].replace('\n','\n> ')+'\n\n'+entry['text']+'\n'
            for reply in entry.get('replies',[]):body+='\n### Reply\n\n'+reply['text']+'\n'
            if entry.get('agent_reply'):body+='\n### Agent reply\n\n'+entry['agent_reply']+'\n'
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
            entry.setdefault('replies',[]).append({'text':text.strip(),'created':datetime.now().astimezone().isoformat(timespec='seconds')})
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
    def agent_result(self, relative, identifier, text):
        with self.lock:
            comments=self.comments(relative)
            entry=next((item for item in comments if item['id']==identifier),None)
            if entry:
                if not entry.get('agent_reply'):entry['agent_reply']=str(text)[:50000]
                self.write_comments(relative,comments)
    def mark_sent(self, relative, identifier, chat):
        with self.lock:
            comments=self.comments(relative)
            entry=next(item for item in comments if item['id']==identifier)
            entry['chat_id']=chat;entry['sent_at']=datetime.now().astimezone().isoformat(timespec='seconds');self.write_comments(relative,comments)
    def comment_prompt(self, relative, identifier):
        page=self.get(relative);entry=next((item for item in page['comments'] if item['id']==identifier),None)
        if not entry:raise ValueError('Comment not found')
        if entry['resolved']:raise ValueError('This comment is already resolved')
        if entry.get('deleted'):raise ValueError('This comment is deleted. Restore it first.')
        return (f"Act on this project-page comment. Read the current page before editing; the attached snapshot is context.\n"
                f"Page file: {self.path(relative)}\nComment ID: {identifier}\nSelected text: {entry['anchor']}\n"
                f"User comment: {entry['text']}\nReplies: {json.dumps(entry.get('replies',[]),ensure_ascii=False)}\n\nMarkdown snapshot:\n{page['markdown']}\n\n"
                f"Make the requested changes and verify them. Record your result in the agent_reply field of this comment in the comments frontmatter array of {self.sidecar(relative)}. "
                "Preserve other comments and fields. Do not mark completed without evidence. Explain any blocker in your reply. "
                f"If the request only rewrites the selected text, do not edit the page: add a suggestion field to this comment, "
                f"{{\"anchor\": <the selected text exactly>, \"replacement\": <the new text>}}, and say so in agent_reply. The person applies it with Apply Change.")
    def project_path(self, project):
        if not isinstance(project,str) or Path(project).name!=project or project in {'.','..'}:raise ValueError('Invalid project')
        path=Path(self.registry[project]['path']).resolve() if project in self.registry else (self.projects/project).resolve()
        if project not in self.registry and not path.is_relative_to(self.projects):raise ValueError('Project is outside the workspace')
        if not path.is_dir():raise ValueError('Project not found')
        return path
    def list_projects(self):
        with self.lock:
            result=[{'id':key,**value} for key,value in self.registry.items()]
            for path in sorted(self.projects.iterdir()):
                if path.is_dir() and not path.is_symlink() and path.name not in self.registry:
                    result.append({'id':path.name,'name':path.name,'path':str(path.resolve())})
            return result
    def register(self, directory, name=None):
        supplied=Path(directory).expanduser()
        if not supplied.is_absolute():raise ValueError('Choose an absolute folder path')
        path=supplied.resolve()
        if not path.is_dir():raise ValueError('Choose an existing folder')
        with self.lock:
            for project in self.list_projects():
                if Path(project['path']).resolve()==path:return project['id']
            identifier=uuid.uuid4().hex
            self.registry[identifier]={'name':slug(name or path.name),'path':str(path)}
            temporary=self.registry_file.with_suffix('.tmp');temporary.write_text(json.dumps(self.registry,ensure_ascii=False,indent=2));temporary.replace(self.registry_file)
            return identifier
    def create_project(self, name, parent=None):
        name=slug(name)
        base=Path(parent).expanduser().resolve() if parent else self.projects
        if parent and not Path(parent).expanduser().is_absolute():raise ValueError('Choose an absolute parent folder')
        if not base.is_dir():raise ValueError('Parent folder not found')
        path=base/name
        with self.lock:
            if path.exists():raise ValueError('Project already exists; add its existing folder instead')
            path.mkdir();(path/'tasks').mkdir()
            (path/'ROADMAP.md').write_text(f'# {name} roadmap\n\n## Goal\n\nDescribe what we are building.\n\n## Tasks\n\n- [ ] Define the first task\n',encoding='utf-8')
            (path/'tasks'/'001-first-task.md').write_text('# First task\n\n- [ ] Define the outcome\n- [ ] Implement\n- [ ] Verify\n',encoding='utf-8')
            return self.register(str(path),name) if parent else name
    def directories(self, directory=None):
        path=Path(directory or Path.home()).expanduser().resolve()
        if not path.is_dir():raise ValueError('Folder not found')
        entries=[]
        for child in sorted(path.iterdir(),key=lambda item:item.name.lower()):
            if child.is_dir() and not child.name.startswith('.'):
                entries.append({'name':child.name,'path':str(child.resolve())})
        return {'path':str(path),'parent':str(path.parent),'directories':entries}
    def files(self, project):
        path=self.project_path(project);result=[]
        ignored={'.git','node_modules','.venv','__pycache__'}
        import os
        for directory,dirs,files in os.walk(path,followlinks=False):
            dirs[:]=sorted(d for d in dirs if d not in ignored and not (Path(directory)/d).is_symlink())
            for name in sorted(files):
                file=Path(directory)/name
                if file.is_symlink():continue
                entry={'path':'projects/'+project+'/'+str(file.relative_to(path)),'name':str(file.relative_to(path)),'size':file.stat().st_size}
                if entry['name']=='ROADMAP.md' or entry['name'].startswith('tasks/') and name.endswith('.md'):entry.update(self.progress(file))
                result.append(entry)
                if len(result)>=2000:return result
        return result
    @staticmethod
    def progress(file):
        """Plan group meta: checkbox progress (done/total over - [ ], - [x], - [~]) and a - [~] Blocked: line."""
        try:text=file.read_text(encoding='utf-8',errors='ignore') if file.stat().st_size<=512000 else ''
        except OSError:text=''
        boxes=re.findall(r'^\s*[-*] \[([ xX~])\]',text,re.M)
        return {'done':sum(box in 'xX' for box in boxes),'total':len(boxes),'blocked':bool(re.search(r'^\s*[-*] \[~\] Blocked:',text,re.M))}
    def create_roadmap(self, project):
        """Create Roadmap (empty Plan): ROADMAP.md and tasks/001-first-task.md, nothing else."""
        root=self.project_path(project)
        with self.lock:
            if (root/'ROADMAP.md').exists():raise ValueError('This folder already has a ROADMAP.md')
            name=self.registry.get(project,{}).get('name',root.name)
            (root/'ROADMAP.md').write_text(f'# {name} roadmap\n\n## Goal\n\nDescribe what we are building.\n\n## Tasks\n\n- [ ] [001-First task](tasks/001-first-task.md)\n',encoding='utf-8')
            (root/'tasks').mkdir(exist_ok=True)
            first=root/'tasks'/'001-first-task.md'
            if not first.exists():first.write_text('# First task\n\nKind: code\n\n- [ ] Define the outcome\n- [ ] Implement\n- [ ] Verify\n',encoding='utf-8')
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
            file=(self.project_path(Path(relative).parts[1])/Path(*Path(relative).parts[2:]));temporary=file.with_name('.'+file.name+'.'+uuid.uuid4().hex+'.tmp')
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
