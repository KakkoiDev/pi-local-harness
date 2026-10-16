// Observe actual canvas pixels through the same Chromium launcher used by the harness.
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const {findChrome, launchChrome} = await import(pathToFileURL(process.argv[2]+'/harness/browser.mjs'));
const chrome = findChrome();
if (!chrome) throw new Error('No Chromium: run plh setup browser');
const browser = await launchChrome(chrome);
try {
 const {session} = browser;
 const {targetId} = await session.send('Target.createTarget',{url:'about:blank'});
 const {sessionId} = await session.send('Target.attachToTarget',{targetId,flatten:true});
 const page=(method,params={})=>session.send(method,params,sessionId);
 const evaluate=async expression=>{const r=await page('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
 await page('Page.enable'); await page('Runtime.enable');
 const loaded=session.once('Page.loadEventFired',sessionId);await page('Page.navigate',{url:process.argv[3]});await loaded;
 await evaluate(`new Promise(resolve=>setTimeout(resolve,300))`);
 assert.equal(await evaluate('document.querySelectorAll("canvas").length'),1,'one canvas');
 await evaluate(`window.pixelFacts=()=>{
  const c=document.querySelector('canvas'),w=c.width,h=c.height,d=c.getContext('2d').getImageData(0,0,w,h).data;
  const white=new Set();let black=0;
  for(let n=0;n<w*h;n++){const i=n*4;if(d[i]<16&&d[i+1]<16&&d[i+2]<16&&d[i+3]>240)black++;if(d[i]>240&&d[i+1]>240&&d[i+2]>240&&d[i+3]>240)white.add(n);}
  const blobs=[];
  while(white.size){const n=white.values().next().value,queue=[n];white.delete(n);let x0=w,y0=h,x1=0,y1=0;
   for(let i=0;i<queue.length;i++){const n=queue[i],x=n%w,y=Math.floor(n/w);x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);
    for(const m of [x>0?n-1:-1,x<w-1?n+1:-1,n-w,n+w])if(white.delete(m))queue.push(m);}
   blobs.push({x:(x0+x1)/2,y:(y0+y1)/2,width:x1-x0+1,height:y1-y0+1});}
  return {black:black/(w*h),w,h,blobs};
 };window.frames=n=>new Promise(resolve=>{const tick=()=>--n>0?requestAnimationFrame(tick):resolve();requestAnimationFrame(tick);});`);
 const facts=()=>evaluate('pixelFacts()');
 const before=await facts();assert.ok(before.black>.85,'black background');
 const ball=f=>f.blobs.find(b=>b.width>=3&&b.height>=3&&b.width<20&&b.height<20&&b.x>f.w*.15&&b.x<f.w*.85&&b.y>f.h*.15&&b.y<f.h*.85);
 const a=ball(before);assert.ok(a,'white ball');
 await evaluate('frames(30)');const b=ball(await facts());assert.ok(b,'white ball after 30 frames');assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>2,'ball moves after 30 frames');
 const paddle=(f,side)=>f.blobs.find(b=>b.height>=20&&b.width<=b.height/2&&(side==='left'?b.x<f.w*.25:b.x>f.w*.75));
 for(const [side,key,code,vk] of [['left','w','KeyW',87],['right','ArrowUp','ArrowUp',38]]){
  const first=paddle(await facts(),side);assert.ok(first,side+' white paddle');
  await page('Input.dispatchKeyEvent',{type:'keyDown',key,code,windowsVirtualKeyCode:vk});await evaluate('frames(12)');
  await page('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode:vk});
  const last=paddle(await facts(),side);assert.ok(last&&last.y<first.y-2,side+' paddle moves up while holding '+key);
 }
 console.log('Black canvas, moving white ball, W and ArrowUp controls passed.');
} finally {browser.close();}
