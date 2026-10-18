// Run with a Playwright installation: NODE_PATH=/path/to/node_modules node tests/browser/chat.cjs
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('node:child_process');
const { mkdtempSync, writeFileSync, chmodSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const assert = require('node:assert/strict');
const readline = require('node:readline');
// Task 263: screenshots go to a folder of this run, never fixed /tmp paths another run may be writing.
const SHOTS=mkdtempSync(join(tmpdir(),'plh-shots-')),shot=name=>join(SHOTS,name);
process.on('exit',()=>console.log(`Screenshots: ${SHOTS}`));
(async()=>{
 const directory=require('node:fs').realpathSync(mkdtempSync(join(tmpdir(),'pi-browser-')));
 const python=execFileSync('which',['python3'],{encoding:'utf8'}).trim();
 const fake=join(directory,'pi');
 writeFileSync(fake,`#!${python}\n`+require('node:fs').readFileSync('tests/fixtures/fake-pi.py','utf8'));chmodSync(fake,0o755);
 const server=spawn('python3',[join(process.env.PI_TEST_RUNTIME||'.','harness/services.py')],{env:{...Object.fromEntries(Object.entries(process.env).filter(([key])=>!/^PI_(HARNESS_|WEB_REMOTE_)/.test(key))) /* never the live harness or phone access */,PATH:directory+':'+process.env.PATH,PI_TAILSCALE:'false',PI_TRASH_DIR:join(directory,'Trash'),PI_GATE_PORT:'0',PI_OLLAMA_URL:'http://127.0.0.1:9',PI_WEB_PORT:'0',PI_AGENT_DATA:join(directory,'workspace'),PI_WEB_DATA:join(directory,'data'),PI_HARNESS_LOG_FILE:join(directory,'audit.log')},stdio:['ignore','pipe','pipe']});
 let browser;
 try{
  // The server's stderr (its request log) must be read: an unread pipe fills up and the server stalls mid-request.
  const serverLog=[];server.stderr.on('data',chunk=>{serverLog.push(...String(chunk).split('\n').filter(line=>line&&!/" (200|304) -/.test(line)));serverLog.splice(0,Math.max(0,serverLog.length-40));});
  process.on('exit',code=>{if(code)console.log('Server log (not 200/304):\n'+serverLog.join('\n'));});
  const lines=readline.createInterface({input:server.stdout});
  const ports=await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('Server startup timeout')),10000);lines.once('line',line=>{clearTimeout(timeout);resolve(JSON.parse(line));});server.once('exit',code=>reject(new Error('Server exited '+code)));});
  browser=await chromium.launch({headless:true,...(process.env.PI_TEST_CHROME?{executablePath:process.env.PI_TEST_CHROME}:{})});
  const page=await browser.newPage({viewport:{width:1440,height:950}}),errors=[];await page.route('**/api/updates',route=>route.fulfill({json:{state:'current',checked:1}}));
  page.on('pageerror',e=>errors.push(e.message));
  const chatConsole=[];page.on('console',message=>chatConsole.push(message.type()+': '+message.text()));
  // Reproduce the installed failure: an older running server cannot serve a
  // newly installed module. Report recovery instead of presenting dead tabs.
  await page.route('**/js/ui.mjs',route=>route.fulfill({status:404,body:'Not found'}));
  await page.goto(`http://127.0.0.1:${ports.web}`);
  await page.locator('#startup-error').waitFor();
  assert.match(await page.locator('#startup-error').textContent(),/start plh again/);
  await page.unroute('**/js/ui.mjs');
  await page.goto(`http://127.0.0.1:${ports.web}`);
  await page.getByRole('button',{name:'Create Your First Project…',exact:true}).waitFor();
  assert.deepEqual(await page.evaluate(()=>Promise.all(['16px "Source Serif 4"','italic 16px "Source Serif 4"','13px "IBM Plex Mono"','500 13px "IBM Plex Mono"'].map(font=>document.fonts.load(font).then(faces=>faces.length>0&&faces.every(face=>face.status==='loaded'),()=>false)))),[true,true,true,true],'the design fonts load from /fonts');assert.match(await page.evaluate(()=>getComputedStyle(document.getElementById('menubar')).fontFamily),/^system-ui/,'chrome uses the system font');
  assert.equal(await page.locator('#prompt').isDisabled(),true);
  await page.locator('#menubar [aria-controls="menu-file"]').click();assert.equal(await page.locator('#menu-file [data-command="new-file"]').getAttribute('aria-disabled'),'true','New File needs a project');assert.equal(await page.locator('#menu-file [data-command="new-project"]').getAttribute('aria-disabled'),'false');await page.keyboard.press('Escape');
  const leaveApp=async()=>{if(['activity','gate'].includes(await page.evaluate(()=>document.body.dataset.view))){await page.locator('#menubar [aria-controls="menu-file"]').click();await page.locator('#menu-file [data-command="close-window"]').click();}};
  async function createProject(name){
   if(await page.locator('#new-project').isVisible())await page.locator('#new-project').click();else{await page.locator('#menubar [aria-controls="menu-file"]').click();await page.locator('#menu-file [data-command="new-project"]').click();}
   await page.locator('#start-dialog').waitFor();await page.locator('#start-name').fill(name);/* round 12: Project Start; these tests are about chats, so the empty folder */
   await page.locator('#start-where').click();await page.waitForFunction(()=>document.querySelector('#folder-path').value.length>0&&!document.querySelector('#folder-use').disabled);await page.locator('#folder-path').fill(directory);
   const browsed=page.waitForResponse(response=>response.url().includes('/api/directories?path='));await page.locator('#folder-go').click();await browsed;
   await page.waitForFunction(path=>document.querySelector('#folder-path').value===path,directory);
   await page.locator('#folder-use').click();await page.locator('#folder-dialog').waitFor({state:'hidden'});await page.locator('#start-empty').click();
   await page.waitForFunction(()=>document.body.dataset.view==='chat'&&/\/chat$/.test(location.pathname));/* a new project opens its Chat (F1) */
   await page.locator('#work-tab').click();await page.getByRole('textbox',{name:'Heading',exact:true}).first().waitFor().catch(async error=>{console.error('DIAGNOSTIC createProject (intermittent, task 150):',JSON.stringify(await page.evaluate(()=>({url:location.pathname,view:document.body.dataset.view,level:document.body.dataset.level,path:document.querySelector('#document-path').textContent,notice:document.querySelector('#save-status')?.textContent,project:document.querySelector('#files-title').textContent,files:[...document.querySelectorAll('#file-tree .pw-row')].map(row=>row.textContent).slice(0,8),editor:document.querySelector('#document-editor').textContent.slice(0,120)}))),'\n'+chatConsole.slice(-15).join('\n'));throw error;});
  }
  await createProject('First project');
  const heading=page.getByRole('textbox',{name:'Heading',exact:true}).first();await heading.fill('Edited roadmap');
  await page.getByText('Saved',{exact:true}).waitFor();
  assert.match(require('node:fs').readFileSync(join(directory,'First project/ROADMAP.md'),'utf8'),/# Edited roadmap/);
  // Ruler and block handle: one handle menu per block, #block-style follows the focused block, ⌥⌘↑/↓ move it.
  const roadmapFile=()=>require('node:fs').readFileSync(join(directory,'First project/ROADMAP.md'),'utf8'),texts=()=>page.evaluate(()=>[...document.querySelectorAll('#document-editor [role=textbox]')].map(box=>box.textContent));
  assert.equal(await page.locator('#document-editor select').count(),0,'per-block selects are replaced by the handle');
  await heading.focus();assert.equal(await page.locator('#block-style').inputValue(),'heading');assert.equal(await page.locator('.pw-block--focused').count(),1);
  await page.keyboard.press('ControlOrMeta+Alt+ArrowDown');await page.waitForFunction(()=>document.querySelectorAll('#document-editor [role=textbox]')[1]?.textContent==='Edited roadmap');
  assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Edited roadmap','the moved block keeps focus');
  await page.locator('.pw-block--focused .pw-block__handle').click();await page.locator('#block-menu').getByRole('menuitem',{name:'Move Up'}).click();
  await page.waitForFunction(()=>document.querySelectorAll('#document-editor [role=textbox]')[0]?.textContent==='Edited roadmap');
  await page.locator('#document-editor .pw-block').nth(2).locator('[role=textbox]').focus();assert.equal(await page.locator('#block-style').inputValue(),'text');
  await page.locator('#block-style').selectOption('quote');
  await page.waitForFunction(()=>document.querySelectorAll('#document-editor .pw-block')[2]?.classList.contains('pw-block--quote'));await page.getByText('Saved',{exact:true}).waitFor();assert.match(roadmapFile(),/\n> Describe what we are building\./);
  await page.locator('.pw-block--focused .pw-block__handle').click();assert.equal(await page.locator('#turn-into-menu').isVisible(),false,'Turn Into is a submenu');
  assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Turn Into▸');await page.keyboard.press('ArrowRight');await page.waitForFunction(()=>document.activeElement.closest('#turn-into-menu')&&document.activeElement.textContent==='Paragraph');
  await page.keyboard.press('ArrowLeft');await page.locator('#turn-into-menu').waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>document.activeElement.getAttribute('aria-expanded')),'false');assert.equal(await page.locator('#block-menu').isVisible(),true);
  await page.locator('#block-menu').getByRole('menuitem',{name:'Turn Into'}).click();await page.locator('#turn-into-menu').getByRole('menuitemradio',{name:'Paragraph'}).click();await page.waitForFunction(()=>!document.querySelectorAll('#document-editor .pw-block')[2]?.classList.contains('pw-block--quote'));
  await page.getByText('Saved',{exact:true}).waitFor();assert.deepEqual((await texts()).slice(0,3),['Edited roadmap','Goal','Describe what we are building.']);
  await heading.evaluate(element=>{const range=document.createRange();range.selectNodeContents(element);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);document.dispatchEvent(new Event('selectionchange'));});
  await page.locator('#selection-bar').waitFor();assert.equal(await page.locator('#selection-comment').count(),0,'the ruler Comment button is replaced by the float bar');
  await page.keyboard.press('ControlOrMeta+Shift+M');await page.waitForFunction(()=>document.activeElement?.id==='comment-text');
  await page.locator('#selected-passage').waitFor();await page.locator('#comment-text').fill('Implement this roadmap');await page.getByRole('button',{name:'Add Comment',exact:true}).click();
  const mark=page.locator('#document-editor .pw-mark');await mark.first().waitFor();assert.equal(await mark.getAttribute('aria-label'),'Comment 1');
  assert.equal(await page.locator('#document-editor .pw-anchor').first().textContent(),'Edited roadmap');assert.deepEqual((await texts())[0],'Edited roadmap','the marker number is not document text');
  assert.equal(await page.locator('#comment-filter [data-filter=open]').textContent(),'Open 1');assert.match(await page.locator('.pw-review-item__head').first().textContent(),/^1 · Not sent to Pi/);
  await mark.click();const thread=page.locator('#document-editor .pw-thread');await thread.waitFor();assert.equal(await mark.getAttribute('aria-expanded'),'true');
  await thread.getByRole('button',{name:'Ask Pi',exact:true}).click();await page.locator('#document-editor .pw-anchor--sent').waitFor();await thread.getByText(/Sent to Pi|Pi is working on it|Pi answered/).waitFor();
  assert.equal(await thread.getByRole('button',{name:'Delete',exact:true}).count(),0,'a comment sent to Pi cannot be deleted');
  await thread.getByRole('textbox',{name:'Reply to text comment'}).fill('Cover Japanese too');await thread.getByRole('button',{name:'Add Note',exact:true}).click();await thread.getByText('Cover Japanese too',{exact:true}).waitFor();
  await page.locator('#document-editor .pw-block').nth(1).locator('.pw-block__content').evaluate(element=>{const range=document.createRange();range.selectNodeContents(element);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);document.dispatchEvent(new Event('selectionchange'));});
  await page.locator('#selection-bar').getByRole('button',{name:/Comment/}).click();await page.locator('#comment-text').fill('Drop this heading');await page.getByRole('button',{name:'Add Comment',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('#document-editor .pw-mark').length===2);
  const second=page.locator('.pw-review-item').filter({hasText:'Drop this heading'});await second.getByRole('button',{name:'Delete',exact:true}).click();
  await page.locator('#toast').filter({hasText:'Comment deleted. It’s kept under Deleted in Review.'}).waitFor();await page.waitForFunction(()=>document.querySelectorAll('#document-editor .pw-mark').length===1);
  await page.keyboard.press('ControlOrMeta+z');await page.waitForFunction(()=>document.querySelectorAll('#document-editor .pw-mark').length===2);
  await second.getByRole('button',{name:'Delete',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('#document-editor .pw-mark').length===1);
  await page.locator('#comment-filter [data-filter=deleted]').click();assert.equal(await page.locator('#comment-filter [data-filter=deleted]').textContent(),'Deleted 1');
  await page.locator('.pw-review-item').filter({hasText:'Drop this heading'}).getByRole('button',{name:'Restore',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('#document-editor .pw-mark').length===2);
  await page.locator('#comment-filter [data-filter=open]').click();await page.locator('.pw-review-item').filter({hasText:'Drop this heading'}).getByRole('button',{name:'Resolve',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('#document-editor .pw-mark').length===1);
  await page.locator('#show-resolved').check();await page.locator('#document-editor .pw-mark--resolved').waitFor();await page.locator('#show-resolved').uncheck();
  await page.evaluate(()=>document.activeElement?.blur());await page.keyboard.press('ControlOrMeta+Alt+BracketRight');await page.locator('.pw-review-item[aria-current=true]').filter({hasText:'Implement this roadmap'}).waitFor();await thread.waitFor();
  await page.locator('#document-editor .pw-block').nth(2).locator('.pw-block__content').evaluate(element=>{const range=document.createRange();range.selectNodeContents(element);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);document.dispatchEvent(new Event('selectionchange'));});
  await page.locator('#selection-bar').getByRole('button',{name:/Comment/}).click();await page.locator('#comment-text').fill('Tighten this TEST_SUGGEST');await page.getByRole('button',{name:'Add Comment',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('#document-editor .pw-mark').length===2);
  await page.locator('.pw-review-item').filter({hasText:'Tighten this TEST_SUGGEST'}).locator('.pw-review-item__head').click();const suggestThread=page.locator('#document-editor .pw-thread').filter({hasText:'Tighten this TEST_SUGGEST'});
  await suggestThread.getByRole('button',{name:'Ask Pi',exact:true}).click();const suggest=suggestThread.locator('.pw-suggest');await suggest.waitFor({timeout:20000});
  assert.equal(await suggest.locator('del').textContent(),'Describe what we are building.');assert.equal(await suggest.locator('ins').textContent(),'State the goal in one line.');await suggest.getByRole('button',{name:'Keep Mine',exact:true}).waitFor();
  await suggest.getByRole('button',{name:'Apply Change',exact:true}).click();await page.waitForFunction(()=>[...document.querySelectorAll('#document-editor .pw-block')].some(block=>block.textContent.includes('State the goal in one line.')));
  await page.waitForFunction(()=>document.querySelectorAll('#document-editor .pw-mark').length===1);assert.equal(await page.locator('#document-editor .pw-block').filter({hasText:'Describe what we are building.'}).count(),0);
  await page.locator('#document-discussion>summary').click();await page.locator('#document-prompt').fill('Review the whole roadmap');await page.getByRole('button',{name:'Send Request',exact:true}).click();
  await page.keyboard.press('Control+Alt+Digit3');const requestRow=page.locator('.activity-task.pw-table__row').filter({hasText:'Review the whole roadmap'});await requestRow.waitFor();
  assert.equal(await requestRow.locator('.task-state.pw-glyph').count(),1);assert.match(await page.locator('#activity-summary').textContent(),/running|waiting|Nothing running or waiting/);
  await requestRow.locator('.activity-request').click();assert.equal(await requestRow.getAttribute('aria-current'),'true');const detail=page.locator('#activity-detail');await detail.getByRole('link',{name:/^(Open in Chat|Show Comment|Show in Review)$/}).waitFor();assert.match(await detail.locator('h3').textContent(),/^(Completed|Running|Waiting) in \S/);
  await page.locator('.activity-task').filter({hasText:'Implement this roadmap'}).locator('.activity-request').click();await detail.getByText('Implement this roadmap').waitFor();assert.equal(await detail.getByRole('link',{name:/^(Open in Chat|Show Comment|Show in Review)$/}).count(),1);
  await requestRow.focus();const distance=await page.evaluate(()=>{const rows=[...document.querySelectorAll('.activity-task')].map(row=>row.textContent);return rows.findIndex(text=>text.includes('Implement this roadmap'))-rows.findIndex(text=>text.includes('Review the whole roadmap'));}),above=distance<0;
  await page.keyboard.press(above?'ArrowUp':'ArrowDown');for(let step=1;step<Math.abs(distance);step++)await page.keyboard.press(above?'ArrowUp':'ArrowDown');await page.waitForFunction(()=>document.activeElement?.matches('.activity-task[aria-current=true]')&&document.activeElement.textContent.includes('Implement this roadmap'));for(let step=0;step<Math.abs(distance);step++)await page.keyboard.press(above?'ArrowDown':'ArrowUp');await page.waitForFunction(()=>document.activeElement?.textContent.includes('Review the whole roadmap'));
  await detail.getByRole('button',{name:'Show Task Record',exact:true}).click();await page.locator('#activity-record-text').filter({hasText:'Review the whole roadmap'}).waitFor();
  // 2026-10-14: the same button hides it ("Hide Task Record"), as does the menu item; no disclosure triangle to find.
  const hide=detail.getByRole('button',{name:'Hide Task Record',exact:true});await hide.waitFor();
  assert.equal(await hide.getAttribute('aria-expanded'),'true');assert.equal(await hide.getAttribute('aria-controls'),'activity-record');assert.match(await page.locator('#activity-record-path').textContent(),/activity\/[0-9a-f]{32}\.md$/,'task 177 (A_Record): the record\'s path in its head');
  assert.equal(await page.locator('#activity-record-close').isVisible(),false,'Close is the phone sheet\'s');assert.equal(await page.locator('#activity-record summary').count(),0);
  assert.equal((await page.locator('[data-command="task-record"]').textContent()).replace('⌃⌥R',''),'Hide Task Record');/* round 12: the menu shows ⌃⌥R */
  await hide.click();await page.locator('#activity-record').waitFor({state:'hidden'});await detail.getByRole('button',{name:'Show Task Record',exact:true}).waitFor();
  assert.equal((await page.locator('[data-command="task-record"]').textContent()).replace('⌃⌥R',''),'Show Task Record');
  await detail.getByRole('button',{name:'Show Task Record',exact:true}).click();await page.locator('#activity-record').waitFor();
  assert.equal(require('node:fs').readdirSync(join(directory,'workspace/activity')).filter(name=>name.endsWith('.md')).length,3,'two roadmap requests and the suggestion request');
  await leaveApp();await page.locator('#chat-tab').click();assert.equal(await page.locator('#messages .pw-msg').count(),0,'document and comment answers stay in the document (task 115)');
  await page.locator('#prompt').fill('First question');
  await page.locator('#files').setInputFiles([
   {name:'notes.txt',mimeType:'text/plain',buffer:Buffer.from('Attached text')},
   {name:'pixel.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jCWQAAAAASUVORK5CYII=','base64')},
   {name:'voice.wav',mimeType:'audio/wav',buffer:Buffer.from('audio-ui-fixture')}
  ]);
  assert.equal(await page.locator('.attachment-chip.pw-chip').count(),3);assert.match(await page.locator('#hint').textContent(),/^3 files · 0\.0 MiB of 20 MiB$/);
  await page.locator('#files').setInputFiles([{name:'site-video.mov',mimeType:'video/quicktime',buffer:Buffer.alloc(13*1024*1024)}]);
  assert.equal(await page.locator('#error').textContent(),'“site-video.mov” is 13 MiB. Limit: 12 MiB per file and 20 MiB in total.');assert.equal(await page.locator('#error svg').count(),1);
  const dragged=await page.evaluateHandle(()=>{const data=new DataTransfer();data.items.add(new File(['x'],'a.txt'));data.items.add(new File(['y'],'b.txt'));return data;});
  await page.locator('#composer').dispatchEvent('dragover',{dataTransfer:dragged});assert.equal(await page.locator('#composer.pw-composer--dragging').count(),1);assert.equal(await page.locator('#hint').textContent(),'Drop to attach 2 files');
  await page.locator('#composer').dispatchEvent('dragleave',{dataTransfer:dragged});assert.equal(await page.locator('#composer.pw-composer--dragging').count(),0);assert.match(await page.locator('#hint').textContent(),/^3 files/);
  await page.getByRole('button',{name:'Remove voice.wav'}).click();await page.locator('#send').click();
  await page.locator('#messages').getByText('reply 1',{exact:true}).first().waitFor(); // the live and the finished message can both show it for a moment
  const reasoning=page.locator('#messages details').first();await reasoning.locator('summary').click();for(let i=0;i<2;i++)await page.waitForResponse(response=>response.url().endsWith('/api/workspace'));assert.equal(await reasoning.getAttribute('open'),'');
  assert.equal(await page.locator('.message.user.pw-msg.pw-msg--user').count(),1,'only what was typed in Chat (task 115)');assert.equal(await page.locator('.message.assistant .pw-msg__label b').first().textContent(),'Pi');assert.equal(await page.locator('#send').textContent(),'Send');assert.equal(await page.locator('.message img').count(),1);
  await createProject('Second project');await leaveApp();await page.locator('#chat-tab').click();
  await page.locator('#prompt').fill('Second question');await page.locator('#send').click();
  await page.locator('#messages').getByText('reply 1',{exact:true}).waitFor();
  const onlyChat=async(mine,other)=>{await page.locator('#messages').getByText(mine,{exact:true}).waitFor();assert.equal(await page.locator('#messages').getByText(other,{exact:true}).count(),0,'each project shows only its own chat');};/* task 150: "reply 1" exists in both chats */
  await onlyChat('Second question','First question');
  await page.locator('#show-projects').click();
  assert.equal(await page.locator('#project-list .pw-row').count(),2);
  await page.locator('#project-search').fill('missing project');await page.getByText('No matching projects',{exact:true}).waitFor();
  await page.locator('#project-search').fill('First');assert.equal(await page.locator('#project-list .pw-row').count(),1);await page.locator('#project-search').fill('');
  await page.getByRole('button',{name:'First project',exact:true}).click();await leaveApp();await page.locator('#chat-tab').click();
  await onlyChat('First question','Second question');
  assert.equal(await page.locator('#window-title').textContent(),'First project');
  // Menu bar: WAI-ARIA keyboard pattern, disabled items, shortcuts, project list, status.
  const focused=()=>page.evaluate(()=>document.activeElement.dataset.command||document.activeElement.getAttribute('aria-controls'));
  await page.locator('#agent-state').filter({hasText:/^Ready$/}).waitFor();
  await page.locator('#menubar [aria-controls="menu-file"]').focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('#menu-file').isVisible(),true);assert.equal(await focused(),'new-project');
  await page.keyboard.press('ArrowDown');assert.equal(await focused(),'add-folder');await page.keyboard.press('ArrowUp');await page.keyboard.press('Enter');
  await page.locator('#start-dialog').waitFor();assert.equal(await page.locator('#menu-file').isVisible(),false);
  await page.locator('#start-cancel').click();await page.locator('#start-dialog').waitFor({state:'hidden'});
  await page.locator('#menubar [aria-controls="menu-edit"]').click();
  assert.equal(await page.locator('#menu-edit [data-command="find-file"]').getAttribute('aria-disabled'),'true','Find in Files needs the Work view');
  await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#menu-view').isVisible(),true);assert.equal(await page.locator('#menu-edit').isVisible(),false);
  await page.keyboard.press('Escape');assert.equal(await page.locator('#menu-view').isVisible(),false);assert.equal(await focused(),'menu-view');
  for(const [key,next] of [['2','work'],['3','activity'],['4','gate'],['close','work'],['1','chat']]){if(key==='close')await page.locator('#main-window>.pw-titlebar [data-command="close-window"]').click();else await page.keyboard.press('Control+Alt+Digit'+key);/* round 12: ⌃⌥1–4 */await page.waitForFunction(value=>document.body.dataset.view===value,next);}
  await page.locator('#menubar [aria-controls="menu-project"]').click();
  assert.equal(await page.locator('#menu-project-list [aria-checked="true"]').textContent(),'First project');
  await page.locator('#menu-project-list').getByRole('menuitemradio',{name:'Second project'}).click();await page.waitForFunction(()=>document.querySelector('#files-title').textContent==='Second project');
  await page.locator('#menubar [aria-controls="menu-project"]').click();await page.locator('#menu-project-list').getByRole('menuitemradio',{name:'First project'}).click();await page.waitForFunction(()=>document.querySelector('#files-title').textContent==='First project');
  await page.keyboard.press('ControlOrMeta+Comma');const settings=page.locator('#settings-dialog');await settings.waitFor();
  await settings.getByLabel('Inverse (white on black, always)').check();await settings.getByRole('radio',{name:'Gray'}).click();await settings.getByLabel(/Return sends a message/).uncheck();await settings.getByRole('button',{name:'Done',exact:true}).click();await settings.waitFor({state:'hidden'});
  assert.deepEqual(await page.evaluate(()=>[document.documentElement.dataset.theme,document.documentElement.dataset.pattern,getComputedStyle(document.body).backgroundColor]),['dark','gray','rgb(0, 0, 0)']);
  await page.keyboard.press('Control+Alt+Digit1');await page.locator('#prompt').fill('line one');await page.locator('#prompt').press('Enter');assert.equal(await page.locator('#prompt').inputValue(),'line one\n','Return adds a line when Return sends is off');await page.locator('#prompt').fill('');
  await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark'&&document.documentElement.dataset.pattern==='gray');await page.locator('#prompt:not([disabled])').waitFor();
  await page.keyboard.press('ControlOrMeta+Comma');await settings.getByLabel('Paper (black on white, always)').check();await settings.getByRole('radio',{name:'Dots'}).click();await settings.getByLabel(/Return sends a message/).check();await settings.getByRole('button',{name:'Done',exact:true}).click();
  assert.deepEqual(await page.evaluate(()=>[document.documentElement.dataset.theme,document.documentElement.dataset.pattern]),['light','dots']);
  await page.keyboard.press('ControlOrMeta+Comma');await settings.getByLabel('Inverse (white on black, always)').check();await settings.getByRole('button',{name:'Done',exact:true}).click();assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),'dark','Settings apply immediately');await page.keyboard.press('ControlOrMeta+Comma');await settings.getByLabel('Paper (black on white, always)').check();await settings.getByRole('button',{name:'Done',exact:true}).click();await page.keyboard.press('Control+Alt+Digit2');await page.waitForFunction(()=>document.body.dataset.view==='work');
  await page.locator('#menubar [aria-controls="menu-pi"]').click();await page.locator('#menu-pi [data-command="about"]').click();await page.locator('#about-dialog').getByText(/gemma4/).waitFor();await page.keyboard.press('Enter');await page.locator('#about-dialog').waitFor({state:'hidden'});
  await page.locator('#menubar [aria-controls="menu-pi"]').click();assert.equal(await page.locator('#menu-pi [data-command="open-on-phone"]').getAttribute('aria-disabled'),'true','Open on Phone… needs the tailnet address');await page.keyboard.press('Escape');
  {const phone=await browser.newPage({viewport:{width:1440,height:950}});phone.on('pageerror',e=>errors.push(e.message));await phone.route('**/api/config',async route=>{const response=await route.fetch();route.fulfill({response,json:{...await response.json(),phoneUrl:'https://pi.example.ts.net'}});});
   await phone.goto(page.url());await phone.waitForFunction(()=>/gemma/i.test(document.getElementById('model').textContent));await phone.locator('#menubar [aria-controls="menu-pi"]').click();await phone.locator('#menu-pi [data-command="open-on-phone"]:not([aria-disabled="true"])').click();
   await phone.locator('#phone-dialog').getByText('Scan with a phone on the same Tailscale account, or open the address.',{exact:true}).waitFor();assert.equal(await phone.locator('#phone-url').inputValue(),'https://pi.example.ts.net');assert.equal(await phone.locator('#phone-dialog').getByRole('button',{name:'Copy',exact:true}).isVisible(),true);
   await phone.locator('#phone-qr svg').waitFor();assert.ok(await phone.locator('#phone-qr svg path, #phone-qr svg rect').count()>0,'the address is also a QR code');
   await phone.keyboard.press('Enter');await phone.locator('#phone-dialog').waitFor({state:'hidden'});await phone.close();}
  await page.locator('#menubar [aria-controls="menu-file"]').click();await page.locator('#menu-file [data-command="new-file"]').click();await page.locator('#name-dialog-title').filter({hasText:'New File'}).waitFor();
  await page.locator('#name-dialog-input').fill('Meeting notes');await page.keyboard.press('Enter');await page.locator('#document-path').filter({hasText:/meeting/i}).waitFor();
  await page.locator('#menubar [aria-controls="menu-project"]').click();await page.locator('#menu-project [data-command="project-chat"]').click();await page.locator('#messages').getByText('reply 1',{exact:true}).waitFor();
  await page.reload();await onlyChat('First question','Second question');
  await leaveApp();await page.locator('#work-tab').click();await page.locator('#file-search').fill('ROADMAP');assert.equal(await page.locator('.file-item').count(),1);await page.locator('#file-search').fill('');await page.getByRole('button',{name:'ROADMAP.md',exact:true}).click();await page.getByRole('textbox',{name:'Heading',exact:true}).filter({hasText:'Edited roadmap'}).waitFor();
  const fileRow=page.locator('#file-tree [aria-current="page"]');assert.deepEqual(await fileRow.evaluate(row=>{const style=getComputedStyle(row);return [row.classList.contains('pw-row'),style.textAlign,style.color===getComputedStyle(document.body).backgroundColor,Math.round(row.getBoundingClientRect().width)===Math.round(document.getElementById('file-tree').clientWidth),row.querySelector('.pw-row__label')?.textContent];}),[true,'left',true,true,'ROADMAP.md'],'the open file is a left-aligned selected .pw-row');
  assert.deepEqual(await page.locator('label:has(#show-resolved)').evaluate(label=>{const box=label.getBoundingClientRect(),check=label.querySelector('input').getBoundingClientRect();return [check.left-box.left<=12,Math.abs((check.top+check.bottom)/2-(box.top+box.bottom)/2)<=2,box.height<=48];}),[true,true,true],'Show resolved: checkbox inline at the left of its label');
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
  const gate=await fetch(`http://127.0.0.1:${ports.gate}/gatekeep`,{method:'POST',headers:{'Content-Type':'application/json','X-Gate-Token':ports.token},body:JSON.stringify({tool_name:'execute_command',args:{command:'rm -fr *'},auth_level:'admin'})});
  assert.equal((await gate.json()).outcome,'BLOCK');
  await page.keyboard.press('Control+Alt+Digit4');
  const blockedRow=page.locator('div.gate-event.pw-table__row').filter({hasText:'Blocked'}).first();await blockedRow.waitFor();assert.equal(await blockedRow.getAttribute('aria-current'),'true','the newest blocked check is selected');
  const info=page.locator('#event-info');await info.getByText('BLOCK',{exact:true}).waitFor();await info.getByText('Recursive deletion targets',{exact:false}).waitFor();assert.match(await info.locator('.pw-mono').first().textContent(),/rm -fr \*/);
  await info.getByRole('button',{name:'Copy Command',exact:true}).waitFor();
  await leaveApp();await page.locator('#chat-tab').click();await page.locator('#prompt').fill('Make a tune TEST_MUSIC');await page.locator('#send').click();
  const musicAudio=page.locator('#messages .assistant audio');await musicAudio.waitFor();
  await musicAudio.evaluate(audio=>new Promise((resolve,reject)=>{if(audio.readyState>=1)return resolve();audio.onloadedmetadata=resolve;audio.onerror=()=>reject(Error('WAV did not load'));}));
  assert.ok(await musicAudio.evaluate(audio=>audio.duration>0&&audio.controls),'generated music is audible in the existing chat');
  await page.reload();await page.locator('#messages .assistant audio').waitFor();
  assert.equal(await page.locator('#messages .assistant a[download="score.json"]').count(),1,'editable score survives reload');
  await leaveApp();await page.locator('#chat-tab').click();await page.locator('#prompt').fill('Read the readme TEST_TOOL');await page.locator('#send').click();
  const liveTool=page.locator('#messages .pw-tool--live').filter({hasText:'$ cat README.md'});await liveTool.filter({hasText:'Approved'}).filter({hasText:'Running'}).waitFor();await liveTool.waitFor({state:'detached'});
  await page.keyboard.press('Control+Alt+Digit3');await page.locator('.activity-task').filter({hasText:'TEST_TOOL'}).locator('.activity-request').click();
  const doneTool=page.locator('#activity-detail .pw-tool').filter({hasText:'$ cat README.md'});await doneTool.filter({hasText:'Approved'}).filter({hasText:'Verified'}).waitFor();
  const facts=await page.locator('#activity-detail .activity-detail__facts').evaluate(list=>Object.fromEntries([...list.querySelectorAll('dt')].map(term=>[term.textContent,term.nextElementSibling.textContent])));
  assert.equal(facts['Last command'],'cat README.md');assert.equal(facts.Gate,'1 approved · 0 blocked');assert.equal(facts.Phase,'Completed');
  await doneTool.getByRole('link',{name:'Show in Gate'}).click();await page.locator('#gate-panel').waitFor();await info.getByText('SUCCESS',{exact:true}).waitFor();assert.match(await info.locator('.pw-mono').first().textContent(),/cat README\.md/);
  const eventRow=page.locator('div.gate-event[aria-current=true]');assert.deepEqual((await eventRow.locator(':scope>*').allTextContents()).slice(3),['cat README.md','First project','Web'],'Command, Project and From columns');
  assert.equal(await info.locator('dt',{hasText:'Project'}).locator('xpath=following-sibling::dd[1]').textContent(),'First project');
  await info.getByRole('button',{name:'Show in Activity',exact:true}).click();await page.locator('#activity-panel').waitFor();await page.locator('.activity-task[aria-current=true]').filter({hasText:'TEST_TOOL'}).waitFor();await page.keyboard.press('Control+Alt+Digit4');
  assert.equal(await page.locator('#composer').isVisible(),false);
  await page.locator('#gate-filter').selectOption('failures');
  await page.screenshot({path:shot('pi-gate-desktop.png')});
  await leaveApp();await page.locator('#chat-tab').click();
  await page.screenshot({path:shot('pi-chat-desktop.png')});
  { // Bug 173: Show in Activity on the answer being written, then Open in Chat: the thread is back at its newest message,
    // with no white band under it (it came back scrolled to the top, or centred on the question).
  await page.setViewportSize({width:1024,height:560});/* short: the conversation is taller than the thread; 761-1100px makes #desk position:relative */
  await page.locator('#prompt').fill('Long answer TEST_SLOW');await page.locator('#send').click();
  const liveLink=page.locator('#messages [data-live]').getByRole('link',{name:'Show in Activity'});await liveLink.click();await page.locator('#activity-panel').waitFor();
  await page.locator('#activity-detail').getByRole('link',{name:'Open in Chat',exact:true}).click();await page.locator('#thread').waitFor();
  await page.waitForTimeout(300);/* a frame for any late scroll */
  const back=await page.locator('#thread').evaluate(thread=>{const last=[...thread.querySelectorAll('#messages > .pw-msg')].at(-1).getBoundingClientRect(),box=thread.getBoundingClientRect();return{gap:thread.scrollHeight-thread.scrollTop-thread.clientHeight,tall:thread.scrollHeight>thread.clientHeight,lastBottom:last.bottom,boxBottom:box.bottom};});
  const lifted=await page.evaluate(()=>{const shifted=[document.scrollingElement,document.body,...document.querySelectorAll('#main-window,#main-window *')].filter(element=>element!==document.getElementById('thread')&&!document.getElementById('thread').contains(element)&&element.scrollTop>0);return shifted.map(element=>(element.id||element.className||element.tagName)+':'+element.scrollTop);});
  assert.deepEqual(lifted,[],'bug 173: nothing around the thread is scrolled (the window was lifted, white at the bottom)');
  const desk=await page.locator('#desk').evaluate(element=>({extra:element.scrollHeight-element.clientHeight}));
  assert.ok(desk.extra<=1,'bug 173: the desk has nothing to scroll (the hidden #chat-announce under a long conversation made it '+desk.extra+'px taller, and the window lifted)');
  assert.ok(back.tall,'the conversation is taller than the thread: '+JSON.stringify(back));
  assert.ok(back.gap<=3,'bug 173: back at the newest message: '+JSON.stringify(back));
  assert.ok(back.lastBottom<=back.boxBottom+1&&back.lastBottom>back.boxBottom-200,'the answer being written is in view at the bottom: '+JSON.stringify(back));
  await page.locator('#stop').click();await page.locator('#messages [data-live]').waitFor({state:'detached'});
  await page.setViewportSize({width:1440,height:950});
  // Plan 184 (A_Retry): a request that stopped offers Ask Pi to Retry…, with an optional note; the stopped run keeps its record.
  await page.keyboard.press('Control+Alt+Digit3');const stoppedRow=page.locator('.activity-task').filter({hasText:'Long answer TEST_SLOW'});
  await stoppedRow.locator('.task-state').filter({hasText:'Stopped'}).waitFor();await stoppedRow.locator('.activity-request').click();
  await page.locator('#activity-detail').getByRole('button',{name:'Ask Pi to Retry…',exact:true}).click();const retryDialog=page.locator('#retry-dialog');await retryDialog.waitFor();
  assert.equal(await page.locator('#retry-dialog-request').textContent(),'“Long answer TEST_SLOW”');assert.match(await page.locator('#retry-dialog-help').textContent(),/^Queues the request again in .+\. The failed run stays in its record\.$/);
  await page.locator('#retry-dialog-note').fill('Try a shorter answer.');await retryDialog.getByRole('button',{name:'Queue Again',exact:true}).click();
  await page.locator('#toast-text').filter({hasText:/^Queued again in /}).waitFor();
  const retried=page.locator('.activity-task').filter({hasText:'Note from the person: Try a shorter answer.'});await retried.waitFor();
  assert.equal(await stoppedRow.locator('.task-state').filter({hasText:'Stopped'}).count(),1,'the stopped run stays');
  await page.evaluate(async()=>{const {jobs}=await fetch('/api/workspace').then(r=>r.json());for(const job of jobs.filter(job=>job.retry_of&&['queued','running'].includes(job.status)))await fetch(job.status==='queued'?'/api/jobs/cancel':'/api/jobs/stop',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:job.id})});});
  await leaveApp();await page.locator('#chat-tab').click();
  }
  await page.setViewportSize({width:390,height:844});await page.locator('#open-menu').click();
  assert.equal(await page.locator('#backdrop').isVisible(),true);
  await page.getByRole('button',{name:'Second project',exact:true}).click();await page.locator('#phone-view').click();await page.locator('#phone-view-menu [data-view="chat"]').click();
  await page.locator('#backdrop').waitFor({state:'hidden'});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:shot('pi-chat-mobile.png')});
  await page.locator('#prompt').fill('TEST_WAIT');await page.locator('#send').click();await page.locator('#stop').waitFor();await page.locator('.pw-tool--live').filter({hasText:'Using bash'}).waitFor();await page.locator('#send').filter({hasText:/^Queue$/}).waitFor();
  await page.locator('#prompt').fill('Queued work to cancel');await page.locator('#send').click();await page.locator('.pw-queue-note').filter({hasText:'Next: 1 request waiting in Second project'}).waitFor();await page.locator('#open-menu').click();await page.locator('#agent-activity').click();/* round 8: Activity is in the π sheet */
  const waiting=page.locator('.activity-task').filter({hasText:'Queued work to cancel'});await waiting.locator('.activity-request').click();await page.locator('#activity-detail').getByRole('button',{name:'Cancel…',exact:true}).click();await page.locator('#alert-message').filter({hasText:'Cancel the waiting request?'}).waitFor();await page.locator('#alert-dialog').getByRole('button',{name:'Cancel Request',exact:true}).click();await page.locator('#detail-back').click();await waiting.locator('.task-state').filter({hasText:'Cancelled'}).waitFor();
  await page.locator('.activity-task').filter({hasText:'TEST_WAIT'}).locator('.activity-request').click();
  { // Task 177 (Ph_ActivityRecord): on the phone the record is a sheet titled "Task record" with Close.
  await page.locator('#activity-detail').getByRole('button',{name:'Show Task Record',exact:true}).click();const sheet=page.locator('#activity-record');await sheet.waitFor();
  const box=await sheet.boundingBox();assert.ok(box.width===390&&Math.round(box.y+box.height)>=840,'a bottom sheet: '+JSON.stringify(box));
  assert.equal(await page.locator('#activity-record-scrim').isVisible(),true,'over the dither');
  await page.locator('#activity-record-close').click();await sheet.waitFor({state:'hidden'});assert.equal(await page.locator('#activity-record-scrim').isVisible(),false);
  await page.locator('#activity-detail').getByRole('button',{name:'Show Task Record',exact:true}).waitFor();
  }
  await page.locator('#activity-detail').getByRole('button',{name:/^Stop/}).click();await page.locator('#detail-back').click();
  await page.locator('.activity-task').filter({hasText:'TEST_WAIT'}).locator('.task-state').filter({hasText:'Stopped'}).waitFor();
  await page.setViewportSize({width:1440,height:950});if(await page.locator('#show-projects').isVisible())await page.locator('#show-projects').click();await page.getByRole('button',{name:'First project',exact:true}).click();
  await page.locator('#show-projects').click();
  const projectRow=page.locator('#project-list [aria-current="page"]');assert.deepEqual(await projectRow.evaluate(row=>{const style=getComputedStyle(row);return [row.classList.contains('pw-row'),style.backgroundColor!=='rgba(0, 0, 0, 0)',style.color===getComputedStyle(document.body).backgroundColor,Math.round(row.getBoundingClientRect().width)===Math.round(document.getElementById('project-list').clientWidth)];}),[true,true,true,true],'the current project is a full-width selected .pw-row');
  await projectRow.click();await page.locator('#files-title').filter({hasText:'First project'}).waitFor();
  await page.getByRole('button',{name:'ROADMAP.md',exact:true}).click();await page.locator('#document-path').filter({hasText:'ROADMAP.md'}).waitFor();assert.equal(await page.locator('#comments-panel').isVisible(),true);await page.keyboard.press('ControlOrMeta+Alt+KeyR');await page.locator('#comments-panel').waitFor({state:'hidden'});assert.equal(await page.locator('#toggle-review').getAttribute('aria-pressed'),'false');await page.locator('#toggle-review').click();await page.locator('#comments-panel').waitFor();
  await page.locator('#menubar [aria-controls="menu-file"]').click();await page.locator('#menu-file [data-command="trash-page"]').click();await page.locator('#alert-message').filter({hasText:'Move “ROADMAP.md” to the Trash?'}).waitFor();assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Cancel','the safe button is the default');await page.keyboard.press('Escape');await page.locator('#alert-dialog').waitFor({state:'hidden'});assert.equal(require('node:fs').existsSync(join(directory,'First project/ROADMAP.md')),true);
  await page.locator('#editor-mode').selectOption('source');
  writeFileSync(join(directory,'First project/ROADMAP.md'),'# Changed outside the browser\n');
  await page.locator('#document-source').fill('# My unsaved 日本語 draft\n');await page.locator('#save-recovery').waitFor();
  assert.match(await page.locator('#document-source').inputValue(),/My unsaved/);assert.match(require('node:fs').readFileSync(join(directory,'First project/ROADMAP.md'),'utf8'),/Changed outside/);
  page.once('dialog',dialog=>dialog.accept());await page.reload();await page.locator('#save-recovery').waitFor();
  await page.locator('#editor-mode').selectOption('source');assert.match(await page.locator('#document-source').inputValue(),/My unsaved 日本語/);
  const downloaded=page.waitForEvent('download');await page.locator('#download-draft').click();assert.match((await downloaded).suggestedFilename(),/ROADMAP.md.draft/);
  await page.locator('#discard-draft').click();await page.locator('#alert-message').filter({hasText:'Reload “ROADMAP.md” from disk?'}).waitFor();await page.locator('#alert-dialog').getByRole('button',{name:'Reload',exact:true}).click();await page.locator('#save-recovery').waitFor({state:'hidden'});await page.getByRole('textbox',{name:'Heading',exact:true}).filter({hasText:'Changed outside'}).waitFor();
  await leaveApp();await page.locator('#chat-tab').click();await page.locator('#prompt').fill('A draft for this project 日本語');await page.reload();await page.waitForFunction(()=>document.querySelector('#prompt').value.includes('A draft for this project 日本語'));
  await page.locator('#prompt').fill('');await page.keyboard.press('ControlOrMeta+k');assert.equal(await page.locator('#project-search').evaluate(element=>element===document.activeElement),true);
  assert.deepEqual(await page.evaluate(()=>['sidebar','main-window'].map(id=>document.getElementById(id).classList.contains('pw-window--inactive'))),[false,true],'the window holding focus is the active one');
  await page.route('**/api/workspace',route=>route.fulfill({status:503,contentType:'application/json',body:'{"error":"temporary offline"}'}));await page.locator('#connection-retry').waitFor();await page.locator('#offline-banner').filter({hasText:'Connection interrupted. Your drafts are kept.'}).waitFor();assert.equal(await page.locator('#send').isDisabled(),true);await page.unroute('**/api/workspace');await page.locator('#offline-reconnect').click();await page.locator('#connection-retry').waitFor({state:'hidden'});await page.locator('#offline-banner').waitFor({state:'hidden'});
  const panels={chat:'#thread',work:'#work-panel',activity:'#activity-panel',gate:'#gate-panel'};
  for(const width of [320,390,768,1101,1440]){await page.setViewportSize({width,height:900});for(const tab of Object.keys(panels)){if(width<=760){for(const back of ['#phone-back','#detail-back'])if(await page.locator(back).isVisible())await page.locator(back).click();if(['activity','gate'].includes(tab)){await page.locator('#open-menu').click();await page.locator('#agent-'+tab).click();}else{await page.locator('#phone-view').click();await page.locator('#phone-view-menu').getByRole('menuitemradio',{name:tab}).click();}/* round 8: Activity and Gate are in the π sheet */if(tab==='work'&&await page.evaluate(()=>document.body.dataset.pane==='files'))await page.getByRole('button',{name:'ROADMAP.md',exact:true}).click();}else{if(['activity','gate'].includes(await page.evaluate(()=>document.body.dataset.view))&&['chat','work'].includes(tab))await leaveApp();if(['chat','work'].includes(tab))await page.locator('#'+tab+'-tab').click();else await page.keyboard.press('Control+Alt+Digit'+(tab==='activity'?3:4));}for(const [name,panel] of Object.entries(panels)){assert.equal(await page.locator(panel).isVisible(),name===tab,tab+' panel selection at '+width);if(['chat','work'].includes(name)&&width>760&&['chat','work'].includes(tab))assert.equal(await page.locator('#'+name+'-tab').getAttribute('aria-pressed'),String(name===tab));}assert.equal(await page.evaluate(()=>document.body.dataset.view),tab);assert.equal(await page.locator('#window-title').textContent(),{chat:'First project',work:'ROADMAP.md',activity:'Activity · All Projects',gate:'Gate · All Projects'}[tab]);assert.equal(await page.locator('.composer-wrap').isVisible(),tab==='chat');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,tab+' overflows at '+width);if(width>760)assert.deepEqual(await page.evaluate(()=>[...document.querySelectorAll('.pw-window')].flatMap(win=>{const box=win.getBoundingClientRect();return box.width?[...win.querySelectorAll('.pw-btn,.pw-seg')].filter(el=>{const r=el.getBoundingClientRect();return el.getClientRects().length&&(r.right>box.right+0.5||r.left<box.left-0.5);}).map(el=>el.id||el.textContent.trim()):[];})),[],tab+': buttons and tabs stay inside their window at '+width);if(width===768){const fit=await page.evaluate(()=>{const desk=document.getElementById('desk');return {deskScrolls:desk.scrollWidth>desk.clientWidth,main:Math.round(document.getElementById('main-window').getBoundingClientRect().width),review:getComputedStyle(document.querySelector('.window-review')).display!=='none'};});assert.equal(fit.deskScrolls,false,tab+': the desk fits at 768 without sideways scroll');assert.ok(fit.main>=400,tab+': main window '+fit.main+'px at 768');if(tab==='work')assert.equal(fit.review,true,'Review stays open at 768');if(tab==='gate')assert.deepEqual(await page.evaluate(()=>{return [...document.querySelectorAll('#gate-events .pw-table__head>*')].filter(cell=>cell.getClientRects().length&&cell.scrollWidth>cell.clientWidth+1).map(cell=>cell.textContent);}),[],'Gate header labels fit their columns at 768');}}}
  await page.setViewportSize({width:1440,height:950});await leaveApp();await page.locator('#work-tab').click();await page.screenshot({path:shot('plh-work-desktop.png')});await page.keyboard.press('Control+Alt+Digit3');await page.screenshot({path:shot('plh-activity-desktop.png')});
  await page.setViewportSize({width:390,height:844});await page.keyboard.press('Escape');await page.locator('#sidebar').waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>scrollX),0);await page.screenshot({path:shot('plh-activity-mobile.png')});
  const phoneView=async name=>{for(const back of ['#phone-back','#detail-back'])if(await page.locator(back).isVisible())await page.locator(back).click();if(['Activity','Gate'].includes(name)){await page.locator('#open-menu').click();await page.locator('#agent-'+name.toLowerCase()).click();}else{await page.locator('#phone-view').click();await page.locator('#phone-view-menu').getByRole('menuitemradio',{name}).click();}await page.waitForFunction(value=>document.body.dataset.view===value,name.toLowerCase());};
  assert.deepEqual(await page.evaluate(()=>['menubar','phonebar','workspace-bar'].map(id=>getComputedStyle(document.getElementById(id)).display!=='none')),[false,true,false],'phone shows the phone bar instead of the menu bar and view tabs');
  await phoneView('Work');if(await page.locator('#phone-back').isVisible())await page.locator('#phone-back').filter({hasText:'Files'}).click();await page.locator('.window-files').waitFor();assert.equal(await page.locator('#main-window').isVisible(),false,'Files is a full screen');
  await page.locator('.window-files').getByRole('button',{name:'ROADMAP.md',exact:true}).click();await page.locator('#main-window').waitFor();assert.equal(await page.locator('.window-files').isVisible(),false);
  await page.locator('#phone-comments').filter({hasText:/^Comments \d+$/}).click();await page.locator('#comments-panel.is-sheet').waitFor();await page.locator('#backdrop').click({position:{x:20,y:80}});await page.locator('#comments-panel').waitFor({state:'hidden'});
  assert.equal(await page.locator('#open-menu').isVisible(),true,'round 8 (Ph8_Doc): the phone bar stays above the document bar');await page.locator('#phone-back').click();
  await page.locator('#open-menu').click();await page.locator('#sidebar').getByRole('button',{name:'Settings…',exact:true}).click();await page.locator('#settings-dialog').waitFor();await page.keyboard.press('Escape');await page.locator('#sidebar').waitFor({state:'hidden'});
  await phoneView('Activity');await page.locator('.activity-task').first().click();await page.locator('#activity-detail').waitFor();assert.equal(await page.locator('#activity-list').isVisible(),false,'the detail is its own screen');await page.locator('#detail-back').filter({hasText:'Activity'}).click();await page.locator('#activity-list').waitFor();assert.equal(await page.locator('#activity-detail').isVisible(),false);
  const activitySeg=page.locator('#activity-seg');assert.equal(await page.locator('#activity-filter').isVisible(),false,'phone filters with a segmented control');
  assert.deepEqual((await activitySeg.getByRole('radio').allTextContents()).map(label=>label.replace(/ \d+$/,'')),['All','Active','Attention','Done']);
  await activitySeg.getByRole('radio',{name:'Done'}).click();assert.equal(await page.locator('#activity-filter').inputValue(),'completed');assert.equal(await activitySeg.getByRole('radio',{name:'Done'}).getAttribute('aria-checked'),'true');
  await page.waitForFunction(()=>document.querySelectorAll('.activity-task').length>0&&!document.querySelector('.activity-task .task-state:not(.completed)'));await page.keyboard.press('ArrowLeft');await page.waitForFunction(()=>document.getElementById('activity-filter').value==='attention');
  await activitySeg.getByRole('radio',{name:'All'}).click();assert.equal(await page.locator('#activity-filter').inputValue(),'all');
  await phoneView('Gate');const gateSeg=page.locator('#gate-seg');assert.equal(await page.locator('#gate-filter').isVisible(),false);assert.deepEqual(await gateSeg.getByRole('radio').allTextContents(),['All','Before','After','Problems']);
  await gateSeg.getByRole('radio',{name:'Problems'}).click();assert.equal(await page.locator('#gate-filter').inputValue(),'failures');await gateSeg.getByRole('radio',{name:'All'}).click();assert.equal(await gateSeg.getByRole('radio',{name:'All'}).getAttribute('aria-checked'),'true');
  await page.setViewportSize({width:1440,height:950});assert.equal(await gateSeg.isVisible(),false,'desk keeps the Show popup');await page.setViewportSize({width:390,height:844});
  await page.locator('div.gate-event').first().click();await page.locator('#event-info').waitFor();await page.locator('#detail-back').filter({hasText:'Gate'}).click();await page.locator('#event-info').waitFor({state:'hidden'});
  for(const width of [320,390]){await page.setViewportSize({width,height:844});for(const name of ['Chat','Work','Activity','Gate']){await phoneView(name);const small=await page.evaluate(()=>[...document.querySelectorAll('button,a.pw-btn,select')].filter(element=>element.getClientRects().length&&getComputedStyle(element).visibility!=='hidden').map(element=>[element.id||element.className||element.textContent.trim().slice(0,20),Math.round(element.getBoundingClientRect().height)]).filter(([name,height])=>height<44&&!(name==='pw-context__more'&&height+16>=44)));/* "+N" is drawn 28px tall; its ::after makes the touch area 44px */assert.deepEqual(small,[],name+' touch targets at '+width);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,name+' overflows at '+width);}}
  assert.deepEqual(errors,[]);
  await page.setViewportSize({width:1440,height:950});await page.evaluate(()=>localStorage.setItem('plh.navigation',JSON.stringify({...JSON.parse(localStorage.getItem('plh.navigation')||'{}'),view:'retired'})));await page.goto(`http://127.0.0.1:${ports.web}`);
  await page.waitForFunction(()=>document.body.dataset.view==='work');assert.equal(await page.locator('#work-panel').isVisible(),true,'a saved view that no longer exists restores Work');
  console.log('UX regression passed: document/text discussions, Markdown Activity, drafts/conflicts, reconnect, keyboard, attachments, live files and four tabs at 320/390/768/1101/1440px.');
 }finally{
  if(browser)await browser.close();/* a server that already died must not make this wait forever (Node would exit 0) */const exited=server.exitCode!==null||server.signalCode!==null?Promise.resolve():new Promise(resolve=>server.once('exit',resolve));server.kill();/* a server stuck in a request gets SIGKILL after 5 s, so a failed run still exits */const killer=setTimeout(()=>server.kill('SIGKILL'),5000);await exited;clearTimeout(killer);rmSync(directory,{recursive:true,force:true});
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
