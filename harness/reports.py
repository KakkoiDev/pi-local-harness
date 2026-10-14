"""Plan 184: every incident the harness meets is one line in <data>/reports.jsonl (a rule sent something back, Gate
failed, a recovery, a wake-up, an unverified end, a genuine stop), so they can be analysed later and turned into lessons
(docs/lessons/). harness/reports.mjs writes the same lines from the extension."""
from datetime import datetime
import json
from pathlib import Path
import threading

LOCK = threading.Lock()


def report(data, kind, detail, **fields):
    """Append one report; never raises (a report must not break the work it describes)."""
    line = {'time': datetime.now().astimezone().isoformat(timespec='seconds'), 'kind': kind, 'detail': str(detail)[:2000],
            **{key: value for key, value in fields.items() if value not in (None, '')}}
    try:
        with LOCK, (Path(data) / 'reports.jsonl').open('a', encoding='utf-8') as handle:
            handle.write(json.dumps(line, ensure_ascii=False) + '\n')
    except OSError:
        pass


def read(data):
    try: lines = (Path(data) / 'reports.jsonl').read_text(encoding='utf-8').splitlines()
    except OSError: return []
    found = []
    for line in lines:
        try: found.append(json.loads(line))
        except ValueError: continue
    return found
