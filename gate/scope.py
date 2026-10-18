"""Round 12 (task 261, plan 267): what the person grants, and Gate's question when Pi needs more.

- What you grant: each planned task's Kind and Files, with where each came from (your answer · task file), shown on the
  plan card above Decisions.
- Scope widening: in Implementation, a write to a file outside the task's Files is refused (System 1) and becomes the
  person's question "Pi wants to change a file outside task N": Add to Task N writes the file into the task's Files line
  (the plan stays approved), Keep Out keeps it out and remembers that.
- Re-plan: when Pi needs a file the person kept out, the plan itself has to change: "The plan needs to change" asks
  Re-plan (the project goes back to Planning, by the person's answer) or Keep the Plan (later writes are plainly refused).
Gate decides; the model only asks through its refused write. Nothing here runs without the person's answer, except under
Run on its own, where the recommended answer is taken and reported like every other automatic decision.
"""
from datetime import datetime
from pathlib import Path
import re

from harness.decision_log import record as record_decision

SCOPE_QUESTION = 'Pi wants to change a file outside task {n}'
ADD = 'Add to Task {n}'
KEEP_OUT = 'Keep Out'
REPLAN_QUESTION = 'The plan needs to change'
REPLAN = 'Re-plan'
KEEP_PLAN = 'Keep the Plan'


def now():
    return datetime.now().astimezone().isoformat(timespec='seconds')


def position(plan, task):
    tasks = plan.get('tasks', [])
    return (tasks.index(task) + 1, len(tasks)) if task in tasks else (None, len(tasks))


def files_of(text):
    found = re.search(r'^Files:\s*(.+)$', text, re.M)
    return [entry.strip().strip('`') for entry in found[1].split(',') if entry.strip()] if found else []


def reason_of(text):
    """Pi's last sentence before the write, as its one-line reason (never more than 160 characters)."""
    sentences = [part.strip() for part in re.split(r'(?<=[.!?。])\s+', ' '.join(str(text or '').split())) if part.strip()]
    last = sentences[-1] if sentences else ''
    return last if len(last) <= 160 else last[:159] + '…'


def relative(root, args, cwd):
    path = args.get('path')
    if not isinstance(path, str): return None
    try: return (Path(cwd or root) / Path(path).expanduser()).resolve().relative_to(Path(root).resolve()).as_posix()
    except (ValueError, OSError): return None


def widen(paperwork, request, root, args, cwd, task_text, assistant_text=''):
    """The person's question for a write outside the task in progress, or None when this refusal is not one."""
    from .planning import file_allowed, git_internal
    from .paperwork import plan_path
    from harness.autonomy import enabled
    path = relative(root, args, cwd)
    if not path or git_internal(path) or plan_path(path) or not files_of(task_text) or file_allowed(task_text, path): return None
    plan = paperwork.plan_state(root); index = plan.get('index', 0); tasks = plan.get('tasks', [])
    if not isinstance(index, int) or not 0 <= index < len(tasks): return None
    task = tasks[index]; number, total = position(plan, task)
    title = re.search(r'^#\s+(?:\d+:\s*)?(.+)', task_text, re.M); title = title[1].strip() if title else task
    if path in plan.get('kept_out', {}).get(task, []):
        if path in plan.get('replan_declined', {}).get(task, []) or enabled(paperwork.data): return None
        choice = {'question': REPLAN_QUESTION, 'options': [{'label': REPLAN, 'detail': f'Back to Planning: add {path} to task {number}, or plan a new task for it.'},
                                                           {'label': KEEP_PLAN, 'detail': f'Pi goes on without {path}.'}],
                  'recommended': 0, 'allow_other': True, 'system_owned': True,
                  'replan': {'task': task, 'title': title, 'number': number, 'total': total, 'file': path, 'reason': reason_of(assistant_text)}}
        said = f'Not written: you kept {path} out of task {number}, {title}, and Pi needs it. Gate asks the person whether the plan should change. Stop here and wait for the answer.'
    else:
        choice = {'question': SCOPE_QUESTION.format(n=number), 'options': [{'label': ADD.format(n=number), 'detail': path}, {'label': KEEP_OUT, 'detail': f'Pi goes on without {path}.'}],
                  'recommended': 0, 'allow_other': True, 'system_owned': True,
                  'scope': {'task': task, 'title': title, 'number': number, 'total': total, 'file': path, 'reason': reason_of(assistant_text)}}
        said = f'Not written: {path} is not part of task {number}, {title}. Gate asks the person: add it to the task, or keep it out. Stop here and wait for the answer.'
    try: paperwork.choice_pending(request, choice, system=True)
    except ValueError: return None  # another question waits: the plain refusal stands
    return {'choice': choice, 'reason': said}


