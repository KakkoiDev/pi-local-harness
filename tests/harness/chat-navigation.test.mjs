import test from 'node:test';
import assert from 'node:assert/strict';
import {revealChatRequest} from '../../js/chat-state.mjs';

for(const status of ['running','queued'])test(`opening a ${status} request reveals the latest answer, not the centered question`,()=>{
 const thread={scrollHeight:1200,scrollTop:100};let centered=false;
 revealChatRequest(thread,{scrollIntoView(){centered=true;}},status);
 assert.equal(thread.scrollTop,1200);assert.equal(centered,false);
});
test('a historical request is still centered without forcing the newest answer',()=>{
 const thread={scrollHeight:1200,scrollTop:100};let options;
 revealChatRequest(thread,{scrollIntoView(value){options=value;}},'completed');
 assert.deepEqual(options,{block:'center'});assert.equal(thread.scrollTop,100);
});
test('a running request not yet rendered still reveals the end safely',()=>{
 const thread={scrollHeight:1200,scrollTop:0};revealChatRequest(thread,null,'running');assert.equal(thread.scrollTop,1200);
 revealChatRequest(thread,null,'completed');assert.equal(thread.scrollTop,1200);
});
