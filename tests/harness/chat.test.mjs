import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodeLines, applyDelta } from '../../js/chat-state.mjs';
test('stream decoder preserves events split across network chunks',()=>{
 const first=decodeLines('', '{"type":"sta');assert.equal(first.events.length,0);
 const second=decodeLines(first.rest,'tus","text":"準備"}\n{"type":"done"}\n');
 assert.deepEqual(second.events,[{type:'status',text:'準備'},{type:'done'}]);assert.equal(second.rest,'');
});
test('conversation stream state stays isolated and handles tools and failures',()=>{
 const first={text:'',thinking:'',status:''},second={text:'other',thinking:'',status:''};
 applyDelta(first,{type:'message_update',assistantMessageEvent:{type:'text_delta',delta:'hello'}});
 applyDelta(first,{type:'tool_execution_end',isError:true});
 assert.match(first.status,/failed/);assert.equal(second.text,'other');
 applyDelta(first,{type:'error',error:'Gate unavailable'});assert.equal(first.error,'Gate unavailable');
});
