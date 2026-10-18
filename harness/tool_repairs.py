"""Task 326: what the tool-call repairs say about a model, for Activity (never a blocking card).

Read from <data>/decisions.jsonl (kind tool_call_repaired, written by harness/tool_repair_proxy.py), only when the file
changed. Each request lists how many of its tool calls the workbench fixed; a model that needed repairs in several
recent requests is named, so the person can see it writes tool calls as text (and maybe choose another model)."""
from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
import threading

RECENT = timedelta(days=14)
RECURRING = 3  # requests with a repair, in RECENT, before Activity names the model
_cache, _lock = {}, threading.Lock()


def rows(data):
    path = Path(data) / 'decisions.jsonl'
    try: stamp = path.stat(); key = (stamp.st_mtime_ns, stamp.st_size)
    except OSError: return []
    with _lock:
        cached = _cache.get(str(path))
        if cached and cached[0] == key: return cached[1]
    found = []
    try:
        with path.open(encoding='utf-8') as handle:
            for line in handle:
                if '"tool_call_repaired"' not in line: continue
                try: row = json.loads(line)
                except ValueError: continue
                if isinstance(row, dict) and row.get('kind') == 'tool_call_repaired' and isinstance(row.get('answer'), dict): found.append(row)
    except OSError: return []
    with _lock: _cache[str(path)] = (key, found)
    return found


def recurring(found, now=None):
    """[{model, requests, calls}] for each model with repairs in at least RECURRING requests over the last RECENT."""
    now = now or datetime.now(timezone.utc)
    models = {}
    for row in found:
        try: when = datetime.fromisoformat(row['time'])
        except (KeyError, TypeError, ValueError): continue
        if now - when > RECENT: continue
        entry = models.setdefault(str(row['answer'].get('model', '')), {'requests': set(), 'calls': 0})
        entry['requests'].add(str(row.get('request') or '').split('.')[0]); entry['calls'] += 1  # a chained request is its job's
    return sorted(({'model': model, 'requests': len(entry['requests']), 'calls': entry['calls']} for model, entry in models.items() if model and len(entry['requests']) >= RECURRING),
                  key=lambda item: -item['requests'])


def annotate(workspace, data):
    """/api/workspace with each job's repairs ({count, model, tools}) and the models that keep needing them."""
    found = rows(data)
    if not found: return workspace
    by_request = {}
    for row in found:
        request = str(row.get('request') or '')
        entry = by_request.setdefault(request.split('.')[0], {'count': 0, 'model': row['answer'].get('model'), 'tools': []})
        entry['count'] += 1
        if row['answer'].get('tool') not in entry['tools']: entry['tools'].append(row['answer'].get('tool'))
    jobs = [{**job, 'tool_repairs': by_request[job['id']]} if job.get('id') in by_request else job for job in workspace.get('jobs', [])]
    return {**workspace, 'jobs': jobs, 'tool_repairs': recurring(found)}
