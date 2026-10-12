import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AgentLock } from '../../harness/agent-lock.mjs';
test('one inference owner across Pi runtimes, with stale-process recovery',()=>{
 const directory=mkdtempSync(join(tmpdir(),'agent-lock-')),path=join(directory,'lock');
 try{const first=new AgentLock(path),second=new AgentLock(path);first.acquire();first.acquire();assert.throws(()=>second.acquire(),/already working/);second.release();assert.throws(()=>second.acquire(),/already working/);first.release();second.acquire();second.release();writeFileSync(path,JSON.stringify({pid:999999999,token:'stale'}));new AgentLock(path,()=>false).acquire();}finally{rmSync(directory,{recursive:true});}
});
