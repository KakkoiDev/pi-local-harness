import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installChoices, validateChoice } from '../../harness/choices.mjs';
const question = { question: 'Who uses it?', options: [{label:'Only me',detail:'Private on this device'},{label:'A team'}], recommended:0, allow_other:true };
function setup(options = {}) {
  let tool; const recorded=[];
  installChoices({registerTool:value=>{tool=value;}},{record:async value=>recorded.push(value),...options});
  return {tool,recorded};
}
test('ask_choices takes one question and rejects reordered recommendations or missing choices (task 236)', () => {
  assert.equal(validateChoice(question).question,question.question);
  for (const value of [{...question,question:['One','Two']},{...question,recommended:1},{...question,options:[{label:'One'}]},{...question,allow_other:false},{...question,options:[{label:'Same'},{label:'Same'}]}]) assert.throws(()=>validateChoice(value));
});
test('a terminal pick returns its label and records the answered decision', async () => {
  const {tool,recorded}=setup();let shown;
  const result=await tool.execute('pick',question,null,null,{ui:{select:async (title,options)=>{shown=[title,options];return options[0];}}});
  assert.equal(shown[1].at(-1),'Something else…');assert.match(shown[1][0],/Recommended/);
  assert.match(result.content[0].text,/Choice: Who uses it\? → Only me/);
  assert.equal(recorded[0].answer,'Only me');assert.equal(recorded[0].state,'chosen');
});
test('Something else returns the person’s words; cancellation does not become approval', async () => {
  const {tool,recorded}=setup();
  await tool.execute('other',question,null,null,{ui:{select:async (_q,options)=>options.at(-1),input:async ()=>'My household'}});
  assert.equal(recorded[0].answer,'My household');
  const result=await tool.execute('cancel',question,null,null,{ui:{select:async ()=>undefined}});
  assert.equal(result.isError,true);assert.equal(recorded.length,1);
});
test('auto takes the recommendation without opening UI; web leaves a pending choice',async()=>{
  const automatic=setup({auto:()=>true});
  await automatic.tool.execute('auto',question,null,null,{ui:{select:()=>{throw Error('must not ask');}}});
  assert.equal(automatic.recorded[0].state,'auto');assert.equal(automatic.recorded[0].answer,'Only me');
  const pending=[];const web=setup({web:()=>true,pending:async value=>pending.push(value)});
  const result=await web.tool.execute('web',question,null,null,{});
  assert.equal(pending[0].question,question.question);assert.equal(web.recorded.length,0);assert.equal(result.details.pending,true);
});

test('the harness-owned choice words follow Japanese while Pi’s labels stay intact', async () => {
  const { loadTerminalLanguage } = await import('../../harness/language.mjs');
  loadTerminalLanguage('ja');
  try {
    const {tool}=setup();let shown;
    await tool.execute('ja',question,null,null,{ui:{select:async(_q,options)=>{shown=options;return options[0];}}});
    assert.equal(shown.at(-1),'別の回答…');assert.match(shown[0],/Only me +\x1b\[2mおすすめ/);
  } finally {loadTerminalLanguage('en');}
});
