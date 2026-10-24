// Round15 recording journey: real Preview proxy, host transport and scratch-only persistence.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const SHOTS=fs.mkdtempSync(join(tmpdir(),'plh-shots-')),shot=name=>join(SHOTS,name);
process.on('exit',()=>console.log(`Screenshots: ${SHOTS}`));
const { scratch, launch, runner } = require('./workbench.cjs');
const { story, run } = runner();
async function recordingSettings(page) {
  if(!await page.locator('#settings-dialog').evaluate(el=>el.open)){await page.locator('#model-button').focus();await page.keyboard.press('ControlOrMeta+Comma');}
  await page.locator('#settings-recording').waitFor();
}
story('US-352', 'Preview records focus and canvas clicks and stopping rejects late actions', async t => {
  const made=await t.bench.api('/api/projects/create',{name:'Recorded',parent:t.bench.directory,kind:'empty'});
  const project=(await t.bench.api('/api/workspace')).projects.find(p=>p.id===made.project);
  fs.writeFileSync(join(project.path,'index.html'),'<!doctype html><html><body><label>Note<input></label><label>Password<input type="password"></label><canvas width="100" height="100"></canvas><button>Save</button></body></html>');
  await t.bench.api('/api/preview/start',{project:made.project});
  await t.page.goto(t.bench.base+'/p/'+made.project+'/chat');
  await t.page.locator('#prompt:not([disabled])').waitFor();
  if(await t.page.locator('#preview-toggle').getAttribute('aria-pressed')!=='true') await t.page.locator('#preview-toggle').click();
  await t.page.waitForFunction(()=>document.getElementById('recording-status')?.dataset.state==='on');
  const app=t.page.frameLocator('iframe[title="The app"]');
  await app.getByLabel('Note',{exact:true}).focus(); await app.getByLabel('Note',{exact:true}).fill('private-journey-value');
  await app.getByLabel('Password',{exact:true}).fill('private-password'); await app.locator('canvas').click();
  await t.page.waitForFunction(async id=>(await fetch('/api/recordings?project='+id).then(r=>r.json())).steps>=3,made.project);
  const flow=(await t.bench.api('/api/recordings',{project:made.project,action:'recent'})).flow;
  assert.ok(flow.steps.some(s=>s.type==='focus')); assert.ok(flow.steps.some(s=>s.type==='click'&&s.selectors[0][0].includes('canvas')));assert.doesNotMatch(JSON.stringify(flow),/private|password|Note/);
  await recordingSettings(t.page);await t.page.locator('#recording-status').click();await t.page.keyboard.press('Escape');assert.equal(await t.page.locator('#settings-dialog').evaluate(d=>d.open),true);await t.page.locator('#recording-status').click();
  await t.page.getByRole('button',{name:'Stop Recording Preview',exact:true}).click();
  await t.page.waitForFunction(()=>document.getElementById('recording-status').dataset.state==='off');
  await t.page.locator('#settings-cancel').click();
  const count=(await t.bench.api('/api/recordings?project='+made.project)).steps;
  await app.getByLabel('Note',{exact:true}).focus();await app.getByRole('button',{name:'Save',exact:true}).click();
  await t.page.reload();await t.page.waitForFunction(()=>document.getElementById('recording-status')?.dataset.state==='off');
  assert.equal((await t.bench.api('/api/recordings?project='+made.project)).steps,count);
  await recordingSettings(t.page);await t.page.locator('#recording-status').click();await t.page.getByRole('button',{name:'Record This Preview',exact:true}).click();
  await t.page.locator('#recording-status').click();await t.page.getByRole('button',{name:'Clear History…',exact:true}).click();await t.page.getByRole('button',{name:'Move to Trash',exact:true}).click();
  await t.page.waitForFunction(async id=>(await fetch('/api/recordings?project='+id).then(r=>r.json())).steps===0,made.project);
});
story('US-353', 'WorkStation recording defaults on and never blocks conversation', async t => {
  const made=await t.bench.api('/api/projects/create',{name:'WorkStation',parent:t.bench.directory,kind:'empty'});
  await t.page.goto(t.bench.base+'/p/'+made.project+'/chat');await t.page.locator('#prompt:not([disabled])').waitFor();
  await t.page.locator('#prompt').fill('private-workstation-buffer');
  await recordingSettings(t.page);await t.page.getByRole('button',{name:'Recording Options…',exact:true}).click();await t.page.keyboard.press('Escape');await t.page.getByRole('button',{name:/^(WorkStation|Recording WorkStation)/}).click();
  await t.page.getByRole('button',{name:'Stop Recording WorkStation',exact:true}).click();
  await t.page.waitForFunction(()=>document.getElementById('ws-recording-status').dataset.state==='off');
  assert.equal((await t.bench.api('/api/recordings?project='+made.project)).enabled,true);
  await t.page.locator('#settings-cancel').click();await t.page.setViewportSize({width:390,height:844});
  assert.equal(await t.page.locator('#ws-recording-status').isVisible(),false);
  const flow=(await t.bench.api('/api/recordings',{surface:'workstation',project:made.project,action:'recent'})).flow;
  assert.doesNotMatch(JSON.stringify(flow),/private-workstation-buffer/);
  await t.page.route('**/api/recordings',r=>r.fulfill({status:503,json:{error:'Scratch storage unavailable'}}));
  await t.page.waitForFunction(()=>document.getElementById('ws-recording-status').textContent==='WorkStation recording paused');
  assert.equal(await t.page.locator('#prompt').inputValue(),'private-workstation-buffer');await t.page.locator('#send').click();
  await t.page.locator('#messages .pw-msg--user').getByText('private-workstation-buffer',{exact:true}).waitFor();
});
story('US-356', 'Stop All Recording stops both surfaces across windows without losing history', async t => {
  const made=await t.bench.api('/api/projects/create',{name:'Stop all',parent:t.bench.directory,kind:'empty'});
  const other=await t.bench.api('/api/projects/create',{name:'Other recorded',parent:t.bench.directory,kind:'empty'});
  for(const project of [made.project,other.project]){const s=await t.bench.api('/api/recordings?project='+project);await t.bench.api('/api/recordings',{project,action:'append',generation:s.generation,run:s.run,flow:{steps:[{type:'focus',selectors:[['input']]}]}});}
  await t.page.goto(t.bench.base+'/p/'+made.project+'/chat');const second=await t.context.newPage();await second.goto(t.bench.base+'/p/'+other.project+'/chat');
  await recordingSettings(t.page);await t.page.locator('#ws-recording-status').click();await t.page.locator('#ws-recording-popover').waitFor();await t.page.waitForFunction(()=>document.activeElement===document.querySelector('#ws-recording-popover button'));await t.page.keyboard.press('Tab');
  assert.equal(await t.page.getByRole('button',{name:'Stop All Recording',exact:true}).evaluate(b=>b===document.activeElement),true);await t.page.keyboard.press('Enter');
  for(const page of [t.page,second])await page.waitForFunction(()=>document.getElementById('ws-recording-status').dataset.state==='off');
  for(const project of [made.project,other.project]){const s=await t.bench.api('/api/recordings?project='+project);assert.equal(s.enabled,false);assert.equal(s.steps,1);}
  await t.page.getByRole('checkbox',{name:'Allow action recording',exact:true}).check();
  await t.page.waitForFunction(()=>document.getElementById('ws-recording-status').dataset.state==='on');
  await t.page.locator('#recording-status').click();await t.page.locator('#recording-popover').getByRole('button',{name:'Stop All Recording',exact:true}).click();
  await second.waitForFunction(()=>document.getElementById('ws-recording-status').dataset.state==='off');
  assert.equal(await t.page.locator('#toast-text').textContent(),'All recording stopped. What was recorded is kept.');await second.close();
});
story('US-368', 'recording runs quietly and Settings explains and controls both surfaces', async t => {
  const made = await t.bench.api('/api/projects/create', {name:'Quiet recording',parent:t.bench.directory,kind:'empty'});
  await t.page.goto(t.bench.base+'/p/'+made.project+'/chat');
  await t.page.locator('#prompt:not([disabled])').waitFor();
  assert.equal(await t.page.locator('#ws-recording-status').isVisible(),false);
  assert.equal(await t.page.locator('#preview-recording-notice').isVisible(),false);
  await t.page.keyboard.press('ControlOrMeta+Comma');
  const enabled=t.page.getByRole('checkbox',{name:'Allow action recording',exact:true});
  await enabled.waitFor(); assert.equal(await enabled.isChecked(),true);
  await t.page.getByText('Turning this off gives Pi less interaction context and makes problems harder to reproduce.',{exact:true}).waitFor();
  for(const width of [1440,1024,390,320]){await t.page.setViewportSize({width,height:900});await enabled.scrollIntoViewIfNeeded();assert.equal(await t.page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await t.page.screenshot({path:shot('quiet-settings-'+width+'.png')});}
  await enabled.uncheck();
  await t.page.waitForFunction(async()=>!(await fetch('/api/recordings',{method:'POST',headers:{'Content-Type':'application/json','X-Pi-Person':document.querySelector('meta[name="pi-person"]').content},body:JSON.stringify({surface:'workstation',action:'preferences'})}).then(r=>r.json())).enabled);
  assert.equal((await t.bench.api('/api/recordings?project='+made.project)).enabled,false);
  await enabled.check();
  await t.page.locator('#settings-cancel').click();
  assert.equal(await t.page.locator('#ws-recording-status').isVisible(),false);
  await t.page.locator('#prompt').focus();
  await t.page.waitForFunction(async()=>{const r=await fetch('/api/recordings',{method:'POST',headers:{'Content-Type':'application/json','X-Pi-Person':document.querySelector('meta[name="pi-person"]').content},body:JSON.stringify({surface:'workstation',action:'status'})}).then(r=>r.json());return r.steps>0;});
});
story('US-354', 'A late chat load preserves the phone menu I just opened', async t => {
  const made = await t.bench.api('/api/projects/create', { name: 'Late chat', parent: t.bench.directory, kind: 'empty' });
  await t.page.setViewportSize({ width: 390, height: 844 });
  let release, blocked, delayed = false;
  const held = new Promise(resolve => { release = resolve; });
  const arrived = new Promise(resolve => { blocked = resolve; });
  await t.page.route('**/api/conversations/*', async route => {
    if (!delayed && route.request().method() === 'GET' && /\/api\/conversations\/[0-9a-f]{32}$/.test(route.request().url())) { delayed = true; blocked(); await held; }
    await route.continue();
  });
  const navigation = t.page.goto(t.bench.base + '/p/' + made.project + '/chat');
  try {
    await arrived;
    await t.page.locator('#open-menu').click();
    assert.equal(await t.page.locator('body').evaluate(body => body.classList.contains('menu-open')), true);
    release(); await navigation;
    await t.page.locator('#prompt:not([disabled])').waitFor();
    assert.equal(await t.page.locator('body').evaluate(body => body.classList.contains('menu-open')), true, 'late chat completion must not close the newly opened menu');
    await t.page.locator('#new-project').click();
    await t.page.locator('#start-dialog').waitFor();
  } finally { release(); }
});

(async () => {
  const browser = await launch();
  let current;
  const code = await run({ fresh: async () => {
    const bench = scratch('pi-recording-story-'); await bench.start();
    const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } }); const page = await context.newPage();
    current = { bench, context, page }; return current;
  }, after: async (_item, error) => { if (error) { console.error(error); await current.page.screenshot({ path: shot('recording-failure.png') }); console.error('Recorder diagnostics:', await current.page.locator('body').innerText(), current.bench.log.join('\n')); } await current.context.close(); await current.bench.stop(); current.bench.remove(); } });
  await browser.close(); process.exitCode = code;
})().catch(error => { console.error(error); process.exitCode = 1; });
