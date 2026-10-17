"""Task 114: the context Pi gets with a request, chosen by fixed rules within a character budget.

Replaces sending the whole project snapshot (every task file) with every message. Order, highest first:
plan (ROADMAP headings and open items, open tasks with progress), the current document, files the request
mentions, then, while room is left, files linked from the document, the active task, files changed by the
last harness commit and files relevant to the request; finally the file names. A footer says what
was left out. Pi can read anything else with its tools.
"""
import re
import subprocess
from pathlib import Path

BUDGET = 16000          # characters, about 4k tokens of a 32k window
FILE_CAP = 3000         # characters per chosen file
WHOLE_DOCUMENT = 6000   # a larger current document is cut to the passage's section plus its headings
NAMES_CAP = 150

TASK = re.compile(r'^tasks/[^/]+\.md$')
LINK = re.compile(r'\]\(([^)\s]+)\)')
PATHLIKE = re.compile(r'(?<![\w/.-])([\w.-]+(?:/[\w.-]+)*\.[A-Za-z0-9]{1,8})(?![\w/])')
TASKREF = re.compile(r'\btasks?\s*#?\s*(\d{1,4})\b|(?<![\w/])#(\d{1,4})\b|(?<![\w/])(\d{1,4})-[a-z]', re.I)


def compress_plan(text):
    """Headings and open or blocked items stay; finished items become a count."""
    kept, done = [], 0
    for line in text.splitlines():
        stripped = line.strip()
        if re.match(r'[-*] \[[xX]\]', stripped): done += 1
        elif stripped.startswith('#') or re.match(r'[-*] \[[ ~]\]', stripped): kept.append(line)
    if done: kept.append(f'({done} done)')
    return '\n'.join(kept)


def section_around(text, passage):
    """For a large document: every heading, plus the whole section that holds the passage."""
    lines = text.splitlines(); headings = [i for i, line in enumerate(lines) if line.startswith('#')]
    at = text.find(passage) if passage else -1
    line_no = text[:at].count('\n') if at >= 0 else 0
    start = max([i for i in headings if i <= line_no], default=0)
    end = min([i for i in headings if i > start], default=len(lines))
    outline = '\n'.join(lines[i] for i in headings)
    return f'Headings:\n{outline}\n\nSection with the passage:\n' + '\n'.join(lines[start:end])[:WHOLE_DOCUMENT]


def mentioned(text, names):
    """Files the text points at: links, paths, file names, task numbers. Only names that exist count."""
    by_base = {}
    for name in names: by_base.setdefault(name.rsplit('/', 1)[-1].lower(), []).append(name)
    found = []
    def add(name):
        if name in names and name not in found: found.append(name)
    for token in LINK.findall(text) + PATHLIKE.findall(text):
        token = token.strip('./') if token.startswith('./') else token
        if token in names: add(token)
        else:
            for name in sorted(by_base.get(token.rsplit('/', 1)[-1].lower(), [])): add(name)
    for match in TASKREF.finditer(text):
        number = int(next(group for group in match.groups() if group))
        for name in sorted(names):
            if TASK.match(name) and re.match(rf'tasks/0*{number}-', name): add(name)
    return found



