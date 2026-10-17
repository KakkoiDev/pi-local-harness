import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import harness from '../../harness/extension.mjs';
// Never the developer's real Pi settings (models.json, AGENTS.md) or a running harness (task 150).
process.env.PI_CODING_AGENT_DIR=mkdtempSync(join(tmpdir(),'pi-agent-dir-'));
for(const key of Object.keys(process.env))if(/^PI_(HARNESS_|WEB_REMOTE_)/.test(key))delete process.env[key];

test('startup, ten-second loop check, abort/compact/reask, canary reinjection', async () => {
 const dir=mkdtempSync(join(tmpdir(),'pi-harness-'));
 writeFileSync(join(dir,'AGENT.md'),'Always prepend [CANARY].');
 const handlers={}, messages=[], notices=[], order=[],commands={},tools={};
 let tick, interval, widget, status, idle = false;
 const entries=[],renderers={};
 let toolResolver;
 const pi={registerCommand:(name,value)=>{commands[name]=value;},registerTool:tool=>{tools[tool.name]=tool;},registerToolRenderer:r=>{toolResolver=r;},appendEntry:(type,data)=>entries.push({type,data}),registerEntryRenderer:(type,renderer)=>{renderers[type]=renderer;},on:(name,fn)=>{handlers[name]=fn;},sendUserMessage:content=>{order.push('reask');messages.push(typeof content==='string'?content:content[0].text);}};
 const ctx={ui:{select:async(_title,options)=>options.includes('Stop Here')?'Stop Here':options[0],notify:text=>notices.push(text),setWidget:(name,lines)=>{if(name==='local-harness')widget=lines;},setStatus:(name,value)=>{status=value;}},
   abort:()=>order.push('abort'),isIdle:()=>idle,
   compact:options=>{order.push('compact');options.onComplete();}};
 const previous={gate:process.env.PI_GATE_PORT,web:process.env.PI_WEB_PORT,data:process.env.PI_WEB_DATA,workspace:process.env.PI_AGENT_DATA,log:process.env.PI_HARNESS_LOG_FILE};
 process.env.PI_HARNESS_WAKE_UPS='1';/* plan 184: one wake-up here, so the limit shows */process.env.PI_WEB_DATA=join(dir,'web');process.env.PI_AGENT_DATA=join(dir,'workspace');process.env.PI_GATE_PORT='0';process.env.PI_WEB_PORT='0';process.env.PI_HARNESS_LOG_FILE=join(dir,'audit.log');
 harness(pi,{root:dir+'/',setInterval:(callback,ms)=>{tick=callback;interval=ms;return {unref(){}};}});
 try {
  await handlers.session_start({},ctx);
  assert.ok(tick,notices.join('\n'));
  assert.equal(interval,10000);
  assert.equal(notices.filter(text=>text.includes('Loop check: every 10 seconds')).length,0);
  assert.equal(widget,undefined);assert.equal(status,undefined);
  const startup=entries.filter(entry=>entry.type==='harness-startup');
  assert.equal(startup.length,1);
  const lines=renderers['harness-startup'](startup[0]).render(120);
  const strip=line=>line.replace(/\x1b\]8;;[^\x1b]*\x1b\\/g,'').replace(/\x1b\[[0-9;]*m/g,'');
  assert.match(strip(lines[0]),/^π Pi Workbench {2}build \S+ · data in /,'round 6 (T_Startup): name and build first');
  for (const [index,label] of [[1,'Web'],[2,'Gate']]) {
   const url=lines[index].match(/http:\/\/127\.0\.0\.1:\d+/)[0];
   assert.equal(lines[index], `  ${label.padEnd(8)}\x1b[4m\x1b]8;;${url}\x1b\\${url}\x1b]8;;\x1b\\\x1b[24m`,'a link: underlined, no colour');
  }
  assert.equal(strip(lines[3]),'  Phone   off · set remote_hosts and remote_users  /guide phone');
  assert.equal(strip(lines[4]),'  Ask in words, or type /harness for commands.');
  assert.equal(strip(lines[5]),'  New here? Try “is anything stuck?”, /status or /guide.','the first start adds one line');
  assert.doesNotMatch(lines.join('\n'),/Loop check/,'it moved to /status');
  assert.match(handlers.before_agent_start({systemPrompt:'Base'}).systemPrompt,/Always prepend/);
  assert.match(handlers.before_agent_start({systemPrompt:'Base'}).systemPrompt,/# Harness console[\s\S]*`\/doctor`/,'a terminal session is the console (plan 158)');
  process.env.PI_HARNESS_SHARED_PORT='1';assert.doesNotMatch(handlers.before_agent_start({systemPrompt:'Base'}).systemPrompt,/# Harness console/,'web workers skip it');delete process.env.PI_HARNESS_SHARED_PORT;
  // Task 114: the web worker's chosen context joins the system prompt for this turn only.
  writeFileSync(join(dir,'context.md'),'Plan: only open items, unique-context-marker');process.env.PI_HARNESS_CONTEXT=join(dir,'context.md');
  assert.match(handlers.before_agent_start({systemPrompt:'Base'}).systemPrompt,/Context for this request:\nPlan: only open items, unique-context-marker/);
  process.env.PI_HARNESS_CONTEXT='';assert.doesNotMatch(handlers.before_agent_start({systemPrompt:'Base'}).systemPrompt,/unique-context-marker/);
  delete process.env.PI_HARNESS_CONTEXT;
  const blocked=await handlers.tool_call({toolCallId:'danger',toolName:'bash',input:{command:'sudo rm -fr *'}});
  assert.equal(blocked.block,true);
  assert.match(blocked.reason,/not executed/);
  assert.match(blocked.reason,/Recursive deletion/);
  assert.match(blocked.reason,/narrowly scoped/);
  assert.doesNotMatch(blocked.reason,/same blocked tool class/);
  const bash={toolCallId:'bash-regression',toolName:'bash',input:{command:'pwd'}};
  assert.equal(await handlers.tool_call(bash),undefined);
  assert.equal(await handlers.tool_result({...bash,content:[{type:'text',text:'developer'}],isError:false}),undefined);
  const web=lines[1].match(/http:\/\/127\.0\.0\.1:\d+/)[0],checked=(await (await fetch(web+'/api/gate')).json()).events.filter(event=>event.tool_call==='bash-regression');
  assert.deepEqual(checked.map(event=>event.phase+' '+event.outcome),['gate ALLOW','audit SUCCESS']);
  // Round 6 (T_Gate): a command that fails on its own is not Gate's doing: Gate's verdict and the exit are separate words.
  const failing={toolCallId:'bash-exit',toolName:'bash',input:{command:'cat missing-fixture-file'}};const noticesBefore=notices.length;
  assert.equal(await handlers.tool_call(failing),undefined);
  const exited=await handlers.tool_result({...failing,content:[{type:'text',text:'Command exited with code 2'}],isError:true});
  assert.match(exited.content.at(-1).text,/^✓ Gate allowed · ✗ exit 2: the command failed on its own; Gate did not block it\.$/);
  const row=toolResolver('bash',()=>undefined).renderResult(exited,{},{},{toolCallId:'bash-exit'}).render(80).map(line=>line.replace(/\x1b\[[0-9;]*m/g,''));
  assert.match(row[0],/^  ✓ Gate allowed · ✗ exit 2 · 0:0\d$/,'round 6: the tool row reads what Gate and the command said');
  assert.doesNotMatch(JSON.stringify(exited),/EXECUTION_FAILED|Gate audit failed/);assert.equal(notices.length,noticesBefore,'no alarm for an ordinary failure');
  // 2026-10-14: Gate's own error reaches Pi (it read only "Gate HTTP 400" and worked around Gate), and Pi 1.1's edits list passes.
  const editDir=join(dir,'edit-checks');mkdirSync(editDir);
  mkdirSync(join(editDir,'tasks'),{recursive:true});writeFileSync(join(editDir,'ROADMAP.md'),'# Checks\n\n## Goal\nVerify file edits.\n\n- [ ] [Checks](tasks/001-checks.md)\n');
  writeFileSync(join(editDir,'tasks/001-checks.md'),'# 001: Checks\nKind: code\nFiles: nowhere.md, plan.md\nDone when: File edits are checked.\n- [ ] Check edits\n');
  await commands.plan.handler('',{...ctx,cwd:editDir});
  execFileSync('python3',['-c',`from pathlib import Path
from gate.paperwork import Paperwork
from gate.protocol import Protocol
import sys
root=Path(sys.argv[1]);paper=Paperwork(Protocol(),data=Path(sys.argv[2]));tasks=['tasks/001-checks.md']
paper.plan_state(root,{'tasks':tasks,'pending':True,'digest':paper.plan_digest(root,tasks)})
`,editDir,join(dir,'workspace')]);
  await commands.build.handler('',{...ctx,cwd:editDir});
  const missing=await handlers.tool_call({toolCallId:'edit-missing',toolName:'edit',input:{path:join(editDir,'nowhere.md'),edits:[{oldText:'a',newText:'b'}]}});
  assert.equal(missing.block,true);assert.match(missing.reason,/G-004 .*use write to create it/,'a missing file is a decision, not a Gate failure');
  // G-011 (plan 184): when Gate itself fails, that call is blocked and reported; the run continues (no babysitting).
  const broken=await handlers.tool_call({toolCallId:'edit-broken',toolName:'edit',input:null});
  assert.equal(broken.block,true);assert.match(broken.reason,/^G-011 .*Gate HTTP 400.*continue/);assert.notEqual(order.at(-1),'abort','the turn goes on');
  assert.equal(entries.filter(entry=>entry.type==='harness-notice').at(-1).data.sentence,'Gate could not check a tool call.');
  assert.match(readFileSync(join(dir,'workspace','reports.jsonl'),'utf8'),/"kind":"gate-failed"/,'reported for the analysis');
  writeFileSync(join(editDir,'plan.md'),'- [ ] two\n');
  assert.equal(await handlers.tool_call({toolCallId:'edit-list',toolName:'edit',input:{path:join(editDir,'plan.md'),edits:[{oldText:'- [ ] two',newText:'- [x] two'}]}}),undefined,'the edit is allowed');
  writeFileSync(join(editDir,'plan.md'),'- [x] two\n');
  assert.equal(await handlers.tool_result({toolCallId:'edit-list',toolName:'edit',input:{path:join(editDir,'plan.md'),edits:[{oldText:'- [ ] two',newText:'- [x] two'}]},content:[],isError:false}),undefined,'and verified');
  const drift={toolCallId:'bash-drift',toolName:'bash',input:{command:'pwd'}};
  assert.equal(await handlers.tool_call(drift),undefined);
  const rejected=await handlers.tool_result({...drift,input:{command:'env'},content:[],isError:false});
  assert.equal(rejected.isError,true);
  assert.match(rejected.content.at(-1).text,/^✗ Gate: the command that ran was not the one it allowed \(DRIFT_DETECTED\)/);
  handlers.input({source:'interactive',text:'Fix my code'});
  handlers.agent_start({},ctx);
  handlers.message_update({assistantMessageEvent:{type:'thinking_delta',delta:'a\nb\nc\na\nb\nc\n'}});
  assert.deepEqual(order,[]); tick(); assert.deepEqual(order,['abort']);
  handlers.agent_end({},ctx);
  await new Promise(resolve=>setTimeout(resolve,10));
  assert.deepEqual(order,['abort','compact','reask']);
  assert.match(messages[0],/Fix my code/);assert.match(messages[0],/Previous reasoning/);
  assert.match(messages[0],/Reinjected AGENTS.md/);
  assert.match(readFileSync(join(dir,'AGENT.md'),'utf8'),/Harness lesson: loop/);
  // Incident records are written under PI_AGENT_DATA, not the module root.
  assert.match(readFileSync(join(dir,'workspace','incident_log.md'),'utf8'),/Harness loop/);
  assert.match(readFileSync(join(dir,'workspace','session.log'),'utf8'),/"event":"recovery"/);
  assert.match(readFileSync(join(dir,'workspace','reports.jsonl'),'utf8'),/"kind":"recovery"/,'plan 184: every recovery is reported');
  assert.equal(existsSync(join(dir,'incident_log.md')),false);assert.equal(existsSync(join(dir,'session.log')),false);
  handlers.input({source:'interactive',text:'Next question'});
  handlers.agent_start({},ctx);
  handlers.message_end({message:{role:'assistant',content:[{type:'text',text:'Forgot token'}]}});
  handlers.agent_end({},ctx);
  await new Promise(resolve=>setTimeout(resolve,10));
  assert.match(messages[1],/omitted \[CANARY\]/);
  assert.match(readFileSync(join(dir,'AGENT.md'),'utf8'),/Harness lesson: canary/);
  // A second failure for the same question must not reask indefinitely.
  handlers.agent_start({},ctx);
  handlers.message_end({message:{role:'assistant',content:[{type:'text',text:'Forgot again'}]}});
  handlers.agent_end({},ctx);
  await new Promise(resolve=>setTimeout(resolve,10));
  assert.equal(messages.length,2);
  assert.equal(entries.filter(entry=>entry.type==='harness-notice').at(-1).data.sentence,'Harness stopped retrying.');
  await handlers.input({source:'interactive',text:'Hang test'},ctx);
  handlers.agent_start({},ctx); idle=true;
  const before=order.length; tick(); assert.equal(order.length,before);
  handlers.message_update({assistantMessageEvent:{type:'thinking_delta',delta:'unfinished thought'}});
  tick(); assert.equal(order.at(-1),'abort');
  handlers.agent_end({},ctx);
  await new Promise(resolve=>setTimeout(resolve,10));
  assert.match(messages[2],/no active model operation/);
  assert.equal(entries.filter(entry=>entry.type==='harness-notice').at(-1).data.sentence,'Harness stopped a hang.','round 6: the harness says it in a sentence');assert.equal(notices.some(text=>/Harness recovery/.test(text)),false);
  assert.match(readFileSync(join(dir,'AGENT.md'),'utf8'),/Harness lesson: hang/);
  // Protocol gate: a commit without red/green/task/roadmap evidence is revised, not treated as destructive.
  mkdirSync(join(dir,'tasks'),{recursive:true});writeFileSync(join(dir,'ROADMAP.md'),'# App\n## Goal\nShow a greeting.\n- [ ] [01](tasks/01.md)\n');writeFileSync(join(dir,'tasks','01.md'),'# 01: Greeting\nFiles: hello.py, broken.py, app.py\n- [ ] Do\n- [ ] Verify\nDone when: The greeting works.\n');
  ctx.cwd=dir;await commands.plan.handler('',ctx);
  execFileSync('git',['init','-q',dir]);writeFileSync(join(dir,'app.py'),'x = 1\n');
  const commit=await handlers.tool_call({toolCallId:'commit',toolName:'bash',input:{command:'git commit -qam work'}});
  assert.equal(commit.block,true);
  assert.match(commit.reason,/Gate pre-execution REVISE/);assert.match(commit.reason,/Missing: a failing \(red\) test/);
  assert.match(commit.reason,/then retry/);assert.doesNotMatch(commit.reason,/destructive/);
  const box=await handlers.tool_call({toolCallId:'box-1',toolName:'task_box',input:{path:'tasks/01.md',box:'do'}});
  assert.equal(box.block,true);assert.match(box.reason,/System 1 ticks task boxes/);
  // Plan 184: the first change gives the request its task, made by the harness; Pi reads where it is.
  await handlers.input({source:'interactive',text:'Fix a greeting'},ctx);
  await tools.propose_plan.execute('fixture-plan',{},null,null,ctx);
  const greet={toolCallId:'greet',toolName:'write',input:{path:join(dir,'hello.py'),content:'print(1)\n'}};
  assert.equal(await handlers.tool_call(greet),undefined);writeFileSync(join(dir,'hello.py'),'print(1)\n');
  const told=await handlers.tool_result({...greet,content:[{type:'text',text:'Wrote hello.py'}],isError:false});
  assert.match(told.content.at(-1).text,/^This request's task is tasks\/01\.md \(named in the request\); the harness keeps it/);
  assert.match(readFileSync(join(dir,'ROADMAP.md'),'utf8'),/- \[ \] \[01\]\(tasks\/01\.md\)/);
  // Strategy 2: a write that breaks the file's syntax is answered in the same tool result.
  const brokenPy={toolCallId:'broken-py',toolName:'write',input:{path:join(dir,'broken.py'),content:'def f(:\n'}};
  assert.equal(await handlers.tool_call(brokenPy),undefined);writeFileSync(join(dir,'broken.py'),'def f(:\n');
  const said=await handlers.tool_result({...brokenPy,content:[{type:'text',text:'Wrote broken.py'}],isError:false});
  assert.match(said.content.map(part=>part.text).join('\n'),/broken\.py does not parse: .* at line 1\. Fix it before going on\./);
  // G-012 for terminal Pi (plan 179, L-005): a turn that changed code and ran no passing test after it ends marked.
  // Plan 184: first the harness wakes Pi to finish (it changed code and no passing test ran on it), then, out of
  // wake-ups, it marks the turn. An answer that asks the person something is not woken.
  await handlers.input({source:'interactive',text:'Change the code'},ctx);
  writeFileSync(join(dir,'app.py'),'x = 3\n');
  const sent=messages.length;
  await handlers.agent_settled({aborted:false},ctx);
  assert.match(messages.at(-1),/^Continue \(harness wake-up 1 of 1\)/);assert.equal(messages.length,sent+1);
  assert.equal(entries.filter(entry=>entry.type==='harness-notice').at(-1).data.sentence,'Harness woke Pi up.');
  assert.match(readFileSync(join(dir,'workspace','reports.jsonl'),'utf8'),/"kind":"wake-up"/);
  handlers.agent_start({},ctx);
  await handlers.agent_settled({aborted:false},ctx);
  assert.equal(messages.length,sent+1,'out of wake-ups');
  const unverified=entries.filter(entry=>entry.type==='harness-notice').at(-1).data;
  assert.equal(unverified.sentence,'Not verified.');assert.match(unverified.detail,/app\.py.*G-012/);
  await handlers.input({source:'interactive',text:'Change it again'},ctx);writeFileSync(join(dir,'app.py'),'x = 4\n');
  handlers.message_end({message:{role:'assistant',content:[{type:'text',text:'[CANARY] Should I also update the docs?'}],stopReason:'stop'}});
  await handlers.agent_settled({aborted:false},ctx);assert.equal(messages.length,sent+1,'a question to the person is not woken');
  await handlers.input({source:'interactive',text:'Once more'},ctx);writeFileSync(join(dir,'app.py'),'x = 5\n');
  await handlers.agent_settled({aborted:true},ctx);assert.equal(messages.length,sent+1,'the person stopped it: not woken');
 } finally {
  handlers.session_shutdown();
  for(const [key,value] of Object.entries(previous)) {
   const name={gate:'PI_GATE_PORT',web:'PI_WEB_PORT',data:'PI_WEB_DATA',workspace:'PI_AGENT_DATA',log:'PI_HARNESS_LOG_FILE'}[key];
   if(value===undefined) delete process.env[name]; else process.env[name]=value;
  }
  rmSync(dir,{recursive:true});
 }
});

test('a long chat is compacted after the turn that passes 60% of the window, once (task 116)',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-compact-'));writeFileSync(join(dir,'AGENT.md'),'Always prepend [CANARY].');
 const handlers={},compactions=[];let usage={tokens:10000,contextWindow:32768,percent:30};
 const pi={on:(name,fn)=>{handlers[name]=fn;},sendUserMessage(){}};
 const ctx={ui:{notify(){},setWidget(){},setStatus(){}},abort(){},isIdle:()=>true,getContextUsage:()=>usage,compact:options=>compactions.push(options)};
 const previous=process.env.PI_AGENT_DATA;process.env.PI_AGENT_DATA=join(dir,'workspace');
 harness(pi,{root:dir+'/',setInterval:()=>({unref(){}})});
 try{
  handlers.agent_end({},ctx);await new Promise(resolve=>setTimeout(resolve,10));
  assert.equal(compactions.length,0,'30% is fine');
  usage={tokens:21000,contextWindow:32768,percent:64};handlers.agent_end({},ctx);await new Promise(resolve=>setTimeout(resolve,10));
  assert.equal(compactions.length,1,'above 60% after a turn: compact');
  assert.match(compactions[0].customInstructions,/open work/);
  handlers.agent_end({},ctx);await new Promise(resolve=>setTimeout(resolve,10));
  assert.equal(compactions.length,1,'not twice in a row: the usage reading is stale until the next reply');
  handlers.agent_start({},ctx);usage={tokens:null,contextWindow:32768,percent:null};handlers.agent_end({},ctx);await new Promise(resolve=>setTimeout(resolve,10));
  assert.equal(compactions.length,1,'unknown usage: nothing');
  handlers.agent_start({},ctx);usage={tokens:25000,contextWindow:32768,percent:76};handlers.agent_end({},ctx);await new Promise(resolve=>setTimeout(resolve,10));
  assert.equal(compactions.length,2,'a new turn above the line compacts again');
 }finally{handlers.session_shutdown?.();if(previous===undefined)delete process.env.PI_AGENT_DATA;else process.env.PI_AGENT_DATA=previous;rmSync(dir,{recursive:true,force:true});}
});

test('a second agent is refused at input while another holds the lock (task 150)', async () => {
 const dir=mkdtempSync(join(tmpdir(),'pi-lock-'));writeFileSync(join(dir,'AGENT.md'),'Always prepend [CANARY].');
 const { AgentLock } = await import('../../harness/agent-lock.mjs');
 const other=new AgentLock(join(dir,'.agent-lock'),()=>true);
 const handlers={},notices=[],entries=[],renderers={};
 const pi={appendEntry:(type,data)=>entries.push({type,data}),registerEntryRenderer:(type,renderer)=>{renderers[type]=renderer;},on:(name,fn)=>{handlers[name]=fn;},sendUserMessage(){}};
 harness(pi,{root:dir+'/',setInterval:()=>({unref(){}})});
 try {
  other.acquire(); // the other agent (terminal or web) works now
  const refused=await handlers.input({source:'interactive',text:'Hello'},{ui:{notify:text=>notices.push(text)},cwd:dir});
  assert.equal(refused.action,'handled','the turn does not run');
  // Round 6 (T_Gate): in terminal Pi, a bold sentence first, drawn and never sent to the model.
  assert.deepEqual(notices,[]);assert.equal(entries.at(-1).type,'harness-notice');
  assert.equal(renderers['harness-notice'](entries.at(-1)).render(80)[0],'\x1b[1m■ Another request is running.\x1b[22m');
  process.env.PI_HARNESS_SHARED_PORT='1';
  try { await handlers.input({source:'interactive',text:'Hello'},{ui:{notify:text=>notices.push(text)},cwd:dir}); } finally { delete process.env.PI_HARNESS_SHARED_PORT; }
  assert.match(notices.join('\n'),/^Harness refused: One agent is already working/,'a web worker keeps the prefix the workbench reads');
  other.release();
  const allowed=await handlers.input({source:'interactive',text:'Hello'},{ui:{notify:text=>notices.push(text)},cwd:dir});
  assert.equal(allowed.action,'continue');
  const prompt=handlers.before_agent_start({systemPrompt:'Base'}).systemPrompt;assert.match(prompt,/Always prepend/,'memory still injected');
  assert.match(prompt,/G-008 Plan files change through edit or write/,'plan 179: the rules Gate enforces, from its registry');
 } finally { handlers.agent_settled?.(); rmSync(dir,{recursive:true}); }
});

test('a workbench request skips the lock the workbench holds, and waits for its turn before each model call (task 164)', async () => {
 const dir=mkdtempSync(join(tmpdir(),'pi-turn-'));writeFileSync(join(dir,'AGENT.md'),'Always prepend [CANARY].');
 const { AgentLock } = await import('../../harness/agent-lock.mjs');
 const workbench=new AgentLock(join(dir,'.agent-lock'),()=>true);
 const handlers={},calls=[];const fetchBefore=globalThis.fetch;
 globalThis.fetch=async(url,options)=>{calls.push([url,options.method]);await new Promise(resolve=>setTimeout(resolve,50));return {ok:true,json:async()=>({waited:0})};};
 process.env.PI_HARNESS_LOCK_HELD='1';process.env.PI_HARNESS_TURN_URL='http://127.0.0.1:3100/api/turn?job=abc';
 const pi={appendEntry(){},registerEntryRenderer(){},on:(name,fn)=>{handlers[name]=fn;},sendUserMessage(){}};
 harness(pi,{root:dir+'/',setInterval:()=>({unref(){}})});
 try {
  workbench.acquire(); // the workbench holds it for all its requests
  const allowed=await handlers.input({source:'rpc',text:'Hello'},{ui:{notify(){}},cwd:dir});
  assert.equal(allowed.action,'continue','a workbench request is not refused by the workbench lock');
  const started=Date.now();const result=await handlers.before_provider_request({payload:{model:'x'}});
  assert.equal(result,undefined,'the request itself is unchanged');assert.ok(Date.now()-started>=45,'it waited for the answer');
  assert.deepEqual(calls,[['http://127.0.0.1:3100/api/turn?job=abc','POST']]);
  delete process.env.PI_HARNESS_TURN_URL;await handlers.before_provider_request({payload:{}});assert.equal(calls.length,1,'no turn URL, no call');
  globalThis.fetch=async()=>{throw new Error('down');};process.env.PI_HARNESS_TURN_URL='http://127.0.0.1:1/api/turn';
  assert.equal(await handlers.before_provider_request({payload:{}}),undefined,'an unreachable workbench never blocks the model');
 } finally { globalThis.fetch=fetchBefore;delete process.env.PI_HARNESS_LOCK_HELD;delete process.env.PI_HARNESS_TURN_URL;workbench.release();rmSync(dir,{recursive:true}); }
});

test('a web worker reaches Gate even when its memory file is missing; the template stands in (bench, 2026-10-15)', async () => {
 // The first bench run: a scratch data folder had no AGENTS.md, reading it threw at session start before Gate's port
 // was set, and every tool call answered "Gate is unavailable".
 const dir=mkdtempSync(join(tmpdir(),'pi-memory-'));
 const saved={...process.env};
 Object.assign(process.env,{PI_HARNESS_SHARED_PORT:'1',PI_HARNESS_TOKEN:'t',PI_WEB_PORT:'3999',PI_AGENT_DATA:join(dir,'data'),PI_HARNESS_MEMORY:join(dir,'data','AGENTS.md')});
 const handlers={};
 const pi={on:(name,fn)=>{handlers[name]=fn;},appendEntry(){},registerEntryRenderer(){},sendUserMessage(){}};
 try {
  harness(pi,{root:dir+'/'});
  await handlers.session_start({},{ui:{notify(){},setWidget(){},setStatus(){}},cwd:dir});
  const call=await handlers.tool_call({toolCallId:'m',toolName:'read',input:{path:join(dir,'x')}});
  assert.doesNotMatch(call.reason,/Gate is unavailable/,'the port is set: the call reached for Gate');
  assert.match(handlers.before_agent_start({systemPrompt:'Base'}).systemPrompt,/\[CANARY\]/,'the template stands in for the missing memory');
  assert.match(readFileSync(join(dir,'data','reports.jsonl'),'utf8'),/"kind":"memory-missing"/);
 } finally { for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key]; Object.assign(process.env,saved); handlers.session_shutdown?.(); rmSync(dir,{recursive:true,force:true}); }
});

test('bare mode (the bench baseline): Pi with Gate safety only, none of the harness around it', async () => {
 const dir=mkdtempSync(join(tmpdir(),'pi-bare-'));const saved={...process.env};
 Object.assign(process.env,{PI_HARNESS_BARE:'1',PI_HARNESS_SHARED_PORT:'1',PI_HARNESS_TOKEN:'t',PI_WEB_PORT:'3999',PI_AGENT_DATA:join(dir,'data')});
 const handlers={},tools=[],sent=[];
 const pi={on:(name,fn)=>{handlers[name]=fn;},appendEntry(){},registerEntryRenderer(){},registerTool:tool=>tools.push(tool.name),registerCommand(){},sendUserMessage:text=>sent.push(text)};
 try {
  harness(pi,{root:dir+'/'});
  assert.deepEqual(tools,[],'no harness, task_box or browser tool');
  await handlers.session_start({},{ui:{notify(){},setWidget(){},setStatus(){}},cwd:dir});
  assert.doesNotMatch(handlers.before_agent_start({systemPrompt:'Base'}).systemPrompt,/G-008/,'no rules summary');
  await handlers.input({source:'rpc',text:'Fix it'},{ui:{notify(){}},cwd:dir});
  await handlers.agent_settled({aborted:false},{ui:{notify(){}}});
  assert.deepEqual(sent,[],'never woken');
 } finally { for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key]; Object.assign(process.env,saved); handlers.session_shutdown?.(); rmSync(dir,{recursive:true,force:true}); }
});

test('the same failing call again and again stops the turn and Pi is asked to change course (strategy 3)', async () => {
 const dir=mkdtempSync(join(tmpdir(),'pi-stuck-'));const saved={...process.env};
 Object.assign(process.env,{PI_AGENT_DATA:join(dir,'data'),PI_HARNESS_WAKE_UPS:'2'});
 const handlers={},entries=[],order=[];
 const pi={on:(name,fn)=>{handlers[name]=fn;},appendEntry:(type,data)=>entries.push({type,data}),registerEntryRenderer(){},sendUserMessage:()=>order.push('reask')};
 try {
  harness(pi,{root:dir+'/'});
  const ctx={ui:{notify(){},setWidget(){},setStatus(){}},cwd:dir,abort:()=>order.push('abort'),isIdle:()=>false,compact:options=>options.onComplete()};
  handlers.agent_start({},ctx);
  await handlers.input({source:'interactive',text:'List the files'},ctx);
  for (let i=0;i<3;i++) await handlers.tool_result({toolCallId:`s${i}`,toolName:'bash',input:{command:'ls /nowhere'},content:[{type:'text',text:'No such file'}],isError:true});
  assert.deepEqual(order,['abort'],'stopped after the third identical failure');
  assert.equal(entries.filter(entry=>entry.type==='harness-notice').at(-1).data.sentence,'Harness stopped a repeat.');
  assert.match(readFileSync(join(dir,'data','reports.jsonl'),'utf8'),/"trigger":"stuck"/);
  handlers.agent_end({},ctx);await new Promise(resolve=>setTimeout(resolve,20));
  assert.equal(order.at(-1),'reask','asked again, another way');
 } finally { for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key]; Object.assign(process.env,saved); handlers.session_shutdown?.(); rmSync(dir,{recursive:true,force:true}); }
});

