"""Bounded, one-use proposal correlation for concurrent pi tool calls."""
from collections import deque
from datetime import datetime
import copy
import hashlib
import json
from pathlib import Path
import threading
import time
import uuid
from .models import ActionProposal, ActionOutcome, ExecutionResult
from .protocol import Protocol

def apply_edits(original, args, name='the file'):
    """The file after Pi's edit, as Pi applies it: each edits[].oldText matched once against the original, no overlaps.
    Pi 1.1 sends {path, edits: [{oldText, newText}]} (some models a JSON string or one object); older Pi sent
    {path, oldText, newText}. Returns (content, None) or (None, the reason to revise)."""
    edits = args.get('edits')
    if isinstance(edits, str):
        try: edits = json.loads(edits)
        except ValueError: return None, 'Edit could not be read: edits is not a list.'
    if isinstance(edits, dict): edits = [edits]
    if edits is None and 'oldText' in args: edits = [{'oldText': args['oldText'], 'newText': args.get('newText', '')}]
    if not isinstance(edits, list) or not edits or not all(isinstance(edit, dict) and isinstance(edit.get('oldText'), str) and isinstance(edit.get('newText'), str) for edit in edits):
        return None, 'Edit must list at least one oldText and newText.'
    spans = []
    for index, edit in enumerate(edits):
        # Say which edit and why: a bare "one exact occurrence" sent Pi to rewrite the whole file instead (task 173's run).
        text = edit['oldText']; found = original.count(text) if text else 0
        shown = '“' + (text if len(text) <= 60 else text[:60] + '…').replace('\n', '\\n') + '”'
        if found == 0:
            return None, f'Edit must identify one exact occurrence: edits[{index}].oldText is not in {name} ({shown}). Read the file again and copy the text exactly.'
        if found > 1:
            return None, f'Edit must identify one exact occurrence: edits[{index}].oldText occurs {found} times in {name} ({shown}); add surrounding lines to make it unique.'
        start = original.index(edit['oldText']); spans.append((start, start + len(edit['oldText']), edit['newText']))
    spans.sort()
    if any(spans[index][1] > spans[index + 1][0] for index in range(len(spans) - 1)):
        return None, 'Edits must not overlap.'
    content, at = [], 0
    for start, end, text in spans: content += [original[at:start], text]; at = end
    return ''.join(content + [original[at:]]), None


