import { test } from 'node:test';
import assert from 'node:assert/strict';
import { projectWillQueue } from '../../js/project-agent.mjs';
test('composer follows its project agent admission, including safe fallback for older hosts',()=>{
 const jobs=[{project:'a',status:'running'}];
 assert.equal(projectWillQueue({jobs,agents:{b:{available:true}}},'b'),false);
 assert.equal(projectWillQueue({jobs,agents:{a:{available:false}}},'a'),true);
 assert.equal(projectWillQueue({jobs,agents:{b:{available:false}}},'b'),true);
 assert.equal(projectWillQueue({jobs},'b'),true);
 assert.equal(projectWillQueue({jobs:[]},'b'),false);
});
