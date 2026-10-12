// Run with a Playwright installation: NODE_PATH=/path/to/node_modules node tests/browser/chat.cjs
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('node:child_process');
const { mkdtempSync, writeFileSync, chmodSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const assert = require('node:assert/strict');
const readline = require('node:readline');
(async()=>{
 const directory=require('node:fs').realpathSync(mkdtempSync(join(tmpdir(),'pi-browser-')));
 const python=execFileSync('which',['python3'],{encoding:'utf8'}).trim();
 const fake=join(directory,'pi');
 writeFileSync(fake,`#!${python}\n`+require('node:fs').readFileSync('tests/fixtures/fake-pi.py','utf8'));chmodSync(fake,0o755);
 const server=spawn('python3',['harness/services.py'],{env:{...process.env,PATH:directory+':'+process.env.PATH,PI_LAYA_PORT:'0',PI_WEB_PORT:'0',PI_AGENT_DATA:join(directory,'workspace'),PI_WEB_DATA:join(directory,'data'),PI_HARNESS_LOG_FILE:join(directory,'audit.log')},stdio:['ignore','pipe','pipe']});
 let browser;
 try{
  const lines=readline.createInterface({input:server.stdout});
  const ports=await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('Server startup timeout')),10000);lines.once('line',line=>{clearTimeout(timeout);resolve(JSON.parse(line));});server.once('exit',code=>reject(new Error('Server exited '+code)));});
  browser=await chromium.launch({headless:true,...(process.env.PI_TEST_CHROME?{executablePath:process.env.PI_TEST_CHROME}:{})});
  const page=await browser.newPage({viewport:{width:1440,height:950}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${ports.web}`);
  await page.getByRole('button',{name:'Create your first project',exact:true}).waitFor();
  assert.equal(await page.locator('#prompt').isDisabled(),true);
  async function createProject(name){
   await page.locator('#new-project').click();await page.waitForFunction(()=>document.querySelector('#folder-path').value.length>0);await page.locator('#folder-path').fill(directory);
   const browsed=page.waitForResponse(response=>response.url().includes('/api/directories?path='));await page.locator('#folder-go').click();await browsed;
   await page.waitForFunction(path=>document.querySelector('#folder-path').value===path,directory);
   await page.locator('#folder-name').fill(name);await page.locator('#folder-use').click();
   await page.getByRole('textbox',{name:'Heading',exact:true}).first().waitFor();
  }
  await createProject('First project');
  const heading=page.getByRole('textbox',{name:'Heading',exact:true}).first();await heading.fill('Edited roadmap');
  await page.getByText('Saved',{exact:true}).waitFor();
  assert.match(require('node:fs').readFileSync(join(directory,'First project/ROADMAP.md'),'utf8'),/# Edited roadmap/);
  await page.locator('#comment-text').fill('Implement this roadmap');await page.getByRole('button',{name:'Add comment',exact:true}).click();
  await page.locator('#document-comments').getByRole('button',{name:'Send to agent',exact:true}).click();
  await page.locator('#project-chat').click();await page.getByText('[CANARY] reply 1',{exact:true}).waitFor();
  await page.locator('#prompt').fill('First question');
  await page.locator('#files').setInputFiles([
   {name:'notes.txt',mimeType:'text/plain',buffer:Buffer.from('Attached text')},
   {name:'pixel.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jCWQAAAAASUVORK5CYII=','base64')},
   {name:'voice.wav',mimeType:'audio/wav',buffer:Buffer.from('audio-ui-fixture')}
  ]);
  assert.equal(await page.locator('.attachment-chip').count(),3);
  await page.getByRole('button',{name:'Remove voice.wav'}).click();await page.locator('#send').click();
  await page.getByText('[CANARY] reply 2',{exact:true}).waitFor();
  assert.equal(await page.locator('.message.user').count(),2);assert.equal(await page.locator('.message img').count(),1);
  await createProject('Second project');await page.locator('#project-chat').click();
  await page.locator('#prompt').fill('Second question');await page.locator('#send').click();
  await page.getByText('[CANARY] reply 1',{exact:true}).waitFor();
  assert.equal(await page.locator('.conversation').count(),2);
  await page.locator('#project-search').fill('missing project');await page.getByText('No matching projects',{exact:true}).waitFor();
  await page.locator('#project-search').fill('First');assert.equal(await page.locator('.conversation').count(),1);await page.locator('#project-search').fill('');
  await page.getByRole('button',{name:'First project',exact:true}).click();await page.locator('#project-chat').click();
  await page.getByText('[CANARY] reply 2',{exact:true}).waitFor();
  await page.reload();await page.getByText('[CANARY] reply 2',{exact:true}).waitFor();
  await page.locator('#work-tab').click();await page.locator('#file-search').fill('ROADMAP');assert.equal(await page.locator('.file-item').count(),1);await page.locator('#file-search').fill('');await page.getByRole('button',{name:'ROADMAP.md',exact:true}).click();await page.getByRole('textbox',{name:'Heading',exact:true}).filter({hasText:'Edited roadmap'}).waitFor();
  await page.locator('#editor-mode').selectOption('source');await page.locator('#document-source').fill('# Updated source\n\n- [ ] Verify\n');
  await page.getByText('Saved',{exact:true}).waitFor();await page.locator('#editor-mode').selectOption('blocks');
  await page.getByRole('checkbox',{name:'Task complete'}).check();await page.getByText('Saved',{exact:true}).waitFor();
  assert.match(require('node:fs').readFileSync(join(directory,'First project/ROADMAP.md'),'utf8'),/- \[x\] Verify/);
  writeFileSync(join(directory,'First project/live.py'),'print("live code")\n');
  await page.getByRole('button',{name:'live.py',exact:true}).waitFor();await page.getByRole('button',{name:'live.py',exact:true}).click();
  await page.locator('#document-source').filter({visible:true}).waitFor();assert.match(await page.locator('#document-source').inputValue(),/live code/);
  writeFileSync(join(directory,'First project/live.py'),'print("updated code")\n');
  await page.waitForFunction(()=>document.querySelector('#document-source').value.includes('updated code'));
  const gate=await fetch(`http://127.0.0.1:${ports.laya}/gatekeep`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tool_name:'execute_command',args:{command:'rm -fr *'},auth_level:'admin'})});
  assert.equal((await gate.json()).outcome,'BLOCK');
  await page.locator('#laya-tab').click();
  await page.getByText('BLOCK',{exact:true}).waitFor();
  await page.getByText('Recursive deletion targets',{exact:false}).waitFor();
  assert.equal(await page.locator('#composer').isVisible(),false);
  await page.locator('#laya-filter').selectOption('failures');
  await page.screenshot({path:'/private/tmp/pi-laya-desktop.png'});
  await page.locator('#chat-tab').click();
  await page.screenshot({path:'/private/tmp/pi-chat-desktop.png'});
  await page.setViewportSize({width:390,height:844});await page.locator('#open-menu').click();
  assert.equal(await page.locator('#backdrop').isVisible(),true);
  await page.getByRole('button',{name:'Second project',exact:true}).click();await page.locator('#project-chat').click();
  await page.locator('#backdrop').waitFor({state:'hidden'});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:'/private/tmp/pi-chat-mobile.png'});
  await page.locator('#prompt').fill('TEST_WAIT');await page.locator('#send').click();await page.locator('#stop').click();
  await page.locator('#stop').waitFor({state:'hidden'});
  assert.deepEqual(errors,[]);
  console.log('Desktop/mobile: project documents, comments, queue, live files, attachments, isolated project chats, Laya and stop passed.');
 }finally{
  if(browser)await browser.close();server.kill();await new Promise(resolve=>server.once('exit',resolve));rmSync(directory,{recursive:true,force:true});
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
