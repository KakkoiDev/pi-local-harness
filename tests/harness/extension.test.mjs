import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import harness from '../../harness/extension.mjs';

test('startup, ten-second loop check, abort/compact/reask, canary reinjection', async () => {
 const dir=mkdtempSync(join(tmpdir(),'pi-harness-'));
 writeFileSync(join(dir,'AGENT.md'),'Always prepend [CANARY].');
 const handlers={}, messages=[], notices=[], order=[];
 let tick, interval, widget, idle = false;
 const pi={on:(name,fn)=>{handlers[name]=fn;},sendUserMessage:content=>{order.push('reask');messages.push(typeof content==='string'?content:content[0].text);}};
 const ctx={ui:{notify:text=>notices.push(text),setWidget:(name,lines)=>{if(name==='local-harness')widget=lines;},setStatus(){}},
   abort:()=>order.push('abort'),isIdle:()=>idle,
   compact:options=>{order.push('compact');options.onComplete();}};
 const previous={laya:process.env.PI_LAYA_PORT,web:process.env.PI_WEB_PORT,data:process.env.PI_WEB_DATA,log:process.env.PI_HARNESS_LOG_FILE};
 process.env.PI_WEB_DATA=join(dir,'web');process.env.PI_LAYA_PORT='0';process.env.PI_WEB_PORT='0';process.env.PI_HARNESS_LOG_FILE=join(dir,'audit.log');
 harness(pi,{root:dir+'/',setInterval:(callback,ms)=>{tick=callback;interval=ms;return {unref(){}};}});
 try {
  await handlers.session_start({},ctx);
  assert.ok(tick,notices.join('\n'));
  assert.equal(interval,10000);
  assert.equal(notices.filter(text=>text.includes('Loop check: every 10 seconds')).length,0);
  assert.match(widget.join('\n').replace(/\x1b\]8;;[^\x1b]*\x1b\\/g,'').replace(/\x1b\[[0-9;]*m/g,''),/Laya: http.*Web: http/s);
  for (const [index,label] of ['Laya','Web'].entries()) {
   const url=widget[index].match(/http:\/\/127\.0\.0\.1:\d+/)[0];
   assert.equal(widget[index], `${label}: \x1b[4;36m\x1b]8;;${url}\x1b\\${url}\x1b]8;;\x1b\\\x1b[0m`);
  }
  assert.equal(widget[2],'Loop check: every 10 seconds');
  assert.match(handlers.before_agent_start({systemPrompt:'Base'}).systemPrompt,/Always prepend/);
  const blocked=await handlers.tool_call({toolCallId:'danger',toolName:'bash',input:{command:'sudo rm -fr *'}});
  assert.equal(blocked.block,true);
  assert.match(blocked.reason,/not executed/);
  assert.match(blocked.reason,/Recursive deletion/);
  assert.match(blocked.reason,/narrowly scoped/);
  assert.doesNotMatch(blocked.reason,/same blocked tool class/);
  const bash={toolCallId:'bash-regression',toolName:'bash',input:{command:'whoami'}};
  assert.equal(await handlers.tool_call(bash),undefined);
  assert.equal(await handlers.tool_result({...bash,content:[{type:'text',text:'developer'}],isError:false}),undefined);
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
 } finally {
  handlers.session_shutdown();
  for(const [key,value] of Object.entries(previous)) {
   const name={laya:'PI_LAYA_PORT',web:'PI_WEB_PORT',data:'PI_WEB_DATA',log:'PI_HARNESS_LOG_FILE'}[key];
   if(value===undefined) delete process.env[name]; else process.env[name]=value;
  }
  rmSync(dir,{recursive:true});
 }
});
