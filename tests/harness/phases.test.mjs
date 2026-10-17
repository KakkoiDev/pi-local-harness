import {test} from 'node:test';
import assert from 'node:assert/strict';
import {installPhases} from '../../harness/phases.mjs';

test('only person slash commands expose shared phase selection, never a model tool',async()=>{
 const commands={},calls=[],notices=[];
 installPhases({registerCommand:(name,value)=>commands[name]=value,registerTool:()=>assert.fail('phase is not a Pi tool')},{call:async(path,value)=>{calls.push([path,value]);return {phase:value.phase,tasks:[]};}});
 assert.deepEqual(Object.keys(commands),['discuss','plan','build']);
 await commands.plan.handler('',{cwd:'/scratch',ui:{notify:text=>notices.push(text)}});
 assert.equal(calls[0][0],'/phase');assert.equal(calls[0][1].phase,'planning');assert.equal(calls[0][1].action,'/plan');
 assert.match(notices[0],/Phase: Planning/);
});

test('/build reviews waiting tasks and cancellation never changes phase',async()=>{
 const commands={},calls=[];
 installPhases({registerCommand:(name,value)=>commands[name]=value},{call:async(path,value)=>{calls.push(value);return {phase:'discussion',tasks:[{title:'Count',done_when:'Clicks count.'}]};}});
 await commands.build.handler('',{cwd:'/scratch',ui:{select:async()=>undefined,notify:()=>{}}});
 assert.equal(calls.length,1);assert.equal(calls[0].phase,undefined);
});
