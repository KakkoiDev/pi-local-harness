"""Local typed decisions (task 250). Missing runtime, invalid output and uncertainty always abstain."""
import atexit
import json
import math
import os
from pathlib import Path
import select
import subprocess
import sys
import threading


class Worker:
    """One MLX process per classifier, using its own pinned Python environment. Never downloads on a request."""
    def __init__(self,data):self.folder=Path(data)/'toolchain/laya';self.process=None;self.lock=threading.RLock();atexit.register(self.close)
    def close(self):
        with self.lock:
            process=self.process;self.process=None
            if process is None:return
            if process.poll() is None:
                process.terminate()
                try:process.wait(timeout=5)
                except subprocess.TimeoutExpired:process.kill();process.wait()
            for stream in (process.stdin,process.stdout):
                if stream:stream.close()
    def receive(self):
        if not select.select([self.process.stdout],[],[],60)[0]:self.close();raise TimeoutError('Classifier unavailable.')
        line=self.process.stdout.readline()
        if not line:self.close();raise RuntimeError('Classifier unavailable.')
        return json.loads(line)
    def predict(self,state,questions,**kwargs):
        with self.lock:
            if self.process is None or self.process.poll() is not None:
                self.close();python=self.folder/'runtime/bin/python';model=self.folder/'model'
                if not python.is_file() or not (model/'model.safetensors').is_file():raise RuntimeError('Classifier is not installed.')
                env={**os.environ,'PYTHONPATH':str(Path(__file__).resolve().parent.parent),'HF_HUB_OFFLINE':'1','HF_HUB_DISABLE_TELEMETRY':'1','TRANSFORMERS_OFFLINE':'1'}
                self.process=subprocess.Popen([str(python),'-m','harness.laya','--serve',str(model)],stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,text=True,bufsize=1,env=env)
                if self.receive()!={'ready':True}:self.close();raise RuntimeError('Classifier unavailable.')
            self.process.stdin.write(json.dumps({'state':state,'questions':questions,**kwargs},ensure_ascii=False)+'\n');self.process.stdin.flush()
            result=self.receive()
            if 'error' in result:raise RuntimeError('Classifier unavailable.')
            return result


class Classifier:
    def __init__(self,loader=None,data=None):
        self.loader=loader or (lambda:Worker(data or os.getenv('PI_LAYA_DATA') or os.getenv('PI_AGENT_DATA',str(Path.home()/'pi-local-harness-data'))))
        self.agent=None;self.lock=threading.RLock()
    def ask(self,kind,state,question,options=None,min_confidence=.95):
        if kind not in ('choice','score','noul') or not isinstance(question,str) or not question.strip():raise ValueError('Use a typed question: choice, score or noul.')
        if isinstance(min_confidence,bool) or not isinstance(min_confidence,(int,float)) or not math.isfinite(min_confidence) or not 0<=min_confidence<=1:raise ValueError('Confidence must be between zero and one.')
        if kind!='noul' and (not isinstance(options,list) or len(options)<2 or any(not isinstance(x,str) or not x.strip() for x in options) or len(set(options))!=len(options)):raise ValueError('Provide at least two unique options.')
        result={'answer':None,'confidence':0.0,'abstained':True}
        spec={'type':kind,'instructions':question}
        if kind!='noul':spec['criteria']=options
        try:
            if len(json.dumps(state,ensure_ascii=False))>128000:return result
            with self.lock:
                if self.agent is None:self.agent=self.loader()
                raw=self.agent.predict(state,{'decision':spec},min_confidence=min_confidence)
            answer=raw['answers']['decision'];confidence=answer.get('answer_confidence')
            if isinstance(confidence,bool) or not isinstance(confidence,(int,float)) or not math.isfinite(confidence) or not 0<=confidence<=1:return result
            result['confidence']=confidence
            if confidence<min_confidence or raw.get('usage',{}).get('truncated') or answer.get('low_confidence') or answer.get('abstention') in ('abstained','unevaluated'):return result
            if kind=='choice':
                value=answer.get('choice')
                if value not in options:return result
            elif kind=='noul':
                probability=answer.get('noul')
                if isinstance(probability,bool) or not isinstance(probability,(int,float)) or not math.isfinite(probability) or not 0<=probability<=1:return result
                value=probability>=.5
            else:
                probabilities=answer.get('probabilities',{})
                if set(probabilities)!={str(n) for n in range(len(options))}:return result
                values=list(probabilities.values())
                if any(isinstance(p,bool) or not isinstance(p,(int,float)) or not math.isfinite(p) or not 0<=p<=1 for p in values) or abs(sum(values)-1)>.01:return result
                value=options[int(max(probabilities,key=probabilities.get))]
            return {'answer':value,'confidence':confidence,'abstained':False}
        except Exception:return result


_default=None
_default_lock=threading.Lock()
def ask(kind,state,question,options=None,min_confidence=.95):
    global _default
    with _default_lock:
        if _default is None:_default=Classifier()
    return _default.ask(kind,state,question,options,min_confidence)


def serve(model):
    import contextlib
    with contextlib.redirect_stdout(sys.stderr):
        import laya_mlx
        agent=laya_mlx.load(str(Path(model).resolve()),dtype='float16')
    print(json.dumps({'ready':True}),flush=True)
    for line in sys.stdin:
        try:
            value=json.loads(line)
            with contextlib.redirect_stdout(sys.stderr):result=agent.predict(**value)
        except Exception:result={'error':'Classifier unavailable.'}
        print(json.dumps(result,ensure_ascii=False),flush=True)


if __name__=='__main__':
    if len(sys.argv)!=3 or sys.argv[1]!='--serve':raise SystemExit('Use the local classifier through harness.laya.ask.')
    serve(sys.argv[2])


def waiting_reply(message,waiting,*,classifier=None):
    """Interpret an answer; callers still require explicit approval and acceptance controls."""
    return (classifier.ask if classifier else ask)('choice',{'message':message,'waiting_question':waiting},'Classify the person’s reply to the waiting question. A request to change the proposal is change; unrelated or ambiguous replies are something_else.',options=['yes','no','change','something_else'],min_confidence=.98)


def phase_intent(message,*,classifier=None):
    """An advisory intent, never a phase transition or an approved plan."""
    return (classifier.ask if classifier else ask)('choice',{'message':message},'Which work phase does the person explicitly request? Discussion explores ideas; planning writes a plan; implementation builds it. Choose none without a clear phase request.',options=['discussion','planning','implementation','none'],min_confidence=.98)


def assumed_value(request,reply,*,classifier=None):
    return (classifier.ask if classifier else ask)('noul',{'request':request,'reply':reply},'The reply silently treats a missing user preference, requirement or value as decided, rather than asking or clearly proposing it.',min_confidence=.98)


def applicable_guide(request,guides,*,classifier=None):
    names=list(dict.fromkeys(guides))
    if not names:return {'answer':None,'confidence':0.0,'abstained':True}
    return (classifier.ask if classifier else ask)('choice',{'request':request},'Choose the guide most relevant to the request, or none when no guide applies.',options=names+(['none'] if 'none' not in names else []),min_confidence=.95)


def shell_risk(command,project,*,classifier=None):
    """Only after code has abstained; this result cannot override a phase or safety refusal."""
    return (classifier.ask if classifier else ask)('score',{'command':command,'project':str(project)},'Classify the command by its most dangerous possible effect. Reading only is read_only; modifying project files is writes_in_project; changing other files is writes_elsewhere; destructive, privileged or concealed execution is dangerous.',options=['read_only','writes_in_project','writes_elsewhere','dangerous'],min_confidence=.995)