def select_files(root, files, request, current=None, task=None, changed=None):
    """One selection for web and terminal: exclude generated, vendored, binary and >40 KB files; keep project rules,
    plan and active task, then named/task/last-request files and request relevance (names before contents).
    With no current-request commit, use the latest Pi Workbench commit, never a person's later commit.
    """
    root = Path(root).resolve(); safe, bodies = [], {}
    excluded = {'vendor','node_modules','.venv','.git','__pycache__','dist','build','coverage','.next'}
    locks = {'package-lock.json','pnpm-lock.yaml','yarn.lock','uv.lock','poetry.lock','cargo.lock','composer.lock'}
    for item in files:
        name=item['name']; path=root/name; parts=Path(name).parts; base=Path(name).name.lower()
        if set(parts) & excluded or base.startswith('license') or base in locks or base.endswith(('.lock','.pyc','.map','.min.js','.min.css')) or name in {'static/app.css','static/app.js'}: continue
        try:
            if not path.resolve().is_relative_to(root) or path.is_symlink() or path.stat().st_size > 40*1024: continue
            text=path.read_text(encoding='utf-8')
        except (OSError,UnicodeError): continue
        if '\0' in text: continue
        safe.append(item);bodies[name]=text
    names=[item['name'] for item in safe];meta={item['name']:item for item in safe};reasons={};ordered=[]
    def add(name, reason):
        if name in meta and name not in reasons: ordered.append(name);reasons[name]=reason
    tasks=sorted(name for name in names if TASK.match(name) and not (meta[name].get('total') and meta[name].get('done')==meta[name]['total']))
    named=mentioned(request,names)
    active=task if task in meta else next((name for name in named if TASK.match(name)),None)
    active=active or next((name for name in tasks if meta[name].get('done')),None) or next(iter(tasks),None)
    add('README.md','Project rules');add('ROADMAP.md','Plan')
    if active: add(active,'Task in progress')
    if current: add(current,'Current document')
    for name in named: add(name,'Named in the request')
    if active:
        for name in mentioned(bodies[active],names): add(name,'Listed by the current task')
    if current in bodies:
        for link in LINK.findall(bodies[current]):
            add(str(Path(current).parent/link),'Linked from the current document');add(link,'Linked from the current document')
    if changed is None:
        try:
            revision=subprocess.run(['git','-C',str(root),'log','-1','--author=^Pi Workbench <','--format=%H'],capture_output=True,text=True,timeout=5).stdout.strip()
            changed=subprocess.run(['git','-C',str(root),'diff-tree','--root','--no-commit-id','--name-only','-r',revision],capture_output=True,text=True,timeout=5).stdout.splitlines() if revision else []
        except (OSError,subprocess.SubprocessError): changed=[]
    for name in changed: add(name,'Last harness commit')
    words=set(re.findall(r'[a-z]{3,}|[一-龯ぁ-んァ-ン]+',request.lower()))-{'the','and','for','make','this','that','with','from','please','can','you'}
    score=lambda text:len(words & set(re.findall(r'[a-z]{3,}|[一-龯ぁ-んァ-ン]+',text.lower())))
    for name in sorted(names,key=lambda name:(-score(name),name)):
        if score(name): add(name,'Relevant file name')
    for name in sorted(names,key=lambda name:(-score(bodies[name]),name)):
        if not TASK.match(name) and score(bodies[name]): add(name,'Relevant contents')
    return {'files':safe,'names':ordered,'reasons':reasons,'task':active,'bodies':bodies}


