"""RPC boundary fixture; never used by the application."""
import json
import os
from pathlib import Path
import sys
import time
if '--session' in sys.argv:session=counter=Path(sys.argv[sys.argv.index('--session')+1])
else:  # --no-session (task 115): record beside the context file, count replies on their own
    session=Path(os.environ['PI_HARNESS_CONTEXT']).parent/'session.jsonl';counter=session.with_name('oneoff')
session_cwd=None
if '--session' in sys.argv and session.is_file() and session.read_text().startswith('{'):
    # Like Pi 1.1.0: a real session file's header names the working folder; Pi stops when that folder is gone.
    session_cwd=json.loads(session.read_text().splitlines()[0]).get('cwd');counter=session.with_name(session.name+'.count')
    if session_cwd and not Path(session_cwd).is_dir():print(f'Stored session working directory does not exist: {session_cwd}',file=sys.stderr);sys.exit(1)
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
session.with_suffix('.environment.json').write_text(json.dumps({'cwd':os.getcwd(),'args':sys.argv,'data':os.environ.get('PI_AGENT_DATA'),'token':TOKEN,'token_in_environment':TOKEN_IN_ENVIRONMENT,'shell_sees':SHELL_SEES,'context':Path(os.environ['PI_HARNESS_CONTEXT']).read_text() if os.environ.get('PI_HARNESS_CONTEXT') else None,'session':'--no-session' not in sys.argv,'session_cwd':session_cwd}))
count=int(counter.read_text())+1 if counter.exists() else 1
counter.write_text(str(count))
def emit(value):print(json.dumps(value),flush=True)
emit({'type':'agent_start'})
def call_gate(path,body):
    import urllib.request
    call=urllib.request.Request(f"http://127.0.0.1:{PORT}{path}",data=json.dumps(body).encode(),headers={'Content-Type':'application/json','X-Gate-Token':TOKEN})
    with urllib.request.urlopen(call,timeout=1200 if path=='/request/end' else 5) as response:return json.load(response)  # like the extension (task 260)
