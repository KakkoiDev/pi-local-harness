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
  assert.equal(await page.locator('#name-dialog-help').textContent(),'Creates “notes.md” in Design check and opens it.');
  await page.locator('#name-dialog-input').fill('tools/check.py');
  assert.equal(await page.locator('#name-dialog-help').textContent(),'Creates “tools/check.py” in Design check and opens it.');
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
  await page.goto(`${base}/p/${id}/work/TYPES.md`);await page.locator('#document-path').filter({hasText:'TYPES.md'}).waitFor();
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
  assert.notEqual(await page.locator('#menu-view [data-command="view-chat"]').getAttribute('aria-disabled'),'true','View › Chat opens the last project (round 3)');
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
  await page.locator('#name-dialog-input').fill('drafts/plan');assert.match(await page.locator('#name-dialog-help').textContent(),/Moves the file “drafts\/idea\.md” to “drafts\/plan”/);
  await page.locator('#name-dialog-input').press('Enter');await page.waitForURL(/drafts\/plan\.md$/);
  assert.ok(fs.existsSync(join(root,'drafts/plan.md'))&&!fs.existsSync(join(root,'drafts/idea.md')),'renamed on disk, extension kept');
  const folder=page.locator('#file-tree .pw-row',{hasText:'drafts'}).first();await folder.click();
  assert.equal(await folder.getAttribute('aria-current'),'true','a clicked folder is selected');
  await fileCommand('rename-file');await page.waitForFunction(()=>document.querySelector('#name-dialog').open);
  assert.equal(await page.locator('#name-dialog-input').inputValue(),'drafts','the command acts on the selected folder');
  await page.locator('#name-dialog-input').fill('archive/drafts');await page.locator('#name-dialog-input').press('Enter');
  await page.waitForURL(/archive\/drafts\/plan\.md$/);assert.ok(fs.existsSync(join(root,'archive/drafts/plan.md')),'the folder moved, the open file followed');
  await page.locator('#file-tree .pw-row',{hasText:'archive'}).first().click();await fileCommand('trash-page');
  await page.waitForFunction(()=>document.querySelector('#alert-dialog').open);assert.match(await page.locator('#alert-dialog').textContent(),/Move the folder “archive” to the Trash\?/);
  await page.getByRole('button',{name:'Move to Trash',exact:true}).click();
  await page.waitForFunction(()=>![...document.querySelectorAll('#file-tree .pw-row')].some(row=>row.textContent.includes('archive')));assert.ok(!fs.existsSync(join(root,'archive')));

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
  assert.deepEqual(await page.locator('#turn-into-menu>.pw-menu__item:visible').evaluateAll(items=>items.map(item=>({text:item.innerText.trim(),box:item.getBoundingClientRect()})).sort((a,b)=>a.box.top-b.box.top||a.box.left-b.box.left).map(item=>item.text)),['Text','Heading','Quote','Bullet','Number','Checkbox'],'PhoneEdit5 order');
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
 }finally{await browser?.close();const exited=new Promise(resolve=>server.once('exit',resolve));server.kill();await exited;fs.rmSync(directory,{recursive:true,force:true,maxRetries:5,retryDelay:200});}
})().catch(error=>{console.error(error);process.exit(1);});
