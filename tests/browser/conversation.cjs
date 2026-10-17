// Task 290: conversation repairs in the page. Run with a Playwright installation:
//   NODE_PATH=/path/to/node_modules node tests/browser/conversation.cjs   (or python3 tests/browser/run.py conversation)
// A choice is answered through its own route, once; the composer's draft and attachments are never touched by a card;
// Start Building and Continue send their own requests; a failed or stopped answer stays in the chat, marked.
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('node:child_process');
const { mkdtempSync, writeFileSync, chmodSync, rmSync, realpathSync, readFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const assert = require('node:assert/strict');
const readline = require('node:readline');

(async () => {
  const directory = realpathSync(mkdtempSync(join(tmpdir(), 'pi-conversation-')));
  const python = execFileSync('which', ['python3'], { encoding: 'utf8' }).trim();
  const fake = join(directory, 'pi');
  writeFileSync(fake, `#!${python}\n` + readFileSync('tests/fixtures/fake-pi.py', 'utf8')); chmodSync(fake, 0o755);
  const env = { ...Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^PI_(HARNESS_|WEB_REMOTE_)/.test(key))), // never the live harness
    PATH: directory + ':' + process.env.PATH, PI_TAILSCALE: 'false', PI_TRASH_DIR: join(directory, 'Trash'), PI_GATE_PORT: '0', PI_OLLAMA_URL: 'http://127.0.0.1:9',
    PI_WEB_PORT: '0', PI_AGENT_DATA: join(directory, 'workspace'), PI_WEB_DATA: join(directory, 'data'), PI_HARNESS_LOG_FILE: join(directory, 'audit.log') };
  const server = spawn('python3', [join(process.env.PI_TEST_RUNTIME || '.', 'harness/services.py')], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let browser;
  try {
    const serverLog = []; server.stderr.on('data', chunk => { serverLog.push(...String(chunk).split('\n').filter(line => line && !/" (200|304) -/.test(line))); serverLog.splice(0, Math.max(0, serverLog.length - 40)); });
    process.on('exit', code => { if (code) console.log('Server log (not 200/304):\n' + serverLog.join('\n')); });
    const lines = readline.createInterface({ input: server.stdout });
    const ports = await new Promise((resolve, reject) => { const timeout = setTimeout(() => reject(new Error('Server startup timeout')), 10000); lines.once('line', line => { clearTimeout(timeout); resolve(JSON.parse(line)); }); server.once('exit', code => reject(new Error('Server exited ' + code))); });
    const base = `http://127.0.0.1:${ports.web}`;
    browser = await chromium.launch({ headless: true, ...(process.env.PI_TEST_CHROME ? { executablePath: process.env.PI_TEST_CHROME } : {}) });
    const errors = [];
    const open = async (path = '/') => {
      const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
      await page.route('**/api/updates', route => route.fulfill({ json: { state: 'current', checked: 1 } }));
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base + path); return page;
    };
    const page = await open();
    const post = (path, body) => page.evaluate(async ([path, body]) => { const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Pi-Person': document.querySelector('meta[name="pi-person"]')?.content || '' }, body: JSON.stringify(body) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); return data; }, [path, body]);
    const workspace = () => page.evaluate(() => fetch('/api/workspace').then(response => response.json()));
    const settled = async id => { for (let i = 0; i < 100; i++) { const job = (await workspace()).jobs.find(item => item.id === id); if (job && !['queued', 'running'].includes(job.status)) return job; await page.waitForTimeout(200); } throw new Error('request did not end: ' + id); };
    const created = await post('/api/projects/create', { name: 'Choices', parent: directory, kind: 'empty' });
    const conversation = () => page.evaluate(id => fetch('/api/conversations/' + id).then(response => response.json()), created.chat);

    // 1. A choice click answers through its own route, once, and never touches the draft or its attachments.
    await settled((await post('/api/jobs/create', { project: created.project, message: 'Discuss the app TEST_ERROR_CHOICE' })).id);
    await page.goto(`${base}/p/${created.project}/chat`);
    const card = page.locator('.pw-card[aria-label="Who uses it?"]'); await card.waitFor();
    const sent = []; page.on('request', request => { if (/\/api\/(jobs\/create|choices\/answer)$/.test(request.url())) sent.push({ path: new URL(request.url()).pathname, body: JSON.parse(request.postData()) }); });
    await page.locator('#prompt').fill('MY UNFINISHED DRAFT about something else');
    await page.locator('#files').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('draft attachment') });
    await page.locator('#attachments .attachment-chip').waitFor();
    const answer = card.getByRole('button', { name: 'Answer', exact: true });
    await answer.click(); await answer.click({ timeout: 300 }).catch(() => {}); // a double click
    await page.locator('.pw-card--settled').filter({ hasText: 'Who uses it?: Only me' }).waitFor();
    await page.waitForTimeout(800);
    assert.deepEqual(sent.map(item => item.path), ['/api/choices/answer'], JSON.stringify(sent));
    assert.equal(sent[0].body.option, 0); assert.ok(sent[0].body.id && sent[0].body.key, 'the answer names its question and carries a key');
    assert.equal(await page.locator('#prompt').inputValue(), 'MY UNFINISHED DRAFT about something else', 'the draft stays');
    assert.equal(await page.locator('#attachments .attachment-chip').count(), 1, 'the attachment stays');
    for (let i = 0; i < 50 && !(await workspace()).jobs.every(job => !['queued', 'running'].includes(job.status)); i++) await page.waitForTimeout(200);
    const after = (await conversation()).messages.filter(message => message.role === 'user').map(message => [message.content, (message.attachments || []).length]);
    assert.deepEqual(after, [['Discuss the app TEST_ERROR_CHOICE', 0], ['Choice: Who uses it? → Only me', 0]], 'one answer, without the draft’s files');
    await page.reload(); await page.locator('.pw-card--settled').filter({ hasText: 'Who uses it?: Only me' }).waitFor();
    assert.equal(await page.locator('#prompt').inputValue(), 'MY UNFINISHED DRAFT about something else');

    // 2. Answering while Pi is busy: the card locks at once, a second tab gets the first answer, nothing merges.
    await settled((await post('/api/jobs/create', { project: created.project, message: 'Discuss again TEST_ERROR_CHOICE' })).id);
    const first = await open(`/p/${created.project}/chat`), second = await open(`/p/${created.project}/chat`);
    const busy = await post('/api/jobs/create', { project: created.project, message: 'Something long TEST_WAIT' });
    for (const tab of [first, second]) await tab.locator('.pw-card[aria-label="Who uses it?"] .pw-option').first().waitFor();
    await first.locator('.pw-card[aria-label="Who uses it?"]').getByRole('button', { name: 'Answer', exact: true }).click();
    await first.locator('.pw-card--settled').filter({ hasText: 'Only me' }).last().waitFor();
    const other = second.locator('.pw-card[aria-label="Who uses it?"]');
    await other.locator('.pw-option').nth(2).click(); await other.locator('input.pw-field').fill('Archive it');
    await other.getByRole('button', { name: 'Answer', exact: true }).click();
    await second.locator('.pw-card--settled').filter({ hasText: 'Only me' }).last().waitFor();
    const queued = (await workspace()).jobs.filter(job => job.status === 'queued').map(job => job.message);
    assert.deepEqual(queued, ['Choice: Who uses it? → Only me'], JSON.stringify(queued));
    await post('/api/jobs/stop', { id: busy.id });
    await first.close(); await second.close();

    // 3. Start Building and Continue send their own requests; the composer keeps the person's words and files.
    await page.route('**/api/phase/build', route => route.fulfill({ json: { phase: 'implementation' } }));
    await settled((await post('/api/jobs/create', { project: created.project, message: 'One more question TEST_ERROR_CHOICE' })).id); // left unanswered
    const plan = await post('/api/jobs/create', { project: created.project, message: 'Discuss a plan TEST_ERROR_PLAN' }); await settled(plan.id);
    for (let i = 0; i < 50 && (await workspace()).jobs.some(job => ['queued', 'running'].includes(job.status)); i++) await page.waitForTimeout(200);
    await page.reload(); await page.locator('#prompt').fill('Still my draft'); await page.locator('#files').setInputFiles({ name: 'more.txt', mimeType: 'text/plain', buffer: Buffer.from('x') });
    // The new plan settled the older open question: it says so and cannot be answered.
    await page.locator('.pw-card--settled').filter({ hasText: 'Who uses it? · not answered: settled by a new plan' }).waitFor();
    assert.equal(await page.locator('.pw-card[aria-label="Who uses it?"] .pw-option').count(), 0);
    assert.equal(await page.locator('#send').textContent(), 'Send', 'the composer is no longer answering it');
    sent.length = 0;
    await page.locator('.pw-card[aria-label="Plan"]').last().getByRole('button', { name: 'Start Building', exact: true }).click();
    await page.waitForFunction(() => true); for (let i = 0; i < 20 && !sent.length; i++) await page.waitForTimeout(100);
    assert.deepEqual(sent.map(item => [item.body.message, (item.body.attachments || []).length]), [['Build the approved task.', 0]]);
    assert.equal(await page.locator('#prompt').inputValue(), 'Still my draft');
    assert.equal(await page.locator('#attachments .attachment-chip').count(), 1);

    await settled((await post('/api/jobs/create', { project: created.project, message: 'Check in TEST_CHECK_IN' })).id);
    for (let i = 0; i < 50 && (await workspace()).jobs.some(job => ['queued', 'running'].includes(job.status)); i++) await page.waitForTimeout(200);
    const checked = await conversation();
    await page.route('**/check-in/accept', route => route.fulfill({ json: { conversation: checked, finished: false } }));
    await page.reload(); await page.locator('#prompt').fill('Still my draft'); await page.locator('#files').setInputFiles({ name: 'more.txt', mimeType: 'text/plain', buffer: Buffer.from('x') });
    sent.length = 0;
    await page.locator('.pw-card').filter({ hasText: 'Task 1 of 2 done' }).last().getByRole('button', { name: 'Accept and Continue', exact: true }).click();
    for (let i = 0; i < 20 && !sent.length; i++) await page.waitForTimeout(100);
    assert.deepEqual(sent.map(item => [item.body.message, (item.body.attachments || []).length]), [['Continue the approved task.', 0]]);
    assert.equal(await page.locator('#prompt').inputValue(), 'Still my draft');
    assert.equal(await page.locator('#attachments .attachment-chip').count(), 1);

    // 4. A phase word gets an inline notice under the answer, not a card.
    await settled((await post('/api/jobs/create', { project: created.project, message: 'Explain the planning module TEST_NOTICE' })).id);
    await page.reload();
    const notice = page.locator('#messages .message-notice').filter({ hasText: 'use the phase button' }); await notice.waitFor();

    assert.deepEqual(errors, []);
    console.log('Conversation checks passed: one answer per card through its own route, drafts and attachments kept, controls send their own requests.');
  } finally {
    if (browser) await browser.close();
    const exited = server.exitCode !== null || server.signalCode !== null ? Promise.resolve() : new Promise(resolve => server.once('exit', resolve)); server.kill();
    const killer = setTimeout(() => server.kill('SIGKILL'), 5000); await exited; clearTimeout(killer); rmSync(directory, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
