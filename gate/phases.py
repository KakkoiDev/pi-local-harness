"""The shared project phase. Pi produces content; only the person or auto moves the phase."""
from copy import deepcopy
from datetime import datetime
import hashlib
import json
from pathlib import Path
import threading
from harness.decision_log import record as record_decision

PHASES = ('discussion', 'planning', 'implementation')


class Phases:
    def __init__(self, data=None, identity=None):
        self.data = Path(data) if data else None
        self.identity = identity
        self.values = {}
        self.lock = threading.RLock()

    def key(self, root):
        return self.identity(root) if self.identity else str(Path(root).resolve())

    def file(self, root):
        key = hashlib.sha256(self.key(root).encode()).hexdigest()
        return self.data / 'phases' / (key + '.json') if self.data else None

    def get(self, root):
        with self.lock:
            file = self.file(root)
            try:
                value = json.loads(file.read_text(encoding='utf-8')) if file else self.values.get(self.key(root))
            except FileNotFoundError:
                legacy = self.data / 'phases' / (hashlib.sha256(str(Path(root).resolve()).encode()).hexdigest()+'.json')
                if legacy != file and legacy.exists():
                    value = json.loads(legacy.read_text(encoding='utf-8'))
                    file.parent.mkdir(parents=True,exist_ok=True)
                    temporary=file.with_suffix('.tmp');temporary.write_text(json.dumps(value,ensure_ascii=False),encoding='utf-8');temporary.replace(file)
                else: value = None
            # A corrupt existing record must not silently replace an enforced phase.
            if value is None:
                return {'phase': 'discussion', 'history': []}
            if value.get('phase') not in PHASES or not isinstance(value.get('history'), list):
                raise ValueError('The saved project phase could not be read.')
            return deepcopy(value)

    def choose(self, root, phase, *, actor, planned=False, action='phase button'):
        if phase not in PHASES:
            raise ValueError('Choose Discussion, Planning or Implementation.')
        if actor not in ('person', 'auto'):
            raise ValueError('Only the person can choose the project phase.')
        with self.lock:
            before = self.get(root)
            if actor == 'auto' and (before['phase'], phase) != ('planning', 'implementation'):
                raise ValueError('Run on its own can only move Planning to Implementation.')
            if phase == 'implementation' and not planned:
                raise ValueError('No planned task yet. Plan one first.')
            if before['phase'] == phase:
                return before
            value = {'phase': phase, 'history': [*before['history'], {
                'phase': phase, 'actor': actor, 'action': action,
                'at': datetime.now().astimezone().isoformat(timespec='seconds'),
            }]}
            file = self.file(root)
            if file:
                file.parent.mkdir(parents=True, exist_ok=True)
                temporary = file.with_suffix('.tmp')
                temporary.write_text(json.dumps(value, ensure_ascii=False), encoding='utf-8')
                temporary.replace(file)
            else:
                self.values[self.key(root)] = value
            record_decision(self.data,None,'phase','person' if actor=='person' else 'code',phase,rule='G-015',automatic=actor=='auto')
            return deepcopy(value)


DISCUSSION_REFUSAL = 'Not written: the project is in Discussion. Pi can read, search and talk, but can’t write files. To plan this change, choose Planning in the phase button (⌃⌥P).'
PLANNING_REFUSAL = 'Not written: the project is in Planning. Pi can only write ROADMAP.md and tasks/. To change code, choose Start Building on the plan, or Implementation (⌃⌥I).'
# Task 263: a refused command did not run and a refused plan was not proposed; "Not written" only for writes.
DISCUSSION_COMMAND_REFUSAL = 'Not run: the project is in Discussion. Pi can read, search and talk; this command could change files. To plan this change, choose Planning in the phase button (⌃⌥P).'
PLANNING_COMMAND_REFUSAL = 'Not run: the project is in Planning. Pi can only write ROADMAP.md and tasks/; this command could change code. To change code, choose Start Building on the plan, or Implementation (⌃⌥I).'
DISCUSSION_PLAN_REFUSAL = 'Not proposed: the project is in Discussion. Plans are proposed in Planning. Choose Planning in the phase button (⌃⌥P).'
NO_TASK_COMMAND_REFUSAL = 'Not run: No approved task is in progress. Choose Planning, then Start Building on the plan.'
# Task 263: a folder that is neither registered nor has ROADMAP.md has no phase button to press.
# Round 12 (R12_Refusals): the folder is named and the two ways to make it a project are said.
NOT_A_PROJECT_REFUSAL = '{verb}: {folder} is not a project. Add it with Add Existing Folder…, or ask Pi to create a ROADMAP.md there to make it one.'


def not_a_project(folder, tool):
    home = str(Path.home())
    shown = '~' + str(folder)[len(home):] if str(folder) == home or str(folder).startswith(home + '/') else str(folder)
    return NOT_A_PROJECT_REFUSAL.format(verb='Not run' if tool == 'execute_command' else 'Not written', folder=shown)


