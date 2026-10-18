"""Project Start's web side (round 12, plan 253; design/system/components/ProjectStart): the catalogue with what the
person's sentence suggests, step 4's facts, Create, and Project › Add a Capability…. Create and Add a Capability… are
the person's controls (PERSON_ROUTES in harness/web_chat.py). The assembling and the tests are kit/capabilities.py."""
from collections import Counter
import os
from pathlib import Path
import subprocess
import time
import uuid

import capabilities as kit  # kit/ is on the path (harness/documents.py puts it there)


def _locations(chat):
    """Where New Project can create: the folders the person's projects are in (most used first), then the home folder."""
    parents = Counter(str(Path(item['path']).parent) for item in chat.documents.list_projects() if not item.get('missing'))
    found = [path for path, _ in parents.most_common() if Path(path).is_dir()]
    home = str(Path.home())
    return found + ([home] if home not in found else [])


def catalogue(chat, query):
    """GET /api/project-start?text=…&project=…: the catalogue, the suggestions from the sentence (code, never chosen),
    the places to create in, and for Add a Capability… what the project already has."""
    result = {**kit.public(), 'suggested': kit.suggest(query.get('text', [''])[0]), 'locations': _locations(chat)}
    project = query.get('project', [''])[0]
    if project:
        base, packages, present = kit.project_state(chat.documents.project_path(project))
        result['project'] = {'base': base, 'packages': packages, 'present': present}
    return result


def plan(chat, data):
    """POST /api/project-start/plan: step 4's facts (the base's files and tests), or what stops Create."""
    return kit.summary(data.get('packages') or [], data.get('capabilities') or [], kit.initial_plan(data.get('name') or 'App'))


def preview(chat, data):
    """POST /api/project-start/preview: what Add a Capability… would change in the open project."""
    return kit.preview(chat.documents.project_path(data['project']), data['capability'])


def create(chat, data):
    """POST /api/projects/start: Create. An empty folder is today's New Project; otherwise the base is assembled and its
    tests run; if one fails nothing is created and the reply names the failing test."""
    if data.get('empty'):
        project = chat.documents.create_project(data['name'], data.get('parent'), 'empty')
        return {'created': True, 'project': project, 'chat': chat.project_chat(project)['id']}
    start = {'packages': data.get('packages') or [], 'capabilities': data.get('capabilities') or []}
    try:
        project = chat.documents.create_project(data['name'], data.get('parent'), 'start', start=start)
    except kit.BaseFailed as error:
        return {'created': False, 'error': str(error), 'check': _shown(error.check)}
    return {'created': True, 'project': project, 'chat': chat.project_chat(project)['id'], 'check': _shown(start['check'])}


def _shown(check):
    return {key: check.get(key) for key in ('passed', 'counts', 'tests', 'failing', 'commands', 'reason')} | {'output': (check.get('output') or '')[-4000:]}


def full_suite(folder):
    """The project's own tests, offline, as /audit runs them (harness/audit.py): {'passed', 'command'}."""
    from harness.audit import commands
    import shlex
    argv = commands(folder)['tests']
    environment = {**os.environ, 'UV_OFFLINE': '1', 'PYTHONDONTWRITEBYTECODE': '1'}
    try:
        from gate import sandbox  # task 311: the project's own code runs in the test sandbox
        ran = subprocess.run(sandbox.argv(argv, folder), cwd=folder, env=environment, capture_output=True, text=True, timeout=300)
        from gate.test_runs import counts
        passed = ran.returncode == 0 and bool(counts(ran.stdout + ran.stderr).get('pass'))
    except (OSError, subprocess.TimeoutExpired):
        passed = False
    return {'passed': passed, 'command': shlex.join(argv)}


def add(chat, data):
    """POST /api/projects/capability: Add a Capability…, refused while Pi works in the project. Kept as one commit by
    the harness, so the done row's Undo This Request… takes it back; otherwise nothing changes."""
    from harness.web_chat import ProjectBusy
    project = data['project']; root = chat.documents.project_path(project)
    busy = [job for job in chat.queue.list() if job['status'] in ('running', 'queued') and job.get('project') == project]
    if busy: raise ProjectBusy(busy[0]['id'])
    started = time.monotonic()
    result = kit.add(root, data['capability'], data=chat.documents.root, request='capability-' + uuid.uuid4().hex[:12], full_suite=full_suite)
    reply = {**{key: value for key, value in result.items() if key != 'check'}, 'check': _shown(result['check']), 'seconds': round(time.monotonic() - started, 1)}
    if not result.get('commit'): return reply  # nothing was kept: the dialog says why, the chat has nothing to undo
    chat.changed(project, root, result['commit'], 'You')
    message = {'role': 'assistant', 'author': 'workbench', 'content': result['message'], 'commit': result['commit']}
    return {**reply, 'conversation': chat.store.append(chat.project_chat(project)['id'], message)}
