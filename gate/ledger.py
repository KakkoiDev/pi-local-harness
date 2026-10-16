"""Bounded, one-use proposal correlation for concurrent pi tool calls."""
from collections import deque
from datetime import datetime
import copy
import hashlib
import json
import re
from pathlib import Path
import threading
import time
import uuid
from .models import ActionProposal, ActionOutcome, ExecutionResult
from .protocol import Protocol, project_root, commit_folder, test_folder, is_documentation
from .paperwork import Paperwork
from . import rules, test_runs
from harness import reports

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


def syntax_problem(path):
    """Strategy 2 (OpenCode's diagnostics after an edit): why a written Python, JavaScript or JSON file does not parse,
    in one line with its line number, or None."""
    path = Path(path)
    try: text = path.read_text(encoding='utf-8')
    except (OSError, UnicodeDecodeError): return None
    if path.suffix == '.py':
        try: compile(text, str(path), 'exec')
        except SyntaxError as error: return f'{path.name} does not parse: {error.msg} at line {error.lineno}.'
    elif path.suffix == '.json':
        try: json.loads(text)
        except ValueError as error: return f'{path.name} does not parse: {error}.'
    elif path.suffix in ('.js', '.mjs', '.cjs'):
        import subprocess
        try: checked = subprocess.run(['node', '--check', str(path)], capture_output=True, text=True, timeout=20)
        except (OSError, subprocess.SubprocessError): return None
        if checked.returncode:
            lines = checked.stderr.strip().splitlines()
            where = next((line for line in lines if line.startswith(str(path))), '').rsplit(':', 1)[-1]
            said = next((line for line in lines if 'Error' in line), lines[-1] if lines else 'syntax error')
            return f"{path.name} does not parse: {said.strip()}{f' at line {where}' if where.isdigit() else ''}."
    return None


