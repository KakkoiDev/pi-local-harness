import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import harness from '../../harness/extension.mjs';
process.env.PI_CODING_AGENT_DIR=mkdtempSync(join(tmpdir(),'pi-agent-dir-'));
for(const key of Object.keys(process.env))if(/^PI_(HARNESS_|WEB_REMOTE_)/.test(key))delete process.env[key];

test('a /request/end slower than 5 s still delivers its check-in (task 260)',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-slow-end-')),saved={...process.env},fetchBefore=globalThis.fetch;
 Object.assign(process.env,{PI_AGENT_DATA:join(dir,'data'),PI_HARNESS_SHARED_PORT:'1',PI_HARNESS_TOKEN:'t',PI_HARNESS_JOB:'job'});
 const handlers={},calls=[],sent=[],notices=[];
 globalThis.fetch=async(url,options)=>{
  const path=new URL(url).pathname;calls.push(path);
  if(path==='/request/end') await new Promise((resolve,reject)=>{const t=setTimeout(resolve,6000);options.signal?.addEventListener('abort',()=>{clearTimeout(t);reject(options.signal.reason);});});
  return {ok:true,json:async()=>path==='/request/end'?{result:{outcome:'committed',message:'Ball',commit:'abc',check_in:{verified:true,task:'tasks/001-ball.md',next:null}}}:{}};
 };
 const pi={on:(name,fn)=>handlers[name]=fn,appendEntry(){},registerEntryRenderer(){},sendUserMessage:text=>sent.push(text)};
 const ctx={cwd:dir,ui:{notify:text=>notices.push(text),setWidget(){},setStatus(){}}};
 try {
  harness(pi,{root:dir+'/',setInterval:()=>({unref(){}})});await handlers.session_start({},ctx);
  await handlers.input({source:'interactive',text:'Build the approved task.'},ctx);
  await handlers.agent_settled({aborted:false});
  assert.ok(notices.some(text=>text.startsWith('Harness check-in: ')),'check-in was never delivered although Gate committed and set check_in');
 } finally {handlers.session_shutdown?.();globalThis.fetch=fetchBefore;for(const key of Object.keys(process.env))if(!(key in saved))delete process.env[key];Object.assign(process.env,saved);rmSync(dir,{recursive:true,force:true});}
});
