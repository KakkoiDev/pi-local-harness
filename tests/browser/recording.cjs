// Round15 recording journey: real Preview proxy, host transport and scratch-only persistence.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const SHOTS=fs.mkdtempSync(join(tmpdir(),'plh-shots-')),shot=name=>join(SHOTS,name);
process.on('exit',()=>console.log(`Screenshots: ${SHOTS}`));
const { scratch, launch, runner } = require('./workbench.cjs');
const { story, run } = runner();
story('US-352', 'Preview records focus and canvas clicks and stopping rejects late actions', async t => {
  const made = await t.bench.api('/api/projects/create', { name: 'Recorded', parent: t.bench.directory, kind: 'empty' });
  const project = (await t.bench.api('/api/workspace')).projects.find(item => item.id === made.project);
  fs.writeFileSync(join(project.path, 'index.html'), '<!doctype html><html><head></head><body><label>Note<input></label><label>Password<input type="password"></label><canvas width="100" height="100"></canvas><button>Save</button></body></html>');
  await t.bench.api('/api/preview/start', { project: made.project });
  await t.page.goto(t.bench.base + '/p/' + made.project + '/chat');
  const toggle = t.page.locator('#preview-toggle');
  if (await toggle.getAttribute('aria-pressed') !== 'true') await toggle.click();
  const status = t.page.locator('#recording-status');
  await status.waitFor();
  await t.page.locator('#preview-recording-notice').getByRole('button', { name: "What's Kept", exact: true }).click();
  await t.page.keyboard.press('Escape');
  await t.page.locator('#preview-recording-notice').getByRole('button', { name: 'OK', exact: true }).click();
  const app = t.page.frameLocator('iframe[title="The app"]');
  await app.getByLabel('Note', { exact: true }).focus();
  await app.getByLabel('Note', { exact: true }).fill('private-journey-value');
  await app.getByLabel('Password', { exact: true }).fill('private-password');
  await app.locator('canvas').click();
  await t.page.waitForFunction(async project => {
    const state = await fetch('/api/recordings?project=' + project).then(reply => reply.json());
    return state.steps >= 3;
  }, made.project);
  const flow = (await t.bench.api('/api/recordings', { project: made.project, action: 'recent' })).flow;
  assert.ok(flow.steps.some(step => step.type === 'focus'));
  assert.ok(flow.steps.some(step => step.type === 'click' && step.selectors[0][0].includes('canvas')));
  assert.doesNotMatch(JSON.stringify(flow), /private|password|Note/);
  await status.click();
  await t.page.getByRole('button', { name: 'Stop Recording Preview', exact: true }).click();
  await t.page.waitForFunction(() => document.getElementById('recording-status').dataset.state === 'off');
  const count = (await t.bench.api('/api/recordings?project=' + made.project)).steps;
  await app.getByLabel('Note', { exact: true }).focus();
  await app.getByRole('button', { name: 'Save', exact: true }).click();
  await t.page.reload();
  await t.page.waitForFunction(() => document.getElementById('recording-status')?.dataset.state === 'off');
  assert.equal((await t.bench.api('/api/recordings?project=' + made.project)).steps, count);
  await status.click();
  await t.page.getByRole('button', { name: 'Record This Preview', exact: true }).click();
  await t.page.waitForFunction(() => document.getElementById('recording-status').dataset.state === 'on');
  await status.click();
  await t.page.getByRole('button', { name: 'Clear History…', exact: true }).click();
  await t.page.getByRole('button', { name: 'Move to Trash', exact: true }).click();
  await t.page.waitForFunction(async project => (await fetch('/api/recordings?project=' + project).then(r => r.json())).steps === 0, made.project);
});
story('US-353', 'WorkStation recording requires opt-in and never blocks conversation', async t => {
  await t.page.goto(t.bench.base + '/projects');
  const status = t.page.getByRole('button', { name: /^(WorkStation|Recording WorkStation)/ });
  await t.page.waitForFunction(() => document.getElementById('ws-recording-status')?.textContent === 'WorkStation not recording');
  assert.equal((await t.bench.api('/api/recordings', { surface: 'workstation', action: 'status' })).steps, 0);
  await status.click(); await t.page.locator('#alert-dialog').getByRole('button', { name: 'Not Now', exact: true }).click();
  await t.page.keyboard.press('ControlOrMeta+Comma');
  await t.page.locator('#settings-dialog').getByRole('button', { name: 'Recording Options…', exact: true }).click();
  await t.page.getByRole('button', { name: 'Enable Recording', exact: true }).click();
  await t.page.locator('#settings-cancel').click();
  await t.page.waitForFunction(() => document.getElementById('ws-recording-status').dataset.state === 'on');
  await status.focus();
  await t.page.waitForFunction(async () => {
    const secret = document.querySelector('meta[name="pi-person"]').content;
    const s = await fetch('/api/recordings', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Pi-Person': secret }, body: JSON.stringify({ surface: 'workstation', action: 'status' }) }).then(r => r.json());
    return s.steps > 0;
  });
  const made = await t.bench.api('/api/projects/create', { name: 'WorkStation', parent: t.bench.directory, kind: 'empty' });
  await t.page.goto(t.bench.base + '/p/' + made.project + '/chat');
  await t.page.waitForFunction(() => document.getElementById('ws-recording-status')?.dataset.state === 'on');
  await t.page.locator('#prompt').fill('private-workstation-buffer');
  await t.page.locator('#ws-recording-status').click();
  assert.equal(await t.page.locator('#ws-recording-popover').getByRole('button', { name: 'Stop Recording WorkStation', exact: true }).textContent(), 'Stop Recording WorkStation');
  await t.page.locator('#ws-recording-popover').getByRole('button', { name: 'Stop Recording WorkStation', exact: true }).click();
  await t.page.waitForFunction(() => document.getElementById('ws-recording-status').dataset.state === 'off');
  await t.page.setViewportSize({ width: 390, height: 844 });
  await t.page.locator('.pw-recbar #ws-recording-status').waitFor();
  assert.equal(await t.page.locator('#ws-recording-status').textContent(), 'WorkStation not recording');
  assert.equal((await t.bench.api('/api/recordings?project=' + made.project)).enabled, true);
  const flow = (await t.bench.api('/api/recordings', { surface: 'workstation', project: made.project, action: 'recent' })).flow;
  assert.doesNotMatch(JSON.stringify(flow), /private-workstation-buffer/);
  await t.page.route('**/api/recordings', route => route.fulfill({ status: 503, json: { error: 'Scratch storage unavailable' } }));
  await t.page.waitForFunction(() => document.getElementById('ws-recording-status').textContent === 'WorkStation recording paused');
  assert.equal(await t.page.locator('#prompt').inputValue(), 'private-workstation-buffer');
  await t.page.locator('#send').click();
  await t.page.locator('#messages .pw-msg--user').getByText('private-workstation-buffer', { exact: true }).waitFor();
});
story('US-356', 'Stop All Recording stops both surfaces across windows without losing history', async t => {
  const made = await t.bench.api('/api/projects/create', { name: 'Stop all', parent: t.bench.directory, kind: 'empty' });
  const other = await t.bench.api('/api/projects/create', { name: 'Other recorded', parent: t.bench.directory, kind: 'empty' });
  for (const project of [made.project, other.project]) {
    const state = await t.bench.api('/api/recordings', { project });
    await t.bench.api('/api/recordings', { project, action: 'append', generation: state.generation, run: state.run, flow: { steps: [{ type: 'focus', selectors: [['input']] }] } });
  }
  await t.bench.api('/api/recordings', { surface: 'workstation', action: 'enabled', enabled: true });
  await t.page.goto(t.bench.base + '/p/' + made.project + '/chat');
  const second = await t.context.newPage();
  await second.goto(t.bench.base + '/p/' + other.project + '/chat');
  await t.page.locator('#ws-recording-status[data-state="on"]').waitFor();
  await second.locator('#ws-recording-status[data-state="on"]').waitFor();
  await t.page.locator('#ws-recording-status').click();
  await t.page.keyboard.press('Tab');
  assert.equal(await t.page.locator('#ws-recording-popover').getByRole('button', { name: 'Stop All Recording', exact: true }).evaluate(button => button === document.activeElement), true);
  await t.page.keyboard.press('Enter');
  for (const page of [t.page, second]) await page.locator('#ws-recording-status').getByText('WorkStation not recording', { exact: true }).waitFor();
  await t.page.locator('#toast-text').getByText('All recording stopped. What was recorded is kept.', { exact: true }).waitFor();
  await second.locator('#toast-text').getByText('WorkStation recording stopped in another window.', { exact: true }).waitFor();
  assert.equal(await t.page.locator('#ws-recording-status').evaluate(button => button === document.activeElement), true);
  for (const project of [made.project, other.project]) {
    const state = await t.bench.api('/api/recordings', { project });
    assert.equal(state.enabled, false); assert.equal(state.steps, 1);
  }
  await t.page.locator('#ws-recording-status').click();
  await t.page.locator('#ws-recording-popover').getByRole('button', { name: 'Stop All Recording', exact: true }).waitFor();
  await t.page.locator('#ws-recording-popover').getByRole('button', { name: 'Record WorkStation', exact: true }).click();
  await t.page.getByRole('button', { name: 'Enable Recording', exact: true }).click();
  await t.page.locator('#ws-recording-status[data-state="on"]').waitFor();
  const toggle = t.page.locator('#preview-toggle');
  if (await toggle.getAttribute('aria-pressed') !== 'true') await toggle.click();
  await t.page.locator('#recording-status').click();
  await t.page.locator('#recording-popover').getByRole('button', { name: 'Stop All Recording', exact: true }).click();
  await second.locator('#ws-recording-status').getByText('WorkStation not recording', { exact: true }).waitFor();
  await t.page.locator('#ws-recording-status').getByText('WorkStation not recording', { exact: true }).waitFor();
  assert.equal(await t.page.locator('#toast-text').textContent(), 'All recording stopped. What was recorded is kept.');
  await second.close();
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
