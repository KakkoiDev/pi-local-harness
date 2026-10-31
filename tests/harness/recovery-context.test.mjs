import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import harness from '../../harness/extension.mjs';
import {cleanRecoveryMessages,recentHistory,incompleteToolJSON} from '../../harness/recovery-context.mjs';

test('US-375 compaction failure falls back to recent context',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-small-compact-')),saved={...process.env},fetchBefore=globalThis.fetch;
 Object.assign(process.env,{PI_AGENT_DATA:join(dir,'data'),PI_HARNESS_SHARED_PORT:'1',PI_HARNESS_TOKEN:'t'});
 writeFileSync(join(dir,'AGENT.md'),'Start with [CANARY]. UNIQUE_SYSTEM_MEMORY');
 const handlers={},sent=[];let tick,compactions=0;
 globalThis.fetch=async url=>({ok:true,json:async()=>new URL(url).pathname==='/context'?{execution:'Current phase: planning',text:'Chosen project files'}:{}});
 const pi={on:(name,fn)=>handlers[name]=fn,appendEntry(){},registerEntryRenderer(){},sendUserMessage:value=>sent.push(value)};
 const ctx={cwd:dir,ui:{notify(){},setWidget(){},setStatus(){}},abort(){},isIdle:()=>true,compact:options=>{compactions++;options.onError(new Error('Nothing to compact (session too small)'));}};
 const user={role:'user',content:[{type:'text',text:'Write a landing-page plan'}]},history=[user,{role:'assistant',content:[{type:'toolCall',name:'read',id:'a',arguments:{path:'README.md'}}]},{role:'toolResult',toolCallId:'a',content:[{type:'text',text:'OLD_TOOL '.repeat(1000)}]}],before=JSON.stringify(history);
 try{
  harness(pi,{root:dir+'/',setInterval:callback=>{tick=callback;return {unref(){}};}});
  await handlers.session_start({},ctx);await handlers.input({source:'interactive',text:'Write a landing-page plan'},ctx);handlers.agent_start({},ctx);handlers.context({messages:history});
  handlers.message_update({assistantMessageEvent:{type:'thinking_delta',delta:'Thinking without an active operation'}});tick();handlers.agent_end({},ctx);
  await new Promise(resolve=>setTimeout(resolve,10));
  assert.equal(compactions,1);assert.equal(sent.length,1);
  assert.doesNotMatch(JSON.stringify(sent),/UNIQUE_SYSTEM_MEMORY|Reinjected AGENTS/);
  const recovery={role:'user',content:sent[0]};
  await handlers.input({source:'extension',text:'Resume'},ctx);handlers.agent_start({},ctx);
  const projected=handlers.context({messages:[...history,recovery]});
  assert.match(JSON.stringify(projected),/Write a landing-page plan/);assert.doesNotMatch(JSON.stringify(projected),/OLD_TOOL/);assert.equal(JSON.stringify(history),before);
  const instructions=handlers.before_agent_start({systemPrompt:'Base'}).systemPrompt;
  assert.match(instructions,/Current phase: planning/);assert.equal(instructions.split('UNIQUE_SYSTEM_MEMORY').length-1,1);
  handlers.message_update({assistantMessageEvent:{type:'thinking_delta',delta:'Still hung'}});tick();handlers.agent_end({},ctx);await new Promise(resolve=>setTimeout(resolve,10));assert.equal(compactions,1,'do not repeat an unavailable compaction');
 }finally{handlers.session_shutdown?.();globalThis.fetch=fetchBefore;for(const key of Object.keys(process.env))if(!(key in saved))delete process.env[key];Object.assign(process.env,saved);rmSync(dir,{recursive:true,force:true});}
});

test('legacy cleanup is narrow and never mutates a user message or stored array',()=>{
 const ordinary={role:'user',content:'Please explain Reinjected AGENTS.md without changing anything.'};const messages=[ordinary];assert.equal(cleanRecoveryMessages(messages)[0],ordinary);
 const legacy={role:'user',content:'Harness recovery: Loop detected.\n\nReinjected AGENTS.md:\nOLD_PRIVATE_MEMORY'};const before=JSON.stringify(legacy);
 assert.doesNotMatch(JSON.stringify(cleanRecoveryMessages([legacy])),/OLD_PRIVATE_MEMORY/);assert.equal(JSON.stringify(legacy),before);
});

test('recent-history fallback preserves live tool pairs and uses no fabricated summary',()=>{
 const old={role:'user',content:[{type:'text',text:'A title and short description'}]},tool={role:'toolResult',content:[{type:'text',text:'OLD_READ'}]},request={role:'user',content:[{type:'text',text:'Write the plan'}]},call={role:'assistant',content:[{type:'toolCall',id:'live',name:'read'}]},result={role:'toolResult',toolCallId:'live',content:[]};
 const projected=recentHistory([old,tool,request,call,result],request);assert.deepEqual(projected,[old,request,call,result]);
 for(const errorMessage of ['Connection error','unexpected end of JSON input','error parsing tool call: wrong schema'])assert.equal(incompleteToolJSON({role:'assistant',stopReason:'error',errorMessage}),false);
});
