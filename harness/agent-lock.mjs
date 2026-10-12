import { mkdirSync, openSync, writeFileSync, closeSync, readFileSync, unlinkSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
export class AgentLock {
  constructor(path, alive = pid => { try { process.kill(pid, 0); return true; } catch (error) { return error.code !== 'ESRCH'; } }) {
    this.path=path;this.alive=alive;this.token=JSON.stringify({pid:process.pid,token:randomUUID()});this.held=false;
  }
  acquire() {
    if(this.held)return;
    mkdirSync(dirname(this.path),{recursive:true});
    for(let attempt=0;attempt<2;attempt++) {
      try {const fd=openSync(this.path,'wx',0o600);try{writeFileSync(fd,this.token);}finally{closeSync(fd);}this.held=true;return;}
      catch(error) {
        if(error.code!=='EEXIST')throw error;
        const contents=readFileSync(this.path,'utf8');
        let owner;try{owner=JSON.parse(contents);}catch{throw new Error('Agent lock is unreadable. Another agent may be starting.');}
        if(this.alive(owner.pid))throw new Error('One agent is already working. Wait or stop the active task before starting another.');
        if(readFileSync(this.path,'utf8')===contents)unlinkSync(this.path);
      }
    }
    throw new Error('Agent is busy; try again after the active task finishes.');
  }
  release() {
    if(!this.held)return;
    try{if(readFileSync(this.path,'utf8')===this.token)unlinkSync(this.path);}catch(error){if(error.code!=='ENOENT')throw error;}
    this.held=false;
  }
}