# Task 290: what Pi may run in each phase, said when a command is refused (the docs say the same).
GIT_READ = '`git --no-pager --no-optional-locks -c core.fsmonitor=false status` (or `diff --no-ext-diff --no-textconv`)'
READS = 'ls, cat, head, tail, wc, grep, rg, find, diff, sed -n <lines>p and pwd, joined by | if needed (no globs, $, ; or redirection), and git in the read form ' + GIT_READ
COMMAND_REFUSALS = {
    'discussion': 'Not run: the project is in Discussion. Pi runs only checked reads: ' + READS + '. To build or run anything else, plan a task (Planning) and choose Start Building.',
    'planning': 'Not run: the project is in Planning. Pi runs only checked reads: ' + READS + '. To build or run anything else, choose Start Building on the plan.',
    'implementation': 'Not run: in Implementation Pi runs checked reads (' + READS + ') and the project\u2019s checked test runners (unittest, pytest, node --test, npm test …). Other commands are refused; the person can run them in a terminal.',
}


def harness_read_only(args, applies=False):
    """Console mutation is not made read-only by the transport's historical tool label.

    Task 290: the harness tool only previews a change (it puts the command on the person's input line, or in the web
    returns the preview); it applies one itself only while Run on its own is on (`applies`), or with --yes. A preview
    changes nothing, so it is a read. `update` (what is new) and `models check` are reads either way."""
    command=args.get('command');words=str(args.get('args') or '').split()
    if '--yes' in words:applies=True;words=[word for word in words if word!='--yes']
    if any(word.startswith('--') for word in words):return False
    if command in {'harness','status','queue','job','gate','projects','paths','doctor','bench','reports','guide','report'}:return True
    if command=='update' and not words or command=='models' and words[:1]==['check']:return True
    if command in {'audit','undo'}:return False  # their own checks (the publication audit's task) decide
    if not applies:return True
    if command in {'models','ollama'}:return not words
    if command=='config':return len(words)<=1 and words!=['set']
    if command=='auto':return words in ([],['status'])
    return False


def refusal(phase, root, tool, args, *, cwd, pi_tool=None, task='', approved=False):
    """Phase permission after core safety checks; task and approval come from recorded plan state, never Pi's prose."""
    import re
    from .phase_shell import read_only, test_run
    from .planning import file_allowed
    from . import media
    root = Path(root).resolve()
    if pi_tool=='music' and args.get('action') in ('template','catalog','read'):return None
    # Task 291: a media tool's revision write is decided by gate/media.py alone, in every phase (a new revision folder only).
    if media.handles(pi_tool, args): return media.media_refusal(pi_tool, args, root, cwd)
    if pi_tool == 'propose_plan' and phase == 'planning': return None
    if pi_tool=='web_search' and phase!='discussion':return 'Search is available in Discussion. Choose Discussion to search the web.'
    if tool == 'read_file' and pi_tool != 'propose_plan': return None
    if tool == 'execute_command' and read_only(args.get('command')): return None
    command = tool == 'execute_command'
    if tool == 'execute_command' and phase in ('discussion', 'planning'): return COMMAND_REFUSALS[phase]
    if phase == 'discussion': return DISCUSSION_PLAN_REFUSAL if pi_tool == 'propose_plan' else DISCUSSION_REFUSAL
    path = None
    if pi_tool in ('write', 'edit') and isinstance(args.get('path'), str):
        candidate = Path(args['path']).expanduser()
        try: path = (Path(cwd) / candidate).resolve().relative_to(root).as_posix()
        except ValueError: pass
    if phase == 'planning':
        if path == 'ROADMAP.md' or path and path.startswith('tasks/') and path.endswith('.md'): return None
        return PLANNING_COMMAND_REFUSAL if command else PLANNING_REFUSAL
    if phase != 'implementation': raise ValueError('The saved project phase could not be read.')
    if not approved: return NO_TASK_COMMAND_REFUSAL if command else 'Not written: No approved task is in progress. Choose Planning, then Start Building on the plan.'
    if tool == 'execute_command' and test_run(args.get('command')): return None
    if tool == 'execute_command':
        title = re.search(r'^#\s+(.+)', task, re.M)  # task 263: say which task this phase serves
        return COMMAND_REFUSALS['implementation'] + f' (task {title[1] if title else "in progress"})'
    if pi_tool == 'browser': return None  # verification runs only in an isolated scratch browser
    title = re.search(r'^#\s+(.+)', task, re.M)
    name = title[1] if title else 'in progress'
    if command: return f'Not run: in Implementation Pi can run tests and read-only commands; other commands could change files outside task {name}. Run the tests, or change the task’s files with edit or write.'
    if not re.search(r'^Files:\s*\S', task, re.M):return 'Not written: the task has no Files: line. Add a Files: line in Planning, then Start Building.'
    if path and file_allowed(task, path): return None
    return f'Not written: {path or args.get("path") or pi_tool or tool} is not part of task {name}. Pi can change only the task’s files. To include it, add it to the task in Planning, or plan a new task.'
