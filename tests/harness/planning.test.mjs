import {test} from 'node:test';
import assert from 'node:assert/strict';
import {installPlanning} from '../../harness/planning.mjs';

const plan={goal:'Pong',tasks:[{title:'Ball',done_when:'Bounces'}],pending:true};
for (const [mode,pick,expected] of [['terminal','Start Building','chosen'],['terminal','Change…',null],['web',null,null],['auto',null,'auto']]) {
  test(`plan approval: ${mode} ${pick || ''}`,async()=>{
    let tool,approved=null,paused=false;
    installPlanning({registerTool:value=>tool=value},{propose:async()=>plan,approve:async state=>approved=state,pending:async()=>paused=true,cancel:async()=>paused=true,web:()=>mode==='web',auto:()=>mode==='auto'});
    const result=await tool.execute('p',{},null,null,{ui:{select:async()=>pick}});
    assert.equal(approved,expected);assert.equal(result.isError,undefined);
    assert.equal(paused,!expected);
  });
}

test('Change collects the person’s plan edit and pauses without approving',async()=>{
 let tool,changed=null,paused=false,approved=false;
 installPlanning({registerTool:value=>tool=value},{propose:async()=>plan,approve:async()=>approved=true,change:async text=>changed=text,cancel:async()=>paused=true});
 const result=await tool.execute('change',{},null,null,{ui:{select:async()=> 'Change…',input:async()=> 'Keep notes only on this Mac'}});
 assert.equal(changed,'Keep notes only on this Mac');assert.equal(approved,false);assert.equal(paused,true);assert.equal(result.isError,undefined);
});

test('Open ROADMAP.md shows the actual source and returns to approval',async()=>{
 const {mkdtempSync,writeFileSync,rmSync}=await import('node:fs');const {tmpdir}=await import('node:os');const {join}=await import('node:path');
 const dir=mkdtempSync(join(tmpdir(),'plh-plan-open-'));writeFileSync(join(dir,'ROADMAP.md'),'# Actual Roadmap\nThe person’s text.');
 let tool,count=0,approved=false;const shown=[];
 installPlanning({registerTool:value=>tool=value},{propose:async()=>({...plan,root:dir}),approve:async()=>approved=true,cancel:async()=>{}});
 try {await tool.execute('open',{},null,null,{ui:{select:async(title)=>{shown.push(title);return ++count===1?'Open ROADMAP.md':count===2?'Back':'Start Building';}}});assert.match(shown[1],/The person’s text/);assert.equal(approved,true);}
 finally{rmSync(dir,{recursive:true,force:true});}
});

test('task 329: propose_plan takes each task’s scenarios (title, given, when, then)',()=>{
 let tool;installPlanning({registerTool:value=>tool=value},{});
 const item=tool.parameters.properties.tasks.items.properties.scenarios;
 assert.equal(item.type,'array');assert.deepEqual(item.items.required,['title','given','when','then']);
 assert.match(tool.description,/scenarios/);
});
