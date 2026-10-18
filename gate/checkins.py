"""Round 12 (task 260, plan 267): what a check-in shows and what Accept Anyway does.

- The evidence on a done check-in: the test run Gate saw (command, passed, failed, time), the tests the request changed,
  Pi's "Tried it:" line and whether a test was removed or weakened (then the card says so and Review First is the
  default).
- Accept Anyway: the person accepts an unverified task without a passing test. Its boxes are checked, its ROADMAP.md line
  is ticked and labelled "accepted without verification", a harness commit records it, and the plan moves on.
"""
from datetime import datetime
from pathlib import Path
import re
import subprocess

from harness.decision_log import record as record_decision

LABEL = 'accepted without verification'
ASSERTION = re.compile(r'\bassert\w*\b|\bexpect\s*\(|\bshould\b|\bt\.(?:Error|Fatal)')


def head_text(root, path):
    done = subprocess.run(['git', '-C', str(root), 'show', f'HEAD:./{path}'], capture_output=True, text=True)
    return done.stdout if done.returncode == 0 else None


def weakened(root, tests):
    """Test files the request removed, or whose assertions it reduced, against HEAD (before the harness commits)."""
    found = []
    for path in tests:
        before = head_text(root, path)
        if before is None: continue  # a new test file
        file = Path(root) / path
        if not file.is_file(): found.append({'path': path, 'how': 'removed'}); continue
        try: after = file.read_text(encoding='utf-8', errors='replace')
        except OSError: continue
        if len(ASSERTION.findall(after)) < len(ASSERTION.findall(before)): found.append({'path': path, 'how': 'fewer checks'})
    return found


def tried(text):
    """Pi's "Tried it: …" line from the task's For the person section, or ''."""
    section = re.search(r'^## For the person\n+(.*?)(?=^## |\Z)', text, re.M | re.S)
    line = re.search(r'^\s*(?:[-*+]\s*)?Tried it:\s*(.+)$', section[1] if section else '', re.M)
    return line[1].strip() if line else ''


def test_run(data, request, command):
    """The last passing run of the command in this request, as Gate recorded it: {command, passed, failed, seconds, time}."""
    from . import test_runs
    rows = [row for row in test_runs.read(data) if row.get('request') == request and row.get('exit_code') == 0 and (not command or row.get('command') == command)]
    if not rows: return {'command': command} if command else None
    row = rows[-1]; counts = row.get('counts') or {}
    return {'command': row.get('command'), 'passed': counts.get('pass'), 'failed': counts.get('fail'), 'seconds': row.get('duration'), 'time': row.get('time')}


def evidence(paperwork, request, item, changed):
    """The evidence lines of a verified check-in (computed before the harness commits, so HEAD is the old code)."""
    from .paperwork import TEST_PATH
    root, task = item['root'], item['task']
    tests = [path for path in changed if TEST_PATH.search(path)]
    text = (root / task).read_text(encoding='utf-8')
    return {'test': test_run(paperwork.data, request, item.get('test_command')), 'tests_changed': tests,
            'weakened': weakened(root, tests), 'tried': tried(text)}


def task_title(root, path):
    """A task's title from its heading ("# 003: Japanese and English" → "Japanese and English"), else its file name."""
    try: found = re.search(r'^# (?:\d+: )?(.+)', (Path(root) / path).read_text(encoding='utf-8'), re.M)
    except OSError: found = None
    return found[1].strip() if found else Path(path).stem


def accept_anyway(paperwork, root, state='chosen'):
    """The person's Accept Anyway… on an unverified check-in (never automatic): the task counts as done, labelled."""
    if state != 'chosen': raise ValueError('Only the person can accept a task without a passing test.')
    from .paperwork import PROGRESS, clock
    root = Path(root).resolve()
    with paperwork.lock:
        plan = paperwork.plan_state(root)
        if not plan.get('check_in'): raise ValueError('No task is waiting for validation.')
        if plan.get('verified'): raise ValueError('This task is verified; accept it with Accept and Continue.')
        index = plan.get('index', 0); task = plan['tasks'][index]
        path = root / task
        if path.is_symlink() or not path.resolve().is_relative_to(root): raise ValueError('The plan links outside this project.')
        head, progress, rest = path.read_text(encoding='utf-8').partition(PROGRESS)
        path.write_text(re.sub(r'^(\s*[-*+]) \[ \]', r'\1 [x]', head, flags=re.M) + progress + rest, encoding='utf-8')
        item = {'root': root, 'task': task, 'text': 'Accept Anyway', 'before': {}}
        paperwork.progress(item, f'Accepted without verification at {clock()} by the person: no passing test after the last change')
        roadmap = root / 'ROADMAP.md'
        text = roadmap.read_text(encoding='utf-8')
        line = re.compile(rf'^(\s*[-*+]) \[[ xX]\](.*\(tasks/{re.escape(Path(task).name)}\))(?: \({LABEL}\))?[ \t]*$', re.M)
        roadmap.write_text(line.sub(lambda match: f'{match[1]} [x]{match[2]} ({LABEL})', text, count=1), encoding='utf-8')
        saved = paperwork.commit(root, [task, 'ROADMAP.md'], paperwork.subject(item, f', {LABEL}'), f'Accepted by the person without a passing test ({datetime.now():%Y-%m-%d %H:%M}).')
        following = index + 1; finished = following >= len(plan['tasks'])
        plan.update(check_in=False, finished=finished, accepted='anyway', index=index if finished else following); plan.pop('card', None)
        paperwork.plan_state(root, plan)
        record_decision(paperwork.data, None, 'task_acceptance', 'person', 'accept_anyway', rule='G-015')
        return {'finished': finished, 'next': None if finished else plan['tasks'][following], 'total': len(plan['tasks']), 'anyway': True, 'task': task, **saved}


def unlabel(text, task):
    """Reopen Task…: the ROADMAP.md line loses the label with its tick."""
    return re.sub(rf'^(\s*[-*+] \[[ xX]\].*\(tasks/{re.escape(Path(task).name)}\)) \({LABEL}\)', r'\1', text, flags=re.M)