test('each request gets only the harness tools it needs (strategy 4)', async () => {
 const dir=mkdtempSync(join(tmpdir(),'pi-tools-'));const saved={...process.env};
 Object.assign(process.env,{PI_AGENT_DATA:join(dir,'data'),PI_HARNESS_SHARED_PORT:'1',PI_HARNESS_TOKEN:'t',PI_WEB_PORT:'3999'});
 mkdirSync(join(dir,'tasks'),{recursive:true});writeFileSync(join(dir,'ROADMAP.md'),'# R\n');
 const handlers={};let active=['read','bash','edit','write','harness','task_box','browser'];
 const pi={on:(name,fn)=>{handlers[name]=fn;},appendEntry(){},registerEntryRenderer(){},registerTool(){},registerCommand(){},sendUserMessage(){},
  getActiveTools:()=>active,setActiveTools:names=>{active=names;},getAllTools:()=>['read','bash','edit','write','harness','task_box','browser'].map(name=>({name}))};
 try {
  harness(pi,{root:dir+'/'});
  const ctx={ui:{notify(){},setWidget(){},setStatus(){}},cwd:dir};
  await handlers.session_start({},ctx);
  await handlers.input({source:'rpc',text:'Rename area_rect to rectangle_area'},ctx);
  assert.deepEqual(active,['read','bash','edit','write'],'a web request about code: no console, no browser');
  await handlers.input({source:'rpc',text:'the page lifts and leaves white at the bottom'},ctx);
  assert.deepEqual(active,['read','bash','edit','write','browser']);
  // Strategy 5: the request's guide joins the prompt for this request only, and is reported.
  assert.match(handlers.before_agent_start({systemPrompt:'Base'}).systemPrompt,/Guides for this request:[\s\S]*observe it before reading code/);
  await handlers.input({source:'rpc',text:'Write a README'},ctx);
  assert.doesNotMatch(handlers.before_agent_start({systemPrompt:'Base'}).systemPrompt,/Guides for this request/);
  assert.match(readFileSync(join(dir,'data','reports.jsonl'),'utf8'),/"kind":"guide","detail":"page-layout"/);
 } finally { for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key]; Object.assign(process.env,saved); handlers.session_shutdown?.(); rmSync(dir,{recursive:true,force:true}); }
});

