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
 const handlers={}, messages=[], notices=[], order=[];
 let tick, interval, widget, status, idle = false;
 const entries=[],renderers={};
 let toolResolver;
 const pi={registerToolRenderer:r=>{toolResolver=r;},appendEntry:(type,data)=>entries.push({type,data}),registerEntryRenderer:(type,renderer)=>{renderers[type]=renderer;},on:(name,fn)=>{handlers[name]=fn;},sendUserMessage:content=>{order.push('reask');messages.push(typeof content==='string'?content:content[0].text);}};
 const ctx={ui:{notify:text=>notices.push(text),setWidget:(name,lines)=>{if(name==='local-harness')widget=lines;},setStatus:(name,value)=>{status=value;}},
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
  const bash={toolCallId:'bash-regression',toolName:'bash',input:{command:'whoami'}};
  assert.equal(await handlers.tool_call(bash),undefined);
  assert.equal(await handlers.tool_result({...bash,content:[{type:'text',text:'developer'}],isError:false}),undefined);
  const web=lines[1].match(/http:\/\/127\.0\.0\.1:\d+/)[0],checked=(await (await fetch(web+'/api/gate')).json()).events.filter(event=>event.tool_call==='bash-regression');
  assert.deepEqual(checked.map(event=>event.phase+' '+event.outcome),['gate ALLOW','audit SUCCESS']);
  // Round 6 (T_Gate): a command that fails on its own is not Gate's doing: Gate's verdict and the exit are separate words.
  const failing={toolCallId:'bash-exit',toolName:'bash',input:{command:'false'}};const noticesBefore=notices.length;
  assert.equal(await handlers.tool_call(failing),undefined);
  const exited=await handlers.tool_result({...failing,content:[{type:'text',text:'Command exited with code 2'}],isError:true});
  assert.match(exited.content.at(-1).text,/^✓ Gate allowed · ✗ exit 2: the command failed on its own; Gate did not block it\.$/);
  const row=toolResolver('bash',()=>undefined).renderResult(exited,{},{},{toolCallId:'bash-exit'}).render(80).map(line=>line.replace(/\x1b\[[0-9;]*m/g,''));
  assert.match(row[0],/^  ✓ Gate allowed · ✗ exit 2 · 0:0\d$/,'round 6: the tool row reads what Gate and the command said');
  assert.doesNotMatch(JSON.stringify(exited),/EXECUTION_FAILED|Gate audit failed/);assert.equal(notices.length,noticesBefore,'no alarm for an ordinary failure');
  // 2026-10-14: Gate's own error reaches Pi (it read only "Gate HTTP 400" and worked around Gate), and Pi 1.1's edits list passes.
  const missing=await handlers.tool_call({toolCallId:'edit-missing',toolName:'edit',input:{path:join(dir,'nowhere.md'),edits:[{oldText:'a',newText:'b'}]}});
  assert.equal(missing.block,true);assert.match(missing.reason,/G-004 .*use write to create it/,'a missing file is a decision, not a Gate failure');
  // G-011 (plan 184): when Gate itself fails, that call is blocked and reported; the run continues (no babysitting).
  const broken=await handlers.tool_call({toolCallId:'edit-broken',toolName:'edit',input:{edits:[{oldText:'a',newText:'b'}]}});
  assert.equal(broken.block,true);assert.match(broken.reason,/^G-011 .*Gate HTTP 400.*continue/);assert.notEqual(order.at(-1),'abort','the turn goes on');
  assert.equal(entries.filter(entry=>entry.type==='harness-notice').at(-1).data.sentence,'Gate could not check a tool call.');
  assert.match(readFileSync(join(dir,'workspace','reports.jsonl'),'utf8'),/"kind":"gate-failed"/,'reported for the analysis');
  writeFileSync(join(dir,'plan.md'),'- [ ] two\n');
  assert.equal(await handlers.tool_call({toolCallId:'edit-list',toolName:'edit',input:{path:join(dir,'plan.md'),edits:[{oldText:'- [ ] two',newText:'- [x] two'}]}}),undefined,'the edit is allowed');
  writeFileSync(join(dir,'plan.md'),'- [x] two\n');
  assert.equal(await handlers.tool_result({toolCallId:'edit-list',toolName:'edit',input:{path:join(dir,'plan.md'),edits:[{oldText:'- [ ] two',newText:'- [x] two'}]},content:[],isError:false}),undefined,'and verified');
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
  mkdirSync(join(dir,'tasks'));writeFileSync(join(dir,'ROADMAP.md'),'- [ ] [01](tasks/01.md)\n');writeFileSync(join(dir,'tasks','01.md'),'- [ ] Do\n');
  execFileSync('git',['init','-q',dir]);writeFileSync(join(dir,'app.py'),'x = 1\n');
  const commit=await handlers.tool_call({toolCallId:'commit',toolName:'bash',input:{command:'git commit -qam work'}});
  assert.equal(commit.block,true);
  assert.match(commit.reason,/Gate pre-execution REVISE/);assert.match(commit.reason,/Missing: a failing \(red\) test/);
  assert.match(commit.reason,/then retry/);assert.doesNotMatch(commit.reason,/destructive/);
  // task_box (task 183, L-003): a box is ticked by the start of its label; Gate checks it as the exact edit it becomes.
  const box={toolCallId:'box-1',toolName:'task_box',input:{path:'tasks/01.md',box:'do'}};
  assert.equal(await handlers.tool_call(box),undefined,'allowed as an edit of that one line');
  writeFileSync(join(dir,'tasks','01.md'),'- [x] Do\n');
  assert.equal(await handlers.tool_result({...box,content:[{type:'text',text:'Ticked'}],isError:false}),undefined,'and verified: the file is what Gate approved');
  const vague=await handlers.tool_call({toolCallId:'box-2',toolName:'task_box',input:{path:'tasks/01.md',box:'Nothing'}});
  assert.equal(vague.block,true);assert.match(vague.reason,/No open box starts with “Nothing”/);
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
