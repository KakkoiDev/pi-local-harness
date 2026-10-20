"""Private System 1 evidence, never instructions or model-authored claims (task 343).

Only trusted harness producers call observe. All identifiers are one-way digests;
no prompts, output, file bodies or command arguments are stored. Durable brain
files and configuration remain under the ordinary phase/approval protocol.
"""
from contextlib import contextmanager
import hashlib
import json
import math
import os
from pathlib import Path
import re
import sqlite3
import time

CATEGORIES = ('environment', 'workflow_recovery', 'testing', 'app_blocks', 'skills', 'project_knowledge', 'unclassified')
KINDS = ('failure', 'test_failed', 'test_passed', 'verified_commit', 'signal')
TRAITS = {'runtime':'environment','network':'environment','filesystem':'project_knowledge','test_runner':'testing','skill_run':'skills','app_block':'app_blocks','project_document':'project_knowledge'}
VERSION = 'curator-1'
TTL = 30 * 86400


def digest(value):
    if not isinstance(value,str) or not value or len(value)>65536:raise ValueError('Expected a bounded evidence identifier.')
    return hashlib.sha256(value.encode()).hexdigest()


def scope(project):
    # The same Mac folder can arrive under /var or /private/var.
    return digest(str(Path(project).resolve()) if isinstance(project,str) and Path(project).is_absolute() else project)


