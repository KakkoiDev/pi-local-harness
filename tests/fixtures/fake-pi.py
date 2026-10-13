"""RPC boundary fixture; never used by the application."""
import json
import os
from pathlib import Path
import sys
import time
session=Path(sys.argv[sys.argv.index('--session')+1])
request=json.loads(sys.stdin.readline())
assert int(os.environ['PI_HARNESS_SHARED_PORT'])>0
session.with_suffix('.request.json').write_text(json.dumps(request))
session.with_suffix('.environment.json').write_text(json.dumps({'cwd':os.getcwd(),'args':sys.argv,'data':os.environ.get('PI_AGENT_DATA'),'token':os.environ.get('PI_HARNESS_TOKEN')}))
count=int(session.read_text())+1 if session.exists() else 1
session.write_text(str(count))
def emit(value):print(json.dumps(value),flush=True)
emit({'type':'agent_start'})
def call_gate(path,body):
    import urllib.request
    call=urllib.request.Request(f"http://127.0.0.1:{os.environ['PI_HARNESS_SHARED_PORT']}{path}",data=json.dumps(body).encode(),headers={'Content-Type':'application/json','X-Gate-Token':os.environ['PI_HARNESS_TOKEN']})
    with urllib.request.urlopen(call,timeout=5) as response:return json.load(response)
if '\nUser comment: Tighten this TEST_SUGGEST\n' in request['message']:
    import re
    message=request['message'];anchor=message.split('\nSelected text: ',1)[1].split('\nUser comment: ',1)[0]
    sidecar=Path(re.search(r'comments frontmatter array of (.+?\.md)\. Preserve',message).group(1))
    lines=sidecar.read_text().split('\n')
    index=next(i for i,line in enumerate(lines) if line.startswith('comments: '));comments=json.loads(lines[index][10:])
    for comment in comments:
        if comment['text']=='Tighten this TEST_SUGGEST':comment.update(suggestion={'anchor':anchor,'replacement':'State the goal in one line.'},agent_reply='Suggested a shorter sentence.')
    lines[index]='comments: '+json.dumps(comments,ensure_ascii=False);sidecar.write_text('\n'.join(lines))
if request['message'].rstrip().endswith('TEST_TOOL'):
    gate=call_gate('/gatekeep',{'tool_name':'execute_command','args':{'command':'cat README.md'},'auth_level':'admin','tool_call_id':'call-read'})
    emit({'type':'tool_execution_start','toolCallId':'call-read','toolName':'bash','args':{'command':'cat README.md'}})
    time.sleep(2)
    call_gate('/audit',{'proposal_id':gate['proposal_id'],'tool_name':'execute_command','args':{'command':'cat README.md'},'output':'readme','exit_code':0})
    emit({'type':'tool_execution_end','toolCallId':'call-read','toolName':'bash','isError':False})
if request['message'].rstrip().endswith('TEST_WAIT'):
    emit({'type':'tool_execution_start','toolName':'bash'})
    time.sleep(60)
else:
    emit({'type':'message_update','assistantMessageEvent':{'type':'thinking_delta','delta':'Reviewing the current project and its request.'}})
    text=f'[CANARY] reply {count}'
    if request['message'].rstrip().endswith('TEST_MARKDOWN'):text='[CANARY] ## Result\n\nI **verified** the `hello.py` output.\n\n1. First step\n2. Second step\n\n- [x] Tests pass\n\n**Updated `ROADMAP.md`:** done.'
    emit({'type':'message_update','assistantMessageEvent':{'type':'text_delta','delta':text}})
    emit({'type':'message_end','message':{'role':'assistant','content':[{'type':'text','text':text}],'stopReason':'stop'}})
    emit({'type':'agent_settled'})
    sys.stdin.readline()
