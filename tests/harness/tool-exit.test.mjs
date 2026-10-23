import {test} from 'node:test';
import assert from 'node:assert/strict';
import {toolExitCode} from '../../harness/tool-exit.mjs';
test('bash exit codes retain the final runtime footer, not incidental output or successful prose',()=>{
 const event={toolName:'bash',isError:true,content:[{type:'text',text:'Command exited with code 127'}]};
 for(const code of [1,2,126,127,137])assert.equal(toolExitCode({...event,content:[{type:'text',text:`output\nCommand exited with code ${code}\n`}]}),code);
 assert.equal(toolExitCode({...event,isError:false}),0);
 assert.equal(toolExitCode({...event,toolName:'read'}),1);
 assert.equal(toolExitCode({...event,content:[{type:'text',text:'Command exited with code 127\nmore output'}]}),1);
 assert.equal(toolExitCode({...event,content:[{type:'text',text:'Command exited with code 999'}]}),1);
});