for (const trigger of ['loop','hang','canary','wake-up']) test(`a ${trigger} recovery keeps its request until the resumed turn settles (task 227)`, async () => {
 const dir=mkdtempSync(join(tmpdir(),'pi-recovery-request-')),saved={...process.env},fetchBefore=globalThis.fetch;
 Object.assign(process.env,{PI_AGENT_DATA:join(dir,'data'),PI_WEB_DATA:join(dir,'web'),PI_TRASH_DIR:join(dir,'trash'),PI_TAILSCALE:'false',PI_OLLAMA_URL:'http://127.0.0.1:9',PI_HARNESS_SHARED_PORT:'1',PI_HARNESS_TOKEN:'t',PI_HARNESS_WAKE_UPS:'1'});
 writeFileSync(join(dir,'AGENT.md'),'Always prepend [CANARY].');
 const handlers={},calls=[],messages=[],notices=[];let tick,compact,changed=false,verified=false;
 globalThis.fetch=async(url,options)=>{
  const path=new URL(url).pathname,body=JSON.parse(options.body);calls.push({path,body});
  return {ok:true,json:async()=>path==='/verification'?{verification:{state:changed?'after':'before',code:changed?['app.py']:[],verified}}:{}};
 };
 const pi={on:(name,fn)=>{handlers[name]=fn;},appendEntry(){},registerEntryRenderer(){},sendUserMessage:message=>messages.push(message)};
 const ctx={cwd:dir,ui:{notify:text=>notices.push(text),setWidget(){},setStatus(){}},abort(){},isIdle:()=>trigger==='hang',compact:options=>{compact=options;}};
 try {
  harness(pi,{root:dir+'/',setInterval:callback=>{tick=callback;return {unref(){}};}});
  await handlers.session_start({},ctx);await handlers.input({source:'interactive',text:'Fix the code'},ctx);handlers.agent_start({},ctx);changed=true;
  if(trigger==='loop') { handlers.message_update({assistantMessageEvent:{type:'thinking_delta',delta:'a\nb\nc\na\nb\nc\n'}});tick(); }
  if(trigger==='hang') { handlers.message_update({assistantMessageEvent:{type:'thinking_delta',delta:'thinking'}});tick(); }
  if(trigger==='canary') handlers.message_end({message:{role:'assistant',content:[{type:'text',text:'Forgot the token'}]}});
  if(trigger!=='wake-up') handlers.agent_end({},ctx);
  await handlers.agent_settled({aborted:trigger!=='wake-up'},ctx);
  assert.equal(calls.filter(call=>call.path==='/request/end').length,0,'the interrupted turn must not close the request');
  await new Promise(resolve=>setTimeout(resolve,10));
  if(compact) compact.onComplete();
  assert.equal(messages.length,1,'one continuation is queued');
  await handlers.agent_settled({aborted:true},ctx);
  assert.equal(calls.filter(call=>call.path==='/request/end').length,0,'a settle while the continuation is queued must not close it');
  assert.equal(notices.includes('Harness settled'),false,'the web worker must keep waiting');
  await handlers.input({source:'extension',text:'Continue'},ctx);handlers.agent_start({},ctx);
  handlers.message_end({message:{role:'assistant',content:[{type:'text',text:'[CANARY] Done.'}]}});
  verified=true;handlers.agent_end({},ctx);await handlers.agent_settled({aborted:false},ctx);
  const requests=calls.filter(call=>call.path==='/request'),ends=calls.filter(call=>call.path==='/request/end');
  assert.equal(requests.length,1);assert.deepEqual(ends.map(call=>call.body.request),[requests[0].body.request]);
  await handlers.agent_settled({aborted:false},ctx);assert.equal(calls.filter(call=>call.path==='/request/end').length,1);
 } finally { handlers.session_shutdown?.();globalThis.fetch=fetchBefore;for(const key of Object.keys(process.env))if(!(key in saved))delete process.env[key];Object.assign(process.env,saved);rmSync(dir,{recursive:true,force:true}); }
});

