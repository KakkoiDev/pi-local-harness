import {test} from 'node:test';
import assert from 'node:assert/strict';
import {choiceRows,planView,checkIn} from '../../harness/terminal-planning.mjs';
import {loadTerminalLanguage} from '../../harness/language.mjs';

test('terminal choices keep the recommendation right and dim, details below, with no colour',()=>{
 const rows=choiceRows({options:[{label:'Only me',detail:'Stays on this Mac'},{label:'A team'}]},60);
 assert.match(rows[0],/^Only me +\x1b\[2mRecommended/);assert.match(rows[0],/\n  \x1b\[2mStays on this Mac/);
 assert.equal(rows.at(-1),'Something else…');assert.doesNotMatch(rows.join(''),/\x1b\[3[0-9]m/);
});
test('terminal plan shows Goal, every task and its decisions',()=>{
 const view=planView({goal:'Notes for a class',tasks:[{title:'Keep notes',done_when:'A note survives reload',decisions:'- Sorting: newest (auto)'}]},80);
 assert.match(view,/Goal.*Notes for a class/);assert.match(view,/Keep notes/);assert.match(view,/A note survives reload/);assert.match(view,/Sorting: newest/);
});
test('verified check-in defaults to Continue; unverified defaults to Review First',async()=>{
 for(const verified of [true,false]) {
  let shown;
  const result=await checkIn({ui:{select:async(title,options)=>{shown={title,options};return options.at(-1);},notify(){}}},{task:'tasks/001-ball.md',verified,verification:'node --test · 6 passed',next:'tasks/002-score.md',number:1,total:2}, {read:()=> '# Ball\n'});
  assert.equal(shown.options[0],verified?'Continue':'Review First');assert.match(shown.title,/node --test/);assert.equal(result,'stop');
 }
});
test('review shows the actual task before returning to the check-in',async()=>{
 let count=0;const titles=[];
 const result=await checkIn({ui:{select:async(title,options)=>{titles.push(title);return ++count===1?'Review First':count===2?'Back':'Continue';}}},{task:'tasks/001-ball.md',verified:true,next:'tasks/002-score.md'}, {read:()=> '# Ball\nActual task notes.'});
 assert.equal(result,'continue');assert.match(titles[1],/Actual task notes/);
});
test('Japanese fixed check-in words follow the terminal language',async()=>{
 loadTerminalLanguage('ja');
 try {let rows;await checkIn({ui:{select:async(_title,options)=>{rows=options;return options.at(-1);},notify(){}}},{task:'tasks/001.md',verified:true,next:'tasks/002.md'});assert.equal(rows[0],'続ける');assert.equal(rows.at(-1),'ここで停止');}
 finally{loadTerminalLanguage('en');}
});
