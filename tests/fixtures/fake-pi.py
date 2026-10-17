"""RPC boundary fixture; never used by the application."""
import json
import os
from pathlib import Path
import sys
import time
if '--session' in sys.argv:session=counter=Path(sys.argv[sys.argv.index('--session')+1])
else:  # --no-session (task 115): record beside the context file, count replies on their own
    session=Path(os.environ['PI_HARNESS_CONTEXT']).parent/'session.jsonl';counter=session.with_name('oneoff')
request=json.loads(sys.stdin.readline())
# Like harness/extension.mjs (task 261): take Gate's token and port out of the environment before any command runs.
TOKEN_IN_ENVIRONMENT='PI_HARNESS_TOKEN' in os.environ
TOKEN=os.environ.pop('PI_HARNESS_TOKEN',None)
if os.environ.get('PI_HARNESS_TOKEN_FILE'):
    token_file=Path(os.environ.pop('PI_HARNESS_TOKEN_FILE'));TOKEN=token_file.read_text().strip();token_file.unlink()
PORT=os.environ.pop('PI_HARNESS_SHARED_PORT')
assert int(PORT)>0
import subprocess
# What Pi's bash tool gives a command: this process's environment.
SHELL_SEES=subprocess.run(['sh','-c','printf "%s|%s|%s" "$PI_HARNESS_TOKEN" "$PI_HARNESS_SHARED_PORT" "$PI_HARNESS_TOKEN_FILE"'],capture_output=True,text=True).stdout
session.with_suffix('.request.json').write_text(json.dumps(request))
session.with_suffix('.environment.json').write_text(json.dumps({'cwd':os.getcwd(),'args':sys.argv,'data':os.environ.get('PI_AGENT_DATA'),'token':TOKEN,'token_in_environment':TOKEN_IN_ENVIRONMENT,'shell_sees':SHELL_SEES,'context':Path(os.environ['PI_HARNESS_CONTEXT']).read_text() if os.environ.get('PI_HARNESS_CONTEXT') else None,'session':'--no-session' not in sys.argv}))
count=int(counter.read_text())+1 if counter.exists() else 1
counter.write_text(str(count))
def emit(value):print(json.dumps(value),flush=True)
emit({'type':'agent_start'})
def call_gate(path,body):
    import urllib.request
    call=urllib.request.Request(f"http://127.0.0.1:{PORT}{path}",data=json.dumps(body).encode(),headers={'Content-Type':'application/json','X-Gate-Token':TOKEN})
    with urllib.request.urlopen(call,timeout=5) as response:return json.load(response)
if '\nPerson: Tighten this TEST_SUGGEST\n' in request['message']:
    import re
    message=request['message'];anchor=message.split('\nSelected text: ',1)[1].split('\nThe thread so far',1)[0]
    sidecar=Path(re.search(r'comments frontmatter array of (.+?\.md)\. Preserve',message).group(1))
    lines=sidecar.read_text().split('\n')
    index=next(i for i,line in enumerate(lines) if line.startswith('comments: '));comments=json.loads(lines[index][10:])
    for comment in comments:
        if comment['text']=='Tighten this TEST_SUGGEST':comment.update(suggestion={'anchor':anchor,'replacement':'State the goal in one line.'},agent_reply='Suggested a shorter sentence.')
    lines[index]='comments: '+json.dumps(comments,ensure_ascii=False);sidecar.write_text('\n'.join(lines))
if 'TEST_RUN_LOG' in request['message']:
    args={'command':'node --test tests/app.test.mjs'}
    gate=call_gate('/gatekeep',{'tool_name':'execute_command','args':args,'auth_level':'admin','cwd':os.getcwd(),'source':'web','request':os.environ['PI_HARNESS_JOB']})
    call_gate('/audit',{'proposal_id':gate['proposal_id'],'tool_name':'execute_command','args':args,'output':'ℹ pass 3\nℹ fail 1\nℹ skipped 0','exit_code':1})
if request['message'].rstrip().endswith('TEST_MUSIC'):
    import wave, math, struct
    output=Path.cwd()/'assets/music/demo/0001';output.mkdir(parents=True,exist_ok=True)
    with wave.open(str(output/'audio.wav'),'wb') as audio:
        audio.setparams((1,2,44100,0,'NONE','not compressed'))
        audio.writeframes(b''.join(struct.pack('<h',int(4000*math.sin(i/10))) for i in range(4410)))
    (output/'score.json').write_text('{"layers": []}')
    emit({'type':'tool_execution_end','toolCallId':'call-music','toolName':'music','isError':False,
          'result':{'details':{'artifacts':[str(output/'audio.wav'),str(output/'score.json')]}}})
