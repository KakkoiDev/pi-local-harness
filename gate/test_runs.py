"""Test evidence observed by Gate, separate from Pi's account of what passed (task 228)."""
from datetime import datetime
import json
from pathlib import Path
import re
import threading
import uuid

LOCK = threading.Lock()


def counts(output):
    """Counts only from runner summaries; an unrecognised runner keeps its exit code alone."""
    text = re.sub(r'\x1b\[[0-9;]*m', '', str(output))
    node = dict(re.findall(r'(?m)^\s*[#ℹ]\s+(pass|fail|skipped)\s+(\d+)\s*$', text))
    if node: return {key: int(value) for key, value in node.items()}
    ran = re.findall(r'Ran (\d+) tests? in .*', text)
    end = re.findall(r'(?m)^(OK|FAILED)(?: \(([^\n]*)\))?\s*$', text)
    if ran and end:
        fields = dict(re.findall(r'(failures|errors|skipped)=(\d+)', end[-1][1]))
        failed = int(fields.get('failures', 0)) + int(fields.get('errors', 0)); skipped = int(fields.get('skipped', 0))
        return {'pass': max(0, int(ran[-1]) - failed - skipped), 'fail': failed, 'skipped': skipped}
    for line in reversed(text.splitlines()):
        if not re.search(r'\bin \d+(?:\.\d+)?s\b', line): continue
        fields = dict((name, int(n)) for n, name in re.findall(r'(\d+) (passed|failed|skipped|error|errors)\b', line))
        if fields: return {'pass': fields.get('passed', 0), 'fail': fields.get('failed', 0) + fields.get('error', 0) + fields.get('errors', 0), 'skipped': fields.get('skipped', 0)}
    return {}


def record(data, *, request, project, cwd, command, exit_code, duration, output):
    identifier = uuid.uuid4().hex
    row = {'id': identifier, 'time': datetime.now().astimezone().isoformat(timespec='seconds'), 'request': request,
           'project': str(project), 'cwd': str(cwd), 'command': command, 'exit_code': exit_code,
           'duration': round(max(0, duration), 3), 'counts': counts(output), 'output_file': f'test-runs/{identifier}.txt'}
    data = Path(data)
    with LOCK:
        (data / 'test-runs').mkdir(parents=True, exist_ok=True)
        (data / row['output_file']).write_text('\n'.join(str(output).splitlines()[-200:]) + '\n', encoding='utf-8')
        with (data / 'test-runs.jsonl').open('a', encoding='utf-8') as handle: handle.write(json.dumps(row, ensure_ascii=False) + '\n')
    return row


def read(data):
    if data is None: return []
    try:
        with LOCK: lines = (Path(data) / 'test-runs.jsonl').read_text(encoding='utf-8').splitlines()
    except OSError: return []
    rows = []
    for line in lines:
        try: row = json.loads(line)
        except ValueError: continue
        if isinstance(row, dict): rows.append(row)
    return rows