class Curator:
    def __init__(self,data,*,clock=time.time,classifier=None,policy=None,max_events=10000):
        self.folder=Path(data)/'brain';self.clock=clock;self.classifier=classifier;self.policy=policy;self.max_events=max_events
        if not isinstance(max_events,int) or isinstance(max_events,bool) or not 1<=max_events<=100000:raise ValueError('Invalid evidence budget.')
        # No confidence default: a deployment must supply a measured policy to use Laya.
        if policy is not None:
            confidence=policy.get('min_confidence');version=policy.get('version')
            if not isinstance(version,str) or not re.fullmatch(r'[A-Za-z0-9_.-]{1,64}',version) or isinstance(confidence,bool) or not isinstance(confidence,(int,float)) or not math.isfinite(confidence) or not 0<=confidence<=1:raise ValueError('Invalid calibrated policy.')

    @contextmanager
    def database(self):
        if self.folder.is_symlink():raise ValueError('The private evidence directory cannot be a link.')
        self.folder.mkdir(parents=True,exist_ok=True,mode=0o700)
        self.folder.chmod(0o700)
        path=self.folder/'evidence.sqlite3'
        if path.is_symlink():raise ValueError('The evidence database cannot be a link.')
        descriptor=os.open(path,os.O_CREAT|os.O_RDWR|getattr(os,'O_NOFOLLOW',0),0o600)
        os.fchmod(descriptor,0o600);os.close(descriptor)
        db=sqlite3.connect(path,timeout=.5);db.row_factory=sqlite3.Row
        try:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS events(seq INTEGER PRIMARY KEY, id TEXT UNIQUE, project TEXT, request TEXT, kind TEXT, signature TEXT, revision TEXT, stamp REAL, active INTEGER DEFAULT 1, reference TEXT);
                CREATE INDEX IF NOT EXISTS event_scope ON events(project,signature,request,seq);
                CREATE TABLE IF NOT EXISTS entries(id TEXT PRIMARY KEY, project TEXT, body TEXT);
                CREATE TABLE IF NOT EXISTS history(seq INTEGER PRIMARY KEY, id TEXT, project TEXT, body TEXT);
                CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value INTEGER);
            """)
            db.execute('BEGIN IMMEDIATE')
            yield db
            db.commit()
        finally:db.close()

    def save(self,db,project,row):
        body=json.dumps(row,sort_keys=True,separators=(',',':'))
        old=db.execute('SELECT body FROM entries WHERE id=?',(row['id'],)).fetchone()
        if old and old['body']==body:return
        db.execute('INSERT OR REPLACE INTO entries VALUES(?,?,?)',(row['id'],project,body))
        db.execute('INSERT INTO history(id,project,body) VALUES(?,?,?)',(row['id'],project,body))

    def category(self,kind,traits=()):
        if kind!='signal':return ('testing' if kind.startswith('test_') or kind=='verified_commit' else 'workflow_recovery','code',None,VERSION)
        categories={TRAITS[item] for item in traits}
        if len(categories)==1:return next(iter(categories)),'code',None,VERSION
        if traits and self.policy is not None and self.classifier is not None:
            try:
                result=self.classifier.ask('choice',{'event_kind':kind,'traits':list(traits)},'Categorize this structured evidence only; abstain when its metadata is insufficient.',options=list(CATEGORIES),min_confidence=self.policy['min_confidence'])
                confidence=result.get('confidence')
                if result.get('abstained') is False and result.get('answer') in CATEGORIES and not isinstance(confidence,bool) and isinstance(confidence,(int,float)) and math.isfinite(confidence) and self.policy['min_confidence']<=confidence<=1:
                    return result['answer'],'laya',confidence,self.policy['version']
            except Exception:pass
        return 'unclassified','code',None,VERSION

    def observe(self,*,project,source,kind,request,signature='',revision=None,traits=()):
        if kind not in KINDS:raise ValueError('Unknown learning event.')
        if not isinstance(traits,(list,tuple)) or len(traits)>len(TRAITS) or any(not isinstance(item,str) or item not in TRAITS for item in traits):raise ValueError('Only allowlisted structural traits are accepted.')
        if kind=='verified_commit' and (not isinstance(revision,str) or not re.fullmatch(r'[0-9a-f]{12,40}',revision)):raise ValueError('A verified commit needs its revision.')
        p,q=scope(project),digest(request);signature=digest(signature or kind)
        identifier=digest(p+':'+kind+':'+source)
        with self.database() as db:
            setting=db.execute("SELECT value FROM settings WHERE key='paused'").fetchone()
            if setting and setting['value']:return
            if db.execute('SELECT count(*) FROM events').fetchone()[0]>=self.max_events:return
            if db.execute('SELECT 1 FROM events WHERE id=?',(identifier,)).fetchone():return
            reference=None
            if kind.startswith('test_') and re.fullmatch(r'[0-9a-f]{32}',source):reference='test-runs/'+source
            elif kind=='failure' and re.fullmatch(r'[0-9]{1,16}',source):reference='gate-events/'+source
            elif kind=='verified_commit':reference='commit/'+revision
            db.execute('INSERT INTO events(id,project,request,kind,signature,revision,stamp,reference) VALUES(?,?,?,?,?,?,?,?)',(identifier,p,q,kind,signature,revision,self.clock(),reference))
            signatures=[signature]
            for sig in signatures:
                events=[dict(row) for row in db.execute('SELECT * FROM events WHERE project=? AND signature=? AND active=1 AND stamp>=? ORDER BY seq',(p,sig,self.clock()-TTL))]
                failures=[row for row in events if row['kind'] in ('failure','test_failed')]
                proof=[]
                if kind=='verified_commit':
                    passed=[row for row in events if row['kind']=='test_passed' and row['request']==q]
                    if passed:
                        last=passed[-1];failed=[row for row in events if row['kind']=='test_failed' and row['request']==q and row['seq']<last['seq']]
                        if failed and not any(x['kind']=='test_failed' and x['seq']>last['seq'] for x in events):proof=[failed[-1]['id'],last['id'],identifier]
                if not proof and len(failures)<2 and kind!='signal':continue
                key=digest(p+':'+sig)
                previous=db.execute('SELECT body FROM entries WHERE id=?',(key,)).fetchone()
                old=json.loads(previous['body']) if previous else None
                if old and old['expires']<=self.clock() and old['status']!='rejected':
                    old['status']='stale';self.save(db,p,old)
                if old and old['status']=='rejected':continue
                if old and old['status']=='stale' and not (proof and revision!=old['revision'] and not set(proof).intersection(old['evidence'])):continue
                category,who,confidence,version=self.category('test_failed' if failures and failures[-1]['kind']=='test_failed' else kind,traits)
                row={'id':key,'scope':p,'category':category,'who':who,'confidence':confidence,'policy':version,'rule':VERSION,
                     'status':'verified' if proof else 'observed','occurrences':len(failures) or 1,
                     'evidence':proof or [x['id'] for x in failures[-16:]] or [identifier],
                     'revision':revision if proof else None,'updated':self.clock(),'expires':self.clock()+TTL}
                if old and old['who']=='person':
                    row.update(category=old['category'],who='person',confidence=None,policy='person')
                if old and old['status'] in ('verified','contradicted') and not proof:
                    row={**old,'occurrences':max(old['occurrences'],len(failures))}
                    if kind in ('test_failed','failure'):row.update(status='contradicted',evidence=list(dict.fromkeys(old['evidence']+[identifier])))
                self.save(db,p,row)

    def retrieve(self,project,*,limit=20,include_inactive=False):
        if isinstance(limit,bool) or not isinstance(limit,int) or not 1<=limit<=1000:raise ValueError('Invalid retrieval budget.')
        p=scope(project);rows=[]
        with self.database() as db:
            for item in db.execute('SELECT body FROM entries WHERE project=? ORDER BY rowid DESC',(p,)).fetchall():
                row=json.loads(item['body'])
                if row['expires']<=self.clock() and row['status'] not in ('stale','rejected'):
                    row['status']='stale';self.save(db,p,row)
                if include_inactive or row['status'] in ('observed','verified'):rows.append(row)
                if len(rows)>=limit:break
        return rows

    def invalidate(self,project,source):
        p=scope(project)
        with self.database() as db:
            identifiers=[];affected=set()
            for kind in KINDS:
                identifier=digest(p+':'+kind+':'+source);identifiers.append(identifier)
                for event in db.execute('SELECT signature FROM events WHERE id=? AND project=?',(identifier,p)):
                    affected.add(digest(p+':'+event['signature']))
                db.execute('UPDATE events SET active=0 WHERE id=? AND project=?',(identifier,p))
            for item in db.execute('SELECT body FROM entries WHERE project=?',(p,)).fetchall():
                row=json.loads(item['body'])
                if (row['id'] in affected or set(identifiers).intersection(row['evidence'])) and row['status']!='rejected':row['status']='stale';self.save(db,p,row)

    def reject(self,project,identifier):
        p=scope(project)
        with self.database() as db:
            item=db.execute('SELECT body FROM entries WHERE id=? AND project=?',(identifier,p)).fetchone()
            if item:
                row=json.loads(item['body']);row['status']='rejected';self.save(db,p,row)

    def restore(self,project,identifier):
        p=scope(project)
        with self.database() as db:
            items=db.execute('SELECT body FROM history WHERE id=? AND project=? ORDER BY seq DESC',(identifier,p)).fetchall()
            if not items or json.loads(items[0]['body'])['status']!='rejected':raise ValueError('Only rejected entries can be restored.')
            for item in items:
                row=json.loads(item['body'])
                if row['status']=='rejected':continue
                if row['status'] not in ('observed','verified'):raise ValueError('Conflicting evidence cannot be restored.')
                if row['expires']<=self.clock():raise ValueError('Expired evidence cannot be restored.')
                for key in row['evidence']:
                    source=db.execute('SELECT active FROM events WHERE id=? AND project=?',(key,p)).fetchone()
                    if not source or not source['active']:raise ValueError('Invalidated evidence cannot be restored.')
                row['restored']=True;self.save(db,p,row);return
            raise ValueError('No active revision to restore.')

    def correct_category(self,project,identifier,category):
        if category not in CATEGORIES:raise ValueError('Unknown knowledge category.')
        p=scope(project)
        with self.database() as db:
            item=db.execute('SELECT body FROM entries WHERE id=? AND project=?',(identifier,p)).fetchone()
            if item:
                row=json.loads(item['body']);row.update(category=category,who='person',confidence=None,policy='person');self.save(db,p,row)

    def evidence(self,project,identifier):
        p=scope(project)
        with self.database() as db:
            entry=db.execute('SELECT body FROM entries WHERE id=? AND project=?',(identifier,p)).fetchone()
            if not entry:return []
            rows=[]
            for key in json.loads(entry['body'])['evidence']:
                item=db.execute('SELECT id,kind,revision,stamp,reference,active FROM events WHERE id=? AND project=?',(key,p)).fetchone()
                if item:rows.append({'id':item['id'],'kind':item['kind'],'revision':item['revision'],'time':item['stamp'],'source':item['reference'],'active':bool(item['active'])})
            return rows

    def history(self,project,identifier):
        with self.database() as db:return [json.loads(x['body']) for x in db.execute('SELECT body FROM history WHERE id=? AND project=? ORDER BY seq',(identifier,scope(project)))]

    def status(self):
        with self.database() as db:
            count=db.execute('SELECT count(*) FROM events').fetchone()[0]
            paused=db.execute("SELECT value FROM settings WHERE key='paused'").fetchone()
            return {'paused':bool(paused and paused['value']),'events':count,'event_budget':self.max_events,'budget_exhausted':count>=self.max_events,'policy':VERSION}

    def pause(self,paused=True):
        if not isinstance(paused,bool):raise ValueError('Pause must be explicit.')
        with self.database() as db:db.execute("INSERT OR REPLACE INTO settings VALUES('paused',?)",(int(paused),))


def emit(data,**event):
    """Collection is optional operational data: a failed brain never blocks work."""
    if data is None:return False
    try:Curator(data).observe(**event);return True
    except Exception:return False


def verified(data,*,project,request,revision,command):
    try:
        from gate.test_runs import read
        rows=[row for row in read(data) if str(row.get('request'))==str(request) and row.get('command')==command and scope(str(row.get('project')))==scope(str(project))]
        if not rows or rows[-1].get('exit_code')!=0:return False
        row=rows[-1]
        return emit(data,project=str(project),source=revision,kind='verified_commit',request=str(request),revision=revision,
                    signature=digest(str(row['cwd'])+'\0'+str(row['command'])))
    except Exception:return False


def main(argv=None):
    """Explicit local maintenance; never scans personal logs or downloads a model."""
    import argparse
    parser=argparse.ArgumentParser(description='Inspect private System 1 evidence. No conversations or configuration are changed.')
    parser.add_argument('--data',required=True,type=Path)
    commands=parser.add_subparsers(dest='operation',required=True)
    for name in ('list','evidence','history','reject','restore','invalidate','categorize'):
        command=commands.add_parser(name);command.add_argument('--project',required=True)
        if name in ('evidence','history','reject','restore','categorize'):command.add_argument('--id',required=True)
        if name=='list':command.add_argument('--all',action='store_true');command.add_argument('--limit',type=int,default=20)
        if name=='invalidate':command.add_argument('--source',required=True)
        if name=='categorize':command.add_argument('--category',choices=CATEGORIES,required=True)
    commands.add_parser('pause');commands.add_parser('resume');commands.add_parser('status')
    args=parser.parse_args(argv);brain=Curator(args.data)
    try:
        if args.operation=='status':result=brain.status()
        elif args.operation=='list':result=brain.retrieve(args.project,include_inactive=args.all,limit=args.limit)
        elif args.operation in ('evidence','history'):result=getattr(brain,args.operation)(args.project,args.id)
        elif args.operation in ('reject','restore'):result=getattr(brain,args.operation)(args.project,args.id)
        elif args.operation=='invalidate':result=brain.invalidate(args.project,args.source)
        elif args.operation=='categorize':result=brain.correct_category(args.project,args.id,args.category)
        else:result=brain.pause(args.operation=='pause')
    except (ValueError,OSError,sqlite3.Error):parser.exit(1,'Evidence operation unavailable; no project files were changed.\n')
    print(json.dumps(result if result is not None else {'ok':True},ensure_ascii=False))


if __name__=='__main__':main()