if request['message'].rstrip().endswith('TEST_TOOL'):
    gate=call_gate('/gatekeep',{'tool_name':'execute_command','args':{'command':'cat README.md'},'auth_level':'admin','tool_call_id':'call-read','cwd':os.getcwd(),'source':'web'})
    emit({'type':'tool_execution_start','toolCallId':'call-read','toolName':'bash','args':{'command':'cat README.md'}})
    time.sleep(2)
    call_gate('/audit',{'proposal_id':gate['proposal_id'],'tool_name':'execute_command','args':{'command':'cat README.md'},'output':'readme','exit_code':0})
    emit({'type':'tool_execution_end','toolCallId':'call-read','toolName':'bash','isError':False})
if 'TEST_READ' in request['message']:  # task 136: files read with the read tool; only the first is beyond the context
    for number,path in enumerate(['unrelated.txt','ROADMAP.md','/etc/hosts',os.path.join(os.getcwd(),'unrelated.txt')]):
        emit({'type':'tool_execution_start','toolCallId':f'call-file-{number}','toolName':'read','args':{'path':path}})
        emit({'type':'tool_execution_end','toolCallId':f'call-file-{number}','toolName':'read','isError':False})
if request['message'].rstrip().endswith('TEST_SPAWN'):  # a server Pi starts with `&` and never stops (seen in the bench)
    import subprocess as sp
    leftover=sp.Popen(['sleep','300'],stdin=sp.DEVNULL,stdout=sp.DEVNULL,stderr=sp.DEVNULL);  # Pi's bash tool gives commands their own pipes
    Path(os.environ['PI_FAKE_PIDFILE']).write_text(str(leftover.pid))
if request['message'].rstrip().endswith('TEST_FAIL'):
    sys.stderr.write('Model crashed\n');sys.exit(3)
if request['message'].rstrip().endswith('TEST_PHASE_PLAN'):
    identifier=os.environ['PI_HARNESS_JOB']
    call_gate('/request',{'request':identifier,'cwd':os.getcwd(),'text':'Plan the counter'})
    plan=call_gate('/plan',{'request':identifier,'content':{'goal':'Count clicks.','tasks':[{'title':title,'files':['app.py'],'done_when':'Counts clicks.','content':'Check a click; implement its handler.'} for title in ['Counter','Reset']]}})
    emit({'type':'extension_ui_request','method':'notify','message':'Harness plan: '+json.dumps(plan)})
    call_gate('/request/pause',{'request':identifier})
    emit({'type':'message_end','message':{'role':'assistant','content':[],'stopReason':'aborted'}})
    emit({'type':'agent_settled'});emit({'type':'extension_ui_request','method':'notify','message':'Harness settled'})
    sys.stdin.readline();sys.exit(0)
if request['message'].rstrip().endswith('TEST_PHASE_NO_CODE'):
    identifier=os.environ['PI_HARNESS_JOB']
    call_gate('/request',{'request':identifier,'cwd':os.getcwd(),'text':'Build the approved task.'})
    result=call_gate('/request/end',{'request':identifier})['result']
    if result.get('check_in'):emit({'type':'extension_ui_request','method':'notify','message':'Harness check-in: '+json.dumps(result['check_in'])})
    emit({'type':'message_end','message':{'role':'assistant','content':[{'type':'text','text':'No implementation was produced.'}]}})
    emit({'type':'agent_settled'});emit({'type':'extension_ui_request','method':'notify','message':'Harness settled'})
    sys.stdin.readline();sys.exit(0)
if request['message'].rstrip().endswith('TEST_PHASE_CHECK'):
    check={'task':request['message'].split('TASK=')[1].split()[0],'title':'Counter','verified':True,'verification':'node --test · 1 passed','next':None,'number':1,'total':1}
    emit({'type':'extension_ui_request','method':'notify','message':'Harness check-in: '+json.dumps(check)})
    emit({'type':'message_end','message':{'role':'assistant','content':[{'type':'text','text':'The counter works.'}]}})
    emit({'type':'agent_settled'});emit({'type':'extension_ui_request','method':'notify','message':'Harness settled'})
    sys.stdin.readline();sys.exit(0)
if request['message'].rstrip().endswith(('TEST_PLAN','TEST_ERROR_PLAN')):
    plan={'goal':'A pong game.','tasks':[{'title':'Move the ball','done_when':'The ball bounces.'}],'pending':True}
    emit({'type':'extension_ui_request','method':'notify','message':'Harness plan: '+json.dumps(plan)})
    error=request['message'].rstrip().endswith('TEST_ERROR_PLAN')
    emit({'type':'message_end','message':{'role':'assistant','content':[{'type':'text','text':'Context before your plan.'}] if error else [],'stopReason':'error' if error else 'aborted','errorMessage':'This operation was aborted'}})
    emit({'type':'agent_settled'})
    emit({'type':'extension_ui_request','method':'notify','message':'Harness settled'})
    sys.stdin.readline();sys.exit(0)
