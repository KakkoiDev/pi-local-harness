import test from 'node:test';
import assert from 'node:assert/strict';
import {taskReviewPrompt,REVIEW_ROLES} from '../../harness/task-review.mjs';
test('GPT-OSS task self-review separates correctness, validation and scope without granting authority',()=>{
 const prompt=taskReviewPrompt('gpt-oss:20b');
 for(const role of Object.keys(REVIEW_ROLES))assert.ok(prompt.includes(role+':'));
 assert.match(prompt,/not independent verification/);assert.match(prompt,/Do not approve a plan/);
 assert.equal(taskReviewPrompt('gemma4:26b'),'');
});

test('a managed instance routes production models to its own endpoint and bounds the full context',async()=>{
 const {localModels}=await import('../../harness/provider.mjs');
 const saved={...process.env};
 try{
  Object.assign(process.env,{PI_OLLAMA_URL:'http://127.0.0.1:19000',PI_OLLAMA_SERVING_CONFIG:JSON.stringify({url:'http://127.0.0.1:19000',previous_url:'http://127.0.0.1:11434'}),PI_HARNESS_CONTEXT_WINDOW:'8192'});
  const config=localModels({baseUrl:'http://127.0.0.1:11434/v1',models:[{id:'gpt-oss:20b',contextWindow:131072}]});
  assert.equal(config.baseUrl,'http://127.0.0.1:19000/v1');
  assert.equal(config.models.find(m=>m.id==='gpt-oss:20b').contextWindow,8192);
  assert.equal(config.models.find(m=>m.id==='gpt-oss:20b').maxTokens,2048);
  const {installToolRepair}=await import('../../harness/tool-repair.mjs');let registered;
  const route=installToolRepair({on(){},registerProvider:(name,value)=>{registered=value;}},{config:{baseUrl:'http://127.0.0.1:11434/v1'},localModels});
  assert.equal(route.route('http://127.0.0.1:19001/v1'),true);
  assert.equal(registered.baseUrl,'http://127.0.0.1:19001/v1');
  assert.equal(localModels({baseUrl:'https://custom.example/v1'}).baseUrl,'https://custom.example/v1');
 }finally{for(const key of Object.keys(process.env))if(!(key in saved))delete process.env[key];Object.assign(process.env,saved);}
});
