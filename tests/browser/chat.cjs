// Run with a Playwright installation: NODE_PATH=/path/to/node_modules node tests/browser/chat.cjs
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('node:child_process');
const { mkdtempSync, writeFileSync, chmodSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const assert = require('node:assert/strict');
const readline = require('node:readline');
(async()=>{
 const directory=mkdtempSync(join(tmpdir(),'pi-browser-'));
 const python=execFileSync('which',['python3'],{encoding:'utf8'}).trim();
 const fake=join(directory,'pi');
 writeFileSync(fake,`#!${python}\n`+require('node:fs').readFileSync('tests/fixtures/fake-pi.py','utf8'));chmodSync(fake,0o755);
 const server=spawn('python3',['harness/services.py'],{env:{...process.env,PATH:directory+':'+process.env.PATH,PI_LAYA_PORT:'0',PI_WEB_PORT:'0',PI_WEB_DATA:join(directory,'data'),PI_HARNESS_LOG_FILE:join(directory,'audit.log')},stdio:['ignore','pipe','pipe']});
 let browser;
 try{
  const lines=readline.createInterface({input:server.stdout});
  const ports=await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('Server startup timeout')),10000);lines.once('line',line=>{clearTimeout(timeout);resolve(JSON.parse(line));});server.once('exit',code=>reject(new Error('Server exited '+code)));});
  browser=await chromium.launch({headless:true,...(process.env.PI_TEST_CHROME?{executablePath:process.env.PI_TEST_CHROME}:{})});
  const page=await browser.newPage({viewport:{width:1440,height:950}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${ports.web}`);
  await page.locator('.conversation').waitFor();
  await page.locator('#prompt').fill('First question');
  await page.locator('#files').setInputFiles([
   {name:'notes.txt',mimeType:'text/plain',buffer:Buffer.from('Attached text')},
   {name:'pixel.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jCWQAAAAASUVORK5CYII=','base64')},
   {name:'voice.wav',mimeType:'audio/wav',buffer:Buffer.from('audio-ui-fixture')}
  ]);
  assert.equal(await page.locator('.attachment-chip').count(),3);
  await page.getByRole('button',{name:'Remove voice.wav'}).click();
  await page.locator('#send').click();
  await page.getByText('[CANARY] reply 1',{exact:true}).waitFor();
  await page.locator('#stop').waitFor({state:'hidden'});
  assert.equal(await page.locator('.message.user').count(),1);
  assert.equal(await page.locator('.message img').count(),1);
  await page.locator('#new-chat').click();
  await page.locator('#prompt').fill('Second question');await page.locator('#send').click();
  await page.getByText('[CANARY] reply 1',{exact:true}).waitFor();await page.locator('#stop').waitFor({state:'hidden'});
  assert.equal(await page.locator('.conversation').count(),2);
  await page.getByRole('button',{name:'First question',exact:true}).click();
  await page.locator('#prompt').fill('Continue');await page.locator('#send').click();
  await page.getByText('[CANARY] reply 2',{exact:true}).waitFor();await page.locator('#stop').waitFor({state:'hidden'});
  await page.reload();await page.getByText('[CANARY] reply 2',{exact:true}).waitFor();
  page.once('dialog',dialog=>dialog.accept('Renamed chat'));
  await page.getByRole('button',{name:'Rename First question'}).click();await page.getByRole('button',{name:'Renamed chat',exact:true}).waitFor();
  await page.screenshot({path:'/private/tmp/pi-chat-desktop.png'});
  await page.setViewportSize({width:390,height:844});await page.locator('#open-menu').click();
  assert.equal(await page.locator('#backdrop').isVisible(),true);
  await page.getByRole('button',{name:'Second question',exact:true}).click();
  assert.equal(await page.locator('#backdrop').isVisible(),false);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.waitForFunction(()=>document.querySelector('#sidebar').getBoundingClientRect().right<=0);
  await page.screenshot({path:'/private/tmp/pi-chat-mobile.png'});
  await page.locator('#prompt').fill('TEST_WAIT');await page.locator('#send').click();await page.locator('#stop').click();
  await page.locator('#stop').waitFor({state:'hidden'});
  assert.equal(await page.locator('#error').isVisible(),true);
  await page.locator('#open-menu').click();page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Delete Second question'}).click();
  await page.waitForFunction(()=>document.querySelectorAll('.conversation').length===1);
  assert.deepEqual(errors,[]);
  console.log('Desktop/mobile: attachments, streaming, isolated conversations, resume, rename, stop, delete passed.');
 }finally{
  if(browser)await browser.close();server.kill();await new Promise(resolve=>server.once('exit',resolve));rmSync(directory,{recursive:true,force:true});
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
