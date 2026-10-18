"""Bounded, one-use proposal correlation for concurrent pi tool calls."""
from collections import deque, OrderedDict
import difflib
from datetime import datetime
import copy
import hashlib
import json
import os
import re
from harness.judgements import NO_CARD
from pathlib import Path
import threading
import time
import uuid
from .models import ActionProposal, ActionOutcome, ExecutionResult
from .protocol import Protocol, project_root, commit_folder, test_folder, is_documentation, test_invocation
from .paperwork import Paperwork
from . import rules, test_runs
from harness import reports
from harness.decision_log import record as record_decision

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
        self.edit_failures = OrderedDict()
        self.lock = threading.Lock()
        self.events = deque(maxlen=200)
        self.event_sequence = 0
        self.protocol = Protocol(protocol_file)
        # Plan 184: the paperwork for each request (the extension says when one starts and ends); token → request and note.
        self.paperwork = Paperwork(self.protocol, data=Path(events_file).parent if events_file else None)
        from harness.judgements import Judgements
        self.judgements=Judgements(self.paperwork)
        self.request_of, self.notes = {}, {}
        self.sandboxed, self.sandbox_refusals = {}, {}  # task 311: tokens of test runs Gate put in the sandbox (their network), and what it refused
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

    def record_event(self, phase, outcome, proposal, reason, token=None, tool_call=None, cwd=None, source=None, rule=None, request=None):
        # Show scope, not uploaded file bodies or tool output.
        if self.paperwork.runs and cwd:
            root=project_root(cwd)
            if root:
                if (phase=='gate' and outcome!='ALLOW') or (phase=='audit' and outcome not in {'SUCCESS','VERIFIED'}):
                    self.paperwork.runs.add(root,'problems',{'reason':reason,'tool':proposal.tool_name,'rule':rule})
                command=proposal.args.get('command','')
                if phase=='audit' and outcome in {'SUCCESS','VERIFIED'} and isinstance(command,str) and re.search(r'\bgit\b[^;\n]*\bpush\b|\b(?:curl|wget|npm install|pip install|uv add|gh issue create|gh pr create|trash)\b',command):
                    self.paperwork.runs.add(root,'external',{'action':'Ran '+command[:500]})
        args = {key: str(value)[:500] for key, value in proposal.args.items()
                if key in {'command', 'cmd', 'script', 'path', 'pattern'}}
        with self.lock:
            self.event_sequence += 1
            self.events.append({'id': self.event_sequence, 'timestamp': datetime.now().astimezone().isoformat(timespec='seconds'),
                                'phase': phase, 'outcome': outcome, 'tool': proposal.tool_name,
                                'args': args, 'reason': reason, 'proposal_id': token, 'tool_call': tool_call,
                                'cwd': cwd, 'source': source, **({'rule': rule} if rule else {}), **({'request': request} if request else {})})  # task 129: where it ran, web or terminal; plan 179: the rule that decided; task 273: the request it belongs to
            self.count(self.events[-1]); identifier = self.event_sequence
            if self.events_file:
                with self.events_file.open('a', encoding='utf-8') as handle: handle.write(json.dumps(self.events[-1]) + '\n')
        # Task 261: an allowed call and a successful audit are not decisions (gate-events.jsonl keeps them); a refusal is.
        # Task 273: it names its event, so an expert's decision row shows the command or path without this log keeping it.
        if not (phase=='gate' and outcome=='ALLOW' or phase=='audit' and outcome in {'SUCCESS','VERIFIED'}):record_decision(self.paperwork.data,request,'command_allowed' if phase=='gate' and proposal.tool_name=='execute_command' else 'tool_permission' if phase=='gate' else 'tool_audit','code',outcome,rule=rule or ('gate.preflight' if phase=='gate' else 'gate.audit'),event=identifier)

    def report(self, kind, detail, **fields):
        if self.events_file: reports.report(self.events_file.parent, kind, detail, **fields)

    def test_runs(self):
        return test_runs.read(self.events_file.parent if self.events_file else None)

    def recent_events(self):
        with self.lock:
            return copy.deepcopy(list(self.events))

    def start_request(self, request, cwd, text):
        return None if rules.bare() else self.paperwork.start(request, cwd, text)

    def request_advice(self,request):
        item=self.paperwork.requests.get(request)
        if not item:return None
        text=item['text']
        if text.startswith('Choice: '):return None  # task 290 (review item 5): an answer is never read as a new request
        waiting=self.paperwork.waiting_choice(item['root'])
        if waiting:advice=self.judgements.decide(request,'waiting_reply',[text,waiting['question']])
        elif re.search(r'\b(?:phase|discuss|discussion|planning|implementation)\b|計画|実装|議論',text,re.I):
            # Task 324 (live finding 8): no notice when the phase the words name is the phase the project is in.
            try:current=self.paperwork.phases.get(item['root'])['phase']
            except Exception:current=None
            named={phase for phase,words in (('discussion',r'\bdiscuss(?:ion)?\b|議論'),('planning',r'\bplan(?:ning)?\b|計画'),('implementation',r'\bimplement(?:ation)?\b|\bbuild\b|実装')) if re.search(words,text,re.I)}
            if current and named=={current}:return None
            advice=self.judgements.decide(request,'phase_intent',[text])
            if current and not advice.get('abstained') and advice.get('answer')==current:return None
        else:return None
        # Task 290 (review item 4): a card raised before Pi read the message keeps it; Pi gets it after the answer.
        if advice.get('choice'):self.paperwork.hold(request,text)
        return advice

    def held(self, request):
        """The person's messages a question interrupted, for the request that answers it (once)."""
        return list((self.paperwork.requests.get(request) or {}).get('held') or [])

    def end_request(self, request, review=True):
        result = self.paperwork.end(request,review=review)
        if result and result.get('outcome') not in ('committed', 'nothing changed', 'continue'): self.report('paperwork', f"{result['outcome']}: {result.get('reason', '')}", request=request, task=result.get('task'))
        return result

    def last_note(self, token):
        return self.notes.pop(token, None)

    def last_sandbox_refusal(self, token):
        """Task 311: what the sandbox refused in this run, for the person's notice (the note carries it to Pi)."""
        return self.sandbox_refusals.pop(token, None)

    MEMORY_LIMIT, MEMORY_GROWTH = 32 * 1024, 4 * 1024

    def memory_change(self, pi_tool, args, cwd):
        """Task 290: AGENTS.md (the shared memory, $PI_HARNESS_MEMORY or <data>/AGENTS.md) takes a short lesson in any
        phase, outside every project's plan. None: not the memory file; '': allowed; else why not (size-guarded: at most
        32 KiB, 4 KiB more at a time, never cut to less than half)."""
        if pi_tool not in ('write','edit') or not isinstance(args.get('path'),str):return None
        try:target=(Path(cwd or '.')/Path(args['path']).expanduser()).resolve()
        except (OSError,ValueError):return None
        files={Path(path).expanduser().resolve() for path in (os.environ.get('PI_HARNESS_MEMORY'),Path(self.paperwork.data)/'AGENTS.md' if self.paperwork.data else None) if path}
        if target not in files:return None
        try:before=target.read_text(encoding='utf-8') if target.is_file() else ''
        except (OSError,UnicodeDecodeError):return None
        if pi_tool=='write':after=args.get('content')
        else:after,_=apply_edits(before,args,target.name)
        if not isinstance(after,str):return None  # the usual checks say what is wrong with the call
        size=len(after.encode());grown=size-len(before.encode())
        if size>self.MEMORY_LIMIT:return f'Not written: {target.name} would be {size:,} bytes; it stays at most {self.MEMORY_LIMIT//1024} KiB because it joins every request. Shorten or merge lessons instead.'
        if grown>self.MEMORY_GROWTH:return f'Not written: add at most {self.MEMORY_GROWTH//1024} KiB to {target.name} at a time: one short lesson with its cause and prevention.'
        if before.strip() and len(after.strip())<len(before.strip())//2:return f'Not written: keep {target.name}’s instructions; remove at most half of it at a time.'
        return ''

    def propose(self, tool_name, args, auth_level, pi_tool=None, cwd=None, tool_call_id=None, source=None, request=None, assistant_text=""):
        from .phases import harness_read_only
        from harness.autonomy import enabled as automatic
        console_change=pi_tool=='harness' and not harness_read_only(args,applies=automatic(self.paperwork.data))
        if console_change:tool_name='write_file'
        proposal = ActionProposal(tool_name, copy.deepcopy(args), 'pi tool call', authorization=auth_level)
        def refuse(rule_id, reason, said=None):
            outcome, said = rules.BY_ID[rule_id].outcome, said or rules.decided(rule_id, reason)
            self.record_event('gate', outcome, proposal, said, tool_call=tool_call_id, cwd=cwd, source=source, rule=rule_id, request=request)
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
        memory=None if rules.bare() else self.memory_change(pi_tool,args,cwd)
        if memory:return refuse('G-015',memory)
        root=None
        if not rules.bare() and memory is None:
            if pi_tool in ('write','edit') and isinstance(args.get('path'),str):
                target=Path(args['path']).expanduser()
                root=self.paperwork.project_root((Path(cwd or '.')/target).resolve())
            root=root or (self.paperwork.project_root(cwd) if cwd else None)
            outside=False
            if root is None and (console_change or pi_tool in ('write','edit','bash','powershell','browser','music','propose_plan')):
                root=(Path(cwd or '.')/Path(args['path']).expanduser()).resolve().parent if pi_tool in ('write','edit') else Path(cwd or '.').resolve()
                outside=True  # task 263: not a project (neither registered nor with ROADMAP.md)
        if root:
            from .phases import refusal
            phase = self.paperwork.phases.get(root)['phase']
            task = self.paperwork.active_scope(root)
            audit=False
            if pi_tool=='harness' and args.get('command')=='audit' and task:
                import shlex
                try:
                    words=shlex.split(str(args.get('args') or ''))
                    plan=self.paperwork.plan_state(root);active=plan['tasks'][plan.get('index',0)]
                    audit=bool(re.fullmatch(r'tasks/\d+-ready-to-publish\.md',active)) and len(words)<=1 and (Path(cwd or '.')/Path(words[0] if words else '.')).resolve()==root
                except (ValueError,KeyError,IndexError):pass
            reason = None if phase=='implementation' and audit else refusal(phase, root, tool_name, args, cwd=cwd, pi_tool=pi_tool, task=task, approved=bool(task))
            if reason and phase=='implementation' and task and pi_tool in ('write','edit') and request in self.paperwork.requests:
                from .scope import widen  # round 12 (task 261): a file outside the task is the person's question
                asked=widen(self.paperwork,request,root,args,cwd,task,assistant_text)
                if asked:return {**refuse('G-015',asked['reason']),'phase':phase,'judgement':{'choice':asked['choice']}}
            if reason and outside and phase=='discussion' and not self.paperwork.phases.get(root)['history']:
                from .phases import not_a_project
                reason=not_a_project(root,tool_name)
            if reason:
                judgement=None
                if tool_name=='execute_command' and request in self.paperwork.requests:
                    from .phase_shell import read_only,test_run
                    if not read_only(command) and not test_run(command):
                        judgement=self.judgements.decide(request,'shell_risk',[command,str(root)])  # task 263: json.dumps cannot take a Path
                return {**refuse('G-015', reason), 'phase':phase, **({'judgement':judgement} if judgement else {})}
            waiting=self.paperwork.waiting_choice(root) if tool_name == 'write_file' else None
            if waiting and waiting.get('system_owned') and ((waiting.get('judgement') or {}).get('kind') in NO_CARD or (waiting.get('request')!=request and waiting.get('request') not in self.paperwork.requests)):
                # Task 324 (live: a never-shown "Which guide should Pi use?" blocked every write of later requests): a
                # question System 1 raised for a request that has ended, or one System 1 decides itself, never blocks work.
                self.paperwork.settle_waiting(root,'its request ended');waiting=None
            if waiting:
                return refuse('G-017','A choice is waiting for the person. Ask with ask_choices and wait for the answer before changing content.')
            if tool_name == 'write_file' and phase == 'implementation':
                rejected=rules.planning_refusal(task,assistant_text,required=False,recorded=self.paperwork.active_decisions(root))
                if rejected:return refuse(*rejected)
                if re.search(r"will be|we(?:['’]ll| will) use|I(?:['’]ve| have) chosen|(?:have|has) been (?:chosen|selected)|decided|にします|採用|決めました",assistant_text,re.I) and request in self.paperwork.requests:
                    judgement=self.judgements.decide(request,'assumed_value',[self.paperwork.requests[request]['text'],assistant_text])
                    if judgement['abstained'] or judgement['answer'] is not False:
                        return {**refuse('G-016','An unstated value could not be ruled out. Ask the person before using it.'),'judgement':judgement}

        expected = None
        if root and tool_name == 'execute_command' and isinstance(command, str):
            from .phase_shell import test_run as allowed_test
            if allowed_test(command):  # task 311: an allowed test run executes the model's code; it runs in the sandbox
                from . import sandbox
                wrapped = sandbox.wrap(command, root, self.paperwork.data)
                if wrapped: response.update(command=wrapped, sandbox=sandbox.widened(self.paperwork.data, root)['network'])
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
                    key=(request,str(path.resolve()))
                    with self.lock:
                        repeated=key in self.edit_failures
                        self.edit_failures[key]=True;self.edit_failures.move_to_end(key)
                        while len(self.edit_failures)>self.limit:self.edit_failures.popitem(last=False)
                    if repeated:
                        edits=args.get('edits', [args])
                        if isinstance(edits,str):
                            try:edits=json.loads(edits)
                            except ValueError:edits=[]
                        if isinstance(edits,dict):edits=[edits]
                        lines=original.splitlines()
                        hints=[]
                        for edit in edits if isinstance(edits,list) else []:
                            old=edit.get('oldText','') if isinstance(edit,dict) else ''
                            size=len(old.splitlines())
                            # Bound diagnostic work and output, even for a model's giant replacement attempt.
                            if not old or size>80:continue
                            windows=['\n'.join(lines[n:n+size]) for n in range(min(len(lines)-size+1,20000))]
                            for match in difflib.get_close_matches(old,windows,n=2,cutoff=.4):
                                if match not in hints:hints.append(match)
                        if hints:reason+='\nClosest current text (copy exactly):\n'+'\n---\n'.join(hints[:3])[:6000]
                    return refuse('G-004', reason)
            root = self.paperwork.project_root(path.parent) if rules.plan_file(path) and not rules.bare() else None
            if root:
                written = rules.model_decisions(path.read_text(errors='replace') if path.is_file() else '', content)
                if written: return refuse('G-017', written)
            if root and not path.exists() and re.search(r'^\s*[-*+] \[[ xX~]\]',content,re.M):return refuse('G-010','System 1 lays out and ticks task boxes. Use propose_plan for task content and run the checks.')
            if root and path.is_file():
                original = path.read_text(errors='replace')
                shrinks = rules.plan_shrinks(original, content) if pi_tool == 'write' else None
                if shrinks:
                    return refuse('G-009', f'this write replaces {path.name} and {shrinks}')
                if re.findall(r'^\s*[-*+] \[[ xX~]\].*$',original,re.M)!=re.findall(r'^\s*[-*+] \[[ xX~]\].*$',content,re.M):
                    return refuse('G-010','System 1 lays out and ticks task boxes. Use propose_plan for task content and run the checks.')
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
            if response.get('sandbox'): self.sandboxed[token] = response['sandbox']
        self.record_event('gate', 'ALLOW', proposal, 'Approved before execution.', token, tool_call_id, cwd=cwd, source=source, request=request)
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
        network = self.sandboxed.pop(token, None)
        if network and proposal.tool_name == 'execute_command':
            from .sandbox import refusal
            refused = refusal(output, exit_code, network)
            if refused:
                self.notes[token] = '\n'.join(filter(None, [self.notes.get(token), refused])); self.sandbox_refusals[token] = refused
                self.report('sandbox', refused, tool=proposal.tool_name, cwd=cwd, source=source)
        request = self.request_of.pop(token, None)
        folder = test_folder(command, cwd) if isinstance(command, str) and proposal.tool_name == 'execute_command' else None
        if folder and self.events_file and event.status in ('SUCCESS', 'EXECUTION_FAILED'):
            try:
                test_runs.record(self.events_file.parent, request=request, project=project_root(folder) or folder, cwd=folder,
                                 command=command, exit_code=exit_code, duration=self.clock() - created, output=output)
            except OSError as error: self.report('test-log', str(error), request=request, cwd=cwd)
        if request:  # plan 184: the paperwork sees what happened (a test run, a first change) and may have a note for Pi
            # Task 260: a `--help` call or a run where no test ran is neither Red nor Green in the task's progress.
            if isinstance(command, str) and test_folder(command, cwd) and event.status in ('SUCCESS', 'EXECUTION_FAILED') and test_invocation(command, output):
                self.paperwork.ran(request, command, exit_code == 0)
            note = self.paperwork.observe(request)
            if note: self.notes[token] = '\n'.join(filter(None, [self.notes.get(token), note]))
        self.record_event('audit', event.status, proposal, event.reasoning, token, tool_call_id, cwd=cwd, source=source,
                          rule={'DRIFT_DETECTED': 'G-006', 'POSTCONDITION_FAILED': 'G-007'}.get(event.status),request=request)
        return event
