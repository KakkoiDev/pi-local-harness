"""Bounded, one-use proposal correlation for concurrent pi tool calls."""
import copy
import hashlib
from pathlib import Path
import threading
import time
import uuid
from .models import ActionProposal, ActionOutcome, ExecutionResult

class ProposalLedger:
    def __init__(self, engine, clock=time.monotonic, limit=1024, ttl=3600):
        self.engine, self.clock, self.limit, self.ttl = engine, clock, limit, ttl
        self.pending = {}
        self.lock = threading.Lock()

    def propose(self, tool_name, args, auth_level, pi_tool=None, cwd=None):
        proposal = ActionProposal(tool_name, copy.deepcopy(args), 'pi tool call', authorization=auth_level)
        outcome = self.engine.gatekeep(proposal, auth_level)
        response = {'outcome': outcome.value}
        if outcome != ActionOutcome.ALLOW:
            response['reason'] = self.engine.rejection_reason(proposal, auth_level) or 'Action denied by Laya policy.'
            return response
        expected = None
        if pi_tool in ('write', 'edit'):
            path = Path(args['path']).expanduser()
            if not path.is_absolute():
                path = Path(cwd or '.') / path
            if pi_tool == 'write':
                content = args['content']
            else:
                original = path.read_text()
                if original.count(args['oldText']) != 1:
                    return {'outcome': 'REVISE', 'reason': 'Edit must identify one exact occurrence.'}
                content = original.replace(args['oldText'], args['newText'], 1)
            expected = (str(path.resolve()), hashlib.sha256(content.encode()).hexdigest())
        with self.lock:
            now = self.clock()
            self.pending = {key: value for key, value in self.pending.items() if now - value[0] < self.ttl}
            if len(self.pending) >= self.limit:
                raise ValueError('Too many pending proposals')
            token = str(uuid.uuid4())
            self.pending[token] = (now, proposal, expected)
        response['proposal_id'] = token
        return response

    def complete(self, token, tool_name, args, output, exit_code):
        with self.lock:
            created, proposal, expected = self.pending.pop(token)
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
        return self.engine.audit(proposal, execution, postcondition_ok=postcondition_ok)