test('context is selected again for user turns and recovery inputs (task 234)', async () => {
 const dir=mkdtempSync(join(tmpdir(),'pi-context-turn-')),saved={...process.env},fetchBefore=globalThis.fetch;
 Object.assign(process.env,{PI_AGENT_DATA:join(dir,'data'),PI_HARNESS_SHARED_PORT:'1',PI_HARNESS_TOKEN:'t'});
 const handlers={},queries=[];let version='first';
 globalThis.fetch=async(url,options)=>{const path=new URL(url).pathname;if(path==='/context')queries.push(JSON.parse(options.body));return {ok:true,json:async()=>path==='/context'?{text:`selected ${version}`,included:['README.md'],reasons:{'README.md':'Project rules'}}:{}};};
 const pi={on:(name,fn)=>{handlers[name]=fn;},appendEntry(){},registerEntryRenderer(){},sendUserMessage(){}};
 const ctx={cwd:dir,ui:{notify(){},setWidget(){},setStatus(){}}};
 try {
  harness(pi,{root:dir+'/',setInterval:()=>({unref(){}})});await handlers.session_start({},ctx);
  await handlers.input({source:'interactive',text:'make the ball faster'},ctx);
  assert.match(handlers.before_agent_start({systemPrompt:'Base'}).systemPrompt,/selected first/);
  version='resumed';await handlers.input({source:'extension',text:'Harness recovery: continue'},ctx);
  const resumed=handlers.before_agent_start({systemPrompt:'Base'}).systemPrompt;
  assert.match(resumed,/selected resumed/);assert.doesNotMatch(resumed,/selected first/);
  assert.equal(queries.length,2);assert.equal(queries[1].text,'make the ball faster');assert.equal(queries[1].request,queries[0].request);
  version='next';await handlers.input({source:'interactive',text:'fix the clock'},ctx);
  assert.equal(queries[2].text,'fix the clock');assert.notEqual(queries[2].request,queries[0].request);
 } finally {handlers.session_shutdown?.();globalThis.fetch=fetchBefore;for(const key of Object.keys(process.env))if(!(key in saved))delete process.env[key];Object.assign(process.env,saved);rmSync(dir,{recursive:true,force:true});}
});

