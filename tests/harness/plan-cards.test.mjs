import {test} from 'node:test';
import assert from 'node:assert/strict';
import {planningState,planDecisions} from '../../js/plan-cards.mjs';
test('answers and approvals come from later person messages; plan versions collapse',()=>{
 const messages=[{role:'assistant',choice:{question:'Who?',pending:true}},{role:'user',content:'Choice: Who? → A team'},{role:'assistant',plan:{tasks:[]}},{role:'user',content:'Use subjects'},{role:'assistant',plan:{tasks:[]}},{role:'user',content:'yes'}];
 assert.equal(planningState(messages,0).answer,'A team');assert.equal(planningState(messages,2).replaced,2);assert.equal(planningState(messages,4).approved,false);
});
test('all decisions survive a long plan, including their origin',()=>{
 const values=planDecisions({tasks:[{decisions:'- Sorting: newest (auto)\n- Languages: Japanese and English (given)'},{decisions:'- Sorting: newest (auto)'}]});
 assert.deepEqual(values,[{question:'Sorting',answer:'newest',state:'auto'},{question:'Languages',answer:'Japanese and English',state:'given'}]);
});

test('only recorded controls settle plans and check-ins',()=>{
 assert.equal(planningState([{role:'assistant',plan:{approved:true}}],0).approved,true);
 assert.equal(planningState([{role:'assistant',check_in:{accepted:true}},{role:'user',content:'yes'}],0).continued,true);
 assert.equal(planningState([{role:'assistant',check_in:{state:'stopped'}},{role:'user',content:'yes'}],0).continued,false);
});
