import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, chmodSync, existsSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, delimiter} from 'node:path';
import {spawnSync} from 'node:child_process';

test('US-359 terminal: plh with an old Node stops and says Pi needs Node 22.19.0 or newer',()=>{
 const root=mkdtempSync(join(tmpdir(),'pi-old-node-'));
 try {
  const data=join(root,'data');mkdirSync(data);
  writeFileSync(join(data,'config.json'),JSON.stringify({web_port:0,auto_update:false}));
  writeFileSync(join(root,'node'),'#!/bin/sh\nprintf "v20.19.0\\n"\n');chmodSync(join(root,'node'),0o755);
  writeFileSync(join(root,'pi'),'#!/bin/sh\ntouch "'+join(root,'pi-started')+'"\n');chmodSync(join(root,'pi'),0o755);
  const result=spawnSync('python3',['plh.py'],{encoding:'utf8',timeout:15000,env:{...process.env,PATH:root+delimiter+process.env.PATH,PI_AGENT_DATA:data,PI_WEB_PORT:'0',PI_OLLAMA_URL:'http://127.0.0.1:9',PI_COLIBRI_URL:'http://127.0.0.1:9',PI_TAILSCALE:'false',PI_NO_DOWNLOADS:'1'}});
  assert.ifError(result.error);assert.notEqual(result.status,0);assert.match(result.stderr,/Pi needs Node >= 22\.19\.0/);
  assert.equal(existsSync(join(root,'pi-started')),false,'Pi must not start');
 } finally {rmSync(root,{recursive:true,force:true});}
});