for (const kind of ['starter','plan']) test(`${kind} cleanup resumes the same request once before its commit (tasks 229, 233)`, async () => {
 const dir=mkdtempSync(join(tmpdir(),'pi-sample-review-')),saved={...process.env},fetchBefore=globalThis.fetch;
 Object.assign(process.env,{PI_AGENT_DATA:join(dir,'data'),PI_HARNESS_SHARED_PORT:'1',PI_HARNESS_TOKEN:'t'});
 const handlers={},calls=[],sent=[],notices=[];let ends=0;
 globalThis.fetch=async(url,options)=>{const path=new URL(url).pathname;calls.push({path,body:JSON.parse(options.body)});return {ok:true,json:async()=>path==='/request/end'?{result:++ends===1?{outcome:'continue',kind,instruction:'Replace the unused notes sample; keep storage.'}:{outcome:'committed',message:'Game',commit:'abc'}}:{}};};
 const pi={on:(name,fn)=>{handlers[name]=fn;},appendEntry(){},registerEntryRenderer(){},sendUserMessage:text=>sent.push(text)};
 const ctx={cwd:dir,ui:{notify:text=>notices.push(text),setWidget(){},setStatus(){}}};
 try {
  harness(pi,{root:dir+'/',setInterval:()=>({unref(){}})});await handlers.session_start({},ctx);
  await handlers.input({source:'interactive',text:'Build a game'},ctx);
  await handlers.agent_settled({aborted:false});
  assert.equal(sent.length,1);assert.match(sent[0],/Replace the unused notes sample/);
  assert.ok(notices.some(text=>text.includes(kind==='plan'?'Plan incomplete.':'This project started from the sample notes app.')));
  assert.equal(notices.filter(text=>text==='Harness settled').length,0);
  await handlers.agent_settled({aborted:false});assert.equal(ends,1,'old cleanup settle cannot end the request');
  await handlers.input({source:'extension',text:sent[0]},ctx);handlers.agent_start({},ctx);
  await handlers.agent_settled({aborted:false});
  const ended=calls.filter(call=>call.path==='/request/end');assert.equal(ended.length,2);assert.equal(ended[0].body.request,ended[1].body.request);
  assert.equal(notices.filter(text=>text==='Harness settled').length,1);
 } finally {handlers.session_shutdown?.();globalThis.fetch=fetchBefore;for(const key of Object.keys(process.env))if(!(key in saved))delete process.env[key];Object.assign(process.env,saved);rmSync(dir,{recursive:true,force:true});}
});

