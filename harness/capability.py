"""Configuration-specific streamed generation evidence. Unknown and errors always serialize.

A smoke verifies progress for two short requests, not answer quality or arbitrary context capacity.
Only a harness-owned server has an attested serving configuration suitable for production admission.
"""
import json
import os
import platform
import subprocess
import sys
import threading
import time
import urllib.request
from datetime import datetime
from pathlib import Path
from harness import model as models

PROMPTS = ['Write a long numbered story about a lighthouse keeper. Continue for at least 200 words.',
           'Explain hash tables in a long numbered list. Continue for at least 200 words.']
SCHEMA = 2
STORE_LOCK = threading.RLock()
LABELS = {'supported':'parallel', 'not_supported':'one at a time', 'unknown':'unknown', 'error':'error'}


def overlap(a, b):
    """Overlap of actual first/last content arrivals, never the request's open interval."""
    if any('events' in row and not row['events'] for row in (a,b)): return 0.0
    first = lambda row: row.get('events', [row.get('first_token', 0)])[0]
    last = lambda row: row.get('events', [row.get('end', 0)])[-1]
    shared = min(last(a), last(b)) - max(first(a), first(b))
    shorter = min(last(a)-first(a), last(b)-first(b))
    return max(0.0, shared)/shorter if shorter > 0 else 0.0


def words(value):
    return 'parallel' if value >= 0.5 else 'partly parallel' if value > 0.05 else 'one at a time'


def classify(rows):
    """Require repeated alternating progress, not just two first tokens followed by a stalled stream.

    Chunks within 2 ms form one arrival burst; buffering cannot manufacture alternating progress.
    Raw chunk timestamps are retained so the evidence can be inspected independently.
    """
    if len(rows) != 2 or any(len(row.get('events', [])) < 4 for row in rows): return 'unknown'
    bursts = []
    for index, row in enumerate(rows):
        previous = -float('inf')
        for stamp in row['events']:
            if stamp-previous >= .002: bursts.append((stamp, index)); previous=stamp
    if any(sum(index==side for _,index in bursts)<4 for side in (0,1)): return 'unknown'
    ordered=sorted(bursts)
    switches=sum(a[1]!=b[1] for a,b in zip(ordered, ordered[1:]))
    if switches >= 6 and overlap(*rows) >= .25: return 'supported'
    if max(rows[0]['events']) <= min(rows[1]['events']) or max(rows[1]['events']) <= min(rows[0]['events']): return 'not_supported'
    return 'unknown'  # weak/ambiguous progress does not prove serialization either


def generate(url, model, prompt, ctx, tokens, start, result):
    body=json.dumps({'model':model,'prompt':prompt,'stream':True,'think':False,
                     'options':{'num_ctx':ctx,'num_predict':tokens,'temperature':0}}).encode()
    request=urllib.request.Request(url+'/api/generate',body,{'Content-Type':'application/json'})
    start.wait(); result.update(sent=time.monotonic(),tokens=0,events=[])
    # A smoke is bounded even when the server never emits a final event.
    deadline=time.monotonic()+120
    with urllib.request.urlopen(request,timeout=120) as response:
        for line in response:
            if time.monotonic()>deadline: raise TimeoutError('Capability smoke exceeded 120 seconds.')
            event=json.loads(line)
            if event.get('error'): raise RuntimeError(event['error'])
            if event.get('response') or event.get('thinking'):
                stamp=time.monotonic(); result.setdefault('first_token',stamp)
                result['events'].append(stamp); result['tokens']+=1
            if event.get('done'):
                result['end']=time.monotonic(); return
    raise RuntimeError('Capability stream ended without a completion event.')


def together(url, model, ctx, tokens, prompts):
    start=threading.Event(); results=[{} for _ in prompts]; errors=[]
    def worker(prompt,result):
        try: generate(url,model,prompt,ctx,tokens,start,result)
        except Exception as error: errors.append(error)
    threads=[threading.Thread(target=worker,args=pair,daemon=True) for pair in zip(prompts,results)]
    for thread in threads: thread.start()
    start.set()
    for thread in threads: thread.join()
    if errors: raise errors[0]
    return results


def num_parallel():
    """Display only: caller/launchctl environment is not attestation of a remote server's settings."""
    value=os.getenv('OLLAMA_NUM_PARALLEL')
    if value is None and sys.platform=='darwin':
        try: value=subprocess.run(['launchctl','getenv','OLLAMA_NUM_PARALLEL'],capture_output=True,text=True,timeout=3).stdout.strip() or None
        except (OSError,subprocess.SubprocessError): value=None
    return value or 'default'