def scripted_story():
    """Task 264: `TEST_SCRIPT=<name>` plays $PI_FAKE_SCRIPTS/<name>.json (tests/browser/stories/) the way the harness
    extension drives a real Pi turn: /request, each tool call through /gatekeep and /audit (a refused call does not run),
    /request/end, then the notices the web worker reads (check-in, committed, report, settled). Steps: {"think"},
    {"read"}, {"write","content"}, {"bash"} (really runs, in the project), {"say"}, {"crash"}, {"hang"}, and the pauses:
    {"choice"} and {"plan"} wait for the person (their "Choice: … → …" or Start Building's "Build the approved task."
    resumes the script after it); {"wait"} ends the request (a check-in) and "Continue the approved task." resumes it.
    With Run on its own, choices and plans are taken at once and a verified check-in continues by itself."""
    import re,subprocess,uuid
    found=re.search(r'TEST_SCRIPT=([\w-]+)',request['message']);state=session.with_suffix('.script')
    resume=request['message'].strip().startswith('Choice: ') or request['message'].strip() in ('Build the approved task.','Continue the approved task.')
    if found:name,index=found[1],0
    elif state.exists() and resume:name,index=json.loads(state.read_text())
    else:return
    spec=json.loads((Path(os.environ['PI_FAKE_SCRIPTS'])/f'{name}.json').read_text(encoding='utf-8'))
    steps=spec['steps'];text=spec.get('say','[CANARY] done');job=os.environ['PI_HARNESS_JOB'];script=name
    notify=lambda message:emit({'type':'extension_ui_request','method':'notify','message':message})
    def settle(answer,stop='stop'):
        emit({'type':'message_end','message':{'role':'assistant','content':[{'type':'text','text':answer}] if answer else [],'stopReason':stop}})
        emit({'type':'agent_settled'});notify('Harness settled');sys.stdin.readline();sys.exit(0)
    def gate(path,body):
        try:return call_gate(path,body)
        except Exception as error:  # G-011: the extension blocks the call and says Gate could not check it
            reason=getattr(error,'read',lambda:b'')().decode(errors='replace') or str(error)
            if path=='/gatekeep':notify(f'Harness note: Gate could not check a tool call ({reason}); that call did not run and Pi continues.')
            return {'outcome':'UNAVAILABLE','reason':reason,'error':reason}
    automatic=lambda:bool(gate('/auto',{}).get('enabled'))
    running={}
    def tool(number,name,gate_name,args,run):
        identifier=f'call-{name}-{number}'
        checked=gate('/gatekeep',{'tool_name':gate_name,'args':args,'pi_tool':name,'auth_level':'admin','tool_call_id':identifier,'cwd':os.getcwd(),'source':'web','request':job})
        emit({'type':'tool_execution_start','toolCallId':identifier,'toolName':name,'args':args})
        if checked.get('outcome')!='ALLOW':
            emit({'type':'tool_execution_end','toolCallId':identifier,'toolName':name,'isError':True,'result':{'content':[{'type':'text','text':str(checked.get('reason'))}]}})
            asked=(checked.get('judgement') or {}).get('choice');asked=asked if asked and (asked.get('scope') or asked.get('replan')) else None  # only Gate's scope questions; the scripts never answered the other judgements
            if asked:  # round 12: Gate's own question (a file outside the task), asked the way the extension's ask_choices does
                shown={key:asked[key] for key in ('question','options','recommended','allow_other','system_owned') if key in asked}  # validateChoice keeps only these
                if automatic():
                    gate('/choice',{'request':job,'choice':shown});gate('/decision',{'request':job,'question':asked['question'],'answer':asked['options'][0]['label'],'state':'auto'})
                else:
                    pending=gate('/choice',{'request':job,'choice':shown});state.write_text(json.dumps([script,number-1]))  # the answer retries this call
                    notify('Harness choice: '+json.dumps(pending));gate('/request/pause',{'request':job});settle('','aborted')
            return
        running['command']=checked.get('command')  # task 311: like the extension, bash runs Gate's sandboxed command
        output,code=run()
        audited=gate('/audit',{'proposal_id':checked['proposal_id'],'tool_name':gate_name,'args':args,'output':output,'exit_code':code})
        if (audited or {}).get('sandbox_refused'):notify('Harness notice: '+audited['sandbox_refused'])
        emit({'type':'tool_execution_end','toolCallId':identifier,'toolName':name,'isError':code!=0})
    def finish():
        """/request/end as the extension does it; True when Run on its own accepted a verified check-in with a next task."""
        for _ in range(3):
            result=(gate('/request/end',{'request':job,'review':True}) or {}).get('result') or {}
            if result.get('outcome')!='continue':break
        if result.get('report'):notify('Harness report: '+json.dumps(result['report']))
        check=result.get('check_in');more=False
        if check and check.get('verified') and automatic():
            gate('/phase/accept',{'cwd':check['root'],'state':'auto','request':job});check['accepted']=True;more=bool(check.get('next'))
        if check and not more:notify('Harness check-in: '+json.dumps(check))
        if result.get('commit'):
            label={'committed':'','not verified':' (not verified)','plan incomplete':' (plan incomplete)'}.get(result.get('outcome'),'')
            notify(f"Harness note: “{result.get('message')}”{label} · committed as {result['commit']}")
        return more
    started=gate('/request',{'request':job,'cwd':os.getcwd(),'text':request['message']})
    if (started.get('advice') or {}).get('notice'):notify('Harness notice: '+started['advice']['notice'])  # like the extension (task 290)
    while index<len(steps):
        step=steps[index];index+=1
        if 'think' in step:emit({'type':'message_update','assistantMessageEvent':{'type':'thinking_delta','delta':step['think']}})
        if 'say' in step:text=step['say']
        if 'read' in step:tool(index,'read','read_file',{'path':step['read']},lambda:(Path(step['read']).read_text(errors='replace'),0) if Path(step['read']).is_file() else ('No such file',1))
        if 'write' in step:
            def write():
                target=Path(step['write']);target.parent.mkdir(parents=True,exist_ok=True);target.write_text(step['content'],encoding='utf-8');return 'written',0
            tool(index,'write','write_file',{'path':step['write'],'content':step['content']},write)
        if 'bash' in step:
            def bash():
                done=subprocess.run(running.get('command') or step['bash'],shell=True,capture_output=True,text=True,timeout=120);return done.stdout+done.stderr,done.returncode
            tool(index,'bash','execute_command',{'command':step['bash']},bash)
        if 'model' in step:  # task 326: ask "the model" through the workbench's tool-call repair proxy, as Pi's provider does, and run the calls it returns
            import urllib.request
            offered=[{'type':'function','function':{'name':'read','description':'Read a file','parameters':{'type':'object','properties':{'path':{'type':'string'}},'required':['path']}}}]
            body={'model':'gemma4:e4b-mlx','stream':False,'messages':[{'role':'user','content':request['message']}],'tools':offered,'_pi_harness_request':job}
            asked=urllib.request.Request(os.environ['PI_HARNESS_TOOL_REPAIR_URL']+'/chat/completions',data=json.dumps(body).encode(),headers={'Content-Type':'application/json'})
            with urllib.request.urlopen(asked,timeout=30) as response:message=json.load(response)['choices'][0]['message']
            for number,call in enumerate(message.get('tool_calls') or []):
                args=json.loads(call['function']['arguments'])
                tool(f'{index}{number}',call['function']['name'],'read_file',args,lambda args=args:(Path(args['path']).read_text(errors='replace'),0) if Path(args['path']).is_file() else ('No such file',1))
            if not message.get('tool_calls'):text='[CANARY] '+(message.get('content') or '')
        if 'hang' in step:time.sleep(step['hang'])
        if 'crash' in step:sys.stderr.write(step['crash']+'\n');sys.exit(3)
        if ('plan' in step or 'choice' in step) and automatic():
            # Run on its own (harness/planning.mjs, choices.mjs): the recommended answer and the plan are taken at once
            if 'plan' in step:
                plan=gate('/plan',{'request':job,'content':step['plan']});gate('/plan/approve',{'request':job,'state':'auto'})
                emit({'type':'tool_execution_end','toolCallId':f'call-plan-{index}','toolName':'propose_plan','isError':False,'result':{'details':{**plan,'pending':False}}})
            else:
                choice=step['choice'];answer=choice['options'][choice.get('recommended',0)]['label']
                gate('/choice',{'request':job,'choice':choice});gate('/decision',{'request':job,'question':choice['question'],'answer':answer,'state':'auto'})
                emit({'type':'tool_execution_end','toolCallId':f'call-choice-{index}','toolName':'ask_choices','isError':False,'result':{'details':{'question':choice['question'],'answer':answer,'state':'auto'}}})
        elif 'plan' in step or 'choice' in step:
            shown=gate('/plan',{'request':job,'content':step['plan']}) if 'plan' in step else gate('/choice',{'request':job,'choice':step['choice']})
            if shown.get('error'):  # the tool fails and Pi reads why; nothing waits for the person
                emit({'type':'tool_execution_end','toolCallId':f'call-control-{index}','toolName':'propose_plan' if 'plan' in step else 'ask_choices','isError':True,'result':{'content':[{'type':'text','text':shown['error']}]}})
                text=f"[CANARY] I could not show it: {shown['error']}";continue
            state.write_text(json.dumps([name,index]))
            notify(('Harness plan: ' if 'plan' in step else 'Harness choice: ')+json.dumps(shown))
            gate('/request/pause',{'request':job});settle(step.get('before',''),'aborted')
        if 'wait' in step:
            if not finish():state.write_text(json.dumps([name,index]));settle(text)
            # Run on its own (the extension): a recovery notice, then a new request identity for the next approved task
            emit({'type':'message_end','message':{'role':'assistant','content':[{'type':'text','text':text}],'stopReason':'stop'}});emit({'type':'agent_settled'})
            notify('Harness recovery: Continue the next approved task.');emit({'type':'agent_start'})
            job=uuid.uuid4().hex;gate('/request',{'request':job,'cwd':os.getcwd(),'text':'Continue the approved task.'})
    state.unlink(missing_ok=True);finish()
    emit({'type':'message_update','assistantMessageEvent':{'type':'text_delta','delta':text}})
    settle(text)
