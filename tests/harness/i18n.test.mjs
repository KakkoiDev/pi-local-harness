// The workbench's own language (plan 198): English is the key; exact strings and patterns with parts that change.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { translator, chosenLanguage } from '../../js/i18n.mjs';

test('exact strings keep their spacing; patterns keep their parts, and translate a part that has its own translation', () => {
  const translate = translator({ exact: { Cancel: 'キャンセル', Running: '実行中' }, patterns: [['Preview · {name}', 'プレビュー · {name}'], ['State: {state}', '状態: {state}']] });
  assert.equal(translate('  Cancel '), '  キャンセル ');
  assert.equal(translate('Preview · Class Notes'), 'プレビュー · Class Notes', 'a project name is not translated');
  assert.equal(translate('State: Running'), '状態: 実行中');
  assert.equal(translate('Something Pi wrote'), null, 'no translation: the text stays as it is');
  assert.equal(translate('   '), null);
});

test('count parts match only numbers: a sentence Pi wrote that ends in "tasks" stays as it is (the translation review)', () => {
  const translate = translator({ exact: {}, patterns: [['{n} tasks', '{n} 件のタスク'], ['Using {tool}', '{tool} を使用中']] });
  assert.equal(translate('3 tasks'), '3 件のタスク');
  assert.equal(translate('Something Pi wrote about tasks'), null);
  assert.equal(translate('Using bash'), 'bash を使用中', 'a part that is not a count matches any text');
});

test('the language: the person\'s choice, else the browser\'s, else English', () => {
  assert.equal(chosenLanguage('ja', ['en-US']), 'ja');
  assert.equal(chosenLanguage('system', ['ja-JP', 'en']), 'ja');
  assert.equal(chosenLanguage(null, ['fr-FR']), 'en');
});

test('messages/ja.json is well formed: every pattern keeps its parts', () => {
  const messages = JSON.parse(readFileSync(new URL('../../messages/ja.json', import.meta.url), 'utf8'));
  assert.ok(Object.keys(messages.exact).length > 100, 'the workbench\'s strings');
  for (const [source, target] of messages.patterns) {
    const parts = text => (text.match(/\{\w+\}/g) || []).sort().join();
    assert.equal(parts(target), parts(source), `${source} → ${target}`);
  }
  for (const [english, japanese] of Object.entries(messages.exact)) assert.ok(japanese.trim(), english);
});


test('round 11 phase refusals have Japanese copy and preserve the task and file',()=>{
 const translate=translator(JSON.parse(readFileSync(new URL('../../messages/ja.json',import.meta.url),'utf8')));
 for(const text of ['Not written: the project is in Discussion. Pi can read, search and talk, but can’t write files. To plan this change, choose Planning in the phase button (⌃⌥P).','Not written: the project is in Planning. Pi can only write ROADMAP.md and tasks/. To change code, choose Start Building on the plan, or Implementation (⌃⌥I).'])assert.ok(translate(text),text);
 const outside=translate('Not written: app.py is not part of task 001: Count. Pi can change only the task’s files. To include it, add it to the task in Planning, or plan a new task.');
 assert.ok(outside);assert.match(outside,/app.py/);assert.match(outside,/001: Count/);
 // Task 263: every refusal sentence Gate's phases can say, read from gate/phases.py itself, has Japanese copy.
 const source=readFileSync(new URL('../../gate/phases.py',import.meta.url),'utf8');
 for(const [,text] of source.matchAll(/^[A-Z_]+_REFUSAL = '([^']+)'$/gm))assert.ok(translate(text.replace('{verb}','Not run').replace('{folder}','/tmp/x')),text);
 assert.match(translate('Not run: in Implementation Pi can run tests and read-only commands; other commands could change files outside task 001: Count. Run the tests, or change the task’s files with edit or write.'),/001: Count/);
});

test('a stale language load cannot attach an observer after the person chose English', async()=>{
 const {applyLanguage}=await import('../../js/i18n.mjs');
 const saved={document:globalThis.document,MutationObserver:globalThis.MutationObserver,NodeFilter:globalThis.NodeFilter};
 let observed=0,release;
 globalThis.document={body:{nodeType:0},documentElement:{lang:'en'},title:'Cancel',createTreeWalker:()=>({nextNode:()=>null})};
 globalThis.NodeFilter={SHOW_TEXT:4,SHOW_ELEMENT:1};
 globalThis.MutationObserver=class {observe(){observed++;}disconnect(){}};
 try {
  const pending=applyLanguage('ja',{load:()=>new Promise(resolve=>{release=resolve;})});
  await applyLanguage('en');release({exact:{Cancel:'キャンセル'}});await pending;
  assert.equal(observed,0,'obsolete requests must never attach a translator');
  assert.equal(document.documentElement.lang,'en');assert.equal(document.title,'Cancel');
  let first, second;
  const older=applyLanguage('ja',{load:()=>new Promise(resolve=>{first=resolve;})});
  const newer=applyLanguage('ja',{load:()=>new Promise(resolve=>{second=resolve;})});
  second({exact:{Cancel:'新しい'}});await newer;first({exact:{Cancel:'古い'}});await older;
  assert.equal(observed,1,'two overlapping loads install only the latest observer');
  assert.equal(document.title,'新しい');
  let reject;
  const failed=applyLanguage('ja',{load:()=>new Promise((resolve,fail)=>{reject=fail;})});
  await applyLanguage('en');reject(new Error('obsolete failure'));await failed;
  await assert.rejects(applyLanguage('ja',{load:async()=>{throw new Error('current failure');}}),/current failure/);
 }finally{await applyLanguage('en');for(const [key,value] of Object.entries(saved)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}}
});
