// Design conformance checks for the 2026-10-13 UI review (tasks 100-110).
// Run like chat.cjs: NODE_PATH=/path/to/node_modules node tests/browser/design.cjs
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const assert = require('node:assert/strict');
const readline = require('node:readline');
(async()=>{
 const directory=fs.realpathSync(fs.mkdtempSync(join(tmpdir(),'pi-design-')));
 const python=execFileSync('which',['python3'],{encoding:'utf8'}).trim();
 const fake=join(directory,'pi');
 fs.writeFileSync(fake,`#!${python}\n`+fs.readFileSync('tests/fixtures/fake-pi.py','utf8'));fs.chmodSync(fake,0o755);
 const server=spawn('python3',[join(process.env.PI_TEST_RUNTIME||'.','harness/services.py')],{env:{...process.env,PATH:directory+':'+process.env.PATH,PI_GATE_PORT:'0',PI_WEB_PORT:'0',PI_AGENT_DATA:join(directory,'workspace'),PI_WEB_DATA:join(directory,'data'),PI_HARNESS_LOG_FILE:join(directory,'audit.log')},stdio:['ignore','pipe','pipe']});
 let browser;
 try{
  const lines=readline.createInterface({input:server.stdout});
  const ports=await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('Server startup timeout')),10000);lines.once('line',line=>{clearTimeout(timeout);resolve(JSON.parse(line));});server.once('exit',code=>reject(new Error('Server exited '+code)));});
  const base=`http://127.0.0.1:${ports.web}`;
  browser=await chromium.launch({headless:true,...(process.env.PI_TEST_CHROME?{executablePath:process.env.PI_TEST_CHROME}:{})});
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);
  const post=(path,body)=>page.evaluate(async([path,body])=>{const response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await response.json();if(!response.ok)throw new Error(data.error);return data;},[path,body]);
  const created=await post('/api/projects/create',{name:'Design check',parent:directory});
  const root=join(directory,'Design check');
  fs.writeFileSync(join(root,'ROADMAP.md'),'# Design check\n\nThe goal is a calm workbench.\n\n- [x] Done item\n- [ ] Open item\n');
  await page.goto(base);
  await page.locator('#work-tab').click();
  await page.getByRole('textbox',{name:'Heading',exact:true}).first().waitFor();
  const roadmap=(await page.evaluate(()=>window.__workspaceStatus?.()))||null;

  // 100: document task checkboxes are the design's 1-bit pw-check, not the system control.
  const check=page.locator('#document-editor input[type=checkbox]').first();
  assert.equal(await check.evaluate(element=>element.classList.contains('pw-check')),true,'task checkbox uses pw-check');
  assert.equal(await check.evaluate(element=>getComputedStyle(element).appearance),'none','task checkbox draws no system control');

  // 101: empty lists use the design's empty state (14px chrome, 24px 16px margin, centred).
  const empty=page.locator('#document-comments p').first();
  await empty.waitFor();
  assert.equal(await empty.evaluate(element=>element.classList.contains('pw-empty')),true,'Review empty state is pw-empty');
  assert.deepEqual(await empty.evaluate(element=>{const style=getComputedStyle(element);return [style.marginTop,style.marginLeft,style.textAlign];}),['24px','16px','center']);
  assert.equal(await empty.textContent(),'No open comments.','Final board copy');

  // 102: an open thread sits below its passage, as wide as the column minus the 24px indent.
  const path=`projects/${created.project}/ROADMAP.md`;
  await post('/api/documents/comment',{path,text:'Say who it is calm for.',anchor:'calm workbench'});
  await page.reload();await page.locator('#work-tab').click();
  await page.locator('.pw-mark').first().click();
  const thread=page.locator('.pw-thread').first();await thread.waitFor();
  const layout=await thread.evaluate(element=>{const block=[...document.querySelectorAll('#document-editor .pw-block')].find(row=>row.textContent.includes('calm workbench')),text=block.querySelector('.block-content').getBoundingClientRect(),box=element.getBoundingClientRect(),who=element.querySelector('.pw-thread__who').getBoundingClientRect(),editor=document.querySelector('#document-editor .pw-block').getBoundingClientRect();return {inside:block.contains(element),below:box.top>=text.bottom-1,indent:Math.round(box.left-text.left),width:Math.round(box.right-editor.right),whoHeight:Math.round(who.height)};});
  assert.equal(layout.inside,false,'thread is not inside the block row');
  assert.equal(layout.below,true,'thread starts below the passage');
  assert.equal(layout.indent,24,'thread is indented 24px like Final');
  assert.ok(Math.abs(layout.width)<=1,'thread reaches the column edge');
  assert.ok(layout.whoHeight<=20,'author and time stay on one line');

  // 104: Work view chrome is the Work board's: tabs + Saved, ruler without file commands, path in the status bar.
  await page.locator('#work-tab').click();
  const ruler=page.locator('#document-toolbar');
  for(const name of ['Add Block','Reload','Move to Trash…'])assert.equal(await ruler.getByRole('button',{name,exact:true}).count(),0,name+' is a File menu command, not a ruler button');
  assert.equal(await page.locator('.work-header').count(),0,'no agent-status strip in Work (the menu bar shows it)');
  assert.equal(await page.locator('#workspace-bar #save-status').isVisible(),true,'save status sits in the toolbar beside the view tabs');
  assert.equal(await page.locator('#workspace-bar #project-folder').isVisible(),false,'the folder path is Chat\'s');
  assert.equal(await page.locator('#document-path').textContent(),'ROADMAP.md','status bar shows the file path');
  assert.equal(await page.locator('#window-title').textContent(),'ROADMAP.md');
  assert.deepEqual(await ruler.locator('.pw-tools button').evaluateAll(items=>items.map(item=>item.getAttribute('aria-label'))),['Bulleted list','Task checkbox']);
  assert.equal(await page.locator('#block-style option[value=text]').textContent(),'Paragraph','Work board label');
  await page.locator('#menubar [aria-controls="menu-file"]').click();await page.locator('#menu-file [data-command="trash-page"]').click();
  await page.locator('#alert-message').filter({hasText:'Move “ROADMAP.md” to the Trash?'}).waitFor();await page.keyboard.press('Escape');

  // 103: Pi's reply renders its Markdown and hides the harness's reply marker.
  await page.locator('#chat-tab').click();
  await page.locator('#prompt').fill('Summarise the check. TEST_MARKDOWN');await page.locator('#send').click();
  const reply=page.locator('#messages .pw-msg:not(.pw-msg--user) .pw-msg__body--md').last();
  await reply.locator('h3').waitFor({timeout:15000});
  assert.equal(await page.locator('#messages').evaluate(element=>element.textContent.includes('[CANARY]')),false,'the marker is not shown');
  assert.equal(await reply.locator('h3').textContent(),'Result');
  assert.equal(await reply.locator('strong').first().textContent(),'verified');
  assert.equal(await reply.locator('strong code').textContent(),'ROADMAP.md','code inside bold is code');
  assert.equal(await reply.locator('code').first().textContent(),'hello.py');
  assert.equal(await reply.locator('ol>li').count(),2);
  assert.equal(await reply.locator('input.pw-check').isChecked(),true);
  assert.equal(await reply.evaluate(element=>element.innerHTML.includes('**')),false,'no raw Markdown marks');

  assert.deepEqual(errors,[]);
  console.log('Design checks passed.');
 }finally{await browser?.close();server.kill();fs.rmSync(directory,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exit(1);});
