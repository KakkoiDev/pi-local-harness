// Design conformance checks for the 2026-10-13 UI review (tasks 100-110).
// Run like chat.cjs: NODE_PATH=/path/to/node_modules node tests/browser/design.cjs
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const assert = require('node:assert/strict');
const readline = require('node:readline');
// Task 263: screenshots go to a folder of this run, never fixed /tmp paths another run may be writing.
const SHOTS=fs.mkdtempSync(join(tmpdir(),'plh-shots-')),shot=name=>join(SHOTS,name);
process.on('exit',()=>console.log(`Screenshots: ${SHOTS}`));
(async()=>{
 const directory=fs.realpathSync(fs.mkdtempSync(join(tmpdir(),'pi-design-')));
 const python=execFileSync('which',['python3'],{encoding:'utf8'}).trim();
 const fake=join(directory,'pi');
 fs.writeFileSync(fake,`#!${python}\n`+fs.readFileSync('tests/fixtures/fake-pi.py','utf8'));fs.chmodSync(fake,0o755);
 const server=spawn('python3',[join(process.env.PI_TEST_RUNTIME||'.','harness/services.py')],{env:{...Object.fromEntries(Object.entries(process.env).filter(([key])=>!/^PI_(HARNESS_|WEB_REMOTE_)/.test(key))) /* never the live harness or phone access */,PATH:directory+':'+process.env.PATH,PI_TAILSCALE:'false',PI_TRASH_DIR:join(directory,'Trash'),PI_GATE_PORT:'0',PI_OLLAMA_URL:'http://127.0.0.1:9',PI_COLIBRI_URL:'http://127.0.0.1:9',PI_WEB_PORT:'0',PI_AGENT_DATA:join(directory,'workspace'),PI_WEB_DATA:join(directory,'data'),PI_HARNESS_LOG_FILE:join(directory,'audit.log')},stdio:['ignore','pipe','pipe']});
 let browser;
 try{
  const lines=readline.createInterface({input:server.stdout});
  const ports=await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('Server startup timeout')),10000);lines.once('line',line=>{clearTimeout(timeout);resolve(JSON.parse(line));});server.once('exit',code=>reject(new Error('Server exited '+code)));});
  const base=`http://127.0.0.1:${ports.web}`;
  browser=await chromium.launch({headless:true,args:['--use-mock-keychain', '--password-store=basic','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream'],/* a fake microphone for dictation */...(process.env.PI_TEST_CHROME?{executablePath:process.env.PI_TEST_CHROME}:{})});
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];let updateFixture={state:'current',checked:1};await page.route('**/api/updates',async route=>{if(route.request().method()==='POST'&&route.request().postDataJSON()?.action==='apply'){await new Promise(resolve=>setTimeout(resolve,200));await route.fulfill({json:{state:'updated',commit:'abc1234'}});}else await route.fulfill({json:updateFixture});});
  page.on('pageerror',e=>errors.push(e.message));
  // The server's stderr (its request log) must be read: an unread pipe fills up and the server stalls mid-request.
  const serverLog=[];server.stderr.on('data',chunk=>{serverLog.push(...String(chunk).split('\n').filter(line=>line&&!/" (200|304) -/.test(line)));serverLog.splice(0,Math.max(0,serverLog.length-40));});
  process.on('exit',code=>{if(code)console.log('Page errors:',JSON.stringify(errors),'\nLast console lines:\n'+consoleLines.slice(-15).join('\n'),'\nServer log (not 200/304):\n'+serverLog.join('\n'));});
  const consoleLines=[];page.on('console',message=>consoleLines.push(message.type()+': '+message.text()));
  await page.goto(base);
  const post=(path,body)=>page.evaluate(async([path,body])=>{const response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json','X-Pi-Person':document.querySelector('meta[name="pi-person"]')?.content||''},body:JSON.stringify(body)});const data=await response.json();if(!response.ok)throw new Error(data.error);return data;},[path,body]); /* task 261: as the person, with the page's secret */
  const created=await post('/api/projects/create',{name:'Design check',parent:directory});
  const root=join(directory,'design-check');
  await page.goto(base+'/?document='+encodeURIComponent(`projects/${created.project}/ROADMAP.md`));
  await page.locator('#work-tab.active').waitFor();await page.locator('#chat-tab').click();
  // Task 233: a marked plan uses the existing request row without falsely claiming no tests ran.
  await page.evaluate(async()=>{
    const {doneRow}=await import('/js/done-row.mjs');
    const row=doneRow('0123456789ab',{project:'fixture',api:async()=>({title:'Game (task 004, plan incomplete)',name:'Game',person:['Plan incomplete (G-014): ROADMAP.md: write the Goal in one or two sentences.','Built the game.'],plan_incomplete:true,verified:false,files:[{path:'app.py',added:1,removed:0}],time:'14:20'}),ask:async()=>null,showPreview(){},send(){},changed(){}});
    row.id='plan-regression-row';document.querySelector('#messages').append(row);
  });
  const incompleteRow=page.locator('#plan-regression-row');await incompleteRow.locator('button').first().waitFor();
  assert.match(await incompleteRow.textContent(),/Plan incomplete \(G-014\)/);
  assert.doesNotMatch(await incompleteRow.textContent(),/Pi did not try it after the last change/);
  for(const width of [1440,1024,390]){await page.setViewportSize({width,height:900});await incompleteRow.scrollIntoViewIfNeeded();await page.screenshot({path:shot(`plh-233-plan-${width}.png`)});}
  await page.evaluate(async()=>{const {applyLanguage}=await import('/js/i18n.mjs');await applyLanguage('ja',{root:document.querySelector('#plan-regression-row')});});
  assert.match(await incompleteRow.textContent(),/計画が未完成です/);
  await incompleteRow.evaluate(row=>row.remove());await page.setViewportSize({width:1440,height:900});

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

  // 112: each block type looks like itself (quote, list markers, code), as .pw-doc styles them.
  fs.writeFileSync(join(root,'TYPES.md'),'# Types\n\n> A quoted line\n\n- First bullet\n- Second bullet\n\n1. One\n2. Two\n\n```\ncode here\n```\n');
  await page.goto(base+'/?document='+encodeURIComponent(`projects/${created.project}/TYPES.md`));
  await page.locator('#document-editor .pw-block--quote').waitFor();
  const look=await page.evaluate(()=>{const style=selector=>getComputedStyle(document.querySelector(selector));const quote=style('#document-editor .pw-block--quote .pw-block__content'),code=style('#document-editor .pw-block--code .pw-block__content');
   return {quote:[quote.borderTopStyle,quote.fontStyle],bullets:[...document.querySelectorAll('#document-editor .pw-block--bullet .pw-block__marker')].map(item=>item.textContent),numbers:[...document.querySelectorAll('#document-editor .pw-block--number .pw-block__marker')].map(item=>item.textContent),
    text:document.querySelector('#document-editor .pw-block--bullet .pw-block__content').textContent,code:[code.borderTopStyle,code.fontFamily.includes('IBM Plex Mono')]};});
  assert.deepEqual(look,{quote:['dotted','italic'],bullets:['•','•'],numbers:['1.','2.'],text:'First bullet',code:['solid',true]});
  await page.goto(base);await page.locator('#work-tab').click();
  await page.getByRole('button',{name:'ROADMAP.md',exact:true}).click();await page.locator('#document-path').filter({hasText:'ROADMAP.md'}).waitFor();

  // 102: an open thread sits below its passage, as wide as the column minus the 24px indent.
  const path=`projects/${created.project}/ROADMAP.md`;
  await post('/api/documents/comment',{path,text:'Say who it is calm for.',anchor:'calm workbench'});
  await page.reload();await page.locator('#work-tab').click();
  await page.locator('.pw-mark').first().click();
  const thread=page.locator('.pw-thread').first();await thread.waitFor();
  const layout=await thread.evaluate(element=>{const block=[...document.querySelectorAll('#document-editor .pw-block')].find(row=>row.textContent.includes('calm workbench')),text=block.querySelector('.pw-block__content').getBoundingClientRect(),box=element.getBoundingClientRect(),who=element.querySelector('.pw-thread__who').getBoundingClientRect(),editor=document.querySelector('#document-editor .pw-block').getBoundingClientRect();return {inside:block.contains(element),below:box.top>=text.bottom-1,indent:Math.round(box.left-text.left),width:Math.round(box.right-editor.right),whoHeight:Math.round(who.height)};});
  assert.equal(layout.inside,false,'thread is not inside the block row');
  assert.equal(layout.below,true,'thread starts below the passage');
  assert.equal(layout.indent,0,'full column width, no indent (InlineThread card, re-synced task 126)');
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

  // 105: blocks are added Notion-style: from the handle, at the page end, with Return; the handle is reachable by hover.
  const blockCount=()=>page.locator('#document-editor>.pw-block').count();
  const firstPara=page.locator('#document-editor>.pw-block--paragraph').first();
  const textBox=await firstPara.locator('.pw-block__content').boundingBox();
  await page.mouse.move(textBox.x+20,textBox.y+textBox.height/2);
  const handle=firstPara.locator('.pw-block__handle');await handle.waitFor();
  const handleBox=await handle.boundingBox();
  for(let step=1;step<=8;step++){await page.mouse.move(textBox.x+20-(textBox.x+20-(handleBox.x+handleBox.width/2))*step/8,handleBox.y+handleBox.height/2);assert.equal(await handle.isVisible(),true,'handle stays while the pointer travels to it (step '+step+')');}
  await page.mouse.down();await page.mouse.up();
  await page.locator('#block-menu').waitFor();
  const menuBox=await page.locator('#block-menu').boundingBox();
  assert.ok(Math.abs(menuBox.x-handleBox.x)<=4&&menuBox.y>=handleBox.y,'menu opens at its handle');
  assert.equal(await page.locator('#block-menu [data-action="add"]').textContent(),'Add Block Below');
  assert.equal(await page.locator('#block-menu [data-action="delete"]').textContent(),'Delete Paragraph');
  const before=await blockCount();
  await page.locator('#block-menu [data-action="add"]').click();
  assert.equal(await blockCount(),before+1);
  const added=page.locator('#document-editor>.pw-block').nth(await firstPara.evaluate(row=>[...row.parentElement.querySelectorAll(':scope>.pw-block')].indexOf(row))+1);
  assert.equal(await added.locator('.pw-block__content').evaluate(element=>element===document.activeElement),true,'the new block has the caret');
  await page.keyboard.type('Typed into the new block');
  assert.equal(await added.locator('.pw-block__content').textContent(),'Typed into the new block');
  await page.keyboard.press('Enter');
  assert.equal(await blockCount(),before+2,'Return at the end starts a block');
  await page.keyboard.press('Backspace');
  assert.equal(await blockCount(),before+1,'Backspace in an empty block removes it');
  assert.equal(await added.locator('.pw-block__content').evaluate(element=>element===document.activeElement),true,'the caret returns to the block above');
  const checkRow=page.locator('#document-editor>.pw-block--task').first();
  await checkRow.locator('.pw-block__content').hover();await checkRow.locator('.pw-block__handle').click();
  assert.equal(await page.locator('#block-menu [data-action="delete"]').textContent(),'Delete Task','labels name the block type');
  await page.locator('#block-menu [data-action="delete"]').click();
  await page.locator('#toast').filter({hasText:'Task deleted'}).waitFor();
  const afterDelete=await blockCount();await page.locator('#toast-undo').click();
  assert.equal(await blockCount(),afterDelete+1,'Undo brings the block back');
  const last=await page.locator('#document-editor>.pw-block').last().boundingBox(),body=await page.locator('#work-panel .pw-window__body').boundingBox();
  assert.ok(body.y+body.height-(last.y+last.height)>40,'there is room below the last block');
  const total=await blockCount();
  await page.mouse.click(last.x+60,Math.min(body.y+body.height-12,last.y+last.height+30));
  assert.equal(await blockCount(),total+1,'clicking below the last block adds one');
  assert.equal(await page.locator('#document-editor>.pw-block').last().locator('.pw-block__content').evaluate(element=>element===document.activeElement),true);
  await page.mouse.click(last.x+60,Math.min(body.y+body.height-12,last.y+last.height+60));
  assert.equal(await blockCount(),total+1,'an empty last block is reused, not stacked');
  await page.keyboard.press('Backspace');

  // 109: New File… names the real file; New Task… numbers it and adds it to the roadmap.
  await page.locator('#menubar [aria-controls="menu-file"]').click();
  assert.equal((await page.locator('#menu-file [data-command="new-file"]').textContent()).replace('⌃⌥N',''),'New File…');/* round 12: ⌃⌥N */
  await page.locator('#menu-file [data-command="new-file"]').click();
  await page.locator('#name-dialog-input').fill('notes');
  assert.equal(await page.locator('#name-dialog-help').textContent(),'Creates “notes.md” in Design check and opens it. Any name works; .md is added when there is no extension, and “specs/phone.md” creates the folder too.');
  await page.locator('#name-dialog-input').fill('tools/check.py');
  assert.equal(await page.locator('#name-dialog-help').textContent(),'Creates “tools/check.py” in Design check and opens it. Any name works; .md is added when there is no extension, and “specs/phone.md” creates the folder too.');
  await page.keyboard.press('Enter');await page.locator('#document-path').filter({hasText:'tools/check.py'}).waitFor();
  assert.equal(fs.existsSync(join(root,'tools/check.py')),true,'a real file in the project folder');
  await page.locator('#menubar [aria-controls="menu-file"]').click();await page.locator('#menu-file [data-command="new-task"]').click();
  await page.locator('#name-dialog-input').fill('Phone layouts');
  assert.equal(await page.locator('#name-dialog-help').textContent(),'Creates “tasks/003-phone-layouts.md” in Design check, adds it to ROADMAP.md, and opens it.');
  await page.keyboard.press('Enter');await page.locator('#document-path').filter({hasText:'tasks/003-phone-layouts.md'}).waitFor();
  assert.match(fs.readFileSync(join(root,'ROADMAP.md'),'utf8'),/- \[ \] \[003-Phone layouts\]\(tasks\/003-phone-layouts\.md\)\n- \[ \] \[Ready to publish\]\(tasks\/002-ready-to-publish\.md\)\n$/);

  // 108: comments reach Pi from the Review list, one at a time or all unsent at once; the whole-file request is separate and folded.
  await post('/api/documents/comment',{path,text:'Name the reader.',anchor:'Design check'});
  await page.reload();await page.locator('#work-tab').click();
  await page.getByRole('button',{name:'ROADMAP.md',exact:true}).click();await page.locator('#document-path').filter({hasText:'ROADMAP.md'}).waitFor();
  const review=page.locator('#document-comments');
  await review.locator('.pw-review-item').nth(1).waitFor();
  assert.equal(await review.getByRole('button',{name:'Ask Pi',exact:true}).count(),2,'each unsent comment offers Ask Pi');
  assert.equal(await page.locator('#send-unsent').textContent(),'Send 2 Unsent Comments to Pi');
  await review.getByRole('button',{name:'Ask Pi',exact:true}).first().click();
  await page.locator('#send-unsent').filter({hasText:'Send 1 Unsent Comment to Pi'}).waitFor();
  assert.equal(await review.getByText(/Sent to Pi|Waiting in queue|Pi is working on it|Pi answered/).count()>=1,true);
  await page.locator('#send-unsent').click();
  await page.locator('#send-unsent').filter({hasText:'No unsent comments'}).waitFor();
  assert.equal(await page.locator('#send-unsent').isDisabled(),true);
  // 115: comment requests run on their own; the chat shows none of them, live or finished.
  await page.locator('#prompt').evaluate(()=>{});await page.locator('#chat-tab').click();
  await page.waitForFunction(()=>!document.querySelector('#messages [data-live]'));
  assert.equal(await page.locator('#messages').evaluate(element=>/Name the reader|Say who it is calm for|Comment:/.test(element.textContent)),false,'the chat holds only chat');
  // 135 (round 4): a thread is one conversation in order; Add Note keeps a reply with the file, Ask Pi sends the thread with what you typed; answers are appended.
  await page.locator('#work-tab').click();
  const mark=page.locator('.pw-mark').first();await mark.click();const answered=page.locator('.pw-thread').first();
  await answered.getByText('Pi answered',{exact:false}).waitFor({timeout:20000});
  assert.equal(await answered.locator('.pw-thread__help').textContent(),'Add Note keeps your reply with the file. Ask Pi sends the thread with what you typed.');
  const ask=answered.getByRole('button',{name:'Ask Pi',exact:true});assert.equal(await ask.evaluate(button=>button.classList.contains('pw-btn--default')),false);
  await answered.locator('input').fill('And one more thing?');assert.equal(await ask.evaluate(button=>button.classList.contains('pw-btn--default')),true,'Ask Pi is the default once there is text');
  await ask.click(); // a follow-up: the thread with what you typed
  await page.waitForFunction(()=>[...document.querySelectorAll('.pw-thread .pw-thread__who b')].filter(b=>b.textContent==='Pi').length===2,null,{timeout:20000});
  assert.deepEqual(await page.locator('.pw-thread').first().locator('.pw-thread__who b').allTextContents(),['You','Pi','You','Pi'],'messages read in order');
  assert.match(await page.locator('.pw-thread').first().locator('.pw-thread__msg').nth(2).textContent(),/And one more thing\?/);
  // A reply saved while nothing was sent (older builds, or an API reply) counts as unsent and goes with Send N Unsent.
  const first=(await page.evaluate(p=>fetch('/api/document?path='+encodeURIComponent(p)).then(r=>r.json()),path)).comments.find(c=>c.chat_id);
  await post('/api/documents/reply',{path,id:first.id,text:'Saved, not sent'});await page.reload();await page.locator('#work-tab').click();
  await page.locator('#send-unsent').filter({hasText:'Send 1 Unsent Comment to Pi'}).waitFor();await page.locator('#send-unsent').click();
  await page.locator('#send-unsent').filter({hasText:'No unsent comments'}).waitFor();
  await page.locator('#work-tab').click();
  assert.equal(await page.locator('#document-discussion>summary').textContent(),'Ask Pi about this whole file');
  assert.equal(await page.locator('#document-prompt').isVisible(),false,'folded until opened');
  await page.locator('#document-discussion>summary').click();assert.equal(await page.locator('#document-prompt').isVisible(),true);

  // 121: the Enter that confirms Japanese (IME) input never sends or splits; Safari reports it as keyCode 229 with isComposing false.
  await page.locator('#chat-tab').click();
  const sentBefore=await page.locator('#messages .pw-msg--user').count();
  await page.locator('#prompt').fill('漢字');
  await page.locator('#prompt').evaluate(element=>element.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',keyCode:229,bubbles:true,cancelable:true})));
  await page.waitForTimeout(500);
  assert.equal(await page.locator('#messages .pw-msg--user').count(),sentBefore,'confirming a kanji does not send');assert.equal(await page.locator('#prompt').inputValue(),'漢字');
  await page.locator('#prompt').fill('');
  await page.locator('#work-tab').click();
  const blocksBefore=await page.locator('#document-editor>.pw-block').count();
  await page.locator('#document-editor>.pw-block--paragraph .pw-block__content').first().evaluate(element=>{element.focus();element.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',keyCode:229,bubbles:true,cancelable:true}));});
  assert.equal(await page.locator('#document-editor>.pw-block').count(),blocksBefore,'confirming a kanji does not split the block');

  await page.locator('#menubar [aria-controls="menu-file"]').click();await page.locator('#menu-file [data-command="new-file"]').click();
  await page.locator('#name-dialog-input').fill('メモ');
  // A script-made Enter never submits a form, so check the guard itself: the confirming Enter is cancelled, a plain one is not.
  assert.deepEqual(await page.locator('#name-dialog-input').evaluate(element=>[229,13].map(keyCode=>{const event=new KeyboardEvent('keydown',{key:'Enter',keyCode,bubbles:true,cancelable:true});element.dispatchEvent(event);return event.defaultPrevented;})),[true,false]);
  await page.keyboard.press('Escape');

  // 113: an open Reasoning panel stays open while reasoning streams in, and after the reply finishes.
  await page.locator('#chat-tab').click();
  await page.locator('#prompt').fill('Think it over. TEST_THINK');await page.locator('#send').click();
  const live=page.locator('#messages .pw-msg:not(.pw-msg--user)').last().locator('details:not(.pw-decisions)');
  await live.locator('summary').waitFor();await live.locator('summary').click();
  await page.waitForFunction(()=>(document.querySelector('#messages .pw-msg:not(.pw-msg--user):last-of-type details')?.textContent||'').includes('Thinking step 3'));
  assert.equal(await page.locator('#messages .pw-msg:not(.pw-msg--user)').last().locator('details:not(.pw-decisions)').evaluate(element=>element.open),true,'still open after new reasoning');
  await page.locator('#messages').getByText(/reply \d+/).last().waitFor({timeout:15000});
  assert.equal(await page.locator('#messages .pw-msg:not(.pw-msg--user)').last().locator('details:not(.pw-decisions)').evaluate(element=>element.open),true,'still open on the finished reply');
  // 125: reasoning renders its Markdown and wraps inside its box, also at phone width.
  const reasoning=page.locator('#messages .pw-msg:not(.pw-msg--user)').last().locator('details:not(.pw-decisions)');
  assert.equal(await reasoning.locator('strong').first().textContent(),'Plan');
  await page.setViewportSize({width:390,height:844});
  assert.equal(await reasoning.evaluate(element=>[...element.querySelectorAll('*')].every(child=>child.scrollWidth<=element.clientWidth+1)),true,'nothing wider than the box');
  await page.setViewportSize({width:1440,height:900});

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
  // 143: tables render as tables and scroll inside their box on a phone.
  assert.deepEqual(await reply.locator('table th').evaluateAll(cells=>cells.map(cell=>cell.textContent)),['If you are…','Action','A very long example column that should scroll on a phone']);
  assert.equal(await reply.locator('table td strong').textContent(),'Looking');
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.querySelector('#thread').scrollWidth<=document.querySelector('#thread').clientWidth+1),true,'a wide table does not widen the page');
  // Round 11 adds a 44 px phase row to task 144’s quarter-screen phone composer.
  await page.locator('#prompt').fill('one\ntwo\nthree\nfour\nfive\nsix');await page.locator('#prompt').dispatchEvent('input');
  assert.ok((await page.locator('#composer').boundingBox()).height<=844/4+44,'composer height '+(await page.locator('#composer').boundingBox()).height);
  await page.locator('#prompt').fill('');await page.setViewportSize({width:1440,height:900});

  // 97: Files window = Plan above Files (ListGroup), titled with the project, as the Work board.
  fs.writeFileSync(join(root,'tasks/003-finished.md'),'# Finished\n\n- [x] a\n- [x] b\n');
  fs.writeFileSync(join(root,'tasks/004-stuck.md'),'# Stuck\n\n- [ ] a\n- [~] Blocked: waiting\n');
  const id=created.project;
  { // Round 11: the shared phase control, keyboard, saved state and phone sheet.
  await page.goto(`${base}/p/${id}/chat`);
  await page.locator('#phase-button').waitFor();/* the app loads by a dynamic import, after the load event */
  assert.equal(await page.locator('#phase-button').count(),1,'the phase control exists');
  await page.locator('#phase-button').filter({hasText:'Discussion'}).waitFor();
  await page.route('**/api/phase',route=>route.fulfill({status:503,json:{error:'fixture save failure'}}));
  await page.locator('#phase-button').focus();await page.keyboard.press('ArrowDown');
  const phases=page.locator('#phase-menu [role=menuitemradio]');
  await page.screenshot({path:shot('plh-247-phase-desktop.png')});
  assert.equal(await phases.count(),3);assert.equal(await phases.nth(2).getAttribute('aria-disabled'),'true');
  await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
  await page.locator('#phase-error').waitFor();
  assert.match(await page.locator('#phase-error').textContent(),/project stays in Discussion/);
  await page.unroute('**/api/phase');await page.locator('#phase-error').getByRole('button',{name:'Try Again'}).click();
  await page.locator('#phase-button').filter({hasText:'Planning'}).waitFor();
  await page.waitForFunction(()=>document.getElementById('phase-button').getAttribute('aria-busy')!=='true');
  assert.equal(await page.locator('#prompt').getAttribute('placeholder'),'Describe the task to plan, or answer Pi');
  await page.reload();await page.locator('#phase-button').filter({hasText:'Planning'}).waitFor();
  await page.keyboard.press('Control+Alt+KeyD');await page.locator('#phase-button').filter({hasText:'Discussion'}).waitFor({timeout:2000});
  await page.waitForFunction(()=>document.getElementById('phase-button').getAttribute('aria-busy')!=='true');
  await page.keyboard.press('Control+Alt+KeyP');await page.locator('#phase-button').filter({hasText:'Planning'}).waitFor({timeout:2000});
  await page.waitForFunction(()=>document.getElementById('phase-button').getAttribute('aria-busy')!=='true');
  await page.setViewportSize({width:1024,height:900});await page.locator('#phase-button').click();await page.locator('#phase-menu').waitFor();await page.screenshot({path:shot('plh-247-phase-tablet.png')});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.keyboard.press('Escape');
  await page.setViewportSize({width:390,height:844});await page.locator('#phase-button').click();
  const sheet=page.getByRole('dialog',{name:'Phase',exact:true});await sheet.waitFor();
  assert.ok((await sheet.locator('.pw-option').first().boundingBox()).height>=64);
  await page.screenshot({path:shot('plh-247-phase-phone.png')});
  await sheet.getByLabel('Discussion',{exact:true}).click();
  await page.locator('#phase-button').filter({hasText:'Discussion'}).waitFor();
  assert.equal(await sheet.count(),0);await page.setViewportSize({width:1440,height:900});
  }
  await page.goto(`${base}/p/${id}/work/ROADMAP.md`);
  await page.locator('#document-path').filter({hasText:'ROADMAP.md'}).waitFor();
  assert.equal(await page.locator('#files-title').textContent(),'Design check','Files window title is the project');
  const plan=page.locator('.pw-group[data-group="plan"]'),other=page.locator('.pw-group[data-group="files"]');
  assert.equal(await plan.locator('.pw-group__toggle').textContent(),'Plan4 open');
  assert.deepEqual(await plan.locator('.pw-group__body>.pw-row').evaluateAll(rows=>rows.map(row=>[row.querySelector('.pw-row__label').textContent,row.querySelector('.pw-row__meta')?.textContent||''])),
   [['ROADMAP.md','1/4'],['004-stuck','Blocked'],['003-phone-layouts','0/3'],['002-ready-to-publish','0/6'],['001-first-task','0/3'],['Done','1 task']]);
  const done=plan.locator('.pw-row--summary');assert.equal(await done.getAttribute('aria-expanded'),'false');
  await done.click();assert.equal(await plan.locator('.pw-row--nested .pw-row__label').first().textContent(),'003-finished');
  assert.deepEqual(await other.locator('.pw-group__body>.pw-row .pw-row__label').evaluateAll(rows=>rows.map(row=>row.textContent)),['tools','TYPES.md'],'folders first, then files; plan files are not repeated');
  assert.equal(await other.locator('.pw-row', {hasText:'tools'}).first().getAttribute('aria-expanded'),'false','folders start collapsed');
  await other.locator('.pw-row',{hasText:'tools'}).first().click();
  assert.equal(await other.locator('.pw-row--nested .pw-row__label').textContent(),'check.py');
  await plan.locator('.pw-group__action').click();assert.equal(await page.locator('#name-dialog-title').textContent(),'New Task');await page.keyboard.press('Escape');
  await other.locator('.pw-group__action').click();assert.equal(await page.locator('#name-dialog-title').textContent(),'New File');await page.keyboard.press('Escape');
  await plan.locator('.pw-group__toggle').click();assert.equal(await plan.locator('.pw-group__body').isHidden(),true);
  await page.reload();
  await page.locator('#document-path').filter({hasText:'ROADMAP.md'}).waitFor();
  assert.equal(await page.locator('.pw-group[data-group="plan"] .pw-group__body').isHidden(),true,'collapse is remembered per project');
  await page.locator('.pw-group[data-group="plan"] .pw-group__toggle').click();
  await page.locator('#file-search').fill('check');
  assert.deepEqual(await page.locator('#file-tree .pw-row__label').evaluateAll(rows=>rows.map(row=>row.textContent)),['tools/check.py']);
  assert.equal(await page.locator('#file-search-note').textContent(),'1 match for “check” in both groups. Esc clears.');
  await page.locator('#file-search').press('Escape');assert.equal(await page.locator('#file-search').inputValue(),'');
  await page.locator('.pw-group[data-group="plan"] .pw-group__toggle').focus();await page.keyboard.press('ArrowDown');
  assert.equal(await page.evaluate(()=>document.activeElement.querySelector('.pw-row__label')?.textContent),'ROADMAP.md','one roving list: ↓ from the toggle reaches the first row');
  assert.equal(await page.locator('#file-tree [tabindex="0"]').count(),1,'one tab stop');

  // 107: the Projects home lists projects; choosing one shows what is inside; ‹ Projects goes back. Same in every view.
  const bare=join(directory,'Bare folder');fs.mkdirSync(bare);fs.writeFileSync(join(bare,'notes.txt'),'x');
  const registered=await post('/api/projects/register',{path:bare});
  await page.locator('#chat-tab').click();
  await page.locator('#show-projects').click();
  await page.waitForURL(base+'/projects');
  assert.equal(await page.locator('.window-projects').isVisible(),true);assert.equal(await page.locator('.window-files').isVisible(),false);
  await page.locator('#project-list .pw-row',{hasText:'Bare folder'}).click();
  await page.waitForURL(`${base}/p/${registered.project}/chat`);
  assert.equal(await page.locator('#files-title').textContent(),'Bare folder');assert.equal(await page.locator('.window-projects').isVisible(),false);
  // empty Plan: Create Roadmap
  assert.equal(await page.locator('.pw-group[data-group="plan"] .pw-group__empty').isVisible(),true);
  await page.getByRole('button',{name:'Create Roadmap',exact:true}).click();
  await page.locator('#document-path').filter({hasText:'ROADMAP.md'}).waitFor();
  assert.equal(fs.existsSync(join(bare,'tasks/001-first-task.md')),true);
  await page.waitForURL(`${base}/p/${registered.project}/work/ROADMAP.md`);

  // 106: views and files are in the path; Back and Forward restore them; a reload lands in the same place.
  await page.locator('#file-tree .pw-row',{hasText:'notes.txt'}).click();
  await page.waitForURL(`${base}/p/${registered.project}/work/notes.txt`);
  await page.keyboard.press('Control+Alt+Digit3');await page.waitForURL(`${base}/activity`);
  await page.goBack();await page.waitForURL(`${base}/p/${registered.project}/work/notes.txt`);
  assert.equal(await page.evaluate(()=>document.body.dataset.view),'work');assert.equal(await page.locator('#document-path').textContent(),'notes.txt');
  await page.goBack();await page.waitForURL(`${base}/p/${registered.project}/work/ROADMAP.md`);await page.locator('#document-path').filter({hasText:'ROADMAP.md'}).waitFor();
  await page.goForward();await page.locator('#document-path').filter({hasText:'notes.txt'}).waitFor();
  await page.goto(`${base}/p/${id}/work/TYPES.md`);await page.locator('#document-path').filter({hasText:'TYPES.md'}).waitFor().catch(async error=>{console.error('DIAGNOSTIC deep link (intermittent, task 150):',JSON.stringify(await page.evaluate(()=>({url:location.pathname,path:document.querySelector('#document-path').textContent,view:document.body.dataset.view,level:document.body.dataset.level,project:document.querySelector('#files-title').textContent,files:[...document.querySelectorAll('#file-tree .file-item')].map(row=>row.textContent).slice(0,8)}))),consoleLines.slice(-20).join('\n'));throw error;});
  assert.equal(await page.locator('#files-title').textContent(),'Design check');assert.equal(await page.evaluate(()=>document.body.dataset.view),'work');
  await page.goto(`${base}/?document=`+encodeURIComponent(`projects/${id}/TYPES.md`));await page.waitForURL(`${base}/p/${id}/work/TYPES.md`);
  await page.goto(base+'/');await page.waitForURL(url=>url.pathname!=='/');

  // 97 phone (Ph_Files): a Plan · N open | Files · N segmented control with its + beside it replaces the group headers.
  await page.setViewportSize({width:390,height:844});
  await page.goto(`${base}/p/${id}/work/ROADMAP.md`);await page.locator('#document-path').filter({hasText:'ROADMAP.md'}).waitFor({state:'attached'});
  await page.locator('#phone-back').click();
  const seg=page.locator('#file-seg');await seg.waitFor();
  assert.deepEqual(await seg.getByRole('radio').evaluateAll(items=>items.map(item=>[item.textContent,item.getAttribute('aria-checked')])),[['Plan · 4 open','true'],['Files · 2','false']]);
  assert.equal(await page.locator('.pw-group__head').first().isVisible(),false,'no group headers on phone');
  assert.equal(await page.locator('#file-seg-add').getAttribute('aria-label'),'New Task…');
  assert.equal(await page.locator('.pw-group[data-group="files"]').isVisible(),false);
  await seg.getByRole('radio',{name:'Files · 2'}).click();
  assert.equal(await page.locator('.pw-group[data-group="plan"]').isVisible(),false);assert.equal(await page.locator('#file-seg-add').getAttribute('aria-label'),'New File…');
  assert.equal(Math.round((await page.locator('#file-seg-add').boundingBox()).height),44);
  await page.locator('#file-search').fill('a');
  assert.match(await seg.getByRole('radio').first().textContent(),/^Plan · \d+$/,'search shows match counts on both segments');
  await page.locator('#file-search').fill('');await page.setViewportSize({width:1440,height:900});

  // 127: Activity and Gate have their own addresses, show the Projects home, and their close box goes back.
  await page.goto(`${base}/p/${id}/chat`);await page.locator('#chat-tab').waitFor();
  await page.goto(`${base}/activity`);await page.waitForFunction(()=>document.body.dataset.view==='activity');
  assert.equal(await page.evaluate(()=>getComputedStyle(document.getElementById('preview')).display),'none','round 7: the Preview is a project window; Activity and Gate are app windows');
  // Plan 198, the workbench in Japanese: Settings → Language; the interface is translated, names and content are not, and English comes back.
  await page.evaluate(()=>{localStorage.setItem('plh.language',JSON.stringify('ja'));});await page.goto(`${base}/p/${id}/chat`);
  await page.waitForFunction(()=>document.querySelector('#menubar [aria-controls="menu-file"]')?.textContent==='ファイル');
  assert.equal(await page.locator('#chat-tab').evaluate(tab=>tab.childNodes[0].nodeValue),'チャット');
  assert.equal(await page.locator('#prompt').getAttribute('placeholder'),'質問や相談、作りたいものを入力');
  assert.equal(await page.evaluate(()=>document.documentElement.lang),'ja');
  await page.evaluate(()=>{localStorage.setItem('plh.language',JSON.stringify('en'));});await page.goto(`${base}/p/${id}/chat`);
  await page.waitForFunction(()=>document.querySelector('#menubar [aria-controls="menu-file"]')?.textContent==='File');
  await page.goto(`${base}/activity`);await page.waitForFunction(()=>document.body.dataset.view==='activity');/* back where the next check starts */
  assert.equal(await page.evaluate(()=>document.body.dataset.level),'projects','app windows show the Projects home');
  await page.locator('#main-window>.pw-titlebar [data-command="close-window"]').click();
  await page.waitForURL(`${base}/p/${id}/chat`);
  await page.goto(`${base}/p/${id}/gate`);await page.waitForURL(`${base}/gate`);

  // 128: the project window has Chat | Work; Activity and Gate are app windows (C_ActivityDesk, C_GateDesk, Menus).
  await page.goto(`${base}/p/${id}/chat`);await page.locator('#chat-tab').waitFor();
  assert.deepEqual(await page.locator('#workspace-bar .view-tabs button').evaluateAll(items=>items.filter(item=>!item.hidden).map(item=>item.textContent)),['Chat⌃⌥1','Work⌃⌥2'],'round 7: Preview is a third segment only when the chat would drop under 480px (P_Narrow)');
  await page.locator('#menubar [aria-controls="menu-window"]').click();
  assert.deepEqual(await page.locator('#menu-window [role="menuitemradio"]').evaluateAll(items=>items.map(item=>item.textContent)),['Chat⌃⌥1','Work⌃⌥2','Activity · All Projects⌃⌥3','Gate · All Projects⌃⌥4']);/* round 12: one ⌃⌥ family */
  await page.locator('#menu-window [data-command="view-activity"]').click();await page.waitForURL(`${base}/activity`);
  assert.equal(await page.locator('#window-title').textContent(),'Activity · All Projects');
  assert.equal(await page.locator('#main-window>.pw-titlebar [data-command="close-window"]').getAttribute('aria-label'),'Close Activity and go back');
  assert.equal(await page.locator('#workspace-bar').isVisible(),false,'no project tabs in an app window');
  assert.match(await page.locator('#activity-panel .pw-infobar').textContent(),/One agent, one queue, first in first out\. Interrupted work is never repeated automatically\./);
  assert.equal(await page.locator('#activity-project option').first().textContent(),'All Projects');
  const projectLink=page.locator('#activity-list .pw-link').first();assert.equal(await projectLink.count(),1,'project names are links');
  assert.match(await page.locator('#activity-detail .activity-detail__actions .pw-btn').first().textContent(),/^(Open in Chat|Show Comment|Show in Review)$/,'one button back, named after the origin (task 157)');
  await page.locator('#menubar [aria-controls="menu-view"]').click();
  assert.equal(await page.locator('#menu-view [data-command="view-chat"]').count(),0,'round 4: Chat and Work live in Window, View is how you see the document');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Control+Alt+Digit4');await page.waitForURL(`${base}/gate`);
  assert.equal(await page.locator('#window-title').textContent(),'Gate · All Projects');
  assert.equal(await page.locator('#gate-panel .pw-infobar #gate-live').count(),1,'live status sits in the info bar');
  await page.locator('#main-window>.pw-titlebar [data-command="close-window"]').click();await page.waitForURL(new RegExp('/p/'));

  // 129: Gate rows name their project and source; the Project popup filters them.
  await page.goto(`${base}/p/${id}/chat`);await page.locator('#prompt').fill('Look around TEST_TOOL');await page.locator('#send').click();
  await page.goto(`${base}/gate`);const webRow=page.locator('#gate-events .gate-event').filter({hasText:'cat README.md'}).first();await webRow.waitFor({timeout:20000});
  assert.equal(await webRow.locator('.pw-link').textContent(),'Design check');assert.equal(await webRow.locator('span').last().textContent(),'Web');
  await page.locator('#gate-project').selectOption({label:'Bare folder'});await page.waitForFunction(()=>!document.querySelector('#gate-events .gate-event'));
  await page.locator('#gate-project').selectOption('all');

  // 130: the Projects window has a Projects group and an Agent section over every project (C_ProjectsWin).
  const stopAll=async()=>{const {jobs}=await page.evaluate(()=>fetch('/api/workspace').then(r=>r.json()));for(const job of jobs.filter(job=>job.status==='queued'))await post('/api/jobs/cancel',{id:job.id});for(const job of jobs.filter(job=>job.status==='running'))await post('/api/jobs/stop',{id:job.id});};
  await stopAll();await page.goto(`${base}/activity`);await page.waitForFunction(()=>document.querySelector('#agent-activity-meta').textContent==='Nothing running',null,{timeout:20000});
  await page.goto(`${base}/projects`);await page.locator('#agent-activity-meta').filter({hasText:'Nothing running'}).waitFor();
  assert.equal(await page.locator('#pg-agent .pw-group__count').textContent(),'All projects');
  assert.equal(await page.locator('#agent-activity-meta').textContent(),'Nothing running');
  assert.match(await page.locator('#agent-gate-meta').textContent(),/^\d+ checks? today$/,'no blocked check yet');
  await page.goto(`${base}/p/${id}/chat`);await page.locator('#prompt').fill('Wait here TEST_WAIT');await page.locator('#send').click();
  await page.locator('#prompt').fill('Then this');await page.locator('#send').click();
  await page.goto(`${base}/projects`);await page.waitForFunction(()=>document.querySelector('#agent-activity-meta').textContent==='1 running · 1 waiting');
  assert.equal(await page.locator('#project-list .pw-row',{hasText:'Design check'}).locator('.pw-row__meta').textContent(),'running');
  await stopAll();
  await page.waitForFunction(()=>document.querySelector('#agent-activity-meta').textContent==='1 needs attention',null,{timeout:20000});
  assert.equal(await page.locator('#project-list .pw-row',{hasText:'Design check'}).locator('.pw-row__meta').textContent(),'failed');
  // Task 131: the status is a button; attention names the real state, is framed, and wins until Activity is opened.
  const status=page.locator('#agent-status');assert.equal(await status.textContent(),'Stopped · 1 needs attention');
  assert.equal(await status.evaluate(button=>button.classList.contains('pw-statusbtn--attention')),true);assert.equal(await status.getAttribute('aria-label'),'Agent status: Stopped · 1 needs attention. Open Activity');
  await status.click();await page.waitForURL(`${base}/activity`);
  await page.waitForFunction(()=>!document.querySelector('#agent-status').classList.contains('pw-statusbtn--attention'));
  await page.goto(`${base}/projects`);await page.locator('#agent-activity').waitFor();
  await page.locator('#agent-activity').click();await page.waitForURL(`${base}/activity`);
  assert.equal(await page.locator('#agent-activity').getAttribute('aria-current'),'page');
  assert.equal(await page.locator('#agent-activity-meta').textContent(),'Nothing running','opening Activity marks attention seen');
  // From Activity or Gate, Chat and Work (Window menu, ⌃⌥1/⌃⌥2) and the ‹ project link go back into the project.
  assert.equal(await page.locator('#activity-panel .app-back').textContent(),'‹ Design check');
  await page.locator('#menubar [aria-controls="menu-window"]').click();await page.locator('#menu-window [data-command="view-work"]').click();
  await page.waitForURL(new RegExp(`/p/${id}/work`));assert.equal(await page.evaluate(()=>document.body.dataset.level),'project');
  await page.goto(`${base}/gate`);await page.locator('#gate-panel .app-back').click();await page.waitForURL(new RegExp(`/p/${id}/`));

  // 146: select a file or folder in the Files window, then File › Rename or Move… or Move to Trash… (one button, no right-click).
  await post('/api/documents/create-file',{project:id,name:'drafts/idea.md'});
  const fileCommand=async command=>{await page.locator('#menubar [aria-controls="menu-file"]').click();await page.locator(`#menu-file [data-command="${command}"]`).click();};
  await page.goto(`${base}/p/${id}/work`);await page.locator('#file-tree .pw-row',{hasText:'drafts'}).waitFor();
  await page.locator('#file-tree .pw-row',{hasText:'drafts'}).click();await page.locator('#file-tree .pw-row',{hasText:'idea.md'}).click();await page.waitForURL(/drafts\/idea\.md$/);
  await fileCommand('rename-file');await page.waitForFunction(()=>document.querySelector('#name-dialog').open);
  assert.equal(await page.locator('#name-dialog-input').inputValue(),'drafts/idea.md','starts from the current path');
  assert.equal(await page.locator('#name-dialog-input').evaluate(input=>input.value.slice(input.selectionStart,input.selectionEnd)),'idea','the name is selected, not the extension');
  await page.locator('#name-dialog-input').fill('drafts/plan');assert.match(await page.locator('#name-dialog-help').textContent(),/Moves the file “drafts\/idea\.md” to “drafts\/plan\.md”\. Folders are created as needed\. Its comments move with it\./);
  assert.equal(await page.locator('#name-dialog-ok').textContent(),'Rename','same folder');
  await page.locator('#name-dialog-input').press('Enter');await page.waitForURL(/drafts\/plan\.md$/);
  assert.ok(fs.existsSync(join(root,'drafts/plan.md'))&&!fs.existsSync(join(root,'drafts/idea.md')),'renamed on disk, extension kept');
  await page.locator('#toast-undo').click();await page.waitForURL(/drafts\/idea\.md$/);assert.ok(fs.existsSync(join(root,'drafts/idea.md')),'Undo moves it back (task 154: file renames match project renames)');
  await fileCommand('rename-file');await page.waitForFunction(()=>document.querySelector('#name-dialog').open);await page.locator('#name-dialog-input').fill('drafts/plan');await page.locator('#name-dialog-input').press('Enter');await page.waitForURL(/drafts\/plan\.md$/);
  const folder=page.locator('#file-tree .pw-row',{hasText:'drafts'}).first();await folder.click();
  assert.equal(await folder.getAttribute('aria-current'),'true','a clicked folder is selected');
  await fileCommand('rename-file');await page.waitForFunction(()=>document.querySelector('#name-dialog').open);
  assert.equal(await page.locator('#name-dialog-input').inputValue(),'drafts','the command acts on the selected folder');
  await page.locator('#name-dialog-input').fill('archive/drafts');assert.equal(await page.locator('#name-dialog-ok').textContent(),'Move','another folder');await page.locator('#name-dialog-input').press('Enter');
  await page.waitForURL(/archive\/drafts\/plan\.md$/);assert.ok(fs.existsSync(join(root,'archive/drafts/plan.md')),'the folder moved, the open file followed');
  await page.locator('#file-tree .pw-row',{hasText:'archive'}).first().click();await fileCommand('trash-page');
  await page.waitForFunction(()=>document.querySelector('#alert-dialog').open);assert.match(await page.locator('#alert-dialog').textContent(),/Move the folder “archive” and its 1 file to the Trash\?/);
  await page.getByRole('button',{name:'Move to Trash',exact:true}).click();
  await page.waitForFunction(()=>![...document.querySelectorAll('#file-tree .pw-row')].some(row=>row.textContent.includes('archive')));assert.ok(!fs.existsSync(join(root,'archive')));

  // 147: the menu bar names the model and the thinking level; each opens a menu. Switching says when the new model is ready;
  // a model without thinking dims the thinking button and its items (disable, never hide). Ollama is faked here.
  await page.route('**/api/models',route=>route.fulfill({json:{models:[{id:'gemma4:26b-mlx',tools:true,thinking:true,vision:true},{id:'qwen3:8b',tools:true,thinking:false,vision:false},{id:'tiny:1b',tools:false,thinking:false,vision:false}],current:{model:'gemma4:26b-mlx',effort:'high',chosenEffort:'high',thinking:true}}}));
  await page.route('**/api/model',route=>new Promise(resolve=>setTimeout(()=>resolve(route.fulfill({json:{model:'qwen3:8b',effort:'off',chosenEffort:'high',thinking:false,vision:false}})),400)));
  await page.goto(`${base}/p/${id}/chat`);await page.locator('#effort-button').waitFor();
  assert.equal(await page.locator('#effort-button').textContent(),'High thinking');
  assert.deepEqual(await page.locator('#effort-menu [data-effort]').evaluateAll(items=>items.map(item=>item.textContent)),['Off','Low','Medium','High'],'task 177: the four levels Ollama knows');
  await page.locator('#effort-button').click();await page.locator('#effort-menu [data-effort="low"]').click();
  await page.locator('#effort-button',{hasText:'Low thinking'}).waitFor();assert.match(await page.locator('#toast-text').textContent(),/Thinking set to low\. Pi uses it from the next request\./);
  assert.equal(JSON.parse(fs.readFileSync(join(directory,'workspace','model.json'),'utf8')).effort,'low','kept for the next request');
  { const widths=[];for(let i=0;i<3;i++){await page.locator('#effort-button').click();await page.locator('#effort-menu').waitFor();widths.push(Math.round((await page.locator('#effort-menu').boundingBox()).width));await page.keyboard.press('Escape');}
    assert.equal(new Set(widths).size,1,'the thinking menu keeps its width: '+widths); } // audit: it grew on every open
  await page.locator('#model-button').click();await page.locator('#model-menu [data-model="qwen3:8b"]').waitFor();
  assert.equal(await page.locator('#model-menu [data-model="tiny:1b"]').getAttribute('aria-disabled'),'true','a model without tools cannot be chosen');
  assert.deepEqual(await page.locator('#model-menu .pw-menu__key').allTextContents(),['tools · thinks · sees · parallel unknown','tools · no thinking · parallel unknown','no tools']);/* task 326: tools only for models that call them */assert.equal(await page.locator('#model-menu [role="note"]').textContent(),'Parallel tested: up to two requests in separate projects, with verified serving settings and enough memory. Unknown, failed or serial checks run one at a time. Each chat keeps its own history.');
  await page.locator('#model-menu [data-model="qwen3:8b"]').click();
  assert.match(await page.locator('#model-button').textContent(),/Loading qwen3:8b…/);
  await page.locator('#model',{hasText:/^qwen3:8b$/}).waitFor();assert.match(await page.locator('#toast-text').textContent(),/qwen3:8b is ready\./);
  assert.equal(await page.locator('#effort-button').getAttribute('aria-disabled'),'true');assert.equal(await page.locator('#effort-button').textContent(),'No thinking');
  assert.equal(await page.locator('#effort-note').textContent(),'qwen3:8b does not think. Choose a model that thinks to set a level.','a note, not a disabled item');
  await page.unroute('**/api/models');await page.unroute('**/api/model');fs.rmSync(join(directory,'workspace','model.json'));

  // Messages sent while Pi works join the chat's waiting message: one request, not many.
  await page.goto(`${base}/p/${id}/chat`);await page.locator('#prompt').fill('Hold on TEST_WAIT');await page.locator('#send').click();
  await page.waitForFunction(()=>document.querySelector('#send').textContent==='Queue');
  for(const text of ['First follow-up','Second follow-up']){await page.locator('#prompt').fill(text);await page.locator('#send').click();await page.waitForFunction(()=>!document.querySelector('#prompt').value);}
  assert.match(await page.locator('#toast-text').textContent(),/Added to your waiting message/);
  const waitingJobs=(await page.evaluate(()=>fetch('/api/workspace').then(r=>r.json()))).jobs.filter(job=>job.status==='queued'&&!job.document);
  assert.deepEqual(waitingJobs.map(job=>job.message),['First follow-up\n\nSecond follow-up']);
  await stopAll();

  // From Activity or Gate, a project row opens that project's Chat at once; a file then opens in Work.
  await page.goto(`${base}/activity`);await page.locator('#project-list .pw-row',{hasText:'Design check'}).click();
  await page.waitForURL(`${base}/p/${id}/chat`);assert.equal(await page.evaluate(()=>document.body.dataset.level),'project');
  await page.goto(`${base}/gate`);await page.locator('#project-list .pw-row',{hasText:'Design check'}).click();await page.waitForURL(`${base}/p/${id}/chat`);
  await page.getByRole('button',{name:'ROADMAP.md',exact:true}).click();await page.waitForURL(/\/work\/ROADMAP\.md$/);

  // Selection › Ask Pi… shows the question box (folded in Review) with the passage quoted and the cursor after it.
  await page.goto(`${base}/p/${id}/work/ROADMAP.md`);const passage=page.locator('#document-editor .pw-block').filter({hasText:'calm workbench'}).locator('[contenteditable]').first();await passage.waitFor();
  if(await page.evaluate(()=>document.body.dataset.review)==='open')await page.locator('#toggle-review').click(); // Review hidden: Ask Pi must show it
  await passage.evaluate(element=>{const range=document.createRange();range.selectNodeContents(element);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);document.dispatchEvent(new Event('selectionchange'));});
  await page.locator('#selection-bar-ask').waitFor();await page.locator('#selection-bar-ask').click();
  assert.equal(await page.locator('#document-prompt').isVisible(),true,'the question box is shown');assert.match(await page.locator('#document-prompt').inputValue(),/^About “/);
  assert.equal(await page.evaluate(()=>document.activeElement.id),'document-prompt');

  // Clicking a comment in Review opens its thread under the passage, scrolled into view, with focus.
  if(await page.evaluate(()=>document.body.dataset.review)==='closed')await page.locator('#toggle-review').click();
  await page.locator('#document-comments .pw-review-item .pw-review-item__quote').first().click();
  await page.waitForFunction(()=>document.activeElement?.classList.contains('pw-thread'));
  assert.equal(await page.locator('#document-editor .pw-thread').evaluate(box=>{const r=box.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0;}),true,'the thread is on screen');

  // Audit (task 150): Undo after deleting a block never writes into another document.
  await page.goto(`${base}/p/${id}/work/ROADMAP.md`);const firstText=page.locator('#document-editor .pw-block').filter({hasText:'calm workbench'}).first();await firstText.waitFor();
  await firstText.hover();await firstText.locator('.pw-block__handle').click();await page.locator('#block-menu [data-action="delete"]').click();
  await page.locator('#toast-undo').waitFor();await page.getByRole('button',{name:'ROADMAP.md',exact:true}).waitFor();
  const otherTask=page.locator('#file-tree .file-item').filter({hasNotText:'ROADMAP.md'}).first();await otherTask.click();await page.waitForFunction(()=>!location.pathname.endsWith('ROADMAP.md'));
  const otherPath=await page.evaluate(()=>location.pathname);await page.locator('#toast-undo').click();
  await page.waitForTimeout(900);assert.equal(fs.readFileSync(join(root,decodeURIComponent(otherPath.split('/work/')[1])),'utf8').includes('calm workbench'),false,'not inserted into the other document');

  // Audit (task 150): a registered folder that is gone is listed as missing and can be removed from the list.
  const gone=join(directory,'Gone folder');fs.mkdirSync(gone);await post('/api/projects/register',{path:gone});fs.rmSync(gone,{recursive:true});
  await page.goto(`${base}/projects`);const missing=page.locator('#project-list .pw-row',{hasText:'Gone'});await missing.waitFor();
  assert.match(await missing.textContent(),/folder missing/);await missing.click();
  await page.locator('#missing-remove').click();/* task 154: it opens with a line offering Locate Folder… and Remove from List… */await page.locator('#alert-default').click();await missing.waitFor({state:'detached'});

  // Audit (task 150): the folder browser lists real rows (icon and name, full height) and the path field gets the room (Add Existing Folder…).
  await page.goto(`${base}/projects`);await page.locator('#add-folder').click();await page.locator('#folder-list .pw-row').first().waitFor();
  const folderRows=await page.locator('#folder-list .pw-row').evaluateAll(rows=>rows.slice(0,3).map(row=>({height:Math.round(row.getBoundingClientRect().height),icon:Boolean(row.querySelector('svg')),label:row.querySelector('.pw-row__label')?.textContent})));
  assert.ok(folderRows.every(row=>row.height>=28&&row.icon&&row.label),'folder rows: '+JSON.stringify(folderRows));
  assert.ok((await page.locator('#folder-path').boundingBox()).width>=240,'the path field is not squeezed');
  assert.match(await page.locator('#folder-help').textContent(),/^Registers the folder in place\. Nothing is moved or created\.$/);
  await page.locator('#folder-cancel').click();
  // Round 12 (R12_NP1, ProjectStart): New Project is four steps in an 860 × 760 dialog; step 1 keeps the way out to an empty folder.
  await page.locator('#new-project').click();await page.locator('#start-dialog').waitFor();
  const startBox=await page.locator('#start-dialog').boundingBox();assert.ok(Math.round(startBox.width)===860&&Math.round(startBox.height)===760,'860 × 760: '+JSON.stringify(startBox));
  assert.deepEqual(await page.locator('#start-steps li').allTextContents(),['1 · Name','2 · Capabilities','3 · Packages','4 · Summary']);
  assert.equal(await page.locator('#start-steps li[aria-current="step"]').textContent(),'1 · Name');
  assert.match(await page.locator('#start-where').textContent(),/^Create in /);assert.equal(await page.locator('#start-empty').textContent(),'Start from an empty folder instead');
  assert.deepEqual([await page.locator('#start-back').isVisible(),await page.locator('#start-cancel').isVisible(),await page.locator('#start-next').textContent()],[false,true,'Next'],'step 1: Cancel · Next');
  await page.locator('#start-name').fill('Shop');await page.locator('#start-next').click();await page.waitForFunction(()=>document.querySelector('#start-steps [aria-current="step"]')?.textContent==='2 · Capabilities');
  assert.equal(await page.locator('#start-steps li').first().getAttribute('data-done'),'','a finished step is ticked');
  assert.deepEqual([await page.locator('#start-back').isVisible(),await page.locator('#start-cancel').isVisible()],[true,false],'Back · status · Next');
  await page.locator('#start-back').click();await page.locator('#start-cancel').click();await page.locator('#start-dialog').waitFor({state:'hidden'});

  // Audit (task 150): at tablet width Activity keeps the request readable (Source and Started move to the detail).
  await page.setViewportSize({width:1024,height:768});await page.goto(`${base}/activity`);await page.locator('#activity-list .pw-table__row').first().waitFor();
  assert.ok(await page.locator('#activity-list .activity-request').first().evaluate(cell=>cell.getBoundingClientRect().width)>=150,'the Request column has room');
  await page.setViewportSize({width:1440,height:900});

  { // Audit (task 150): ⌘Return in another text field never sends the hidden chat draft.
  await page.goto(`${base}/p/${id}/chat`);await page.locator('#prompt').fill('Hidden draft TEST_WAIT');
  const before=(await page.evaluate(()=>fetch('/api/workspace').then(r=>r.json()))).jobs.length;
  await page.locator('#work-tab').click();await page.locator('#document-discussion>summary').click();await page.locator('#document-prompt').fill('A question about this file');
  await page.locator('#document-prompt').press('ControlOrMeta+Enter');await page.waitForTimeout(600);
  const after=(await page.evaluate(()=>fetch('/api/workspace').then(r=>r.json()))).jobs;
  assert.equal(after.some(job=>job.message==='Hidden draft TEST_WAIT'),false,'the chat draft was not sent');assert.ok(after.length<=before+1);
  await stopAll();await page.goto(`${base}/p/${id}/chat`);await page.locator('#prompt').fill('');
  }
  { // Audit (task 150): Gate rows are a grid; Arrow keys move between checks.
  await page.goto(`${base}/p/${id}/chat`);await page.locator('#prompt').fill('Once more TEST_TOOL');await page.locator('#send').click();
  await page.waitForFunction(async()=>(await fetch('/api/gate').then(r=>r.json())).events.length>=2,null,{timeout:20000,polling:500});
  await page.goto(`${base}/gate`);await page.locator('#gate-filter').selectOption('all');await page.locator('#gate-events .gate-event').nth(1).waitFor();
  assert.equal(await page.locator('#gate-events').getAttribute('role'),'grid');
  await page.locator('#gate-events .gate-event[tabindex="0"]').focus();const first=await page.evaluate(()=>document.activeElement.textContent);
  await page.keyboard.press('ArrowDown');await page.waitForFunction(text=>document.activeElement?.classList.contains('gate-event')&&document.activeElement.textContent!==text,first);
  assert.equal(await page.evaluate(()=>document.activeElement.getAttribute('aria-current')),'true','the focused check is the selected one');
  }

  { // Audit (task 150): on a phone, Gate and Activity rows are two lines (Ph_Gate, Ph_Activity): decision/state first, then the command/request.
  await page.setViewportSize({width:390,height:844});await page.goto(`${base}/gate`);await page.evaluate(()=>{const filter=document.querySelector('#gate-filter');filter.value='all';filter.dispatchEvent(new Event('change'));});/* a segmented control on phones */
  const row=page.locator('#gate-events .gate-event').first();await row.waitFor();
  const box=await row.boundingBox(),command=row.locator('.pw-table__cell--mono');
  assert.ok(box.height>=60,'two lines: '+box.height);assert.equal(await command.isVisible(),true,'the command shows');
  assert.ok((await command.boundingBox()).y>box.y+20,'the command is on the second line');
  assert.equal(await page.locator('#gate-events .pw-table__head').isVisible(),false);
  await page.setViewportSize({width:1440,height:900});
  }

  { // Audit (task 150): Review's filter is a radio group: Arrow keys choose.
  await page.goto(`${base}/p/${id}/work/ROADMAP.md`);if(await page.evaluate(()=>document.body.dataset.review)==='closed')await page.locator('#toggle-review').click();
  await page.locator('#document-comments .pw-review-item').first().waitFor();/* Review rendered */await page.locator('#comment-filter [data-filter="open"]').press('ArrowRight');
  await page.waitForFunction(()=>document.querySelector('#comment-filter [aria-checked="true"]').dataset.filter==='resolved');
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.filter),'resolved');await page.locator('#comment-filter [data-filter="resolved"]').press('ArrowLeft');
  }

  { // Voice input in comments: Dictate records, the Mac transcribes (answered here), the text lands at the cursor.
  await page.route('**/api/transcribe',route=>route.fulfill({json:{text:'spoken words'}}));
  await page.goto(`${base}/p/${id}/work/ROADMAP.md`);if(await page.evaluate(()=>document.body.dataset.review)==='closed')await page.locator('#toggle-review').click();
  await page.locator('#document-discussion>summary').click();const dictate=page.locator('#document-prompt-form .dictate');
  assert.equal(await dictate.getAttribute('aria-label'),'Dictate');await dictate.click();
  await page.waitForFunction(()=>document.querySelector('#document-prompt-form .dictate').getAttribute('aria-pressed')==='true');
  assert.equal(await dictate.getAttribute('aria-label'),'Stop dictating');await page.waitForTimeout(1200);await dictate.click();
  await page.waitForFunction(()=>document.querySelector('#document-prompt').value.includes('spoken words'));
  assert.equal(await page.locator('#comment-form .dictate').count(),1,'the comment composer has one too');
  await page.unroute('**/api/transcribe');await page.locator('#document-prompt').fill('');
  }

  { // Task 140: blocks follow the DocumentBlock card: pw-block--{type}, pw-block__content, placeholders, handle labels, the page tail.
  await page.goto(`${base}/p/${id}/work/ROADMAP.md`);await page.locator('#document-editor .pw-block').first().waitFor();
  const types=await page.locator('#document-editor>.pw-block').evaluateAll(rows=>rows.map(row=>[...row.classList].find(name=>name.startsWith('pw-block--')&&name!=='pw-block--focused'&&name!=='pw-block--empty')));
  assert.ok(types.every(Boolean)&&types.includes('pw-block--heading')&&types.includes('pw-block--paragraph'),'card types: '+types);
  assert.equal(await page.locator('#document-editor .pw-block__content').count(),await page.locator('#document-editor>.pw-block').count());
  assert.match(await page.locator('#document-editor .pw-block--heading .pw-block__handle').first().getAttribute('aria-label'),/^Heading options$/);
  assert.equal(await page.locator('#document-editor>.pw-doc__tail').count(),1,'the page tail takes the click below the last block');
  await page.locator('#document-editor>.pw-doc__tail').click();const fresh=page.locator('#document-editor>.pw-block').last();
  await page.waitForFunction(()=>[...document.querySelectorAll('#document-editor>.pw-block')].at(-1)?.classList.contains('pw-block--empty'));
  assert.equal(await fresh.locator('.pw-block__content').getAttribute('data-placeholder'),'Write, or choose a style in the ruler');
  assert.equal(await fresh.evaluate(row=>getComputedStyle(row.querySelector('.pw-block__content'),'::before').content),'"Write, or choose a style in the ruler"','the placeholder shows');
  await page.keyboard.press('Escape');
  }

  { // Review shows where a comment is with Pi, live, like the thread: "Pi is working on it" while its request runs.
  await page.goto(`${base}/p/${id}/work/ROADMAP.md`);if(await page.evaluate(()=>document.body.dataset.review)==='closed')await page.locator('#toggle-review').click();
  await post('/api/documents/comment',{path:`projects/${created.project}/ROADMAP.md`,text:'Take your time TEST_SLOW',anchor:'Open item'});
  await page.reload();const item=page.locator('#document-comments .pw-review-item').filter({hasText:'TEST_SLOW'});await item.waitFor();
  await item.getByRole('button',{name:'Ask Pi',exact:true}).click();
  await item.locator('.pw-review-item__head').filter({hasText:'Pi is working on it'}).waitFor({timeout:20000});
  assert.equal(await item.locator('.pw-review-item__head svg').count(),1,'with its glyph');
  await stopAll();
  }

  // 123: the phone follows the phone boards.
  await page.setViewportSize({width:390,height:844});
  await page.goto(`${base}/projects`);await page.locator('#open-menu').waitFor();
  await page.locator('#open-menu').click();await page.locator('#project-list .pw-row',{hasText:'Design check'}).click();
  await page.waitForURL(new RegExp(`/p/${id}/`),{timeout:5000});
  assert.equal(await page.evaluate(()=>document.body.dataset.level),'project','a project chosen in the π sheet is entered');
  await page.goto(`${base}/p/${id}/work/ROADMAP.md`);await page.locator('#phone-comments').waitFor();
  await page.locator('#phone-comments').click();
  const sheet=page.locator('#comments-panel');
  assert.ok(await sheet.locator('.pw-review-item').count()>0||await sheet.locator('.pw-empty').isVisible(),'the Comments sheet shows its list');
  assert.ok((await sheet.locator('.pw-review-item').first().boundingBox())?.height>20,'review items are laid out');
  await sheet.getByRole('button',{name:'Close',exact:true}).click();
  await sheet.waitFor({state:'hidden'});
  // Phone bar on a document (PhoneEdit1/6): ‹ Files, the name, Comments N; the status shows elsewhere.
  assert.equal(await page.locator('#phone-back').isVisible(),true);assert.equal(await page.locator('#phone-title-text').textContent(),'ROADMAP.md');
  assert.equal(await page.locator('#phone-view').isVisible(),true,'round 8 (Ph8_Doc): the phone bar stays');assert.equal(await page.locator('#phone-comments').isVisible(),true,'Comments is always there');assert.equal(await page.locator('#phone-more').isVisible(),true,'⋯ for the file');assert.equal(await page.locator('#document-toolbar').isVisible(),false,'no desk ruler');
  // Editing shows the bottom bar; Done hides it.
  await page.locator('#document-editor>.pw-block--paragraph .pw-block__content').first().click();
  await page.locator('#phone-edit-bar').waitFor();assert.equal(await page.locator('#phone-block-style').inputValue(),'text');
  await page.locator('#phone-edit-done').click();await page.locator('#phone-edit-bar').waitFor({state:'hidden'});
  // Block handle sheet (PhoneEdit5): title, six types in a grid, Cancel.
  await page.locator('#document-editor>.pw-block--paragraph .pw-block__content').first().click();await page.locator('.pw-block--focused .pw-block__handle').click();
  assert.equal(await page.locator('#block-menu-title').textContent(),'Paragraph');
  assert.deepEqual(await page.locator('#turn-into-menu>.pw-menu__item:visible').evaluateAll(items=>items.map(item=>({text:item.innerText.trim(),box:item.getBoundingClientRect()})).sort((a,b)=>a.box.top-b.box.top||a.box.left-b.box.left).map(item=>item.text)),['Paragraph','Heading','Task','Bullet','Number','Quote','Code','Raw Markdown'],'PhoneEdit5 order (Table not built yet)');
  const sheetBox=await page.locator('#block-menu').boundingBox();assert.ok(Math.round(sheetBox.y+sheetBox.height)===844&&Math.round(sheetBox.width)===390,'a bottom sheet');
  await page.locator('#block-menu [data-action="cancel"]').click();await page.locator('#block-menu').waitFor({state:'hidden'});
  // Phone bar elsewhere shows the agent status; the π sheet is Ph_Pi; the composer is one row.
  await page.goto(`${base}/p/${id}/chat`);await page.locator('#phone-status').filter({hasText:/Ready|Working|waiting|needs? attention/}).waitFor();
  assert.equal(await page.locator('#hint').isVisible(),false);assert.equal(await page.locator('.composer-wrap .footnote').isVisible(),false);
  assert.equal(new Set(await page.locator('.pw-composer__row>*').evaluateAll(items=>items.filter(item=>item.getClientRects().length&&item.offsetHeight).map(item=>Math.round(item.getBoundingClientRect().top)))).size,1,'composer controls in one row');
  await page.locator('#open-menu').click();
  assert.equal(await page.locator('#sidebar .sheet-head__title').textContent(),'π Pi WorkStation');assert.equal(await page.locator('#sidebar>.pw-titlebar').isVisible(),false);
  assert.equal(await page.locator('#pi-status').isVisible(),false,'Ph_Pi: no status strip');
  // Round 8 point 2 (Ph8_Pi): Model and Thinking in the π sheet; Model opens its own sheet with ‹ π.
  assert.equal(await page.locator('#pi-model').isVisible(),true);assert.ok((await page.locator('#pi-model-meta').textContent()).length>0,'the model name');
  assert.match(await page.locator('#pi-thinking-meta').textContent(),/^(No thinking|Off|Low|Medium|High|Minimal|Extra high|Max)$/);
  await page.locator('#pi-model').click();await page.locator('#model-sheet').waitFor();assert.equal(await page.locator('#model-sheet-title').textContent(),'Model');
  await page.locator('#model-sheet').waitFor({state:'hidden'}).catch(()=>page.locator('#model-sheet-back').click());/* no Ollama in the test: the sheet closes with an error */
  if(await page.locator('#model-sheet').isVisible())await page.locator('#model-sheet-back').click();
  await page.locator('#error').evaluate(element=>element.hidden=true).catch(()=>{});
  if(!(await page.locator('#sidebar').isVisible()))await page.locator('#open-menu').click();assert.equal(await page.locator('#agent-activity').isVisible(),true,'the Agent section shows the state');await page.locator('#pi-close').click();
  { // Task 132: view popup (Ph_Views), detail bar (Ph_ActivityDetail), dialogs as sheets, the bullet tool (PhoneEdit1).
  await page.locator('#phone-view').click();
  const menuItems=()=>page.locator('#phone-view-menu>*').evaluateAll(items=>items.filter(item=>!item.hidden).map(item=>item.getAttribute('role')==='separator'?'—':item.firstChild.textContent.trim()));
  assert.deepEqual(await menuItems(),['Chat','Work','Preview'],'round 8 (Ph8_ChatMenu): the views; Activity and Gate are in the π sheet');
  await page.locator('#phone-view-menu [data-view="preview"]').click();await page.waitForFunction(()=>document.body.dataset.view==='preview');
  await page.locator('#phone-view').click();
  assert.deepEqual(await menuItems(),['Chat','Work','Preview','—','App language','English','日本語','—','Reload','Open App'],'Ph8_PreviewMenu: the view\'s commands follow');
  assert.equal(await page.locator('.pw-preview__foot').getByRole('button',{name:/^(Stop|Start)$/}).count(),1,'Ph8_Preview: Stop / Start in the foot');
  await page.keyboard.press('Escape');
  await page.locator('#open-menu').click();await page.locator('#agent-activity').click();await page.waitForFunction(()=>document.body.dataset.view==='activity');
  assert.equal(await page.locator('#phone-view-label').textContent(),'Activity · all');
  await page.locator('#activity-list .activity-task').first().click();await page.waitForFunction(()=>document.body.dataset.pane==='detail');
  assert.equal(await page.locator('#phone-view').isVisible(),false,'only the back button');assert.equal(await page.locator('#detail-back-label').textContent(),'Activity · all');
  assert.match(await page.locator('#activity-detail .activity-detail__actions .pw-btn').first().innerText(),/^(Open in Chat|Show Comment|Show in Review)$/);
  await page.locator('#detail-back').click();
  await page.locator('#open-menu').click();await page.locator('#new-project').click();await page.locator('#start-dialog').waitFor();
  assert.equal(await page.evaluate(()=>document.body.classList.contains('menu-open')),false,'the π sheet closes for a dialog');
  const sheet=await page.locator('#start-dialog').boundingBox();assert.ok(Math.round(sheet.y)===0&&Math.round(sheet.height)>=840&&Math.round(sheet.width)===390,'Ph12_NP: one full-screen page per step: '+JSON.stringify(sheet));
  assert.match(await page.locator('#start-dialog .pw-start__bar').innerText(),/Cancel\s+Name\s+1 of 4/);
  await page.locator('#start-dialog .pw-start__bar button').click();await page.locator('#start-dialog').waitFor({state:'hidden'});
  await page.goto(`${base}/p/${id}/work/ROADMAP.md`);await page.locator('#document-editor .pw-block--paragraph .pw-block__content').first().click();
  await page.locator('#phone-tool-bullet').waitFor();await page.locator('#phone-tool-bullet').click();
  await page.waitForFunction(()=>document.querySelector('#document-editor .pw-block--focused')?.classList.contains('pw-block--bullet'));
  await page.locator('#phone-tool-bullet').click();await page.locator('#phone-edit-done').click();
  }
  { // Task 124: the phone Comment sheet (PhoneEdit3) and the thread as a sheet (PhoneEdit4).
  await page.goto(`${base}/p/${id}/work/ROADMAP.md`);const passage=page.locator('#document-editor .pw-block--paragraph .pw-block__content').first();await passage.waitFor();
  await passage.evaluate(element=>{const range=document.createRange();range.selectNodeContents(element);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);document.dispatchEvent(new Event('selectionchange'));});
  await page.locator('#selection-bar-comment').waitFor();await page.locator('#selection-bar-comment').click();
  const compose=page.locator('#selected-passage');await compose.waitFor();
  assert.equal(await page.locator('.compose-head .sheet-head__title').textContent(),'Comment');assert.equal(await page.locator('label[for="comment-text"]').innerText(),'Your comment');
  assert.equal(await page.locator('#document-comments').isVisible(),false,'only the composer while writing');
  assert.equal((await page.locator('#add-ask').boundingBox()).height>=44,true);
  await page.locator('#compose-cancel').click();await compose.waitFor({state:'hidden'});
  // Round 8 point 6 (Ph8_Ask): Ask Pi… opens its own sheet, never the Comment composer; Ask sends a question, no comment.
  await passage.evaluate(element=>{const range=document.createRange();range.selectNodeContents(element);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);document.dispatchEvent(new Event('selectionchange'));});
  await page.locator('#selection-bar-ask').waitFor();await page.locator('#selection-bar-ask').click();
  const askSheet=page.locator('#ask-dialog');await askSheet.waitFor();
  assert.equal(await page.locator('#selected-passage').isVisible(),false,'not the Comment composer');
  assert.match(await page.locator('#ask-quote').textContent(),/^“.+”$/);assert.equal(await page.locator('#ask-text').getAttribute('placeholder'),'Ask about this passage…');
  assert.equal(await page.locator('#ask-send').isDisabled(),true,'Ask needs a question');
  const commentsBefore=await page.locator('#document-comments .pw-review-item').count();
  await page.locator('#ask-text').fill('Is this clear?');await page.locator('#ask-send').click();await askSheet.waitFor({state:'hidden'});
  assert.equal(await page.locator('#document-comments .pw-review-item').count(),commentsBefore,'nothing is saved as a comment');
  await page.locator('#document-editor .pw-mark').first().click();const sheet=page.locator('#document-editor .pw-thread');await sheet.waitFor();
  assert.match(await sheet.locator('.thread-head .sheet-head__title').textContent(),/^Comment \d+ of \d+$/);
  const box=await sheet.boundingBox();assert.ok(Math.round(box.y+box.height)>=840&&Math.round(box.width)===390,'a bottom sheet: '+JSON.stringify(box));
  await sheet.getByRole('button',{name:'Close',exact:true}).click();await sheet.waitFor({state:'detached'});
  }
  { // Round 8 point 9 (Ph8_Doc): the phone bar hides on scroll down and comes back on scroll up; editing shows only the document bar.
  fs.writeFileSync(join(root,'LONG.md'),'# Long\n\n'+Array.from({length:60},(_,n)=>`Paragraph ${n} of a long file.`).join('\n\n')+'\n');
  await page.goto(`${base}/p/${id}/work/LONG.md`);await page.locator('#phone-docbar').waitFor();
  const scroller=page.locator('#work-panel .pw-window__body');
  await scroller.evaluate(element=>{element.scrollTop=600;});await page.waitForFunction(()=>document.body.classList.contains('phonebar-away'));
  assert.equal(await page.locator('#phonebar').isVisible(),false,'scrolled down: only the document bar');assert.equal(await page.locator('#phone-docbar').isVisible(),true);
  await scroller.evaluate(element=>{element.scrollTop=300;});await page.waitForFunction(()=>!document.body.classList.contains('phonebar-away'));
  await page.locator('#document-editor .pw-block--paragraph .pw-block__content').first().click();await page.locator('#phone-edit-bar').waitFor();
  assert.equal(await page.locator('#phonebar').isVisible(),false,'editing: only the document bar');assert.equal(await page.locator('#phone-saved').isVisible(),true,'the save status while editing');
  await page.locator('#phone-edit-done').click();await page.locator('#phonebar').waitFor();
  }
  { // Round 8 points 3-5 (Ph8_Folder, Ph8_DocMore, Ph8_Source, Ph8_CommentsNone).
  fs.mkdirSync(join(root,'drafts'),{recursive:true});fs.writeFileSync(join(root,'drafts','idea.md'),'# Idea\n\nA phone-first review mode.\n');
  await page.goto(`${base}/p/${id}/work`);await page.locator('#file-seg:visible, #phone-docbar:visible').first().waitFor();
  if(await page.locator('#phone-back').isVisible())await page.locator('#phone-back').click();
  await page.locator('#file-seg').waitFor();
  await page.locator('#file-seg [role="radio"]').nth(1).click();await page.getByRole('button',{name:'drafts',exact:true}).click();
  await page.locator('#phone-docbar').waitFor();assert.equal(await page.locator('#phone-title-text').textContent(),'drafts','a folder opens as a level');
  assert.equal(await page.locator('#file-tree .pw-row').count(),1,'only the folder\'s rows');
  await page.locator('#phone-more').click();await page.locator('#folder-more').waitFor();assert.equal(await page.locator('#folder-more-title').textContent(),'drafts/');
  assert.equal(await page.locator('#folder-more-new').textContent(),'New File in drafts…');await page.locator('#folder-more-close').click();
  await page.getByRole('button',{name:'idea.md',exact:true}).click();await page.locator('#phone-title-text').filter({hasText:'idea.md'}).waitFor();
  await page.locator('#phone-more').click();await page.locator('#file-more').waitFor();assert.equal(await page.locator('#file-more-title').textContent(),'drafts/idea.md','the path is the title');
  assert.deepEqual(await page.locator('#file-more [data-file-more]').allTextContents(),['Rename or Move…','Copy Path','Ask Pi About This File…','View as Markdown','Reload from Disk','Download Draft…','Move to Trash…']);
  await page.locator('#file-more [data-file-more="markdown"]').click();await page.locator('#document-source').waitFor();
  assert.equal(await page.locator('#phonebar').isVisible(),false,'View as Markdown is full screen');assert.equal(await page.locator('#phone-source-done').isVisible(),true);
  assert.match(await page.locator('#document-source').inputValue(),/^# Idea/);
  await page.locator('#phone-source-done').click();await page.locator('#document-source').waitFor({state:'hidden'});
  await page.locator('#phone-comments').click();await page.locator('#comments-ask-file').waitFor();
  assert.equal(await page.locator('#document-comments .comments-none p').first().textContent(),'No open comments in idea.md.');
  await page.locator('#comments-ask-file').click();await page.locator('#ask-dialog').waitFor();assert.equal(await page.locator('#ask-file').isVisible(),true,'the whole file');
  await page.locator('#ask-cancel').click();
  await page.locator('#phone-back').click();assert.equal(await page.locator('#phone-title-text').textContent(),'drafts','back to the folder');
  await page.locator('#phone-back').click();await page.locator('#phone-docbar').waitFor({state:'hidden'});
  }
  { // Round 8 point 8: the status button lands on the running request's detail; ‹ goes to the list.
  await page.goto(`${base}/p/${id}/chat`);await page.locator('#prompt:not([disabled])').waitFor();
  await page.locator('#prompt').fill('Landing check TEST_WAIT');await page.locator('#send').click();
  for(let tries=0;tries<40;tries++){const {jobs}=await page.evaluate(()=>fetch('/api/workspace').then(r=>r.json()));if(jobs.some(job=>job.status==='running'))break;await page.waitForTimeout(250);}
  await page.waitForTimeout(800);/* the status button follows the next poll */await page.locator('#phone-status').click();
  await page.waitForFunction(()=>document.body.dataset.view==='activity'&&document.body.dataset.pane==='detail');
  assert.equal(await page.locator('#detail-back').isVisible(),true);await page.locator('#detail-back').click();
  await page.waitForFunction(()=>document.body.dataset.pane==='list');
  await stopAll();
  }
  { // Round 8 point 10 (Ph8_ChooseFolder), now Project Start's “Create in … ›” (R12_NP1): it opens the folder browser as its own step; New Folder… makes one.
  await page.goto(`${base}/p/${id}/chat`);await page.locator('#open-menu').waitFor();await page.locator('#open-menu').click();await page.locator('#new-project').click();await page.locator('#start-dialog').waitFor();
  await page.locator('#start-where').click();await page.locator('#folder-list').waitFor();assert.equal(await page.locator('#folder-name').isVisible(),false,'its own step');
  await page.evaluate(folder=>{document.getElementById('folder-path').value=folder;document.getElementById('folder-go').click();},directory);
  await page.locator('#folder-crumbs [aria-current]').filter({hasText:directory.split('/').pop()}).waitFor();
  assert.ok((await page.locator('#folder-list .pw-row').first().boundingBox()).height>=44,'44 px folder rows');
  await page.locator('#folder-new').click();await page.locator('#name-dialog-input').fill('Made here');await page.locator('#name-dialog-ok').click();
  await page.locator('#folder-crumbs [aria-current]').filter({hasText:'Made here'}).waitFor();assert.equal(fs.existsSync(join(directory,'Made here')),true,'New Folder… made it');
  assert.equal(await page.locator('#folder-choose').textContent(),'Choose “Made here”');await page.locator('#folder-choose').click();
  await page.locator('#folder-dialog').waitFor({state:'hidden'});assert.match(await page.locator('#start-where').textContent(),/^Create in .*Made here/);
  await page.locator('#start-dialog .pw-start__bar button').click();await page.locator('#start-dialog').waitFor({state:'hidden'});
  }
  { // Round 8 point 11 (Ph8_Details, Ph8_Toast, Ph8_Settings): 44 px targets, no ⌘ hints, the toast above the edit bar.
  await page.goto(`${base}/p/${id}/work/ROADMAP.md`);await page.locator('#phone-comments').waitFor();
  assert.equal(await page.locator('#toast-undo .pw-kbd').isVisible(),false,'no ⌘Z on the phone');
  await page.locator('#document-editor>.pw-block--paragraph .pw-block__content').first().click();await page.locator('#phone-edit-bar').waitFor();
  await page.evaluate(()=>{const toast=document.getElementById('toast');toast.hidden=false;document.getElementById('toast-text').textContent='Paragraph deleted.';});
  const toastBox=await page.locator('#toast').boundingBox(),barBox=await page.locator('#phone-edit-bar').boundingBox();
  assert.ok(toastBox.y+toastBox.height<=barBox.y+1,'the toast sits above the edit bar: '+JSON.stringify([toastBox,barBox]));
  await page.evaluate(()=>{document.getElementById('toast').hidden=true;});await page.locator('#phone-edit-done').click();
  await page.locator('#phone-comments').click();
  assert.ok((await page.locator('.review-footer .pw-label-row').boundingBox()).height>=44,'Show resolved is a 44 px row');
  await page.locator('#comments-panel').getByRole('button',{name:'Close',exact:true}).click();
  await page.goto(`${base}/p/${id}/chat`);await page.locator('#open-menu').waitFor();
  await page.locator('#open-menu').click();await page.locator('#pi-settings').click();await page.locator('#settings-dialog').waitFor();
  assert.equal(await page.locator('#settings-pattern').isVisible(),false,'no Desktop pattern on the phone');assert.equal(await page.locator('#settings-return').isVisible(),false);
  assert.equal(await page.locator('.settings-mac-note').isVisible(),true,'named, not silently absent');
  await page.locator('#settings-cancel').click();
  }
  await page.setViewportSize({width:1440,height:900});
  assert.equal(await page.locator('.sheet-head').first().isVisible(),false,'sheet heads are phone only');
  { // Task 134: "Pi sees:" (ContextLine) under the chat composer, the comment composer, an unsent thread and the whole-file box.
  await page.goto(`${base}/p/${id}/chat`);await page.locator('#prompt').fill('Read ROADMAP.md please');
  const seen=page.locator('#chat-context');await seen.locator('.pw-context__item').first().waitFor();
  assert.equal(await seen.locator('.pw-context__label').textContent(),'Pi sees:');
  assert.equal(await seen.locator('.pw-context__item').first().textContent(),'ROADMAP.md(plan)','the plan first in Chat');
  assert.equal(await seen.locator('a').first().getAttribute('href'),`/p/${id}/work/ROADMAP.md`);
  assert.match(await seen.innerText(),/\d+ open tasks?/);
  await page.waitForFunction(()=>new URLSearchParams(document.querySelector('#chat-context').dataset.query).get('text')==='Read ROADMAP.md please');
  const why=seen.locator('.pw-context__why');assert.equal(await why.count(),1,'task 234: selected files have a Why? control');
  await why.click();const reasons=page.locator('#ctx-why');await reasons.waitFor();
  assert.equal(await why.getAttribute('aria-expanded'),'true');
  assert.match(await reasons.locator('h3').textContent(),/^Why Pi sees these \d+ files$/);
  assert.ok(await reasons.locator('.pw-reasons__why').count()>0);
  assert.equal(await reasons.locator('li').first().locator('.pw-reasons__why').textContent(),'Always: the plan');
  assert.match(await reasons.locator('.pw-reasons__path').first().textContent(),/\/ROADMAP\.md$/,'the complete selected path');
  await page.screenshot({path:shot('plh-234-context-desktop.png')});
  await page.setViewportSize({width:1024,height:900});await why.click();await why.click();
  assert.ok(await page.locator('#ctx-why').evaluate(panel=>panel.getBoundingClientRect().right<=innerWidth),'fits the tablet width');
  await page.screenshot({path:shot('plh-234-context-tablet.png')});
  await page.keyboard.press('Escape');await reasons.waitFor({state:'detached'});assert.equal(await why.evaluate(button=>document.activeElement===button),true);
  await page.setViewportSize({width:390,height:844});await why.click();
  const reasonSheet=page.locator('.pw-sheet',{has:page.locator('#ctx-why')});await reasonSheet.waitFor();
  assert.match(await reasonSheet.locator('h2').textContent(),/^Pi sees these \d+ files$/);
  assert.ok(await why.evaluate(button=>button.getBoundingClientRect().height)>=44);
  const refreshed=page.waitForResponse(response=>response.url().includes('/api/context-preview?')&&response.status()===200);
  await page.evaluate(async project=>{const {showContext}=await import('/js/context-line.mjs');showContext(document.querySelector('#chat-context'),{project,text:document.querySelector('#prompt').value},{force:true,delay:0});},id);await refreshed;
  assert.ok(await reasonSheet.isVisible(),'an unchanged context refresh keeps the explanation open');
  await page.screenshot({path:shot('plh-234-context-phone.png')});
  await reasonSheet.getByRole('button',{name:'Done',exact:true}).click();assert.equal(await why.getAttribute('aria-expanded'),'false');
  await page.setViewportSize({width:1440,height:900});

  await seen.evaluate(line=>{line.parentElement.style.width='200px';});/* less room: the counter appears */await page.waitForFunction(()=>!document.querySelector('#chat-context .pw-context__more').hidden);
  const more=seen.locator('.pw-context__more');assert.match(await more.textContent(),/^\+\d+$/);assert.match(await more.getAttribute('aria-label'),/^Show \d+ more$/);
  await more.click();assert.equal(await more.textContent(),'Less');assert.equal(await seen.getAttribute('data-expanded'),'');assert.equal(await more.getAttribute('aria-expanded'),'true');
  assert.equal(await seen.locator('.pw-context__item[hidden]').count(),0,'expanded shows every item');
  await more.click();await seen.evaluate(line=>{line.parentElement.style.width='';});
  await seen.locator('a').first().click();await page.waitForURL(`${base}/p/${id}/work/ROADMAP.md`);await page.locator('#document-editor .pw-block').first().waitFor();
  assert.equal(await page.locator('#document-editor .pw-block__handle').first().evaluate(handle=>getComputedStyle(handle).cursor),'pointer','task 155: the handle shows the hand');
  const passage=page.locator('#document-editor .pw-block--paragraph .pw-block__content').first();
  await passage.evaluate(element=>{const range=document.createRange();range.selectNodeContents(element);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);document.dispatchEvent(new Event('selectionchange'));});
  await page.locator('#selection-bar-comment').click();const composer=page.locator('#comment-context');await composer.locator('.pw-context__item').first().waitFor();
  assert.equal(await composer.locator('.pw-context__item').first().textContent(),'ROADMAP.md(this file)','comments: the current file first');
  await page.locator('#clear-anchor').click();
  await page.locator('#document-discussion>summary').click();assert.equal(await page.locator('#document-context .pw-context__item').first().textContent(),'ROADMAP.md(this file)');
  await post('/api/documents/comment',{path:`projects/${id}/ROADMAP.md`,text:'Unsent context check',anchor:await passage.textContent()});
  await page.reload();const thread=page.locator('#document-comments .pw-review-item',{hasText:'Unsent context check'});await thread.locator('.pw-review-item__head').click();
  const inThread=page.locator('.pw-thread .pw-thread__actions > .pw-context').first();await inThread.locator('.pw-context__item').first().waitFor();
  assert.equal(await inThread.locator('.pw-context__item').first().textContent(),'ROADMAP.md(this file)','an unsent thread says what Pi would get');
  const empty=join(directory,'Empty folder');fs.mkdirSync(empty);const added=await post('/api/projects/register',{path:empty});
  await page.goto(`${base}/p/${added.project}/chat`);await page.locator('#prompt').fill('Hello');
  await page.waitForFunction(()=>document.querySelector('#chat-context').textContent==='Pi sees: nothing from this project');
  // 2026-10-14: the line is evaluated again after every exchange: files Pi made while answering show without typing.
  await page.locator('#prompt').fill('');await page.waitForFunction(()=>document.querySelector('#chat-context').textContent==='Pi sees: nothing from this project');
  fs.writeFileSync(join(empty,'ROADMAP.md'),'# Plan\n\n- [ ] First\n');
  const answered=async()=>page.waitForFunction(()=>fetch('/api/workspace').then(r=>r.json()).then(data=>!data.jobs.some(job=>['queued','running'].includes(job.status))),null,{polling:300,timeout:20000});
  await post('/api/jobs/create',{project:added.project,message:'Make a plan'});await answered();
  await page.waitForFunction(()=>/ROADMAP\.md\(plan\)/.test(document.querySelector('#chat-context').textContent),null,{timeout:10000});
  }

  { // Task 135: a comment waiting behind another request reads as sent, with Show in Activity; the composer help; whole-file requests as cards.
  await stopAll();
  await page.goto(`${base}/p/${id}/work/ROADMAP.md`);const para=page.locator('#document-editor .pw-block--paragraph .pw-block__content').first();await para.waitFor();
  /* task 164: a comment waits behind another work request in its project (a chat no longer holds it back) */
  const busy=await post('/api/documents/comment',{path:`projects/${id}/ROADMAP.md`,text:'Keep busy TEST_SLOW',anchor:await para.textContent()});
  await post('/api/jobs/create',{project:id,message:'Comment',document_comment:{path:`projects/${id}/ROADMAP.md`,id:busy.id}});
  await page.waitForFunction(async()=>(await fetch('/api/workspace').then(r=>r.json())).jobs.some(job=>job.status==='running'),null,{polling:300,timeout:20000});
  await post('/api/documents/comment',{path:`projects/${id}/ROADMAP.md`,text:'Queued state check',anchor:await para.textContent()});
  await page.reload();const item=page.locator('#document-comments .pw-review-item',{hasText:'Queued state check'});await item.locator('.pw-review-item__head').click();
  const thread=()=>page.locator('.pw-thread',{hasText:'Queued state check'}).first();await thread().getByRole('button',{name:'Ask Pi',exact:true}).click();
  await thread().locator('.pw-thread__state').filter({hasText:'Sent to Pi · waiting in queue · can no longer be deleted'}).waitFor({timeout:10000});
  assert.equal(await thread().locator('.pw-link',{hasText:'Show in Activity'}).count(),1,'a sent, unanswered thread links to Activity');
  await item.locator('.pw-review-item__head').filter({hasText:'Waiting in queue'}).waitFor();
  assert.match(await page.locator('#comment-form').textContent(),/Comments stay with the file until you choose Ask Pi\./);
  await page.locator('#document-discussion>summary').click();await page.locator('#document-prompt').fill('Card check');await page.getByRole('button',{name:'Send Request'}).click();
  const card=page.locator('#document-requests .document-request',{hasText:'Card check'});await card.waitFor({state:'attached',timeout:10000});
  assert.equal(await card.locator('.pw-link',{hasText:'Show in Activity'}).count(),1,'a whole-file request is a card with one way into Activity');
  await stopAll();
  }
  { // Task 157: every "working" leads to its request in Activity, and its detail leads back where it came from.
  await stopAll();await page.goto(`${base}/p/${id}/chat`);await page.locator('#prompt').fill('Origin check TEST_WAIT');await page.locator('#send').click();
  const liveLink=page.locator('#messages [data-live] .live-activity');await liveLink.waitFor({timeout:20000});
  await liveLink.click();await page.waitForURL(`${base}/activity`);
  const detail=page.locator('#activity-detail');await detail.getByText('Origin check TEST_WAIT').first().waitFor();
  assert.match(await detail.locator('.activity-detail__facts').textContent(),/FromChat · Design check, your message at/);
  await stopAll();await page.waitForFunction(()=>document.querySelector('#activity-detail h3')?.textContent.includes('Stopped'),null,{timeout:20000});
  await page.goto(`${base}/p/${id}/chat`);await page.locator('#prompt:not([disabled])').waitFor();/* the page is wired: a click before that did nothing (the old 1-in-3 flake) */await page.locator('#agent-status').click();await page.waitForURL(`${base}/activity`);
  await page.locator('#activity-list .activity-task').filter({hasText:'Origin check'}).first().click();
  await detail.getByRole('link',{name:'Open in Chat'}).click();await page.waitForURL(`${base}/p/${id}/chat`);await page.locator('#messages .pw-msg--found').waitFor();
  const roadmap=`projects/${id}/ROADMAP.md`;await page.goto(`${base}/p/${id}/work/ROADMAP.md`);const para=page.locator('#document-editor .pw-block--paragraph .pw-block__content').first();await para.waitFor();
  const made=await post('/api/documents/comment',{path:roadmap,text:'Origin comment TEST_SLOW',anchor:await para.textContent()});
  await post('/api/jobs/create',{project:id,message:'Comment',document_comment:{path:roadmap,id:made.id}});
  await page.reload();const thread=page.locator('#document-comments .pw-review-item',{hasText:'Origin comment'});await thread.locator('.pw-review-item__head').click();
  const state=page.locator('.pw-thread',{hasText:'Origin comment'}).first().locator('.pw-thread__state');await state.filter({hasText:'Pi is working on it · Show in Activity'}).waitFor({timeout:20000});
  await state.locator('.pw-link').click();await page.waitForURL(`${base}/activity`);
  assert.match(await detail.locator('.activity-detail__facts').textContent(),/FromComment on ROADMAP\.md/);
  await detail.getByRole('link',{name:'Show Comment'}).click();await page.waitForURL(new RegExp(`/p/${id}/work/ROADMAP\\.md$`));
  await page.locator('.pw-thread',{hasText:'Origin comment'}).first().waitFor();
  await stopAll();
  await page.locator('#document-discussion>summary').click();await page.locator('#document-prompt').fill('Origin whole file');await page.getByRole('button',{name:'Send Request'}).click();
  const card=page.locator('#document-requests .document-request',{hasText:'Origin whole file'});await card.waitFor({state:'attached',timeout:20000});await page.locator('#document-request-history').evaluate(element=>{element.open=true;});await card.locator('.pw-link').click();await page.waitForURL(`${base}/activity`);
  await page.waitForFunction(()=>document.querySelector('#activity-detail details'),null,{timeout:20000});
  await detail.locator('details summary').click();await page.waitForTimeout(2600);/* a poll rebuilds the detail */
  assert.equal(await detail.locator('details').evaluate(element=>element.open),true,'Result stays open while the detail refreshes');
  await detail.getByRole('link',{name:'Show in Review'}).click();await page.waitForURL(new RegExp(`/p/${id}/work/ROADMAP\\.md$`));
  assert.equal(await page.locator('#document-discussion').evaluate(element=>element.open),true);
  await stopAll();
  }
  { // Task 136: "Also read:" after an answer lists files Pi opened beyond its context; nothing when there are none.
  await stopAll();const reads=await post('/api/projects/create',{name:'Reads',parent:directory});
  fs.writeFileSync(join(directory,'reads','unrelated.txt'),'Outside the selected context.');
  const old=new Date(Date.now()-7200e3);for(const file of ['ROADMAP.md','tasks/001-first-task.md'])fs.utimesSync(join(directory,'reads',file),old,old);/* not "changed in the last hour" */
  await page.goto(`${base}/p/${reads.project}/chat`);await page.locator('#prompt').fill('Look around TEST_READ');await page.locator('#send').click();
  const after=page.locator('#thread .pw-msg .pw-context--after').last();await after.waitFor({timeout:20000});
  assert.equal(await after.textContent(),'Also read:unrelated.txt(Pi opened it)');assert.equal(await after.locator('a').getAttribute('title'),'unrelated.txt');
  const count=await page.locator('#thread .pw-msg').count();await page.locator('#prompt').fill('Just answer');await page.locator('#send').click();
  await page.waitForFunction(n=>document.querySelectorAll('#thread .pw-msg').length>=n+2&&!document.querySelector('#thread .pw-msg:last-child')?.classList.contains('pw-msg--user'),count,{timeout:20000});
  assert.equal(await page.locator('#thread .pw-msg').last().locator('.pw-context--after').count(),0,'nothing when Pi read nothing more');
  await page.goto(`${base}/p/${reads.project}/work/ROADMAP.md`);await page.locator('#document-discussion>summary').click();await page.locator('#document-prompt').fill('Whole file TEST_READ');await page.getByRole('button',{name:'Send Request'}).click();
  await page.locator('#document-requests .document-request .pw-context--after').first().waitFor({state:'attached',timeout:20000});
  assert.equal(await page.locator('#document-requests .document-request .pw-context--after').first().textContent(),'Also read:unrelated.txt(Pi opened it)');
  }
  { // Round 5 (task 163): the model menu says what each model runs at once, and lists a chosen model that is gone.
  await page.route('**/api/models',route=>route.fulfill({json:{models:[{id:'gemma4:26b-mlx',tools:true,thinking:true,vision:true,at_once:'parallel'},{id:'qwen3:8b',tools:true,thinking:false,vision:false,at_once:'checking'},{id:'mistral:7b',tools:true,thinking:false,vision:false,at_once:'unknown'}],current:{model:'gemma4:26b-mlx',effort:'high',chosenEffort:'high',thinking:true,missing:'gone:7b'}}}));
  await page.goto(`${base}/p/${id}/chat`);await page.locator('#model-button').click();await page.locator('#model-menu [data-model]').first().waitFor();
  const keys=await page.locator('#model-menu .pw-menu__key').allTextContents();
  assert.match(keys[0],/ · parallel tested$/);assert.match(keys[1],/ · checking…$/);assert.match(keys[2],/ · parallel unknown$/,'unknown remains visible and serializes');
  const gone=page.locator('#model-menu .pw-menu__item',{hasText:'gone:7b'});assert.equal(await gone.getAttribute('aria-disabled'),'true');assert.equal(await gone.locator('.pw-menu__key').textContent(),'not installed');
  await page.keyboard.press('Escape');await page.unroute('**/api/models');
  }
  { // Task 141: Open on Phone when tailscale serve did not start (Dialogs2): the reason, the enable link, Copy Link, Done.
  await page.route('**/api/config',async route=>{const response=await route.fetch();const config=await response.json();await route.fulfill({response,json:{...config,phoneUrl:null,phoneError:'tailscale serve exited (1): Serve is not enabled on your tailnet. To enable, visit: https://login.tailscale.com/f/serve?node=abc',phoneEnable:'https://login.tailscale.com/f/serve?node=abc'}});});
  await page.goto(`${base}/p/${id}/chat`);await page.locator('#menubar [aria-controls="menu-pi"]').click();
  const phoneItem=page.locator('#menu-pi [data-command="open-on-phone"]');assert.equal(await phoneItem.getAttribute('aria-disabled'),'false','enabled, so it can say why');await phoneItem.click();
  await page.locator('#phone-off').waitFor();assert.equal(await page.locator('#phone-off .pw-alert__message').textContent(),'Phone access is off.');
  assert.equal(await page.locator('#phone-off-detail').textContent(),'Serve is not enabled on your tailnet. Enable it once at login.tailscale.com/f/serve, then quit plh and start it again.');
  assert.equal(await page.locator('#phone-off-detail a').getAttribute('href'),'https://login.tailscale.com/f/serve?node=abc');
  assert.equal(await page.locator('#phone-copy-link').isVisible(),true);assert.equal(await page.locator('.phone-address').isVisible(),false,'no address to copy');assert.equal(await page.locator('#phone-qr').isVisible(),false);
  await page.locator('#phone-dialog .pw-btn--default').click();await page.unroute('**/api/config');
  }
  { // Task 154: rename, move, remove, trash and locate a project from the Project menu; the phone ⋯ sheet.
  const made=await post('/api/projects/create',{name:'Rename me',parent:directory});const pid=made.project;
  const projectMenu=async command=>{await page.locator('#menubar [aria-controls="menu-project"]').click();await page.locator(`#menu-project [data-command="${command}"]`).click();};
  await page.goto(`${base}/p/${pid}/chat`);await page.locator('#window-title').filter({hasText:'Rename me'}).waitFor();
  await page.locator('#menubar [aria-controls="menu-project"]').click();
  assert.deepEqual(await page.locator('#menu-project [data-command$="-project"]:not([hidden])').evaluateAll(items=>items.map(item=>item.textContent)),['Rename Project…','Move Project…','Remove from List…','Move Project to Trash…']);
  await page.keyboard.press('Escape');
  await projectMenu('rename-project');await page.locator('#name-dialog-title').filter({hasText:'Rename Project'}).waitFor();
  await page.locator('#name-dialog-input').fill('Renamed');assert.match(await page.locator('#name-dialog-help').textContent(),/^Renames the folder “Rename me” to “Renamed” in .+\. Chat, comments and Activity stay with the project\.$/);
  await page.locator('#name-dialog-ok').click();await page.locator('#toast-text').filter({hasText:'Renamed to “Renamed”.'}).waitFor();
  assert.ok(fs.existsSync(join(directory,'renamed','ROADMAP.md')));assert.equal(new URL(page.url()).pathname,`/p/${pid}/chat`,'the address stays');
  await page.locator('#window-title').filter({hasText:'Renamed'}).waitFor();
  await page.locator('#toast-undo').click();await page.waitForFunction(()=>document.querySelector('#window-title').textContent==='Rename me');assert.ok(fs.existsSync(join(directory,'rename-me')),'Undo renames it back');
  fs.mkdirSync(join(directory,'Elsewhere'));
  await projectMenu('rename-project');await page.locator('#name-dialog-title').filter({hasText:'Rename Project'}).waitFor();await page.locator('#name-dialog-input').fill('Elsewhere');await page.locator('#name-dialog-ok').click();
  await page.locator('#name-dialog-help').filter({hasText:'A folder named “Elsewhere” already exists'}).waitFor();assert.equal(await page.locator('#name-dialog').evaluate(dialog=>dialog.open),true,'round 5: the error stays in the dialog');
  assert.equal(await page.locator('#name-dialog-input').evaluate(input=>input.value.slice(input.selectionStart,input.selectionEnd)),'Elsewhere','the name is selected to fix it');
  await page.locator('#name-dialog-cancel').click();
  await projectMenu('move-project');await page.locator('#folder-dialog-title').filter({hasText:'Move “Rename me”'}).waitFor();await page.locator('#folder-list .pw-row').first().waitFor();assert.equal(await page.locator('#folder-use').textContent(),'Move Here');
  assert.equal(await page.locator('#folder-name').isVisible(),false,'no name field when moving');
  assert.equal(await page.locator('#folder-list .pw-row',{hasText:'rename-me'}).isDisabled(),true,'the project cannot move into itself');
  await page.locator('#folder-path').fill(join(directory,'Elsewhere'));await page.locator('#folder-go').click();await page.locator('#folder-help').filter({hasText:'Elsewhere.'}).waitFor();
  assert.match(await page.locator('#folder-help').textContent(),/^Moves “Rename me” into .+Elsewhere\. Chat, comments and Activity stay with the project\.$/);
  await page.locator('#folder-use').click();await page.locator('#toast-text').filter({hasText:/^Moved to .+Elsewhere\.$/}).waitFor();
  assert.ok(fs.existsSync(join(directory,'Elsewhere','rename-me','ROADMAP.md')));
  await page.locator('#prompt').fill('Hold on TEST_WAIT');await page.locator('#send').click();
  await projectMenu('rename-project');await page.locator('#name-dialog-title').filter({hasText:'Rename Project'}).waitFor();await page.locator('#name-dialog-input').fill('Busy');await page.locator('#name-dialog-ok').click();
  await page.locator('#alert-message').filter({hasText:'Pi is answering about this project.'}).waitFor();
  assert.equal(await page.locator('#alert-danger').textContent(),'Show in Activity');assert.equal(await page.locator('#alert-default').textContent(),'OK');
  assert.equal(await page.locator('#alert-danger').evaluate(button=>button.classList.contains('pw-dialog__danger')),false,'an ordinary button');
  await page.locator('#alert-default').click();assert.ok(fs.existsSync(join(directory,'Elsewhere','rename-me')),'nothing moved');
  await stopAll();
  await projectMenu('remove-project');await page.locator('#alert-message').filter({hasText:'Remove “Rename me” from the list?'}).waitFor();
  assert.equal(await page.locator('#alert-default').textContent(),'Remove');await page.keyboard.press('Escape');
  const listed=async()=>(await page.evaluate(()=>fetch('/api/workspace').then(r=>r.json()))).projects.some(item=>item.id===pid);
  assert.equal(await listed(),true,'Esc cancels');
  await projectMenu('remove-project');await page.locator('#alert-default').click();await page.locator('#toast-text').filter({hasText:'Removed “Rename me” from the list.'}).waitFor();
  assert.equal(await listed(),false);assert.equal(await page.evaluate(()=>document.body.dataset.level),'projects','the Projects home');
  await page.locator('#toast-undo').click();await page.waitForFunction(async id=>(await fetch('/api/workspace').then(r=>r.json())).projects.some(item=>item.id===id),pid);
  await page.goto(`${base}/p/${pid}/chat`);await page.locator('#window-title').filter({hasText:'Rename me'}).waitFor();
  await projectMenu('trash-project');await page.locator('#alert-message').filter({hasText:'Move “Rename me” to the Trash?'}).waitFor();
  assert.match(await page.locator('#alert-detail').textContent(),/^Its 3 files and 1 folder go to the Trash on your Mac\./);assert.equal(await page.locator('#alert-default').textContent(),'Cancel','Cancel is the default');
  await page.locator('#alert-danger').click();await page.locator('#toast-text').filter({hasText:'“Rename me” is in the Trash.'}).waitFor();
  assert.ok(fs.existsSync(join(directory,'Trash','rename-me','ROADMAP.md')),'in the (test) Trash');assert.equal(await listed(),false);
  const gone=await post('/api/projects/create',{name:'Gone',parent:directory});fs.renameSync(join(directory,'gone'),join(directory,'Found'));
  await page.goto(`${base}/projects`);await page.locator('#project-list .pw-row',{hasText:'Gone'}).click();
  await page.locator('#missing-banner').waitFor();assert.match(await page.locator('#missing-text').textContent(),/^The folder .+gone is missing\. The chat is kept; Pi cannot work here until you locate it\.$/);
  await page.locator('#menubar [aria-controls="menu-project"]').click();
  assert.equal(await page.locator('#menu-project [data-command="move-project"]').isVisible(),false);assert.equal(await page.locator('#menu-project [data-command="locate-project"]').isVisible(),true);
  assert.equal(await page.locator('#menu-project [data-command="rename-project"]').getAttribute('aria-disabled'),'true','dimmed, not hidden');
  await page.locator('#menu-project [data-command="locate-project"]').click();await page.locator('#folder-dialog-title').filter({hasText:'Locate “Gone”'}).waitFor();
  assert.equal(await page.locator('#folder-remove').isVisible(),true);
  await page.locator('#folder-path').fill(join(directory,'Found'));await page.locator('#folder-go').click();await page.locator('#folder-help').filter({hasText:'Found.'}).waitFor();
  await page.locator('#folder-use').click();await page.locator('#missing-banner').waitFor({state:'hidden'});
  assert.equal((await page.evaluate(()=>fetch('/api/workspace').then(r=>r.json()))).projects.find(item=>item.id===gone.project).missing,undefined);
  await page.setViewportSize({width:390,height:844});await page.goto(`${base}/projects`);await page.locator('#open-menu').click();
  await page.getByRole('button',{name:'More for Found'}).click();const more=page.locator('#project-more');await more.waitFor();
  assert.equal(await more.locator('#project-more-title').textContent(),'Found');
  assert.deepEqual(await more.locator('[data-more]:not([hidden])').evaluateAll(items=>items.map(item=>item.textContent)),['Open','Rename Project…','Move Project…','Copy Folder Path','Remove from List…','Move Project to Trash…']);
  await more.locator('#project-more-close').click();await more.waitFor({state:'hidden'});
  await page.setViewportSize({width:1440,height:900});
  }
  // Task 228: Activity uses Gate's saved evidence, including counts and a failed exit.
  // Replay an approved test task: Discussion deliberately cannot launch a test runner.
  execFileSync(python,['-c',`
import sys
from pathlib import Path
from gate.paperwork import Paperwork
from gate.protocol import Protocol
from harness.documents import DocumentStore
root=Path(sys.argv[1]).resolve();task='tasks/999-test-log-fixture.md'
(root/task).write_text('# 999: Test log fixture\\nFiles: tests/\\nDone when: Runs are recorded.\\n')
paper=Paperwork(Protocol(),data=Path(sys.argv[2]));paper.projects=DocumentStore(Path(sys.argv[2]))
paper.plan_state(root,{'tasks':[task],'pending':True,'digest':paper.plan_digest(root,[task])})
paper.start_building(root)
`,root,join(directory,'workspace')]);
  const tested=await post('/api/jobs/create',{project:id,message:'Check the tests TEST_RUN_LOG'});
  await page.waitForFunction(id=>fetch('/api/workspace').then(r=>r.json()).then(data=>data.jobs.some(job=>job.id===id&&job.status==='completed')),tested.id);
  await page.goto(`${base}/activity`);await page.locator('#job-'+tested.id+' .activity-request').click();
  const testList=page.locator('#activity-detail section[aria-label="Tests"]');await testList.waitFor();
  assert.match(await testList.textContent(),/node --test tests\/app.test.mjs/);
  assert.match(await testList.textContent(),/Exit code: 1/);assert.match(await testList.textContent(),/3 passed/);assert.match(await testList.textContent(),/1 failed/);
  for(const width of [1440,1024,390]){await page.setViewportSize({width,height:900});if(width===390)await page.locator('#job-'+tested.id+' .activity-request').click();await testList.waitFor();await testList.scrollIntoViewIfNeeded();await page.screenshot({path:shot(`plh-228-activity-${width}.png`)});}
  await page.setViewportSize({width:1440,height:900});await post('/api/settings',{language:'ja'});await page.evaluate(()=>localStorage.setItem('plh.language',JSON.stringify('ja')));await page.reload();await page.getByRole('heading',{name:'テスト',exact:true}).waitFor();assert.equal(await page.getByText('3 件成功',{exact:true}).count(),1);
  // Round 10: the card answers through the real composer and keeps its settled state after reload.
  await page.setViewportSize({width:1440,height:900});
  await post('/api/settings',{language:'en'});await page.evaluate(()=>localStorage.setItem('plh.language',JSON.stringify('en')));
  const choiceJob=await post('/api/jobs/create',{project:created.project,message:'Discuss the app TEST_ERROR_CHOICE'});
  await page.waitForFunction(id=>fetch('/api/workspace').then(r=>r.json()).then(d=>d.jobs.some(j=>j.id===id&&j.status==='waiting')),choiceJob.id); /* task 290: a question or a plan pause waits for the person */
  await page.goto(`${base}/p/${created.project}/chat`);
  const choiceCard=page.locator('.pw-card[aria-label="Who uses it?"]');await choiceCard.waitFor();
  await page.locator('#messages').getByText('Context before your choice.',{exact:true}).waitFor();
  assert.equal(await choiceCard.locator('input[type="radio"]').first().isChecked(),true);
  await choiceCard.getByText('Something else…',{exact:true}).click();
  await choiceCard.getByRole('textbox',{name:'Your answer'}).fill('A study group');
  await choiceCard.getByRole('button',{name:'Answer',exact:true}).click();
  await page.locator('.pw-card--settled').filter({hasText:'A study group'}).waitFor();
  await page.reload();await page.locator('.pw-card--settled').filter({hasText:'A study group'}).waitFor();
  // Same global switch from the composer, menu, and Settings: risks every time, Cancel owns Return.
  for(let attempt=0;attempt<2;attempt++){
   await page.locator('#auto-composer').check();await page.locator('#alert-dialog').waitFor();
   assert.equal(await page.locator('#alert-default').textContent(),'Cancel');
   assert.equal(await page.locator('#alert-default').evaluate(el=>el===document.activeElement),true);
   assert.ok(await page.locator('#alert-extra b').count()>=5);
   if(attempt===0){await page.locator('#alert-default').click();await page.waitForFunction(()=>!document.querySelector('#auto-composer').checked);}
   else {await page.locator('#alert-danger').click();await page.waitForFunction(()=>fetch('/api/auto').then(r=>r.json()).then(d=>d.enabled));await page.locator('#auto-composer').uncheck();await page.waitForFunction(()=>fetch('/api/auto').then(r=>r.json()).then(d=>!d.enabled));}
  }
  const planJob=await post('/api/jobs/create',{project:created.project,message:'Discuss a plan TEST_ERROR_PLAN'});
  await page.waitForFunction(id=>fetch('/api/workspace').then(r=>r.json()).then(d=>d.jobs.some(j=>j.id===id&&j.status==='waiting')),planJob.id); /* task 290: a question or a plan pause waits for the person */
  await page.reload();const planCard=page.locator('.pw-card[aria-label="Plan"]').last();await planCard.waitFor();
  await page.locator('#messages').getByText('Context before your plan.',{exact:true}).waitFor();
  assert.match(await planCard.textContent(),/Move the ball/);await planCard.getByRole('button',{name:'Change…',exact:true}).click();
  assert.equal(await page.locator('#send').textContent(),'Send Change');assert.equal(await page.locator('#prompt').inputValue(),'');
  const checkJob=await post('/api/jobs/create',{project:created.project,message:'Check in TEST_CHECK_IN'});
  await page.waitForFunction(id=>fetch('/api/workspace').then(r=>r.json()).then(d=>d.jobs.some(j=>j.id===id&&j.status==='completed')),checkJob.id);
  await page.reload();const checkCard=page.locator('.pw-card').filter({hasText:'Task 1 of 2 not verified:'}).last();await checkCard.waitFor();
  assert.equal(await checkCard.locator('.pw-btn--default').textContent(),'Retry Task');/* round 12 (R12_Verify): Retry Task is the default */
  assert.deepEqual(await checkCard.locator('.pw-card__foot .pw-btn').allTextContents(),['Retry Task','Review First','Accept Anyway…','Stop Here']);
  await page.screenshot({path:shot('plh-r12-verify-1440.png')});
  await page.reload();await page.locator('.pw-card').filter({hasText:'Waiting for you'}).last().waitFor();
  // Round 11: the actual approval route, waiting review, durable subset and final validation.
  const phaseProject=await post('/api/projects/create',{name:'Phase lifecycle',parent:directory,kind:'empty'});
  await post('/api/phase',{project:phaseProject.project,phase:'planning'});
  const planned=await post('/api/jobs/create',{project:phaseProject.project,message:'TEST_PHASE_PLAN'});
  await page.waitForFunction(id=>fetch('/api/workspace').then(r=>r.json()).then(d=>d.jobs.some(j=>j.id===id&&j.status==='waiting')),planned.id); /* task 290: a question or a plan pause waits for the person */
  await page.goto(`${base}/p/${phaseProject.project}/chat`);
  const ready=page.locator('.pw-card[aria-label="Plan"]');await ready.waitFor();
  assert.equal(await ready.getByRole('button',{name:'Approve Plan',exact:true}).count(),0);
  await ready.getByRole('button',{name:'Plan Another Task',exact:true}).click();
  await page.locator('.pw-waiting').waitFor();await page.reload();await page.locator('.pw-waiting').waitFor();
  for(const width of [1440,390]){
   await page.setViewportSize({width,height:900});await page.getByRole('button',{name:'Build the Planned Tasks…',exact:true}).click();
   const phaseReview=page.getByRole('dialog',{name:'Build the planned tasks?',exact:true});await phaseReview.waitFor();
   const boxes=phaseReview.locator('input[type=checkbox]');for(const box of await boxes.all())await box.uncheck();
   assert.equal(await phaseReview.getByRole('button',{name:'Start Building',exact:true}).isDisabled(),true,JSON.stringify(await boxes.evaluateAll(list=>list.map(b=>({value:b.value,checked:b.checked})))));
   await page.screenshot({path:shot(`plh-247-waiting-review-${width}.png`)});await phaseReview.getByRole('button',{name:'Cancel',exact:true}).click();
  }
  await page.getByRole('button',{name:'Build the Planned Tasks…',exact:true}).click();
  const phaseReview=page.getByRole('dialog',{name:'Build the planned tasks?',exact:true});for(const box of await phaseReview.locator('input[type=checkbox]').all())await box.uncheck();await phaseReview.locator('input[type=checkbox]').first().check();
  await phaseReview.getByRole('button',{name:'Start Building',exact:true}).click();await page.waitForFunction(()=>(document.querySelector('#phase-button')?.textContent||'').includes('Implementation'));
  await page.waitForFunction(()=>document.querySelector('#send').textContent==='Send');
  const state=await page.evaluate(project=>fetch('/api/phase?project='+project).then(r=>r.json()),phaseProject.project),task=state.tasks[0].path;
  // Real Gate settlement, not a synthetic check-in: an empty code task must stay unverified.
  const emptyCode=await post('/api/jobs/create',{project:phaseProject.project,message:'TEST_PHASE_NO_CODE'});
  await page.waitForFunction(id=>fetch('/api/workspace').then(r=>r.json()).then(d=>d.jobs.some(j=>j.id===id&&j.status==='completed')),emptyCode.id);
  await page.reload();const emptyCheck=page.locator('.pw-card').filter({hasText:'no implementation change'}).last();await emptyCheck.waitFor();
  assert.match(await emptyCheck.textContent(),/not verified/);
  assert.match(require('node:fs').readFileSync(join(directory,'phase-lifecycle',task),'utf8'),/- \[ \] Red:/);
  await page.reload();await page.locator('.pw-card').filter({hasText:'no implementation change'}).last().waitFor();
  execFileSync('python3',['-c',`from pathlib import Path
from gate.paperwork import Paperwork
from gate.protocol import Protocol
from harness.documents import DocumentStore
import sys
root=Path(sys.argv[1]);data=Path(sys.argv[2]);paper=Paperwork(Protocol(),data=data);paper.projects=DocumentStore(data)
plan=paper.plan_state(root);plan.update(check_in=True,verified=True);paper.plan_state(root,plan)
`,join(directory,'phase-lifecycle'),join(directory,'workspace')]);
  const checked=await post('/api/jobs/create',{project:phaseProject.project,message:'TASK='+task+' TEST_PHASE_CHECK'});
  await page.waitForFunction(id=>fetch('/api/workspace').then(r=>r.json()).then(d=>d.jobs.some(j=>j.id===id&&j.status==='completed')),checked.id);
  await page.reload();const phaseLast=page.locator('.pw-card').filter({hasText:'Waiting for you to check it'}).last();await phaseLast.waitFor();
  await phaseLast.getByRole('button',{name:'Stop Here',exact:true}).click();await page.reload();
  await page.locator('.pw-card').filter({hasText:'Waiting for you to check it'}).last().getByRole('button',{name:'Accept Task',exact:true}).click();
  await page.getByText('All 1 planned tasks are built · still Implementation',{exact:true}).waitFor();
  await page.getByRole('link',{name:'Back to Discussion',exact:true}).click();await page.locator('.pw-waiting').waitFor();
  assert.match(await page.locator('.pw-waiting').textContent(),/Reset/);
  await page.setViewportSize({width:1440,height:900});
  await page.evaluate(async()=>{
   const {toolCard}=await import('/js/ui.mjs');const stage=document.createElement('div');stage.id='phase-refusal';document.querySelector('#messages').after(stage);
   stage.append(toolCard({name:'write',detail:'app.py',checks:[{phase:'gate',outcome:'REVISE',reason:'G-015 Not written: the project is in Discussion. Pi can read, search and talk, but can’t write files.'}]}));
  });
  for(const width of [1440,390]){
   await page.setViewportSize({width,height:900});const refusal=page.locator('#phase-refusal');await refusal.scrollIntoViewIfNeeded();
   await refusal.locator('summary').click();assert.match(await refusal.locator('details').textContent(),/No file changes/);await refusal.locator('summary').click();
   await refusal.getByRole('button',{name:'Change Phase…',exact:true}).click();await page.locator('#phase-menu').waitFor();await page.keyboard.press('Escape');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  }
  await page.locator('#phase-refusal').evaluate(el=>el.remove());await page.setViewportSize({width:1440,height:900});
  // All four card families use the drawn phone dimensions and long-plan/auto states.
  await page.evaluate(async()=>{
   const {choiceCard,planCard,awayCard}=await import('/js/plan-cards.mjs');
   const stage=document.createElement('div');stage.id='round10-cards';document.querySelector('#messages').after(stage);
   const noop=()=>{},decisions='- Sorting: newest (auto)\n- Languages: Japanese and English (given)';
   stage.append(choiceCard({question:'Sorting?',options:[{label:'Newest'},{label:'Oldest'}],answer:'Newest',state:'auto'},{change:noop}),planCard({goal:'Keep notes',tasks:Array.from({length:9},(_,n)=>({title:'Task '+n,done_when:'It works',decisions}))},{name:'Class Notes',approve:noop,change:noop,open:noop}),awayCard({id:'report',started:'2026-10-16T14:40:00+09:00',ended:'2026-10-16T16:05:00+09:00',outcome:'roadmap done',done:[{task:'Ball',verified:true}],decisions:[{question:'Sort',answer:'Newest'}],external:[{action:'Published',url:'https://example.com'}],problems:[{reason:'A test failed, then passed'}]},{change:noop,seen:noop,activity:noop}));
  });
  assert.equal(await page.locator('#round10-cards .pw-card--auto').count(),1);
  assert.equal(await page.locator('#round10-cards .pw-plan__tasks>li').count(),6);
  assert.equal(await page.locator('#round10-cards .pw-plan__decisions .pw-tag').count(),3);
  for(const width of [1440,390]){await page.setViewportSize({width,height:900});await page.locator('#round10-cards').scrollIntoViewIfNeeded();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);if(width===390){const sizes=await page.locator('#round10-cards .pw-card__foot button').evaluateAll(items=>items.map(e=>e.getBoundingClientRect().height));assert.ok(sizes.every(h=>h>=44));}await page.screenshot({path:shot(`plh-239-cards-${width}.png`)});}
  await post('/api/settings',{language:'ja'});await page.evaluate(()=>localStorage.setItem('plh.language',JSON.stringify('ja')));await page.reload();
  await page.locator('#send').filter({hasText:'送信'}).waitFor();
  await page.evaluate(async()=>{
   const {choiceCard,planCard,awayCard}=await import('/js/plan-cards.mjs');const stage=document.createElement('div');stage.id='round10-ja';document.querySelector('#messages').after(stage);const noop=()=>{};
   stage.append(choiceCard({question:'Tasks',options:[{label:'Tasks'},{label:'Decisions'}],number:1,total:3},{answer:noop}),planCard({goal:'Tasks',tasks:[{title:'Tasks',done_when:'it works',decisions:'- Tasks: Decisions (given)'}]},{name:'Notes',approve:noop,change:noop,open:noop}),awayCard({id:'ja',done:[],decisions:[],external:[],problems:[]},{seen:noop,change:noop,activity:noop}));
  });
  await page.locator('#round10-ja button').filter({hasText:'実装開始'}).waitFor();
  assert.equal(await page.locator('#round10-ja .pw-option__label').first().evaluate(el=>el.firstChild.textContent),'Tasks','person options keep their original words');
  assert.equal(await page.locator('#round10-ja .pw-plan__goal').textContent(),'Tasks');
  assert.match(await page.locator('#round10-ja .pw-plan__tasks small').textContent(),/完了条件/);
  // Round 9: every designed update state uses the safe backend result; these routes never fetch the real clone.
  await post('/api/settings',{language:'en'});await page.evaluate(()=>localStorage.setItem('plh.language',JSON.stringify('en')));await page.reload();
  for(const [state,why,title,action] of [
   ['current','','Pi WorkStation is up to date.',''],['unknown','','Can’t check for updates right now.','Try Again'],
   ['blocked','This copy has its own changes (2 commits not on GitHub), so it is not updated automatically.','This copy is not updated automatically.','Ask Pi to Update'],
   ['blocked','Some files of Pi WorkStation were edited and not saved in a commit; updating would overwrite them.','Pi WorkStation can’t update yet.','Ask Pi to Save Them'],
   ['available','','A new version of Pi WorkStation is ready','Update']]){
   updateFixture={state,why,changes:Array.from({length:25},(_,n)=>'Change '+n)};
   await page.setViewportSize({width:1440,height:900});await page.locator('#menubar [aria-controls="menu-pi"]').click();await page.locator('#menu-pi [data-command="check-updates"]').click();
   const update=page.locator('#updates-dialog');await update.getByRole('heading',{name:title,exact:true}).waitFor();
   if(action)assert.equal(await update.getByRole('button',{name:action,exact:true}).count(),1);
   if(state==='blocked')assert.match(await update.textContent(),/Nothing was changed/);
   if(state==='available'){assert.equal(await update.locator('li').count(),20);await update.getByRole('button',{name:'Update',exact:true}).click();await update.getByRole('heading',{name:'Updating Pi WorkStation…',exact:true}).waitFor();await update.getByRole('heading',{name:/Updated to abc1234/}).waitFor();}
   await page.keyboard.press('Escape');
  }
  const manifest=await page.evaluate(()=>fetch('/design/app-icons/manifest.webmanifest').then(r=>r.json()));assert.equal(manifest.display,'standalone');assert.equal(manifest.icons[1].purpose,'maskable');
  for(const icon of manifest.icons)assert.equal(await page.evaluate(async src=>(await fetch(src)).status,icon.src),200);
  await page.keyboard.press('ControlOrMeta+Comma');const round9Settings=page.locator('#settings-dialog');await round9Settings.waitFor();assert.equal(await round9Settings.locator('legend').first().textContent(),'Language');await round9Settings.getByLabel('Check for updates once a day').uncheck();await page.waitForFunction(()=>fetch('/api/settings').then(r=>r.json()).then(d=>!d.updates_daily));await round9Settings.getByRole('button',{name:'Done',exact:true}).click();
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>document.querySelector('#install-dialog').showModal());const home=page.locator('#install-dialog');await home.getByRole('radio',{name:'Android',exact:true}).click();assert.match(await home.textContent(),/Choose Install app/);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await home.getByRole('button',{name:'Done',exact:true}).click();
  // Terminal Preview controls share the real socket bridge's tested key protocol.
  const terminalStatus={state:'running',kind:'app',terminal:true,command:'python -m app.tui',url:base+'/round9-terminal'};
  await page.route('**/api/preview?*',route=>route.fulfill({json:terminalStatus}));let terminalRestarts=0;
  await page.route('**/api/preview/{start,stop}',route=>{terminalRestarts++;return route.fulfill({json:terminalStatus});});
  await page.route('**/round9-terminal*',route=>route.fulfill({contentType:'text/html',body:'<textarea aria-label="Terminal"></textarea><script>addEventListener("message",event=>{document.body.dataset.key=event.data.key||"";});</script>'}));
  await page.evaluate(id=>localStorage.setItem('plh.preview.'+id,JSON.stringify({open:true,seen:true,size:'phone',path:'/round9-terminal',language:'en'})),phaseProject.project);
  await page.setViewportSize({width:1440,height:900});await page.reload();await page.locator('#preview-body').getByRole('button',{name:'Restart',exact:true}).waitFor();assert.equal(await page.locator('#preview-body input[aria-label="Page"]').inputValue(),'python -m app.tui');
  await page.locator('#preview-body').getByRole('radio',{name:'120 × 40',exact:true}).click();assert.match(await page.locator('#preview-body .pw-preview__caption').textContent(),/120 × 40/);const restarted=page.waitForResponse(response=>response.url().endsWith('/api/preview/start'));await page.locator('#preview-body').getByRole('button',{name:'Restart',exact:true}).click();await restarted;assert.equal(terminalRestarts,2);
  await page.setViewportSize({width:390,height:844});await page.locator('.pw-terminal-keys').waitFor();await page.frameLocator('#preview-body iframe').getByRole('textbox',{name:'Terminal'}).waitFor();await page.locator('.pw-terminal-keys').getByRole('button',{name:'Return',exact:true}).click();await page.frameLocator('#preview-body iframe').locator('body[data-key="Enter"]').waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.screenshot({path:shot('plh-243-terminal-phone.png')});
  await post('/api/settings',{language:'ja'});await page.evaluate(()=>localStorage.setItem('plh.language',JSON.stringify('ja')));await page.reload();await page.locator('#preview-body').getByRole('button',{name:'再起動',exact:true}).waitFor();
  assert.deepEqual(errors,[]);
  console.log('Design checks passed.');
 }finally{await browser?.close();/* a server that already died must not make this wait forever (Node would exit 0) */const exited=server.exitCode!==null||server.signalCode!==null?Promise.resolve():new Promise(resolve=>server.once('exit',resolve));server.kill();/* a server stuck in a request gets SIGKILL after 5 s, so a failed run still exits */const killer=setTimeout(()=>server.kill('SIGKILL'),5000);await exited;clearTimeout(killer);fs.rmSync(directory,{recursive:true,force:true,maxRetries:5,retryDelay:200});}
})().catch(error=>{console.error(error);process.exitCode=1;});