if request['message'].rstrip().endswith('TEST_CHECK_IN'):
    check={'task':'tasks/001-first-task.md','title':'Move the ball','verified':False,'reason':'no passing test run after the last change','next':'tasks/002-score.md','number':1,'total':2}
    emit({'type':'extension_ui_request','method':'notify','message':'Harness check-in: '+json.dumps(check)})
    emit({'type':'message_end','message':{'role':'assistant','content':[{'type':'text','text':'The ball moves.'}]}})
    emit({'type':'agent_settled'});emit({'type':'extension_ui_request','method':'notify','message':'Harness settled'})
    sys.stdin.readline();sys.exit(0)
if request['message'].rstrip().endswith(('TEST_CHOICE','TEST_ERROR_CHOICE','TEST_BROKEN_CHOICE')):
    choice={'number':1,'total':3,'question':'Who uses it?','options':[{'label':'Only me'},{'label':'A team'}],'recommended':0,'pending':True}
    emit({'type':'extension_ui_request','method':'notify','message':'Harness choice: '+json.dumps(choice)})
    error=request['message'].rstrip().endswith(('TEST_ERROR_CHOICE','TEST_BROKEN_CHOICE'))
    emit({'type':'message_end','message':{'role':'assistant','content':[{'type':'text','text':'Context before your choice.'}] if error else [],'stopReason':'error' if error else 'aborted','errorMessage':'Model crashed' if request['message'].rstrip().endswith('TEST_BROKEN_CHOICE') else 'This operation was aborted'}})
    emit({'type':'agent_settled'})
    emit({'type':'extension_ui_request','method':'notify','message':'Harness settled'})
    sys.stdin.readline();sys.exit(0)
if request['message'].rstrip().endswith('TEST_RECOVER'):  # the extension aborts a looping turn, compacts and re-asks (task 150)
    notify=lambda text:emit({'type':'extension_ui_request','method':'notify','message':text})
    notify('Harness recovery: Loop detected: the same three thought lines occurred twice.')
    emit({'type':'message_end','message':{'role':'assistant','content':[],'stopReason':'aborted'}});emit({'type':'agent_settled'})
    time.sleep(0.3);emit({'type':'agent_start'})
    emit({'type':'message_end','message':{'role':'assistant','content':[{'type':'text','text':'[CANARY] recovered answer'}],'stopReason':'stop'}})
    emit({'type':'agent_settled'});sys.stdin.readline();sys.exit(0)
if request['message'].rstrip().endswith('TEST_REFUSED'):  # another agent holds the lock
    emit({'type':'extension_ui_request','method':'notify','message':'Harness refused: One agent is already working. Wait or stop the active task before starting another.'})
    sys.stdin.readline();sys.exit(0)
if request['message'].rstrip().endswith('TEST_THINK'):
    for step in range(8):
        emit({'type':'message_update','assistantMessageEvent':{'type':'thinking_delta','delta':f'Thinking step {step}.\n' if step else '**Plan** the reply. '+'averyveryverylongunbrokenwordthatmustwrap'*4+'\n\n'}})
        time.sleep(0.6)
if 'TEST_TICK' in request['message']:  # task 165: long work that keeps reporting, for longer than the silence limit
    for _ in range(12): emit({'type':'tool_execution_update','toolCallId':'tick','toolName':'bash'}); time.sleep(0.25)
if 'TEST_SLOW' in request['message']:  # a comment request that keeps running (its text is inside the comment prompt)
    emit({'type':'tool_execution_start','toolName':'bash'});time.sleep(60)
if request['message'].rstrip().endswith('TEST_WAIT'):
    emit({'type':'tool_execution_start','toolName':'bash'})
    time.sleep(60)
else:
    emit({'type':'message_update','assistantMessageEvent':{'type':'thinking_delta','delta':'Reviewing the current project and its request.'}})
    text=f'[CANARY] reply {count}'
    if 'TEST_ASK' in request['message']:text='[CANARY] I can do that two ways. Should I keep the old name too?'  # the bench's scripted user answers it
    if request['message'].rstrip().endswith('TEST_MARKDOWN'):text='[CANARY] ## Result\n\nI **verified** the `hello.py` output.\n\n1. First step\n2. Second step\n\n- [x] Tests pass\n\n**Updated `ROADMAP.md`:** done.\n\n| If you are… | Action | A very long example column that should scroll on a phone |\n| :--- | :---: | ---: |\n| **Looking** | Use `sou` | 美味しそう and a much longer cell to push the width |'
    emit({'type':'message_update','assistantMessageEvent':{'type':'text_delta','delta':'old <channel|>' if 'TEST_FINAL_TEXT' in request['message'] else text}})
    if 'TEST_FINAL_TEXT' in request['message']:text='[CANARY] clean answer'
    emit({'type':'message_end','message':{'role':'assistant','content':[{'type':'text','text':text}],'stopReason':'stop'}})
    emit({'type':'agent_settled'})
    emit({'type':'extension_ui_request','method':'notify','message':'Harness settled'})  # what the extension says when it will not wake Pi (plan 184)
    sys.stdin.readline()