scripted_story()
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
if request['message'].rstrip().endswith('TEST_CRASH'):  # task 290: the runner dies mid-answer
    emit({'type':'message_update','assistantMessageEvent':{'type':'text_start'}})
    emit({'type':'message_update','assistantMessageEvent':{'type':'text_delta','delta':'PARTIAL: the first half of a long answer'}})
    time.sleep(0.3);sys.stderr.write('segfault in model runner\n');sys.exit(9)
if request['message'].rstrip().endswith('TEST_CRASH_AFTER_END'):
    emit({'type':'message_end','message':{'role':'assistant','content':[{'type':'text','text':'COMPLETE ANSWER before crash'}],'stopReason':'stop'}})
    time.sleep(0.3);sys.stderr.write('crash after message_end\n');sys.exit(9)
if request['message'].rstrip().endswith('TEST_STREAM_WAIT'):  # task 290: part of an answer, then a long wait (the person stops it)
    emit({'type':'message_update','assistantMessageEvent':{'type':'text_delta','delta':'PARTIAL before the stop'}})
    time.sleep(60)
if request['message'].rstrip().endswith('TEST_ABORTED_CHOICE'):  # an abort text the pause does not know, with a question waiting
    emit({'type':'extension_ui_request','method':'notify','message':'Harness choice: '+json.dumps({'question':'Park or drop?','options':[{'label':'Park'},{'label':'Drop'}],'recommended':0,'pending':True})})
    emit({'type':'message_end','message':{'role':'assistant','content':[{'type':'text','text':'Answer text before the question.'}],'stopReason':'error','errorMessage':'Provider connection lost'}})
    emit({'type':'agent_settled'});emit({'type':'extension_ui_request','method':'notify','message':'Harness settled'})
    sys.stdin.readline();sys.exit(0)
if request['message'].rstrip().endswith('TEST_NOTICE'):  # task 290: the extension's inline notice (a phase word)
    emit({'type':'extension_ui_request','method':'notify','message':'Harness notice: Pi cannot change the phase. To move the work, use the phase button: Discussion, Planning or Implementation.'})
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
if request['message'].rstrip().endswith(('TEST_CHOICE','TEST_ERROR_CHOICE','TEST_BROKEN_CHOICE','TEST_LIVE_CHOICE')):
    choice={'number':1,'total':3,'question':'Who uses it?','options':[{'label':'Only me'},{'label':'A team'}],'recommended':0,'pending':True}
    emit({'type':'extension_ui_request','method':'notify','message':'Harness choice: '+json.dumps(choice)})
    if request['message'].rstrip().endswith('TEST_LIVE_CHOICE'):time.sleep(5)
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
