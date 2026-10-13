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
 const server=spawn('python3',[join(process.env.PI_TEST_RUNTIME||'.','harness/services.py')],{env:{...process.env,PATH:directory+':'+process.env.PATH,PI_LAYA_PORT:'0',PI_WEB_PORT:'0',PI_AGENT_DATA:join(directory,'workspace'),PI_WEB_DATA:join(directory,'data'),PI_HARNESS_LOG_FILE:join(directory,'audit.log')},stdio:['ignore','pipe','pipe']});
 let browser;
 try{
  const lines=readline.createInterface({input:server.stdout});
  const ports=await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('Server startup timeout')),10000);lines.once('line',line=>{clearTimeout(timeout);resolve(JSON.parse(line));});server.once('exit',code=>reject(new Error('Server exited '+code)));});
  browser=await chromium.launch({headless:true,...(process.env.PI_TEST_CHROME?{executablePath:process.env.PI_TEST_CHROME}:{})});
  const page=await browser.newPage({viewport:{width:1440,height:950}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  // Reproduce the installed failure: an older running server cannot serve a
  // newly installed module. Report recovery instead of presenting dead tabs.
  await page.route('**/js/ui.mjs',route=>route.fulfill({status:404,body:'Not found'}));
  await page.goto(`http://127.0.0.1:${ports.web}`);
  await page.locator('#startup-error').waitFor();
  assert.match(await page.locator('#startup-error').textContent(),/start plh again/);
  await page.unroute('**/js/ui.mjs');
  await page.goto(`http://127.0.0.1:${ports.web}`);
  await page.getByRole('button',{name:'Create Your First Project…',exact:true}).waitFor();
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
  await heading.evaluate(element=>{const range=document.createRange();range.selectNodeContents(element);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);document.dispatchEvent(new Event('selectionchange'));});
  await page.locator('#selected-passage').waitFor();await page.locator('#comment-text').fill('Implement this roadmap');await page.getByRole('button',{name:'Add Comment',exact:true}).click();
  await page.locator('#document-comments').getByRole('button',{name:'Ask agent about this passage',exact:true}).click();
  await page.locator('#document-comments').getByRole('textbox',{name:'Reply to text comment'}).fill('Cover Japanese too');await page.locator('#document-comments').getByRole('button',{name:'Reply',exact:true}).click();await page.getByText('Cover Japanese too',{exact:true}).waitFor();
  await page.locator('#document-prompt').fill('Review the whole roadmap');await page.getByRole('button',{name:'Send Request',exact:true}).click();
  await page.locator('#activity-tab').click();await page.locator('.activity-task').filter({hasText:'Review the whole roadmap'}).waitFor();assert.equal(await page.getByRole('link',{name:'Open document',exact:true}).count(),2);
  await page.locator('.activity-task').filter({hasText:'Review the whole roadmap'}).getByRole('button',{name:'Markdown record'}).click();await page.locator('#activity-record-text').filter({hasText:'Review the whole roadmap'}).waitFor();
  assert.equal(require('node:fs').readdirSync(join(directory,'workspace/activity')).filter(name=>name.endsWith('.md')).length,2);
  await page.locator('#chat-tab').click();await page.locator('#messages').getByText('[CANARY] reply 2',{exact:true}).waitFor();
  await page.locator('#prompt').fill('First question');
  await page.locator('#files').setInputFiles([
   {name:'notes.txt',mimeType:'text/plain',buffer:Buffer.from('Attached text')},
   {name:'pixel.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jCWQAAAAASUVORK5CYII=','base64')},
   {name:'voice.wav',mimeType:'audio/wav',buffer:Buffer.from('audio-ui-fixture')}
  ]);
  assert.equal(await page.locator('.attachment-chip').count(),3);
  await page.getByRole('button',{name:'Remove voice.wav'}).click();await page.locator('#send').click();
  await page.locator('#messages').getByText('[CANARY] reply 3',{exact:true}).waitFor();
  const reasoning=page.locator('#messages details').first();await reasoning.locator('summary').click();for(let i=0;i<2;i++)await page.waitForResponse(response=>response.url().endsWith('/api/workspace'));assert.equal(await reasoning.getAttribute('open'),'');
  assert.equal(await page.locator('.message.user').count(),3);assert.equal(await page.locator('.message img').count(),1);
  await createProject('Second project');await page.locator('#project-chat').click();
  await page.locator('#prompt').fill('Second question');await page.locator('#send').click();
  await page.locator('#messages').getByText('[CANARY] reply 1',{exact:true}).waitFor();
  assert.equal(await page.locator('.conversation').count(),2);
  await page.locator('#project-search').fill('missing project');await page.getByText('No matching projects',{exact:true}).waitFor();
  await page.locator('#project-search').fill('First');assert.equal(await page.locator('.conversation').count(),1);await page.locator('#project-search').fill('');
  await page.getByRole('button',{name:'First project',exact:true}).click();await page.locator('#project-chat').click();
  await page.locator('#messages').getByText('[CANARY] reply 3',{exact:true}).waitFor();
  assert.equal(await page.locator('#window-title').textContent(),'First project');
  await page.reload();await page.locator('#messages').getByText('[CANARY] reply 3',{exact:true}).waitFor();
  await page.locator('#work-tab').click();await page.locator('#file-search').fill('ROADMAP');assert.equal(await page.locator('.file-item').count(),1);await page.locator('#file-search').fill('');await page.getByRole('button',{name:'ROADMAP.md',exact:true}).click();await page.getByRole('textbox',{name:'Heading',exact:true}).filter({hasText:'Edited roadmap'}).waitFor();
  await page.locator('#editor-mode').selectOption('source');await page.locator('#document-source').fill('# Updated source\n\n- [ ] Verify\n');
  await page.getByText('Saved',{exact:true}).waitFor();await page.locator('#editor-mode').selectOption('blocks');
  await page.getByRole('checkbox',{name:'Task complete'}).check();await page.getByText('Saved',{exact:true}).waitFor();
  assert.match(require('node:fs').readFileSync(join(directory,'First project/ROADMAP.md'),'utf8'),/- \[x\] Verify/);
  writeFileSync(join(directory,'First project/live.py'),'print("live code")\n');
  await page.getByRole('button',{name:'live.py',exact:true}).waitFor();await page.getByRole('button',{name:'live.py',exact:true}).click();
  await page.locator('#document-source').filter({visible:true}).waitFor();assert.match(await page.locator('#document-source').inputValue(),/live code/);
  assert.equal(await page.locator('#comments-panel').isVisible(),false,'text files have no Review window');assert.equal(await page.locator('#window-title').textContent(),'live.py');
  writeFileSync(join(directory,'First project/live.py'),'print("updated code")\n');
  await page.waitForFunction(()=>document.querySelector('#document-source').value.includes('updated code'));
  const gate=await fetch(`http://127.0.0.1:${ports.laya}/gatekeep`,{method:'POST',headers:{'Content-Type':'application/json','X-Laya-Token':ports.token},body:JSON.stringify({tool_name:'execute_command',args:{command:'rm -fr *'},auth_level:'admin'})});
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
  await page.locator('#prompt').fill('TEST_WAIT');await page.locator('#send').click();await page.locator('#stop').waitFor();
  await page.locator('#prompt').fill('Queued work to cancel');await page.locator('#send').click();await page.locator('#activity-tab').click();
  const waiting=page.locator('.activity-task').filter({hasText:'Queued work to cancel'});await waiting.getByRole('button',{name:'Cancel',exact:true}).click();await waiting.locator('.task-state').filter({hasText:'cancelled'}).waitFor();
  await page.locator('.activity-task').filter({hasText:'TEST_WAIT'}).getByRole('button',{name:'Stop',exact:true}).click();
  await page.locator('.activity-task').filter({hasText:'TEST_WAIT'}).locator('.task-state').filter({hasText:'stopped'}).waitFor();
  await page.setViewportSize({width:1440,height:950});await page.getByRole('button',{name:'First project',exact:true}).click();
  await page.getByRole('button',{name:'ROADMAP.md',exact:true}).click();await page.locator('#document-name').filter({hasText:'ROADMAP.md'}).waitFor();assert.equal(await page.locator('#comments-panel').isVisible(),true);
  await page.locator('#editor-mode').selectOption('source');
  writeFileSync(join(directory,'First project/ROADMAP.md'),'# Changed outside the browser\n');
  await page.locator('#document-source').fill('# My unsaved 日本語 draft\n');await page.locator('#save-recovery').waitFor();
  assert.match(await page.locator('#document-source').inputValue(),/My unsaved/);assert.match(require('node:fs').readFileSync(join(directory,'First project/ROADMAP.md'),'utf8'),/Changed outside/);
  page.once('dialog',dialog=>dialog.accept());await page.reload();await page.locator('#save-recovery').waitFor();
  await page.locator('#editor-mode').selectOption('source');assert.match(await page.locator('#document-source').inputValue(),/My unsaved 日本語/);
  const downloaded=page.waitForEvent('download');await page.locator('#download-draft').click();assert.match((await downloaded).suggestedFilename(),/ROADMAP.md.draft/);
  page.once('dialog',dialog=>dialog.accept());await page.locator('#discard-draft').click();await page.locator('#save-recovery').waitFor({state:'hidden'});await page.getByRole('textbox',{name:'Heading',exact:true}).filter({hasText:'Changed outside'}).waitFor();
  await page.locator('#project-chat').click();await page.locator('#prompt').fill('A draft for this project 日本語');await page.reload();await page.waitForFunction(()=>document.querySelector('#prompt').value.includes('A draft for this project 日本語'));
  await page.locator('#prompt').fill('');await page.keyboard.press('Control+k');assert.equal(await page.locator('#project-search').evaluate(element=>element===document.activeElement),true);
  assert.deepEqual(await page.evaluate(()=>['sidebar','main-window'].map(id=>document.getElementById(id).classList.contains('pw-window--inactive'))),[false,true],'the window holding focus is the active one');
  await page.route('**/api/workspace',route=>route.fulfill({status:503,contentType:'application/json',body:'{"error":"temporary offline"}'}));await page.locator('#connection-retry').waitFor();await page.unroute('**/api/workspace');await page.locator('#connection-retry').click();await page.locator('#connection-retry').waitFor({state:'hidden'});
  const panels={chat:'#thread',work:'#work-panel',activity:'#activity-panel',laya:'#laya-panel'};
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});for(const tab of Object.keys(panels)){await page.locator('#'+tab+'-tab').click();for(const [name,panel] of Object.entries(panels)){assert.equal(await page.locator(panel).isVisible(),name===tab,tab+' panel selection at '+width);assert.equal(await page.locator('#'+name+'-tab').getAttribute('aria-pressed'),String(name===tab));}assert.equal(await page.evaluate(()=>document.body.dataset.view),tab);assert.equal(await page.locator('#window-title').textContent(),{chat:'First project',work:'ROADMAP.md',activity:'Activity',laya:'Laya'}[tab]);assert.equal(await page.locator('.composer-wrap').isVisible(),tab==='chat');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,tab+' overflows at '+width);}}
  await page.setViewportSize({width:1440,height:950});await page.locator('#work-tab').click();await page.screenshot({path:'/private/tmp/plh-work-desktop.png'});await page.locator('#activity-tab').click();await page.screenshot({path:'/private/tmp/plh-activity-desktop.png'});
  await page.setViewportSize({width:390,height:844});await page.keyboard.press('Escape');await page.locator('#sidebar').waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>scrollX),0);await page.screenshot({path:'/private/tmp/plh-activity-mobile.png'});
  assert.deepEqual(errors,[]);
  console.log('UX regression passed: document/text discussions, Markdown Activity, drafts/conflicts, reconnect, keyboard, attachments, live files and four tabs at 320/390/768/1440px.');
 }finally{
  if(browser)await browser.close();server.kill();await new Promise(resolve=>server.once('exit',resolve));rmSync(directory,{recursive:true,force:true});
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
