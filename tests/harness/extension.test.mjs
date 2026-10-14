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
 const pi={appendEntry:(type,data)=>entries.push({type,data}),registerEntryRenderer:(type,renderer)=>{renderers[type]=renderer;},on:(name,fn)=>{handlers[name]=fn;},sendUserMessage:content=>{order.push('reask');messages.push(typeof content==='string'?content:content[0].text);}};
 const ctx={ui:{notify:text=>notices.push(text),setWidget:(name,lines)=>{if(name==='local-harness')widget=lines;},setStatus:(name,value)=>{status=value;}},
   abort:()=>order.push('abort'),isIdle:()=>idle,
   compact:options=>{order.push('compact');options.onComplete();}};
 const previous={gate:process.env.PI_GATE_PORT,web:process.env.PI_WEB_PORT,data:process.env.PI_WEB_DATA,workspace:process.env.PI_AGENT_DATA,log:process.env.PI_HARNESS_LOG_FILE};
 process.env.PI_WEB_DATA=join(dir,'web');process.env.PI_AGENT_DATA=join(dir,'workspace');process.env.PI_GATE_PORT='0';process.env.PI_WEB_PORT='0';process.env.PI_HARNESS_LOG_FILE=join(dir,'audit.log');
 harness(pi,{root:dir+'/',setInterval:(callback,ms)=>{tick=callback;interval=ms;return {unref(){}};}});
 try {
  await handlers.session_start({},ctx);
  assert.ok(tick,notices.join('\n'));
  assert.equal(interval,10000);
  assert.equal(notices.filter(text=>text.includes('Loop check: every 10 seconds')).length,0);
  assert.equal(widget,undefined);assert.equal(status,undefined);
  const startup=entries.filter(entry=>entry.type==='harness-startup');
  assert.equal(startup.length,1);
  const lines=renderers['harness-startup'](startup[0]).render(80);
  assert.match(lines.join('\n').replace(/\x1b\]8;;[^\x1b]*\x1b\\/g,'').replace(/\x1b\[[0-9;]*m/g,''),/Gate: http.*Web: http/s);
  for (const [index,label] of ['Gate','Web'].entries()) {
   const url=lines[index].match(/http:\/\/127\.0\.0\.1:\d+/)[0];
   assert.equal(lines[index], `${label}: \x1b[4;36m\x1b]8;;${url}\x1b\\${url}\x1b]8;;\x1b\\\x1b[0m`);
  }
  assert.equal(lines[2],'Phone access off: set remote_hosts and remote_users in config.json');
  assert.equal(lines[3],'Loop check: every 10 seconds');
  assert.match(handlers.before_agent_start({systemPrompt:'Base'}).systemPrompt,/Always prepend/);
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
  const drift={toolCallId:'bash-drift',toolName:'bash',input:{command:'pwd'}};
  assert.equal(await handlers.tool_call(drift),undefined);
  const rejected=await handlers.tool_result({...drift,input:{command:'env'},content:[],isError:false});
  assert.equal(rejected.isError,true);
  assert.match(rejected.content.at(-1).text,/DRIFT_DETECTED/);
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
  await handlers.input({source:'interactive',text:'Hang test'},ctx);
  handlers.agent_start({},ctx); idle=true;
  const before=order.length; tick(); assert.equal(order.length,before);
  handlers.message_update({assistantMessageEvent:{type:'thinking_delta',delta:'unfinished thought'}});
  tick(); assert.equal(order.at(-1),'abort');
  handlers.agent_end({},ctx);
  await new Promise(resolve=>setTimeout(resolve,10));
  assert.match(messages[2],/no active model operation/);
  assert.match(readFileSync(join(dir,'AGENT.md'),'utf8'),/Harness lesson: hang/);
  // Protocol gate: a commit without red/green/task/roadmap evidence is revised, not treated as destructive.
  mkdirSync(join(dir,'tasks'));writeFileSync(join(dir,'ROADMAP.md'),'- [ ] [01](tasks/01.md)\n');writeFileSync(join(dir,'tasks','01.md'),'- [ ] Do\n');
  execFileSync('git',['init','-q',dir]);writeFileSync(join(dir,'app.py'),'x = 1\n');
  const commit=await handlers.tool_call({toolCallId:'commit',toolName:'bash',input:{command:'git commit -qam work'}});
  assert.equal(commit.block,true);
  assert.match(commit.reason,/Gate pre-execution REVISE/);assert.match(commit.reason,/Missing: a failing \(red\) test/);
  assert.match(commit.reason,/then retry/);assert.doesNotMatch(commit.reason,/destructive/);
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
 const handlers={},notices=[];
 const pi={appendEntry(){},registerEntryRenderer(){},on:(name,fn)=>{handlers[name]=fn;},sendUserMessage(){}};
 harness(pi,{root:dir+'/',setInterval:()=>({unref(){}})});
 try {
  other.acquire(); // the other agent (terminal or web) works now
  const refused=await handlers.input({source:'interactive',text:'Hello'},{ui:{notify:text=>notices.push(text)},cwd:dir});
  assert.equal(refused.action,'handled','the turn does not run');assert.match(notices.join('\n'),/Harness refused: One agent is already working/);
  other.release();
  const allowed=await handlers.input({source:'interactive',text:'Hello'},{ui:{notify:text=>notices.push(text)},cwd:dir});
  assert.equal(allowed.action,'continue');
  assert.match(handlers.before_agent_start({systemPrompt:'Base'}).systemPrompt,/Always prepend/,'memory still injected');
 } finally { handlers.agent_settled?.(); rmSync(dir,{recursive:true}); }
});