class ProposalLedger:
    def __init__(self, engine, clock=time.monotonic, limit=1024, ttl=3600, protocol_file=None, events_file=None):
        self.engine, self.clock, self.limit, self.ttl = engine, clock, limit, ttl
        self.pending = {}
        self.lock = threading.Lock()
        self.events = deque(maxlen=200)
        self.event_sequence = 0
        self.protocol = Protocol(protocol_file)
        # Checks survive a restart of plh: one JSON line per event, the last 200 read back (the person lost them on restart).
        self.events_file = Path(events_file) if events_file else None
        self.day = {}  # 'YYYY-MM-DD' -> {'today': n, 'blocked_today': n}: before-execution checks per day, beyond the 200 kept in memory
        if self.events_file and self.events_file.exists():
            lines = self.events_file.read_text(encoding='utf-8').splitlines()
            for line in lines:  # every saved check counts toward its own day
                try: self.count(json.loads(line))
                except ValueError: continue
            for line in lines[-200:]:
                try: self.events.append(json.loads(line))
                except ValueError: continue
            self.event_sequence = max((event.get('id', 0) for event in self.events), default=0)
            if len(lines) > 2000: self.events_file.write_text(''.join(json.dumps(event) + '\n' for event in self.events), encoding='utf-8')

    def count(self, event):
        if event.get('phase') != 'gate': return
        counts = self.day.setdefault(str(event.get('timestamp', ''))[:10], {'today': 0, 'blocked_today': 0})
        counts['today'] += 1; counts['blocked_today'] += event.get('outcome') != 'ALLOW'

    def counts_today(self):
        with self.lock: return dict(self.day.get(datetime.now().astimezone().date().isoformat(), {'today': 0, 'blocked_today': 0}))

    def record_event(self, phase, outcome, proposal, reason, token=None, tool_call=None, cwd=None, source=None):
        # Show scope, not uploaded file bodies or tool output.
        args = {key: str(value)[:500] for key, value in proposal.args.items()
                if key in {'command', 'cmd', 'script', 'path', 'pattern'}}
        with self.lock:
            self.event_sequence += 1
            self.events.append({'id': self.event_sequence, 'timestamp': datetime.now().astimezone().isoformat(timespec='seconds'),
                                'phase': phase, 'outcome': outcome, 'tool': proposal.tool_name,
                                'args': args, 'reason': reason, 'proposal_id': token, 'tool_call': tool_call,
                                'cwd': cwd, 'source': source})  # task 129: where it ran, web or terminal
            self.count(self.events[-1])
            if self.events_file:
                with self.events_file.open('a', encoding='utf-8') as handle: handle.write(json.dumps(self.events[-1]) + '\n')

    def recent_events(self):
        with self.lock:
            return copy.deepcopy(list(self.events))

    def propose(self, tool_name, args, auth_level, pi_tool=None, cwd=None, tool_call_id=None, source=None):
        proposal = ActionProposal(tool_name, copy.deepcopy(args), 'pi tool call', authorization=auth_level)
        outcome = self.engine.gatekeep(proposal, auth_level)
        response = {'outcome': outcome.value}
        if outcome != ActionOutcome.ALLOW:
            response['reason'] = self.engine.rejection_reason(proposal, auth_level) or 'Action denied by Gate policy.'
            self.record_event('gate', outcome.value, proposal, response['reason'], tool_call=tool_call_id, cwd=cwd, source=source)
            return response
        command = args.get('command') if tool_name == 'execute_command' else None
        reason = self.protocol.commit_reason(cwd, command) if isinstance(command, str) else None
        if reason:
            self.record_event('gate', 'REVISE', proposal, reason, tool_call=tool_call_id, cwd=cwd, source=source)
            return {'outcome': 'REVISE', 'reason': reason}
        expected = None
        if pi_tool in ('write', 'edit'):
            path = Path(args['path']).expanduser()
            if not path.is_absolute():
                path = Path(cwd or '.') / path
            if pi_tool == 'write':
                content = args['content']
            else:
                original = path.read_text()
                content, reason = apply_edits(original, args, path.name)
                if reason:
                    self.record_event('gate', 'REVISE', proposal, reason, tool_call=tool_call_id, cwd=cwd, source=source)
                    return {'outcome': 'REVISE', 'reason': reason}
            expected = (str(path.resolve()), hashlib.sha256(content.encode()).hexdigest())
        with self.lock:
            now = self.clock()
            self.pending = {key: value for key, value in self.pending.items() if now - value[0] < self.ttl}
            if len(self.pending) >= self.limit:
                raise ValueError('Too many pending proposals')
            token = str(uuid.uuid4())
            self.pending[token] = (now, proposal, expected, cwd, tool_call_id, source)
        self.record_event('gate', 'ALLOW', proposal, 'Approved before execution.', token, tool_call_id, cwd=cwd, source=source)
        response['proposal_id'] = token
        return response

    def complete(self, token, tool_name, args, output, exit_code):
        with self.lock:
            created, proposal, expected, cwd, tool_call_id, source = self.pending.pop(token)
        if self.clock() - created >= self.ttl:
            raise KeyError('Proposal expired')
        execution = ExecutionResult(tool_name, copy.deepcopy(args), output, exit_code)
        postcondition_ok = True
        if expected and exit_code == 0:
            path, digest = expected
            try:
                postcondition_ok = hashlib.sha256(Path(path).read_bytes()).hexdigest() == digest
            except OSError:
                postcondition_ok = False
        event = self.engine.audit(proposal, execution, postcondition_ok=postcondition_ok)
        command = proposal.args.get('command')
        if proposal.tool_name == 'execute_command' and isinstance(command, str) and event.status in ('SUCCESS', 'EXECUTION_FAILED'):
            self.protocol.record(cwd, command, exit_code == 0, output)
        self.record_event('audit', event.status, proposal, event.reasoning, token, tool_call_id, cwd=cwd, source=source)
        return event