def build_context(store, project, request, current=None, passage='', thread='', budget=BUDGET, now=None, task=None, changed=None):
    root = store.project_path(project)
    current_name = current.split('/', 2)[2] if current else None
    selection=select_files(root,store.files(project),f'{request}\n{passage}\n{thread}',current_name,task,changed)
    files=selection['files'];names=[item['name'] for item in files];meta={item['name']:item for item in files}
    sections, included, omitted, items = [], [], [], []
    used = 0
    reserved={name:min(FILE_CAP,len(selection['bodies'][name]))+80 for name in ['README.md',selection['task']] if name in selection['bodies']}

    def read(name, cap):
        try: return (root / name).read_text(encoding='utf-8', errors='replace')[:cap]
        except OSError: return ''

    def offer(title, body, name=None, required=False, kind=None):
        nonlocal used
        block = f'## {title}\n{body.strip()}\n'
        reserved.pop(name,None); available=max(0,budget-sum(reserved.values()))
        if not required and used + len(block) > available:
            if name: omitted.append(name)
            return False
        if required and used + len(block) > available: block = block[:max(0, available - used)]
        sections.append(block); used += len(block)
        if name and name not in included:
            included.append(name); items.append({'label': name.rsplit('/', 1)[-1], 'path': name, 'full_path':str(root/name), 'kind': kind, 'reason':selection['reasons'].get(name,'Plan')})
        return True

    # 1. Plan
    plan = []
    if 'ROADMAP.md' in meta: plan.append(compress_plan(read('ROADMAP.md', 200000)))
    tasks = sorted((name for name in names if TASK.match(name)), reverse=True)
    open_tasks = [name for name in tasks if not (meta[name].get('total') and meta[name]['done'] == meta[name]['total'])]
    if tasks:
        plan.append('Open tasks:\n' + '\n'.join(f"{name} {meta[name]['done']}/{meta[name]['total']}" + (' Blocked' if meta[name].get('blocked') else '') if meta[name].get('total') else name for name in open_tasks))
        if len(tasks) > len(open_tasks): finished = len(tasks) - len(open_tasks); plan.append(f"{finished} finished task{'' if finished == 1 else 's'}")
    if plan: offer('Plan (ROADMAP.md, compressed)', '\n\n'.join(plan), 'ROADMAP.md' if 'ROADMAP.md' in meta else None, required=True, kind='plan')
    if open_tasks: items.append({'label': f"{len(open_tasks)} open task{'' if len(open_tasks) == 1 else 's'}", 'kind': 'tasks', 'count': len(open_tasks)})

    # 2. Current document
    document = ''
    if current_name and current_name in meta:
        document = read(current_name, 400000)
        body = document if len(document) <= WHOLE_DOCUMENT else section_around(document, passage)
        if offer(f'Current document: {current_name}', body, current_name, kind='this file'):
            # Comments and whole-file requests are about this file: it leads the "Pi sees:" line (ContextLine card).
            mine = next((item for item in items if item.get('path') == current_name), None)
            if mine: items.remove(mine); items.insert(0, {**mine, 'kind': 'this file'})

    if 'README.md' in meta: offer('Project rules: README.md',read('README.md',FILE_CAP),'README.md',required=True,kind='related')

    # 3. Mentioned files, then 4. auto-selected while room is left
    chosen = [name for name in mentioned(f'{request}\n{passage}\n{thread}', names) if name != current_name]
    for name in chosen:
        if name not in included: offer(f'Mentioned: {name}', read(name, FILE_CAP), name, required=name==selection['task'], kind='mentioned')
    for name in selection['names']:
        if name in included or name in omitted or name == current_name or name == 'ROADMAP.md': continue
        offer(f'Related: {name}',read(name,FILE_CAP),name,required=name==selection['task'],kind='related')

    # 5. File names only
    listed = names if len(names) <= NAMES_CAP else _compress_names(names)
    room = max(0, budget - used - 40)
    lines, size = [], 0
    for name in listed:
        if size + len(name) + 1 > room: lines.append(f'… {len(listed) - len(lines)} more'); break
        lines.append(name); size += len(name) + 1
    sections.append('## Files in the project (names only)\n' + '\n'.join(lines) + '\n')

    footer = 'Read other files with your tools when you need them.'
    if omitted: footer = f"Not included (over the context budget): {', '.join(omitted)}. " + footer
    sections.append(footer + '\n')
    # items: what the "Pi sees:" line shows (task 133), files in the order Pi gets them plus the open-task count.
    return {'text': '\n'.join(sections), 'included': included, 'omitted': omitted, 'items': items, 'reasons': {name:selection['reasons'].get(name,'Plan') for name in included}, 'open_tasks': len(open_tasks)}


def _compress_names(names):
    """Keep names two levels deep; deeper files become one line per folder with a count."""
    shown, folders = [], {}
    for name in sorted(names):
        parts = name.split('/')
        if len(parts) <= 2: shown.append(name)
        else: folders.setdefault('/'.join(parts[:2]) + '/', 0); folders['/'.join(parts[:2]) + '/'] += 1
    return shown + [f'{folder} ({count} files)' for folder, count in sorted(folders.items())]


def build_project_context(root, request, **options):
    """The terminal uses the web selector without registering a project or writing into its folder."""
    from harness.documents import DocumentStore
    class ProjectFiles:
        def project_path(self, _project): return Path(root).resolve()
        def files(self, _project): return DocumentStore.inventory(Path(root).resolve())
    return build_context(ProjectFiles(), '', request, **options)
