"""Append-only decision provenance, without prompts, commands or credentials (tasks 250 and 249)."""
from datetime import datetime, timezone
import json
import math
import os
from pathlib import Path
import threading

_lock=threading.Lock()


def record(data,request,kind,who,answer,*,confidence=None,rule=None,automatic=False):
    if data is None:return
    if who not in ('code','laya','person','model'):raise ValueError('Unknown decision author.')
    value={'time':datetime.now(timezone.utc).isoformat(timespec='milliseconds'),'request':request,'kind':kind,'who':who,'answer':answer}
    if rule:value['rule']=rule
    if automatic:value['automatic']=True
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
