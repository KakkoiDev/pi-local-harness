import {test} from 'node:test';
import assert from 'node:assert/strict';
globalThis.ResizeObserver=class {observe(){}};
const {contextReason}=await import('../../js/context-line.mjs');
test('context reasons describe the recorded cause, including the fallback commit and current document',()=>{
 const item=reason=>({reason,label:'notes.js',kind:'related'});
 assert.deepEqual(contextReason(item('Project rules')),['rules','Always: the project’s rules']);
 assert.deepEqual(contextReason(item('Plan')),['plan','Always: the plan']);
 assert.deepEqual(contextReason(item('Task in progress')),['task','Always: the task in progress']);
 assert.deepEqual(contextReason(item('Named in the request')),['named','You named it: “notes.js” in your message']);
 assert.deepEqual(contextReason(item('Last harness commit')),['changed','Last harness commit']);
 for(const name of ['Relevant file name','Relevant contents','Listed by the current task','Linked from the current document'])assert.deepEqual(contextReason(item(name)),['related',name]);
 assert.deepEqual(contextReason({...item('Plan'),kind:'this file'}),['this file','Current document']);
 assert.deepEqual(contextReason(item('Pi opened it')),['Pi opened it','Pi opened it']);
});

test('Japanese reason details preserve the selected filename and count',async()=>{
 const {readFileSync}=await import('node:fs'),{translator}=await import('../../js/i18n.mjs');
 const tr=translator(JSON.parse(readFileSync(new URL('../../messages/ja.json',import.meta.url),'utf8')));
 assert.equal(tr('Why Pi sees these 3 files'),'Pi がこの 3 個のファイルを見る理由');
 assert.equal(tr('Pi sees these 3 files'),'Pi が見る 3 個のファイル');
 assert.equal(tr('You named it: “notes.js” in your message'),'メッセージで「notes.js」を指定');
 assert.equal(tr('(changed)'),'（変更）');
});