test('ask_choices records a terminal answer and clears the assumption Gate quoted (task 236)', async t => {
  const dir=mkdtempSync(join(tmpdir(),'pi-choices-')),handlers={},tools={},commands={};
  const keys=['PI_AGENT_DATA','PI_GATE_PORT','PI_WEB_PORT','PI_TAILSCALE','PI_OLLAMA_URL'];const before=Object.fromEntries(keys.map(key=>[key,process.env[key]]));
  Object.assign(process.env,{PI_AGENT_DATA:join(dir,'data'),PI_GATE_PORT:'0',PI_WEB_PORT:'0',PI_TAILSCALE:'false',PI_OLLAMA_URL:'http://127.0.0.1:9'});
  mkdirSync(join(dir,'tasks'),{recursive:true});writeFileSync(join(dir,'ROADMAP.md'),'# App\n## Goal\nBuild an app.\n- [ ] [App](tasks/001-app.md)\n');writeFileSync(join(dir,'tasks/001-app.md'),'# App\nFiles: app.py\n- [ ] Build\nDone when: It works.\n');writeFileSync(join(dir,'AGENT.md'),'Always prepend [CANARY].');
  const ctx={cwd:dir,ui:{notify(){},setWidget(){},setStatus(){},select:async(_question,options)=>options[0]},abort(){},isIdle:()=>true};
  harness({on:(name,fn)=>{handlers[name]=fn;},registerCommand:(name,value)=>{commands[name]=value;},registerTool:tool=>{tools[tool.name]=tool;}},{root:dir+'/'});
  t.after(async()=>{handlers.session_shutdown?.();await new Promise(resolve=>setTimeout(resolve,300));for(const key of keys){if(before[key]===undefined)delete process.env[key];else process.env[key]=before[key];}rmSync(dir,{recursive:true,force:true});});
  await handlers.session_start({},ctx);await commands.plan.handler('',ctx);await handlers.input({source:'interactive',text:'Fix the app'},ctx);await tools.propose_plan.execute('fixture-plan',{},null,null,ctx);
  handlers.message_update({assistantMessageEvent:{type:'thinking_delta',delta:"I'll assume blue."}});
  const write={toolCallId:'assumed',toolName:'write',input:{path:join(dir,'app.py'),content:'colour="blue"\n'}};
  assert.match((await handlers.tool_call(write)).reason,/G-016.*I.ll assume blue/);
  const result=await tools.ask_choices.execute('choose',{question:'Which colour?',options:[{label:'Blue'},{label:'Green'}],recommended:0},null,null,ctx);
  assert.equal(result.isError,undefined);assert.equal(result.details.answer,'Blue');
  assert.equal(await handlers.tool_call({...write,toolCallId:'answered'}),undefined);
  const task=readFileSync(join(dir,'tasks/001-app.md'),'utf8');assert.match(task,/Which colour\?: Blue \(chosen /);
});

test('a project-defining request always gets planning guidance and code waits for the terminal approval (task 237)', async t => {
  const dir=mkdtempSync(join(tmpdir(),'pi-plan-')),handlers={},tools={},commands={};
  const keys=['PI_AGENT_DATA','PI_GATE_PORT','PI_WEB_PORT','PI_TAILSCALE','PI_OLLAMA_URL'];const before=Object.fromEntries(keys.map(key=>[key,process.env[key]]));
  Object.assign(process.env,{PI_AGENT_DATA:join(dir,'data'),PI_GATE_PORT:'0',PI_WEB_PORT:'0',PI_TAILSCALE:'false',PI_OLLAMA_URL:'http://127.0.0.1:9'});
  mkdirSync(join(dir,'tasks'),{recursive:true});writeFileSync(join(dir,'ROADMAP.md'),'# Game\n## Goal\nA pong game.\n## Tasks\n- [ ] [Ball](tasks/001-ball.md)\n');writeFileSync(join(dir,'tasks/001-ball.md'),'# 001: Ball\n- [ ] Bounce\nDone when: The ball bounces.\nFiles: game.py\n');writeFileSync(join(dir,'AGENT.md'),'Always prepend [CANARY].');
  const ctx={cwd:dir,ui:{notify(){},setWidget(){},setStatus(){},select:async(_question,options)=>options[0]},abort(){},isIdle:()=>true};
  harness({on:(name,fn)=>{handlers[name]=fn;},registerCommand:(name,value)=>{commands[name]=value;},registerTool:tool=>{tools[tool.name]=tool;}},{root:dir+'/'});
  t.after(async()=>{handlers.session_shutdown?.();await new Promise(resolve=>setTimeout(resolve,300));for(const key of keys){if(before[key]===undefined)delete process.env[key];else process.env[key]=before[key];}rmSync(dir,{recursive:true,force:true});});
  await handlers.session_start({},ctx);await commands.plan.handler('',ctx);await handlers.input({source:'interactive',text:'Build a pong game'},ctx);
  assert.match(handlers.before_agent_start({systemPrompt:'Base'}).systemPrompt,/Every request follows the shared phase/);
  const write={toolCallId:'early',toolName:'write',input:{path:join(dir,'game.py'),content:'speed=5\n'}};
  assert.match((await handlers.tool_call(write)).reason,/G-015/);
  const result=await tools.propose_plan.execute('plan',{},null,null,ctx);assert.equal(result.isError,undefined);
  assert.match(readFileSync(join(dir,'tasks/001-ball.md'),'utf8'),/Plan approved: chosen/);
  assert.equal(await handlers.tool_call({...write,toolCallId:'approved'}),undefined);
  const refused=await handlers.tool_call({...write,toolCallId:'outside',input:{path:join(dir,'other.py'),content:'x=1\n'}});
  assert.match(refused.reason,/not part of task/);
});

test('auto check-ins start fresh request identities and finish with a report (task 238)',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-auto-chain-')),saved={...process.env},fetchBefore=globalThis.fetch;
 Object.assign(process.env,{PI_AGENT_DATA:join(dir,'data'),PI_HARNESS_SHARED_PORT:'1',PI_HARNESS_TOKEN:'t',PI_HARNESS_JOB:'initial-job'});
 const handlers={},calls=[],sent=[],notices=[];let ends=0;
 globalThis.fetch=async(url,options)=>{
  const path=new URL(url).pathname;calls.push({path,body:JSON.parse(options.body)});
  return {ok:true,json:async()=>path==='/auto'?{enabled:true}:path==='/request/end'?{result:++ends===1?{outcome:'committed',message:'Ball',commit:'abc',check_in:{verified:true,next:'tasks/002-score.md'}}:{outcome:'committed',message:'Score',commit:'def',check_in:{verified:true,next:null},report:{counts:{done:2,decisions:1,external:0,problems:0}}}}:{}};
 };
 const pi={on:(name,fn)=>handlers[name]=fn,appendEntry(){},registerEntryRenderer(){},sendUserMessage:text=>sent.push(text)};
 const ctx={cwd:dir,ui:{notify:text=>notices.push(text),setWidget(){},setStatus(){}}};
 try {
  harness(pi,{root:dir+'/',setInterval:()=>({unref(){}})});await handlers.session_start({},ctx);
  await handlers.input({source:'interactive',text:'Build a game'},ctx);await handlers.agent_settled({aborted:false});
  assert.deepEqual(sent,['yes']);assert.equal(notices.filter(text=>text==='Harness settled').length,0);
  await handlers.input({source:'extension',text:'yes'},ctx);handlers.agent_start({},ctx);await handlers.agent_settled({aborted:false});
  const requests=calls.filter(call=>call.path==='/request');assert.equal(requests.length,2);assert.notEqual(requests[0].body.request,requests[1].body.request);
  assert.equal(notices.filter(text=>text==='Harness settled').length,1);assert.ok(notices.some(text=>text.startsWith('Harness report: ')));
 } finally {handlers.session_shutdown?.();globalThis.fetch=fetchBefore;for(const key of Object.keys(process.env))if(!(key in saved))delete process.env[key];Object.assign(process.env,saved);rmSync(dir,{recursive:true,force:true});}
});