def serving():
    try:
        config=json.loads(os.getenv('PI_OLLAMA_SERVING_CONFIG','null'))
        if isinstance(config,dict) and config.get('url')==models.ollama_url():
            os.kill(int(config['pid']),0)
            return config,True
    except (OSError,ValueError,TypeError,KeyError): pass
    return {'url':models.ollama_url(),'num_parallel':num_parallel(),'configuration':'unattested'},False


def keys():
    try:
        tags=models.ollama('/api/tags',timeout=5).get('models',[])
        version=models.ollama('/api/version',timeout=5).get('version')
    except (OSError,ValueError): return {}
    config,verified=serving()
    return {item['name']:{'digest':item.get('digest',''),'ollama':version,'backend':'ollama',
            'num_parallel':str(config.get('num_parallel',num_parallel())), 'serving':config,
            'model_details':item.get('details',{}), 'hardware':{'machine':platform.machine(),'os':platform.release(),'cpus':os.cpu_count()}, 'configuration_verified':verified} for item in tags}


def store_path(data): return Path(data)/'model-capabilities.json'


def stored(data):
    try:
        value=json.loads(store_path(data).read_text())
        return value if isinstance(value,dict) else {}
    except (OSError,ValueError): return {}


def matching(data,name,current=None):
    current=keys() if current is None else current
    key,saved=current.get(name),stored(data).get(name)
    if (not key or not isinstance(saved,dict) or saved.get('schema')!=SCHEMA or not key.get('digest') or not key.get('ollama')
            or any(saved.get(part)!=value for part,value in key.items())): return None
    return saved


def known(data,name,current=None):
    saved=matching(data,name,current)
    return LABELS.get(saved.get('status'),'unknown') if saved else 'unknown'


def status(data,name,current=None):
    saved=matching(data,name,current)
    return saved.get('status','unknown') if saved else 'unknown'


def capacity(data,name,ctx):
    current=keys(); saved=matching(data,name,current)
    if not saved or saved.get('status')!='supported' or not current[name].get('configuration_verified'): return 1
    try:
        if ctx>int(saved.get('tested_ctx',0)): return 1
        return max(1,min(2,int(saved.get('tested_slots',1)),int(current[name]['serving'].get('num_parallel',1))))
    except (ValueError,TypeError,KeyError): return 1


def missing(data):
    current=keys()
    return [name for name in current if known(data,name,current)=='unknown']


def check(data,name,tokens=64,ctx=None):
    current=keys()
    if not current: raise ValueError(f'Ollama does not answer at {models.ollama_url()}.')
    if name not in current: raise ValueError(f"{name} is not installed. Installed: {', '.join(current)}.")
    ctx=ctx or int(current[name]['serving'].get('num_ctx',4096))
    result={**current[name],'schema':SCHEMA,'tested_ctx':ctx,'tested_slots':2,'output_limit':tokens,
            'checked':datetime.now().astimezone().isoformat(timespec='seconds'),'overlap':0,'alone_tps':0,'combined_x':0}
    try:
        url=models.ollama_url()
        together(url,name,ctx,4,PROMPTS[:1])
        alone=together(url,name,ctx,tokens,PROMPTS[:1])[0]
        pair=together(url,name,ctx,tokens,PROMPTS)
        rate=lambda row: row['tokens']/max(1e-6,row.get('end',0)-row.get('first_token',0))
        combined=sum(row['tokens'] for row in pair)/max(1e-6,max(row['end'] for row in pair)-min(row.get('first_token',row['end']) for row in pair))
        result.update(status=classify(pair),streams=pair,overlap=round(overlap(*pair),3),alone_tps=round(rate(alone),1),combined_x=round(combined/max(1e-6,rate(alone)),2))
        if keys().get(name)!=current[name]: result.update(status='unknown',reason='Serving configuration changed during the smoke.')
    except (OSError,ValueError,RuntimeError) as error:
        result.update(status='error',reason=str(error)[:500])
    result['verdict']=LABELS[result['status']]
    with STORE_LOCK:
        everything=stored(data); everything[name]=result
        path=store_path(data); path.parent.mkdir(parents=True,exist_ok=True)
        temporary=path.with_suffix('.tmp'); temporary.write_text(json.dumps(everything,indent=2)+'\n'); temporary.replace(path)
    return result