def add_file(root, task, path):
    file = Path(root) / task
    text = file.read_text(encoding='utf-8')
    if path in files_of(text): return
    file.write_text(re.sub(r'^(Files:[ \t]*)(.*?)[ \t]*$', lambda match: f'{match[1]}{match[2]}{", " if match[2].strip() else ""}{path}', text, count=1, flags=re.M), encoding='utf-8')


def answer(paperwork, request, item, waiting, value, state):
    """The person's answer to a scope or re-plan question (paperwork.decision calls this): what it grants, at once."""
    from .paperwork import clock
    root = item['root']; asked = waiting.get('scope') or waiting.get('replan'); task = asked['task']
    plan = paperwork.plan_state(root); number = asked.get('number')
    if waiting.get('scope'):
        if value == ADD.format(n=number):
            add_file(root, task, asked['file'])
            plan.setdefault('granted', {}).setdefault(task, {})[asked['file']] = {'source': 'your answer' if state != 'auto' else 'auto', 'at': now()}
            if task in plan.get('tasks', []) and (plan.get('approved') or plan.get('pending')): plan['digest'] = paperwork.plan_digest(root, plan['tasks'])  # the person's own grant is not a change of plan
            paperwork.progress({**item, 'task': task}, f"Files: {asked['file']} added at {clock()} ({'your answer' if state != 'auto' else 'Run on its own'})")
        elif value == KEEP_OUT:
            kept = plan.setdefault('kept_out', {}).setdefault(task, [])
            if asked['file'] not in kept: kept.append(asked['file'])
    elif value == REPLAN:
        paperwork.phases.choose(root, 'planning', actor='person', planned=True, action='Re-plan')
    elif value == KEEP_PLAN:
        declined = plan.setdefault('replan_declined', {}).setdefault(task, [])
        if asked['file'] not in declined: declined.append(asked['file'])
    plan = {**paperwork.plan_state(root), **{key: plan[key] for key in ('granted', 'kept_out', 'replan_declined', 'digest') if key in plan}}
    paperwork.plan_state(root, plan)
    paperwork.save_choice(root, {**waiting, 'pending': False, 'answer': value, 'state': state, 'at': now()})
    record_decision(paperwork.data, request, 'scope_widening' if waiting.get('scope') else 'replan', 'code' if state == 'auto' else 'person', value, rule='G-015', automatic=state == 'auto')
    if state == 'auto' and paperwork.runs: paperwork.runs.add(root, 'decisions', {'task': task, 'question': waiting['question'], 'answer': value})
    return {'task': task, 'question': waiting['question'], 'answer': value, 'state': state}


def grant(paperwork, root, path, text):
    """What the plan card shows under What you grant for one task: Kind and Files, each with its source."""
    from .paperwork import UNPLANNED
    kind = re.search(r'^Kind:\s*(\S+)', text, re.M)
    decisions = paperwork.recorded_decisions(root, path) + paperwork.recorded_decisions(root, UNPLANNED)
    chosen = next((value for value in decisions if re.search(r'\bkind\b|\bserver\b|種類|サーバー', value.get('question', ''), re.I)), None)
    granted = paperwork.plan_state(root).get('granted', {}).get(path, {})
    files = [entry for entry in files_of(text) if entry not in granted]
    return {'kind': chosen['answer'] if chosen else (kind[1] if kind else 'code'), 'kind_source': 'your answer' if chosen else 'task file',
            **({'kind_at': chosen.get('at')} if chosen and chosen.get('at') else {}), 'files': files,
            'granted': [{'file': file, **value} for file, value in granted.items()]}