for(const scenario of ['continue','change','unverified']) test(`terminal planning lifecycle: ${scenario} (task 240)`,async()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-terminal-plan-')),saved={...process.env},fetchBefore=globalThis.fetch;
 Object.assign(process.env,{PI_AGENT_DATA:join(dir,'data'),PI_HARNESS_SHARED_PORT:'1',PI_HARNESS_TOKEN:'t'});
 const handlers={},tools={},calls=[],sent=[],notices=[];let ends=0;
 globalThis.fetch=async(url,options)=>{
  const path=new URL(url).pathname;calls.push({path,body:JSON.parse(options.body)});
  return {ok:true,json:async()=>path==='/auto'?{enabled:scenario==='unverified'}:path==='/plan'?{goal:'Pong',tasks:[{title:'Ball',done_when:'Bounces'}]}:path==='/request/end'?{result:++ends===1?{outcome:scenario==='unverified'?'not verified':'committed',message:'Ball',commit:'abc',check_in:{verified:scenario!=='unverified',task:'tasks/001-ball.md',verification:'node --test',next:'tasks/002-score.md'}}:{outcome:'committed',message:'Score',commit:'def',check_in:{verified:true,next:null}}}:{}};
 };
 const pi={on:(name,fn)=>handlers[name]=fn,registerTool:tool=>tools[tool.name]=tool,appendEntry(){},registerEntryRenderer(){},sendUserMessage:text=>sent.push(text)};
 const ctx={cwd:dir,abort(){},ui:{notify:text=>notices.push(text),setWidget(){},setStatus(){},select:async()=>scenario==='change'?'Change…':'Accept and Continue',input:async()=> 'Use black and white'}};
 try {
  harness(pi,{root:dir+'/',setInterval:()=>({unref(){}})});await handlers.session_start({},ctx);
  if(scenario!=='unverified')delete process.env.PI_HARNESS_SHARED_PORT; // use native terminal dialogs with scratch mocked services
  await handlers.input({source:'interactive',text:'Build a game'},ctx);
  if(scenario==='change')await tools.propose_plan.execute('plan',{},null,null,ctx);
  await handlers.agent_settled({aborted:scenario==='change'});
  if(scenario==='unverified') {assert.deepEqual(sent,[]);assert.ok(notices.some(text=>text.startsWith('Harness check-in: ')));return;}
  assert.deepEqual(sent,[scenario==='change'?'Use black and white':'Continue the approved task.']);
  await handlers.input({source:'extension',text:sent[0]},ctx);handlers.agent_start({},ctx);
  const requests=calls.filter(call=>call.path==='/request');assert.equal(requests.length,2);assert.notEqual(requests[0].body.request,requests[1].body.request);
  if(scenario==='change') {assert.equal(calls.filter(call=>call.path==='/request/end').length,0);assert.equal(calls.filter(call=>call.path==='/request/pause').length,1);}
 } finally {handlers.session_shutdown?.();globalThis.fetch=fetchBefore;for(const key of Object.keys(process.env))if(!(key in saved))delete process.env[key];Object.assign(process.env,saved);rmSync(dir,{recursive:true,force:true});}
});

