"""Append-only decision provenance, without prompts, commands or credentials (tasks 250 and 249)."""
from datetime import datetime, timezone
import json
import math
import os
from pathlib import Path
import threading

_lock=threading.Lock()


def record(data,request,kind,who,answer,*,confidence=None,rule=None,automatic=False,abstained=False,proposal=False,event=None):
    """abstained: Laya did not answer (kept for provenance, not counted). proposal: the model proposed it (task 261).
    event: the Gate event this refusal is (gate-events.jsonl id), so the decision row can name its command or path
    for an expert without this log keeping commands (plan 267, task 273)."""
    if data is None:return
    if who not in ('code','laya','person','model'):raise ValueError('Unknown decision author.')
    value={'time':datetime.now(timezone.utc).isoformat(timespec='milliseconds'),'request':request,'kind':kind,'who':who,'answer':answer}
    if rule:value['rule']=rule
    if automatic:value['automatic']=True
    if abstained:value['abstained']=True
    if proposal:value['proposal']=True
    if isinstance(event,int) and not isinstance(event,bool):value['event']=event
    if confidence is not None:
        if isinstance(confidence,bool) or not isinstance(confidence,(int,float)) or not math.isfinite(confidence) or not 0<=confidence<=1:raise ValueError('Invalid decision confidence.')
        value['confidence']=confidence
    body=(json.dumps(value,ensure_ascii=False,separators=(',',':'))+'\n').encode()
    folder=Path(data);folder.mkdir(parents=True,exist_ok=True)
    with _lock:
        descriptor=os.open(folder/'decisions.jsonl',os.O_WRONLY|os.O_CREAT|os.O_APPEND,0o600)
        try:
            if os.write(descriptor,body)!=len(body):raise OSError('The decision record was not fully written.')
        finally:os.close(descriptor)
