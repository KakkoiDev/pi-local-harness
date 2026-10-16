import {test} from 'node:test';
import assert from 'node:assert/strict';
import {installPlanning} from '../../harness/planning.mjs';

const plan={goal:'Pong',tasks:[{title:'Ball',done_when:'Bounces'}],pending:true};
for (const [mode,pick,expected] of [['terminal','Approve Plan','chosen'],['terminal','Change…',null],['web',null,null],['auto',null,'auto']]) {
  test(`plan approval: ${mode} ${pick || ''}`,async()=>{
    let tool,approved=null,paused=false;
    installPlanning({registerTool:value=>tool=value},{propose:async()=>plan,approve:async state=>approved=state,pending:async()=>paused=true,cancel:async()=>paused=true,web:()=>mode==='web',auto:()=>mode==='auto'});
    const result=await tool.execute('p',{},null,null,{ui:{select:async()=>pick}});
    assert.equal(approved,expected);assert.equal(result.isError,undefined);
    assert.equal(paused,!expected);
  });
}
