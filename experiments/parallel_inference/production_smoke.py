#!/usr/bin/env python3
"""Bounded, explicit live smoke of the production server and proxy. Never part of offline tests.

Requires an existing shared GPU lock file. Does not resume a lab queue or reconfigure owner Ollama.
"""
import argparse
import fcntl
import json
import os
import sys
import threading
import time
import urllib.request
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]))
from harness import capability, model
from harness.parallel_server import ParallelServer, memory_available
from harness.tool_repair_proxy import RepairProxy


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--gpu-lock',required=True)
    parser.add_argument('--out',required=True)
    args=parser.parse_args()
    output=Path(args.out); output.mkdir(parents=True,exist_ok=True)
    with Path(args.gpu_lock).open('r') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        if model.ollama('/api/ps').get('models'): raise SystemExit('Owner Ollama has a resident model; live smoke deferred.')
        if (memory_available() or 0)<16*1024**3: raise SystemExit('Less than 16 GiB available; live smoke deferred.')
        server=ParallelServer(output).start(); proxy=None
        try:
            server.activate()
            result=capability.check(output,'gpt-oss:20b',tokens=64)
            if result['status']!='supported': raise RuntimeError('Native smoke: '+result['status']+' '+result.get('reason',''))
            proxy=RepairProxy(server.url+'/v1',output).start()
            start=threading.Event(); rows=[{'events':[],'delta_fields':[]},{'events':[],'delta_fields':[]}]; errors=[]
            def request(index):
                try:
                    # Distinct conversation markers, tools enabled, same endpoint production Pi uses.
                    body={'model':'gpt-oss:20b','stream':True,'max_tokens':128,'reasoning_effort':'low','tool_choice':'none',
                          'messages':[{'role':'user','content':f'Conversation marker {index}. Write a long numbered list of animals.'}],
                          'tools':[{'type':'function','function':{'name':'read','description':'Read a file','parameters':{'type':'object','properties':{'path':{'type':'string'}},'required':['path']}}}]}
                    start.wait()
                    req=urllib.request.Request(proxy.url+'/chat/completions',json.dumps(body).encode(),{'Content-Type':'application/json'})
                    with urllib.request.urlopen(req,timeout=120) as response:
                        for line in response:
                            if not line.startswith(b'data: '):continue
                            if line.strip()==b'data: [DONE]':break
                            event=json.loads(line[6:]);delta=(event.get('choices') or [{}])[0].get('delta',{})
                            rows[index]['delta_fields']=sorted(set(rows[index]['delta_fields'])|set(delta))
                            if any(delta.get(field) for field in ('content','reasoning','reasoning_content','tool_calls')):rows[index]['events'].append(time.monotonic())
                except Exception as error:errors.append(str(error))
            threads=[threading.Thread(target=request,args=(index,)) for index in (0,1)]
            for thread in threads:thread.start()
            start.set()
            for thread in threads:thread.join()
            record={'native_status':result['status'],'proxy_status':capability.classify(rows),'proxy_streams':rows,'errors':errors,
                    'admitted_slots':capability.capacity(output,'gpt-oss:20b',8192),'memory_available_after':memory_available(),
                    'limitations':'Busy everyday machine. Two short prompts, configured 8K contexts. Quality and sustained full histories untested. No inference from old 16-slot evidence.'}
            (output/'production-smoke.json').write_text(json.dumps(record,indent=2)+'\n')
            print(json.dumps({key:value for key,value in record.items() if key!='proxy_streams'}))
            if errors or record['proxy_status']!='supported':raise RuntimeError('Production proxy smoke did not show repeated token interleaving.')
        finally:
            if proxy:proxy.close()
            server.close()

if __name__=='__main__':main()
