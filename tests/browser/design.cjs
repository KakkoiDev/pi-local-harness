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
 const server=spawn('python3',[join(process.env.PI_TEST_RUNTIME||'.','harness/services.py')],{env:{...Object.fromEntries(Object.entries(process.env).filter(([key])=>!/^PI_(HARNESS_|WEB_REMOTE_)/.test(key))) /* never the live harness or phone access */,PATH:directory+':'+process.env.PATH,PI_TAILSCALE:'false',PI_GATE_PORT:'0',PI_OLLAMA_URL:'http://127.0.0.1:9',PI_WEB_PORT:'0',PI_AGENT_DATA:join(directory,'workspace'),PI_WEB_DATA:join(directory,'data'),PI_HARNESS_LOG_FILE:join(directory,'audit.log')},stdio:['ignore','pipe','pipe']});
 let browser;
 try{
  const lines=readline.createInterface({input:server.stdout});
  const ports=await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('Server startup timeout')),10000);lines.once('line',line=>{clearTimeout(timeout);resolve(JSON.parse(line));});server.once('exit',code=>reject(new Error('Server exited '+code)));});
  const base=`http://127.0.0.1:${ports.web}`;
  browser=await chromium.launch({headless:true,...(process.env.PI_TEST_CHROME?{executablePath:process.env.PI_TEST_CHROME}:{})});
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const consoleLines=[];page.on('console',message=>consoleLines.push(message.type()+': '+message.text()));
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

  // 112: each block type looks like itself (quote, list markers, code), as .pw-doc styles them.
  fs.writeFileSync(join(root,'TYPES.md'),'# Types\n\n> A quoted line\n\n- First bullet\n- Second bullet\n\n1. One\n2. Two\n\n```\ncode here\n```\n');
  await page.goto(base+'/?document='+encodeURIComponent(`projects/${created.project}/TYPES.md`));
  await page.locator('#document-editor .pw-block.quote').waitFor();
  const look=await page.evaluate(()=>{const style=selector=>getComputedStyle(document.querySelector(selector));const quote=style('#document-editor .pw-block.quote .block-content'),code=style('#document-editor .pw-block.code .block-content');
   return {quote:[quote.borderTopStyle,quote.fontStyle],bullets:[...document.querySelectorAll('#document-editor .pw-block.bullet .pw-block__marker')].map(item=>item.textContent),numbers:[...document.querySelectorAll('#document-editor .pw-block.number .pw-block__marker')].map(item=>item.textContent),
    text:document.querySelector('#document-editor .pw-block.bullet .block-content').textContent,code:[code.borderTopStyle,code.fontFamily.includes('IBM Plex Mono')]};});
  assert.deepEqual(look,{quote:['dotted','italic'],bullets:['•','•'],numbers:['1.','2.'],text:'First bullet',code:['solid',true]});
  await page.goto(base);await page.locator('#work-tab').click();
  await page.getByRole('button',{name:'ROADMAP.md',exact:true}).click();await page.locator('#document-path').filter({hasText:'ROADMAP.md'}).waitFor();

  // 102: an open thread sits below its passage, as wide as the column minus the 24px indent.
  const path=`projects/${created.project}/ROADMAP.md`;
  await post('/api/documents/comment',{path,text:'Say who it is calm for.',anchor:'calm workbench'});
  await page.reload();await page.locator('#work-tab').click();
  await page.locator('.pw-mark').first().click();
  const thread=page.locator('.pw-thread').first();await thread.waitFor();
  const layout=await thread.evaluate(element=>{const block=[...document.querySelectorAll('#document-editor .pw-block')].find(row=>row.textContent.includes('calm workbench')),text=block.querySelector('.block-content').getBoundingClientRect(),box=element.getBoundingClientRect(),who=element.querySelector('.pw-thread__who').getBoundingClientRect(),editor=document.querySelector('#document-editor .pw-block').getBoundingClientRect();return {inside:block.contains(element),below:box.top>=text.bottom-1,indent:Math.round(box.left-text.left),width:Math.round(box.right-editor.right),whoHeight:Math.round(who.height)};});
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
  const firstPara=page.locator('#document-editor>.pw-block.text').first();
  const textBox=await firstPara.locator('.block-content').boundingBox();
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
  assert.equal(await added.locator('.block-content').evaluate(element=>element===document.activeElement),true,'the new block has the caret');
  await page.keyboard.type('Typed into the new block');
  assert.equal(await added.locator('.block-content').textContent(),'Typed into the new block');
  await page.keyboard.press('Enter');
  assert.equal(await blockCount(),before+2,'Return at the end starts a block');
  await page.keyboard.press('Backspace');
  assert.equal(await blockCount(),before+1,'Backspace in an empty block removes it');
  assert.equal(await added.locator('.block-content').evaluate(element=>element===document.activeElement),true,'the caret returns to the block above');
  const checkRow=page.locator('#document-editor>.pw-block.check').first();
  await checkRow.locator('.block-content').hover();await checkRow.locator('.pw-block__handle').click();
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
  assert.equal(await page.locator('#document-editor>.pw-block').last().locator('.block-content').evaluate(element=>element===document.activeElement),true);
  await page.mouse.click(last.x+60,Math.min(body.y+body.height-12,last.y+last.height+60));
  assert.equal(await blockCount(),total+1,'an empty last block is reused, not stacked');
  await page.keyboard.press('Backspace');

  // 109: New File… names the real file; New Task… numbers it and adds it to the roadmap.
  await page.locator('#menubar [aria-controls="menu-file"]').click();
  assert.equal((await page.locator('#menu-file [data-command="new-file"]').textContent()).replace('⇧⌘N',''),'New File…');
  await page.locator('#menu-file [data-command="new-file"]').click();
  await page.locator('#name-dialog-input').fill('notes');
  assert.equal(await page.locator('#name-dialog-help').textContent(),'Creates “notes.md” in Design check and opens it. Any name works; .md is added when there is no extension, and “specs/phone.md” creates the folder too.');
  await page.locator('#name-dialog-input').fill('tools/check.py');
  assert.equal(await page.locator('#name-dialog-help').textContent(),'Creates “tools/check.py” in Design check and opens it. Any name works; .md is added when there is no extension, and “specs/phone.md” creates the folder too.');
  await page.keyboard.press('Enter');await page.locator('#document-path').filter({hasText:'tools/check.py'}).waitFor();
  assert.equal(fs.existsSync(join(root,'tools/check.py')),true,'a real file in the project folder');
  await page.locator('#menubar [aria-controls="menu-file"]').click();await page.locator('#menu-file [data-command="new-task"]').click();
  await page.locator('#name-dialog-input').fill('Phone layouts');
  assert.equal(await page.locator('#name-dialog-help').textContent(),'Creates “tasks/002-phone-layouts.md” in Design check, adds it to ROADMAP.md, and opens it.');
  await page.keyboard.press('Enter');await page.locator('#document-path').filter({hasText:'tasks/002-phone-layouts.md'}).waitFor();
  assert.match(fs.readFileSync(join(root,'ROADMAP.md'),'utf8'),/- \[ \] \[002-Phone layouts\]\(tasks\/002-phone-layouts\.md\)\n$/);

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
  assert.equal(await review.getByText('Sent to Pi',{exact:false}).count()>=1,true);
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
  await page.locator('#document-editor>.pw-block.text .block-content').first().evaluate(element=>{element.focus();element.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',keyCode:229,bubbles:true,cancelable:true}));});
  assert.equal(await page.locator('#document-editor>.pw-block').count(),blocksBefore,'confirming a kanji does not split the block');

  await page.locator('#menubar [aria-controls="menu-file"]').click();await page.locator('#menu-file [data-command="new-file"]').click();
  await page.locator('#name-dialog-input').fill('メモ');
  // A script-made Enter never submits a form, so check the guard itself: the confirming Enter is cancelled, a plain one is not.
  assert.deepEqual(await page.locator('#name-dialog-input').evaluate(element=>[229,13].map(keyCode=>{const event=new KeyboardEvent('keydown',{key:'Enter',keyCode,bubbles:true,cancelable:true});element.dispatchEvent(event);return event.defaultPrevented;})),[true,false]);
  await page.keyboard.press('Escape');

  // 113: an open Reasoning panel stays open while reasoning streams in, and after the reply finishes.
  await page.locator('#chat-tab').click();
  await page.locator('#prompt').fill('Think it over. TEST_THINK');await page.locator('#send').click();
  const live=page.locator('#messages .pw-msg:not(.pw-msg--user)').last().locator('details');
  await live.locator('summary').waitFor();await live.locator('summary').click();
  await page.waitForFunction(()=>(document.querySelector('#messages .pw-msg:not(.pw-msg--user):last-of-type details')?.textContent||'').includes('Thinking step 3'));
  assert.equal(await page.locator('#messages .pw-msg:not(.pw-msg--user)').last().locator('details').evaluate(element=>element.open),true,'still open after new reasoning');
  await page.locator('#messages').getByText(/reply \d+/).last().waitFor({timeout:15000});
  assert.equal(await page.locator('#messages .pw-msg:not(.pw-msg--user)').last().locator('details').evaluate(element=>element.open),true,'still open on the finished reply');
  // 125: reasoning renders its Markdown and wraps inside its box, also at phone width.
  const reasoning=page.locator('#messages .pw-msg:not(.pw-msg--user)').last().locator('details');
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
  // 144: the phone composer stays within a quarter of the screen while typing.
  await page.locator('#prompt').fill('one\ntwo\nthree\nfour\nfive\nsix');await page.locator('#prompt').dispatchEvent('input');
  assert.ok((await page.locator('#composer').boundingBox()).height<=844/4,'composer height '+(await page.locator('#composer').boundingBox()).height);
  await page.locator('#prompt').fill('');await page.setViewportSize({width:1440,height:900});

  // 97: Files window = Plan above Files (ListGroup), titled with the project, as the Work board.
  fs.writeFileSync(join(root,'tasks/003-finished.md'),'# Finished\n\n- [x] a\n- [x] b\n');
  fs.writeFileSync(join(root,'tasks/004-stuck.md'),'# Stuck\n\n- [ ] a\n- [~] Blocked: waiting\n');
  const id=created.project;
  await page.goto(`${base}/p/${id}/work/ROADMAP.md`);
  await page.locator('#document-path').filter({hasText:'ROADMAP.md'}).waitFor();
  assert.equal(await page.locator('#files-title').textContent(),'Design check','Files window title is the project');
  const plan=page.locator('.pw-group[data-group="plan"]'),other=page.locator('.pw-group[data-group="files"]');
  assert.equal(await plan.locator('.pw-group__toggle').textContent(),'Plan3 open');
  assert.deepEqual(await plan.locator('.pw-group__body>.pw-row').evaluateAll(rows=>rows.map(row=>[row.querySelector('.pw-row__label').textContent,row.querySelector('.pw-row__meta')?.textContent||''])),
   [['ROADMAP.md','1/3'],['004-stuck','Blocked'],['002-phone-layouts','0/3'],['001-first-task','0/3'],['Done','1 task']]);
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
  await page.keyboard.press('ControlOrMeta+Digit3');await page.waitForURL(`${base}/activity`);
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
  assert.deepEqual(await seg.getByRole('radio').evaluateAll(items=>items.map(item=>[item.textContent,item.getAttribute('aria-checked')])),[['Plan · 3 open','true'],['Files · 2','false']]);
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
  assert.equal(await page.evaluate(()=>document.body.dataset.level),'projects','app windows show the Projects home');
  await page.locator('#main-window>.pw-titlebar [data-command="close-window"]').click();
  await page.waitForURL(`${base}/p/${id}/chat`);
  await page.goto(`${base}/p/${id}/gate`);await page.waitForURL(`${base}/gate`);

  // 128: the project window has Chat | Work; Activity and Gate are app windows (C_ActivityDesk, C_GateDesk, Menus).
  await page.goto(`${base}/p/${id}/chat`);await page.locator('#chat-tab').waitFor();
  assert.deepEqual(await page.locator('#workspace-bar .view-tabs button').evaluateAll(items=>items.map(item=>item.textContent)),['Chat⌘1','Work⌘2']);
  await page.locator('#menubar [aria-controls="menu-window"]').click();
  assert.deepEqual(await page.locator('#menu-window [role="menuitemradio"]').evaluateAll(items=>items.map(item=>item.textContent)),['Chat⌘1','Work⌘2','Activity · All Projects⌘3','Gate · All Projects⌘4']);
  await page.locator('#menu-window [data-command="view-activity"]').click();await page.waitForURL(`${base}/activity`);
  assert.equal(await page.locator('#window-title').textContent(),'Activity · All Projects');
  assert.equal(await page.locator('#main-window>.pw-titlebar [data-command="close-window"]').getAttribute('aria-label'),'Close Activity and go back');
  assert.equal(await page.locator('#workspace-bar').isVisible(),false,'no project tabs in an app window');
  assert.match(await page.locator('#activity-panel .pw-infobar').textContent(),/One agent, one queue, first in first out\. Interrupted work is never repeated automatically\./);
  assert.equal(await page.locator('#activity-project option').first().textContent(),'All Projects');
  const projectLink=page.locator('#activity-list .pw-link').first();assert.equal(await projectLink.count(),1,'project names are links');
  assert.match(await page.locator('#activity-detail .activity-detail__actions .pw-btn').first().textContent(),/^Open in /);
  await page.locator('#menubar [aria-controls="menu-view"]').click();
  assert.equal(await page.locator('#menu-view [data-command="view-chat"]').count(),0,'round 4: Chat and Work live in Window, View is how you see the document');
  await page.keyboard.press('Escape');
  await page.keyboard.press('ControlOrMeta+Digit4');await page.waitForURL(`${base}/gate`);
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
  const stopAll=async()=>{const {jobs}=await page.evaluate(()=>fetch('/api/workspace').then(r=>r.json()));for(const job of jobs.filter(job=>job.status==='queued'))await post('/api/jobs/cancel',{id:job.id});for(const job of jobs.filter(job=>job.status==='running'))await post(`/api/conversations/${job.chat}/stop`,{});};
  await stopAll();await page.goto(`${base}/activity`);await page.waitForFunction(()=>document.querySelector('#agent-activity-meta').textContent==='Nothing running',null,{timeout:20000});
  await page.goto(`${base}/projects`);await page.locator('#agent-activity').waitFor();
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
  await page.locator('#agent-activity').click();await page.waitForURL(`${base}/activity`);
  assert.equal(await page.locator('#agent-activity').getAttribute('aria-current'),'page');
  assert.equal(await page.locator('#agent-activity-meta').textContent(),'Nothing running','opening Activity marks attention seen');
  // From Activity or Gate, Chat and Work (Window menu, ⌘1/⌘2) and the ‹ project link go back into the project.
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
  await page.locator('#effort-button').click();await page.locator('#effort-menu [data-effort="low"]').click();
  await page.locator('#effort-button',{hasText:'Low thinking'}).waitFor();assert.match(await page.locator('#toast-text').textContent(),/Thinking set to low\. Pi uses it from the next request\./);
  assert.equal(JSON.parse(fs.readFileSync(join(directory,'workspace','model.json'),'utf8')).effort,'low','kept for the next request');
  await page.locator('#model-button').click();await page.locator('#model-menu [data-model="qwen3:8b"]').waitFor();
  assert.equal(await page.locator('#model-menu [data-model="tiny:1b"]').getAttribute('aria-disabled'),'true','a model without tools cannot be chosen');
  assert.deepEqual(await page.locator('#model-menu .pw-menu__key').allTextContents(),['thinks · sees','no thinking','no tools']);assert.equal(await page.locator('#model-menu [role="note"]').textContent(),'One model in memory at a time. Switching unloads the current one.');
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
  await page.getByRole('button',{name:'Remove from List',exact:true}).click();await missing.waitFor({state:'detached'});

  // Audit (task 150): the folder browser lists real rows (icon and name, full height), the path field gets the room, the help says what happens.
  await page.goto(`${base}/projects`);await page.locator('#new-project').click();await page.locator('#folder-list .pw-row').first().waitFor();
  const folderRows=await page.locator('#folder-list .pw-row').evaluateAll(rows=>rows.slice(0,3).map(row=>({height:Math.round(row.getBoundingClientRect().height),icon:Boolean(row.querySelector('svg')),label:row.querySelector('.pw-row__label')?.textContent})));
  assert.ok(folderRows.every(row=>row.height>=28&&row.icon&&row.label),'folder rows: '+JSON.stringify(folderRows));
  assert.ok((await page.locator('#folder-path').boundingBox()).width>=240,'the path field is not squeezed');
  await page.locator('#folder-name').fill('Shop');assert.match(await page.locator('#folder-help').textContent(),/^Creates the folder “.+\/Shop” with ROADMAP\.md and tasks\/001-first-task\.md, then opens its Chat\.$/);
  await page.locator('#folder-cancel').click();

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
  assert.equal(await page.locator('#phone-view').isVisible(),false);assert.equal(await page.locator('#document-toolbar').isVisible(),false,'no desk ruler');
  // Editing shows the bottom bar; Done hides it.
  await page.locator('#document-editor>.pw-block.text .block-content').first().click();
  await page.locator('#phone-edit-bar').waitFor();assert.equal(await page.locator('#phone-block-style').inputValue(),'text');
  await page.locator('#phone-edit-done').click();await page.locator('#phone-edit-bar').waitFor({state:'hidden'});
  // Block handle sheet (PhoneEdit5): title, six types in a grid, Cancel.
  await page.locator('#document-editor>.pw-block.text .block-content').first().click();await page.locator('.pw-block--focused .pw-block__handle').click();
  assert.equal(await page.locator('#block-menu-title').textContent(),'Paragraph');
  assert.deepEqual(await page.locator('#turn-into-menu>.pw-menu__item:visible').evaluateAll(items=>items.map(item=>({text:item.innerText.trim(),box:item.getBoundingClientRect()})).sort((a,b)=>a.box.top-b.box.top||a.box.left-b.box.left).map(item=>item.text)),['Paragraph','Heading','Task','Bullet','Number','Quote','Code','Raw Markdown'],'PhoneEdit5 order (Table not built yet)');
  const sheetBox=await page.locator('#block-menu').boundingBox();assert.ok(Math.round(sheetBox.y+sheetBox.height)===844&&Math.round(sheetBox.width)===390,'a bottom sheet');
  await page.locator('#block-menu [data-action="cancel"]').click();await page.locator('#block-menu').waitFor({state:'hidden'});
  // Phone bar elsewhere shows the agent status; the π sheet is Ph_Pi; the composer is one row.
  await page.goto(`${base}/p/${id}/chat`);await page.locator('#phone-status').filter({hasText:/Ready|Working|waiting/}).waitFor();
  assert.equal(await page.locator('#hint').isVisible(),false);assert.equal(await page.locator('.composer-wrap .footnote').isVisible(),false);
  assert.equal(new Set(await page.locator('.pw-composer__row>*').evaluateAll(items=>items.filter(item=>item.getClientRects().length&&item.offsetHeight).map(item=>Math.round(item.getBoundingClientRect().top)))).size,1,'composer controls in one row');
  await page.locator('#open-menu').click();
  assert.equal(await page.locator('#sidebar .sheet-head__title').textContent(),'π Pi Workbench');assert.equal(await page.locator('#sidebar>.pw-titlebar').isVisible(),false);
  assert.equal(await page.locator('#pi-status').isVisible(),true);await page.locator('#pi-close').click();
  await page.setViewportSize({width:1440,height:900});
  assert.equal(await page.locator('.sheet-head').first().isVisible(),false,'sheet heads are phone only');

  assert.deepEqual(errors,[]);
  console.log('Design checks passed.');
 }finally{await browser?.close();/* a server that already died must not make this wait forever (Node would exit 0) */const exited=server.exitCode!==null||server.signalCode!==null?Promise.resolve():new Promise(resolve=>server.once('exit',resolve));server.kill();await exited;fs.rmSync(directory,{recursive:true,force:true,maxRetries:5,retryDelay:200});}
})().catch(error=>{console.error(error);process.exitCode=1;});
