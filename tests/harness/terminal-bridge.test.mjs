import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
test('the embedding Preview sends real Textual stdin and other windows cannot',()=>{
 const listeners={},messages=[],upstream=[];class Socket{static OPEN=1;constructor(url){this.url=url;this.readyState=1;}send(data){messages.push(JSON.parse(data));}}
 const parent={postMessage:(value,origin)=>upstream.push({value,origin})},window={WebSocket:Socket,parent,addEventListener:(name,fn)=>listeners[name]=fn};
 vm.runInNewContext(readFileSync(new URL('../../harness/terminal-bridge.js',import.meta.url),'utf8'),{window,URL,document:{referrer:'https://workbench.example.ts.net/chat',querySelector:()=>null},location:{href:'https://app.example.ts.net/',host:'app.example.ts.net',protocol:'https:'}});
 const socket=new window.WebSocket('ws://127.0.0.1:4000/ws');assert.equal(socket.url,'wss://app.example.ts.net/ws');
 const event=(origin,source=parent)=>({source,origin,data:{type:'pi-terminal-key',key:'ArrowUp'}});
 listeners.message(event('https://stranger.example'));listeners.message(event('https://workbench.example.ts.net',{}));assert.equal(messages.length,0);
 listeners.message(event('https://workbench.example.ts.net'));assert.deepEqual(messages[0],['stdin','\x1b[A']);
 listeners.message({source:parent,origin:'https://workbench.example.ts.net',data:{type:'pi-terminal-control',value:true}});let prevented=false;
 listeners.keydown({key:'c',preventDefault:()=>prevented=true,stopImmediatePropagation(){}});assert.equal(prevented,true);assert.deepEqual(messages[1],['stdin','\x03']);
 socket.send(JSON.stringify(['resize',{width:80,height:24}]));assert.equal(upstream.at(-1).value.width,80);assert.equal(upstream.at(-1).origin,'https://workbench.example.ts.net');
});