class ProposalLedger:
    def __init__(self, engine, clock=time.monotonic, limit=1024, ttl=3600, protocol_file=None, events_file=None):
        self.engine, self.clock, self.limit, self.ttl = engine, clock, limit, ttl
        self.pending = {}
        self.lock = threading.Lock()
        self.events = deque(maxlen=200)
        self.event_sequence = 0
        self.protocol = Protocol(protocol_file)
        # Plan 184: the paperwork for each request (the extension says when one starts and ends); token → request and note.
        self.paperwork = Paperwork(self.protocol, data=Path(events_file).parent if events_file else None)
        self.request_of, self.notes = {}, {}
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

    def record_event(self, phase, outcome, proposal, reason, token=None, tool_call=None, cwd=None, source=None, rule=None):
        # Show scope, not uploaded file bodies or tool output.
        args = {key: str(value)[:500] for key, value in proposal.args.items()
                if key in {'command', 'cmd', 'script', 'path', 'pattern'}}
        with self.lock:
            self.event_sequence += 1
            self.events.append({'id': self.event_sequence, 'timestamp': datetime.now().astimezone().isoformat(timespec='seconds'),
                                'phase': phase, 'outcome': outcome, 'tool': proposal.tool_name,
                                'args': args, 'reason': reason, 'proposal_id': token, 'tool_call': tool_call,
                                'cwd': cwd, 'source': source, **({'rule': rule} if rule else {})})  # task 129: where it ran, web or terminal; plan 179: the rule that decided
            self.count(self.events[-1])
            if self.events_file:
                with self.events_file.open('a', encoding='utf-8') as handle: handle.write(json.dumps(self.events[-1]) + '\n')

    def report(self, kind, detail, **fields):
        if self.events_file: reports.report(self.events_file.parent, kind, detail, **fields)

    def test_runs(self):
        return test_runs.read(self.events_file.parent if self.events_file else None)

    def recent_events(self):
        with self.lock:
            return copy.deepcopy(list(self.events))

    def start_request(self, request, cwd, text):
        return None if rules.bare() else self.paperwork.start(request, cwd, text)

    def end_request(self, request, review=True):
        result = self.paperwork.end(request,review=review)
        if result and result.get('outcome') not in ('committed', 'nothing changed', 'continue'): self.report('paperwork', f"{result['outcome']}: {result.get('reason', '')}", request=request, task=result.get('task'))
        return result

    def last_note(self, token):
        return self.notes.pop(token, None)

    def propose(self, tool_name, args, auth_level, pi_tool=None, cwd=None, tool_call_id=None, source=None, request=None, assistant_text=""):
        proposal = ActionProposal(tool_name, copy.deepcopy(args), 'pi tool call', authorization=auth_level)
        def refuse(rule_id, reason, said=None):
            outcome, said = rules.BY_ID[rule_id].outcome, said or rules.decided(rule_id, reason)
            self.record_event('gate', outcome, proposal, said, tool_call=tool_call_id, cwd=cwd, source=source, rule=rule_id)
            self.report('rule', said, rule=rule_id, tool=tool_name, source=source, cwd=cwd)  # plan 184: for the later analysis
            return {'outcome': outcome, 'reason': said, 'rule': rule_id}
        rule, reason = self.engine.rejection(proposal, auth_level)
        if rule:
            return refuse(rule.id, None, reason)
        response = {'outcome': 'ALLOW'}
        command = args.get('command') if tool_name == 'execute_command' else None
        if isinstance(command, str) and not rules.bare() and request in self.paperwork.requests and commit_folder(command, cwd):
            return refuse('G-013', 'the harness commits this request when the change is verified (tests failed first, then passed on the final code). Finish the work and run the tests; do not commit.')
        reason = self.protocol.commit_reason(cwd, command) if isinstance(command, str) else None
        if reason:
            return refuse('G-005', reason)
        root=project_root(cwd) if cwd and not rules.bare() else None
        if root and pi_tool in ('write','edit') and not rules.plan_file(Path(args.get('path',''))):
            item=self.paperwork.requests.get(request);task=''
            if item:
                from harness.context import mentioned
                paths=[path.relative_to(root).as_posix() for path in (root/'tasks').glob('*.md')]
                active=item.get('task') or next(iter(mentioned(item['text'],paths)),None)
                if active:task=(root/active).read_text(encoding='utf-8')
            if self.paperwork.waiting_choice(root):return refuse('G-017','A choice is waiting for the person. Ask with ask_choices and wait for the answer before changing content.')
            rejected=rules.planning_refusal(task,assistant_text,required=False)
            if rejected:return refuse(*rejected)
            if item and not is_documentation(args.get('path','')):
                status=self.paperwork.plan_status(request,small_fix=bool(re.search(r'^This is a small fix[.!]?\s*$',assistant_text,re.M|re.I)))
                if status['required'] and not status['approved']:
                    return refuse('G-015','Plan first: write the plan and ask the person to approve it with propose_plan before changing code.')
                if status['approved']:
                    from .planning import file_allowed
                    path=Path(args.get('path',''))
                    if path.is_absolute():
                        try:path=path.resolve().relative_to(root)
                        except ValueError:return refuse('G-015','Code must stay inside the active task’s project.')
                    if not file_allowed(task,path.as_posix()):return refuse('G-015','This file is outside the active task’s Files: line. Change the plan and ask for approval first.')
        expected = None
        if pi_tool in ('write', 'edit'):
            path = Path(args['path']).expanduser()
            if not path.is_absolute():
                path = Path(cwd or '.') / path
            if pi_tool == 'write':
                content = args['content']
            else:
                if not path.is_file():
                    return refuse('G-004', f'{path.name} does not exist; use write to create it.')
                original = path.read_text()
                content, reason = apply_edits(original, args, path.name)
                if reason:
                    return refuse('G-004', reason)
            root = project_root(path.parent) if rules.plan_file(path) and not rules.bare() else None
            if root and path.is_file():
                original = path.read_text(errors='replace')
                shrinks = rules.plan_shrinks(original, content) if pi_tool == 'write' else None
                if shrinks:
                    return refuse('G-009', f'this write replaces {path.name} and {shrinks}')
                for ticked in rules.newly_ticked(original, content):
                    word = re.match(r'(Red|Green)\b', ticked)
                    if word and word.group(1) == 'Red' and not self.protocol.failed_run(root):
                        return refuse('G-010', f'ticking “{ticked[:60]}” needs a failing test run first, and Gate has seen none in {root.name} since the last commit. Run the test and let it fail, then tick Red.')
                    if word and word.group(1) == 'Green' and not self.protocol.passing_now(root):
                        return refuse('G-010', f'ticking “{ticked[:60]}” needs the last test run in {root.name} to pass, and it did not (or none ran). Run the tests, then tick Green.')
            expected = (str(path.resolve()), hashlib.sha256(content.encode()).hexdigest())
        with self.lock:
            now = self.clock()
            self.pending = {key: value for key, value in self.pending.items() if now - value[0] < self.ttl}
            if len(self.pending) >= self.limit:
                raise ValueError('Too many pending proposals')
            token = str(uuid.uuid4())
            self.pending[token] = (now, proposal, expected, cwd, tool_call_id, source)
            if request: self.request_of[token] = request
        self.record_event('gate', 'ALLOW', proposal, 'Approved before execution.', token, tool_call_id, cwd=cwd, source=source)
        response['proposal_id'] = token
        return response

    def verification(self, cwd):
        """G-012 for terminal Pi: {state, code, verified} for the project around cwd, or None outside a project."""
        root = project_root(cwd) if cwd else None
        answer = self.protocol.verification(root) if root else None
        return {'state': answer[0], 'code': answer[1], 'verified': answer[2]} if answer else None

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
        if expected and exit_code == 0:  # strategy 2: the file Pi just wrote still parses
            problem = syntax_problem(expected[0])
            if problem:
                self.notes[token] = f'{problem} Fix it before going on.'
                self.report('syntax', problem, tool=proposal.tool_name, cwd=cwd, source=source)
        request = self.request_of.pop(token, None)
        folder = test_folder(command, cwd) if isinstance(command, str) and proposal.tool_name == 'execute_command' else None
        if folder and self.events_file and event.status in ('SUCCESS', 'EXECUTION_FAILED'):
            try:
                test_runs.record(self.events_file.parent, request=request, project=project_root(folder) or folder, cwd=folder,
                                 command=command, exit_code=exit_code, duration=self.clock() - created, output=output)
            except OSError as error: self.report('test-log', str(error), request=request, cwd=cwd)
        if request:  # plan 184: the paperwork sees what happened (a test run, a first change) and may have a note for Pi
            if isinstance(command, str) and test_folder(command, cwd) and event.status in ('SUCCESS', 'EXECUTION_FAILED'):
                self.paperwork.ran(request, command, exit_code == 0)
            note = self.paperwork.observe(request)
            if note: self.notes[token] = '\n'.join(filter(None, [self.notes.get(token), note]))
        self.record_event('audit', event.status, proposal, event.reasoning, token, tool_call_id, cwd=cwd, source=source,
                          rule={'DRIFT_DETECTED': 'G-006', 'POSTCONDITION_FAILED': 'G-007'}.get(event.status))
        return event
