"""Private, metadata-only evidence normalization; no discovery, replay or I/O.

Envelopes contain project, request, source ('pi' RPC or 'gate') and event.
Scope labels are trusted host metadata, never inferred from model arguments.
"""
import hashlib
import json

TOOLS = frozenset(('bash', 'read', 'write', 'edit', 'grep', 'find', 'ls'))

def normalize(records, *, project, request, limit=10000):
    """Summarize selected envelopes, retaining 1-based input positions as citations.

Call IDs are opaque digests; all free text, arguments, paths and outputs are
omitted rather than relying on a secret-pattern denylist. No execution timing
or subprocesses can be inferred. Duplicate records share their first citation.
"""
    if not isinstance(project, str) or not project or not isinstance(request, str) or not request:
        raise ValueError('Select a project and request explicitly.')
    if type(limit) is not int or not 1 <= limit <= 100000:
        raise ValueError('Record limit must be between 1 and 100000.')
    calls = {}; seen = set(); malformed = duplicates = 0; truncated = False
    for position, envelope in enumerate(records, 1):
        if position > limit:
            truncated = True; break
        if not isinstance(envelope, dict):
            malformed += 1; continue
        if envelope.get('project') != project or envelope.get('request') != request:
            continue
        event = envelope.get('event'); source = envelope.get('source')
        if not isinstance(event, dict) or source not in ('pi', 'gate'):
            malformed += 1; continue
        kind = event.get('type') if source == 'pi' else event.get('phase')
        if kind not in (('tool_execution_start', 'tool_execution_end') if source == 'pi' else ('gate', 'audit')):
            continue
        identity = event.get('toolCallId' if source == 'pi' else 'tool_call')
        if not isinstance(identity, str) or not identity or len(identity) > 4096:
            malformed += 1; continue
        try:
            identity_bytes = identity.encode()
            encoded = json.dumps([source, event], sort_keys=True, allow_nan=False).encode()
        except (TypeError, ValueError, RecursionError, UnicodeError):
            malformed += 1; continue
        if len(encoded) > 1024 * 1024:
            malformed += 1; continue
        fingerprint = hashlib.sha256(encoded).digest()
        if fingerprint in seen:
            duplicates += 1; continue
        seen.add(fingerprint)
        key = hashlib.sha256(identity_bytes).hexdigest()
        row = calls.setdefault(key, dict(id=key, tool='other', evidence=[], checks=[], sources=set(), started=False, results=set(), blocked=False))
        row['evidence'].append(position); row['sources'].add(source)
        tool = event.get('toolName' if source == 'pi' else 'tool')
        if isinstance(tool, str) and tool in TOOLS: row['tool'] = tool
        if source == 'pi':
            if kind == 'tool_execution_start': row['started'] = True
            elif type(event.get('isError')) is bool: row['results'].add('failed' if event['isError'] else 'succeeded')
            else: malformed += 1
        else:
            outcome = event.get('outcome')
            allowed = ('ALLOW', 'BLOCK', 'REVISE', 'ESCALATE') if kind == 'gate' else ('SUCCESS', 'VERIFIED', 'DRIFT_DETECTED', 'EXECUTION_FAILED', 'POSTCONDITION_FAILED', 'UNVERIFIED')
            row['checks'].append(dict(phase=kind, outcome=outcome if isinstance(outcome, str) and outcome in allowed else 'unknown', position=position))
            if kind == 'gate' and outcome in ('BLOCK', 'REVISE', 'ESCALATE'): row['blocked'] = True
    output = []
    for row in calls.values():
        started = row.pop('started'); results = row.pop('results'); blocked = row.pop('blocked')
        if len(results) > 1 or blocked and (started or results): state = 'conflicting'
        elif blocked: state = 'blocked'
        elif results and not started: state = 'result_only'
        elif results: state = next(iter(results))
        elif started: state = 'incomplete'
        else: state = 'unknown'
        row['state'] = state; row['sources'] = sorted(row['sources']); output.append(row)
    return dict(version=1, calls=output, duplicates=duplicates, malformed=malformed, truncated=truncated,
                arguments='omitted', timing='unavailable', completeness='supplied records only')