for(const answer of ['[CANARY] I will start Task 2 by reading text.py.', '[CANARY] `bash{command: "ls -F"}`', '[CANARY] First, target showView(next).<channel|>', '[CANARY] <|tool_call|>', '[CANARY] I will read pager.py before writing README.md.']) test(`wake a stopped model once: ${answer} (task 241)`,async()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-no-action-')),saved={...process.env},fetchBefore=globalThis.fetch;
 Object.assign(process.env,{PI_AGENT_DATA:join(dir,'data'),PI_HARNESS_SHARED_PORT:'1',PI_HARNESS_TOKEN:'t',PI_HARNESS_WAKE_UPS:'1'});
 const handlers={},sent=[],calls=[];
 globalThis.fetch=async(url,options)=>{const path=new URL(url).pathname;calls.push(path);return {ok:true,json:async()=>path==='/verification'?{verification:{state:'unchanged',code:[],verified:false}}:{}};};
 const pi={on:(name,fn)=>handlers[name]=fn,appendEntry(){},registerEntryRenderer(){},sendUserMessage:text=>sent.push(text)};
 const ctx={cwd:dir,ui:{notify(){},setWidget(){},setStatus(){}}};
 try {
  harness(pi,{root:dir+'/',setInterval:()=>({unref(){}})});await handlers.session_start({},ctx);
  await handlers.input({source:'interactive',text:answer.includes('README.md')?'Can you write a README for this? Say what it does, show an example, and how to run the tests.':'Do task 2'},ctx);handlers.agent_start({},ctx);
  handlers.message_end({message:{role:'assistant',content:[{type:'text',text:answer}]}});await handlers.agent_settled({aborted:false});
  assert.equal(sent.length,1);assert.match(sent[0],/tool call|Call the tool/);assert.equal(calls.filter(p=>p==='/request/end').length,0);
  await handlers.input({source:'extension',text:sent[0]},ctx);handlers.agent_start({},ctx);
  handlers.message_end({message:{role:'assistant',content:[{type:'text',text:answer}]}});await handlers.agent_settled({aborted:false});
  assert.equal(sent.length,1,'one no-action wake per request, within canWake limit');
 }finally{handlers.session_shutdown?.();globalThis.fetch=fetchBefore;for(const key of Object.keys(process.env))if(!(key in saved))delete process.env[key];Object.assign(process.env,saved);rmSync(dir,{recursive:true,force:true});}
});

test('template tokens are removed from finalized answers and logged (task 241)',()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-tokens-')),saved=process.env.PI_AGENT_DATA,handlers={};process.env.PI_AGENT_DATA=dir;
 try{
  harness({on:(name,fn)=>handlers[name]=fn},{root:dir+'/',setInterval:()=>({unref(){}})});
  const result=handlers.message_end({message:{role:'assistant',content:[{type:'text',text:'[CANARY] First, target showView(next).<channel|><|im_end|>'}]}});
  assert.equal(result.message.content[0].text,'[CANARY] First, target showView(next).');
  assert.match(readFileSync(join(dir,'session.log'),'utf8'),/template-tokens/);assert.match(readFileSync(join(dir,'reports.jsonl'),'utf8'),/template-tokens/);
 }finally{if(saved===undefined)delete process.env.PI_AGENT_DATA;else process.env.PI_AGENT_DATA=saved;rmSync(dir,{recursive:true,force:true});}
});
