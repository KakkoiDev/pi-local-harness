import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ThoughtWatch } from '../../harness/watch.mjs';
test('exact triple repeats, including across chunks', () => {
 const w = new ThoughtWatch();
 assert.equal(w.feed('a\nb\nc\nx\na\nb'), null);
 assert.deepEqual(w.feed('\nc\n'), ['a','b','c']);
});
test('similar lines and overlapping triples do not trigger', () => {
 const w = new ThoughtWatch();
 assert.equal(w.feed('a\na\na\na\na\n'), null);
 assert.equal(new ThoughtWatch().feed('a\nb\nc\na!\nb\nc\n'), null);
});
test('only last 100 lines count', () => {
 const w = new ThoughtWatch();
 assert.equal(w.feed(['a','b','c',...Array.from({length:100},(_,i)=>String(i)),'a','b','c',''].join('\n')), null);
 assert.equal(w.lines.length,100);
});
test('hang is deterministic and active only', () => {
 const w = new ThoughtWatch();
 assert.equal(w.hanging(100000,100),false);
 w.start(10); assert.equal(w.hanging(109,100),false);
 assert.equal(w.hanging(110,100),true);
 w.touch(100); assert.equal(w.hanging(110,100),false);
 w.stop(); assert.equal(w.hanging(100000,100),false);
});
import { missingCanary, loadMemory, recordLesson } from '../../harness/memory.mjs';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
test('canary checks completed text, not tools or aborted output', () => {
 const message = text => ({role:'assistant', content:[{type:'text',text}]});
 assert.equal(missingCanary(message('Oops')),true);
 assert.equal(missingCanary(message(' [CANARY] hello')),false);
 assert.equal(missingCanary({...message('Oops'),stopReason:'aborted'}),false);
 assert.equal(missingCanary({role:'assistant',content:[{type:'toolCall'}]}),false);
 assert.equal(missingCanary({...message('Let me read the file.'),stopReason:'toolUse'}),false,'a preamble before a tool call is not the answer');
 // Task 324: the marker in code or bold is the marker (the owner's model wrote `[CANARY]` and was "recovered" every answer)
 for (const text of ['`[CANARY]` Done.','**[CANARY]** Done.','  `[CANARY]`\n\nDone.']) assert.equal(missingCanary(message(text)),false,text);
 assert.equal(missingCanary(message('Done. [CANARY]')),true,'only at the start');
});
test('memory reloads edits and incident lessons are deduplicated', () => {
 const dir = mkdtempSync(join(tmpdir(),'pi-memory-'));
 try {
  const path=join(dir,'AGENT.md'); writeFileSync(path,'Initial');
  recordLesson(path,'canary'); const memory=loadMemory(path);
  recordLesson(path,'canary'); assert.equal(loadMemory(path),memory);
  writeFileSync(path,'Updated'); assert.equal(loadMemory(path),'Updated');
 } finally { rmSync(dir,{recursive:true}); }
});
import { localModels } from '../../harness/provider.mjs';
import { attachMedia, mediaPaths } from '../../harness/media.mjs';
test('MLX aliases advertise vision and preserve other configured models',()=>{
 const provider=localModels({models:[{id:'gpt-oss:20b',reasoning:true},{id:'gemma4:26b',reasoning:true}]});
 assert.deepEqual(provider.models.find(m=>m.id==='gemma4:26b-mlx').input,['text','image']);
 assert.deepEqual(provider.models.find(m=>m.id==='gpt-oss:20b').input,['text']);
});
test('Off turns thinking off in Ollama, and Minimal is sent as a level Ollama knows (2026-10-14)',()=>{
 // Pi sends no reasoning_effort for Off unless the model maps it, and Ollama then thinks by default; "minimal" is not an Ollama level.
 const provider=localModels({models:[{id:'qwen3.8:27b-mlx',reasoning:true},{id:'llama3.2:3b'}]});
 const thinking=provider.models.find(m=>m.id==='qwen3.8:27b-mlx');
 assert.deepEqual(thinking.thinkingLevelMap,{off:'none',minimal:'low'});
 assert.equal(provider.models.find(m=>m.id==='llama3.2:3b').thinkingLevelMap,undefined,'a model that does not think gets no levels');
});
test('accessible quoted image paths attach bytes; audio paths attach transcripts',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'pi-media-'));
 try {
  const image=join(dir,'my picture.png'),audio=join(dir,'speech.wav');
  writeFileSync(image,'image bytes');writeFileSync(audio,'audio bytes');
  assert.equal(mediaPaths(`See "${image}"`,dir).length,1);
  const result=await attachMedia({text:`See "${image}" and ${audio}`},dir,{input:['text','image']},async path=>{assert.equal(path,audio);return 'Hello world';});
  assert.equal(result.action,'transform');assert.equal(result.images[0].data,Buffer.from('image bytes').toString('base64'));
  assert.match(result.text,/Hello world/);
  const blind=await attachMedia({text:`Look at "${image}"`},dir,{input:['text']},async()=>'');
  assert.equal(blind.images.length,0);assert.match(blind.text,/^Look at .*not attached: the chosen model does not see images/s,'the prompt is kept, the image skipped');
  assert.equal((await attachMedia({text:'/does/not/exist.png'},dir,{input:['text']},async()=>'' )).action,'continue');
 } finally {rmSync(dir,{recursive:true});}
});
