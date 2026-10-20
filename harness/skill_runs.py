"""Host-side ICM contract proof, not an installer or an agent-facing approval API.

The embedding Gate supplies authorization and a registry of independent validators.
No checker named by a skill is executed. This API never changes phase, writes a
project document, invokes a model, installs hooks, or commits. Runtime adoption
and frontend controls remain separate work.
"""
import hashlib
import json
from pathlib import Path
import re
import uuid
from harness.learning import Curator, digest, scope

CAPABILITIES = frozenset(('read', 'write', 'network'))


def _hash(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def inspect_skill(folder, *, source, version, capabilities, validator):
    """Read a bounded ICM skill tree without executing directives or checkers."""
    folder=Path(folder)
    if folder.is_symlink() or not folder.is_dir():raise ValueError('Skill folder unavailable.')
    for value in (source, version, validator):
        if not isinstance(value,str) or not re.fullmatch(r'[A-Za-z0-9_.:/@+-]{1,128}',value):raise ValueError('Invalid skill metadata.')
    if not isinstance(capabilities,(list,tuple)) or any(not isinstance(x,str) or x not in CAPABILITIES for x in capabilities):raise ValueError('Unknown capability.')
    inventory={};size=0
    for path in sorted(folder.rglob('*')):
        if path.is_symlink():raise ValueError('Skill links are not accepted.')
        if path.is_dir():continue
        if not path.is_file() or len(inventory)>=256:raise ValueError('Skill inventory is unavailable or too large.')
        if path.stat().st_size>1024*1024:raise ValueError('Skill file too large.')
        body=path.read_bytes();size+=len(body)
        if size>4*1024*1024:raise ValueError('Skill inventory too large.')
        inventory[path.relative_to(folder).as_posix()]=hashlib.sha256(body).hexdigest()
    stages=sorted((name for name in inventory if re.fullmatch(r'stages/[0-9]{2,3}-[A-Za-z0-9_-]+\.md',name)),key=lambda name:int(name.split('/')[1].split('-')[0]))
    if 'SKILL.md' not in inventory or not stages:raise ValueError('A skill needs SKILL.md and numbered stages.')
    if len({int(name.split('/')[1].split('-')[0]) for name in stages})!=len(stages):raise ValueError('Duplicate stage number.')
    contract={'source':source,'version':version,'capabilities':sorted(set(capabilities)),
              'validator':validator,'inventory':inventory,'stages':stages}
    return {**contract,'digest':_hash(contract),'folder':str(folder.resolve())}


def _check(contract):
    try:
        fresh=inspect_skill(contract['folder'],source=contract['source'],version=contract['version'],
                            capabilities=contract['capabilities'],validator=contract['validator'])
        if fresh!=contract:raise ValueError('Skill contract changed.')
    except (KeyError,TypeError,OSError):raise ValueError('Skill contract unavailable.') from None


class SkillRuns:
    def __init__(self,data,*,authorize,validators):
        if not callable(authorize) or not isinstance(validators,dict) or not all(callable(v) for v in validators.values()):raise ValueError('Host policy and validators required.')
        self.brain=Curator(data);self.authorize=authorize;self.validators=dict(validators)

    def _table(self,db):
        db.execute('CREATE TABLE IF NOT EXISTS skill_runs(id TEXT PRIMARY KEY, project TEXT, request TEXT, contract TEXT, body TEXT)')

    def _authorize(self,project,request,contract):
        if contract['validator'] not in self.validators:raise ValueError('Independent validator unavailable.')
        # The host must check phase AND approved scope AND tool capabilities.
        if self.authorize(project,request,tuple(contract['capabilities'])) is not True:raise ValueError('Skill operation is outside the approved phase or scope.')

    def start(self,project,request,contract):
        _check(contract);self._authorize(project,request,contract)
        row={'id':uuid.uuid4().hex,'next':0,'status':'running','receipts':[]}
        with self.brain.database() as db:
            self._table(db)
            db.execute('INSERT INTO skill_runs VALUES(?,?,?,?,?)',(row['id'],scope(project),digest(request),contract['digest'],json.dumps(row)))
        return row

    def _load(self,db,identifier,project,request,contract):
        self._table(db)
        found=db.execute('SELECT * FROM skill_runs WHERE id=? AND project=? AND request=? AND contract=?',
                         (identifier,scope(project),digest(request),contract['digest'])).fetchone()
        if not found:raise ValueError('Run does not match this project, request and frozen contract.')
        return json.loads(found['body'])

    def resume(self,identifier,project,request,contract):
        _check(contract)
        with self.brain.database() as db:return self._load(db,identifier,project,request,contract)

    def advance(self,identifier,project,request,contract,*,expected_stage):
        _check(contract);self._authorize(project,request,contract)
        with self.brain.database() as db:
            row=self._load(db,identifier,project,request,contract)
            if row['status']!='running' or type(expected_stage) is not int or row['next']!=expected_stage:raise ValueError('Run is finished or stage changed; reload its state.')
            stage=contract['stages'][row['next']]
            try:passed=self.validators[contract['validator']](project,request,stage) is True
            except Exception:passed=False
            if not passed:raise ValueError('Validation did not pass; the run can be resumed.')
            _check(contract);self._authorize(project,request,contract)
            row['receipts'].append({'stage':row['next'],'validator':contract['validator'],'contract':contract['digest']})
            row['next']+=1
            if row['next']==len(contract['stages']):row['status']='completed'
            db.execute('UPDATE skill_runs SET body=? WHERE id=?',(json.dumps(row),identifier))
        if row['status']=='completed':
            # Optional collection cannot block a completed operation. No prose or
            # output enters the brain; a host validation is not a verified commit.
            try:self.brain.observe(project=project,request=request,source='skill:'+identifier,kind='signal',signature=contract['digest'],traits=['skill_run'])
            except Exception:pass
        return row

    def cancel(self,identifier,project,request,contract):
        _check(contract)
        with self.brain.database() as db:
            row=self._load(db,identifier,project,request,contract)
            if row['status']=='running':
                row['status']='cancelled';db.execute('UPDATE skill_runs SET body=? WHERE id=?',(json.dumps(row),identifier))
        return row
