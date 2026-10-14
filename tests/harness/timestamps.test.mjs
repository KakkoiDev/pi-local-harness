import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installTimestamps, formatTimestamp } from '../../harness/timestamps.mjs';

test('timestamp includes date, seconds and timezone across midnight',()=>{
 assert.equal(formatTimestamp(Date.parse('2026-10-12T15:02:03Z'),'Asia/Tokyo'),'[2026-10-13 00:02:03 +09:00]');
 assert.equal(formatTimestamp(Date.parse('2026-10-12T15:02:03Z'),'UTC'),'[2026-10-12 15:02:03 +00:00]');
});
test('timestamp entries use lifecycle times and never change message text',()=>{
 let now=Date.parse('2026-10-12T15:00:00Z');
 const handlers={}, entries=[];let renderer;
 const pi={on:(name,fn)=>handlers[name]=fn,appendEntry:(type,data)=>entries.push({type,data}),registerEntryRenderer:(type,fn)=>renderer=fn};
 installTimestamps(pi,{now:()=>now,timeZone:'Asia/Tokyo'});
 const input={source:'interactive',text:'Question'};
 assert.deepEqual(handlers.input(input),{action:'continue'});
 assert.equal(entries[0].data.label,'Question submitted');
 now+=5000;
 const message={role:'assistant',content:[{type:'text',text:'[CANARY] Done'}],stopReason:'stop',timestamp:now-3000};
 const original=JSON.stringify(message);
 handlers.message_start({message});
 handlers.message_end({message});
 assert.equal(JSON.stringify(message),original);
 assert.equal(entries.at(-1).data.timestamp,now);
 assert.equal(entries.at(-1).data.label,'Assistant message completed');
 now+=1000;handlers.agent_settled({aborted:false});
 assert.equal(entries.at(-1).data.label,'Task completed');
 assert.deepEqual(renderer({data:entries.at(-1).data}).render(100),[],'round 6: no stamp lines by default');
 const started=entries.find(entry=>entry.data.label==='Assistant message started');
 assert.deepEqual(renderer({data:started.data}).render(100),['\x1b[1mPi\x1b[22m \x1b[2m00:00\x1b[22m'],'one header per Pi message, the time dim');
});
test('failed and aborted runs do not claim completion; recovery requests are labeled',()=>{
 const handlers={},entries=[];
 installTimestamps({on:(n,f)=>handlers[n]=f,appendEntry:(_,d)=>entries.push(d),registerEntryRenderer(){}},{now:()=>0,timeZone:'UTC'});
 handlers.input({source:'extension'});
 assert.equal(entries.at(-1).label,'Recovery question submitted');
 handlers.agent_start({});
 handlers.message_end({message:{role:'assistant',stopReason:'error',content:[]}});
 assert.equal(entries.at(-1).label,'Assistant message failed');
 handlers.agent_settled({aborted:false});assert.equal(entries.at(-1).label,'Task failed');
 handlers.agent_start({});handlers.agent_settled({aborted:true});assert.equal(entries.at(-1).label,'Task stopped');
 handlers.message_end({message:{role:'toolResult',toolName:'read',isError:false}});
 assert.equal(entries.at(-1).label,'Tool result received: read');
});

test('/verbose shows every stamp, and [CANARY] never reaches the screen (task 171, T_Noise)', async () => {
  const handlers={},entries=[],commands={};let renderer,transform;
  installTimestamps({on:(n,f)=>handlers[n]=f,appendEntry:(_,d)=>entries.push(d),registerEntryRenderer:(_,f)=>renderer=f,registerCommand:(name,options)=>commands[name]=options,registerMarkdownTransformer:f=>transform=f},{now:()=>Date.parse('2026-10-12T15:00:06Z'),timeZone:'Asia/Tokyo'});
  handlers.agent_settled({aborted:false});
  await commands.verbose.handler('on');
  assert.deepEqual(renderer({data:entries.at(-1)}).render(100),['\x1b[2m[2026-10-13 00:00:06 +09:00] Task completed\x1b[22m']);
  await commands.verbose.handler('off');assert.deepEqual(renderer({data:entries.at(-1)}).render(100),[]);
  assert.equal(transform('[CANARY] Nothing is stuck.',{messageType:'assistant'}),'Nothing is stuck.');
  assert.equal(transform('[CANARY] literal',{messageType:'user'}),'[CANARY] literal','only Pi\'s answers');
});
