import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { plan, look, findChrome, startScratch } from '../../harness/browser.mjs';

const chrome = findChrome();

test('the input is checked before anything starts (L-008)', () => {
  assert.match(plan({ width: 100 }).error, /width must be/);
  assert.match(plan({ target: 'https://example.com' }).error, /Only pages on this computer/);
  assert.match(plan({ target: 'nonsense' }).error, /scratch/);
  assert.deepEqual(plan({}).probes, ['viewport', 'scrolled', 'scrollable', 'console'], 'the facts that find most layout bugs, by default');
  assert.equal(plan({ target: 'http://127.0.0.1:5173/app' }).target, 'http://127.0.0.1:5173/app');
});

// Task 173's bug, reduced: an absolute element inside a scrolling list, positioned against the desk around it.
const PAGE = `<!doctype html><title>Desk</title><style>body{margin:0;height:100vh;display:flex}#desk{flex:1;min-height:0;display:flex;overflow-x:auto;position:relative}
#thread{flex:1;min-height:0;overflow:auto}.msg{height:400px;border:1px solid}#announce{position:absolute;width:1px;height:1px;overflow:hidden}</style>
<div id="desk"><main id="window"><section id="thread"><div class="msg">1</div><div class="msg">2</div><div class="msg">3</div><p id="announce">new</p></section></main></div>
<button id="go" onclick="document.getElementById('desk').scrollTop=200;document.title='clicked';console.error('boom')">Send</button>`;

test('it shows what scrolls and what an element is placed against, at the size asked', { skip: !chrome && 'no Chromium on this machine' }, async () => {
  const server = createServer((_request, response) => { response.setHeader('Content-Type', 'text/html'); response.end(PAGE); });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const shots = mkdtempSync(join(tmpdir(), 'pi-shots-'));
    const result = await look({ target: `http://127.0.0.1:${server.address().port}/`, width: 1024, height: 560, steps: [{ click: 'Send' }],
      probes: ['viewport', 'scrolled', 'scrollable', 'positioned', 'console', { boxes: '.msg' }, { styles: { selector: '#desk', props: ['position', 'overflow-y'] } }, 'screenshot'] }, { chrome, shots });
    const dump = JSON.stringify(result).slice(0, 1500); // a flake under load (about 1 in 4 with a bench running) prints what the tool saw
    assert.equal(result.size, '1024×560', dump); assert.deepEqual(result.steps, ['1. click "Send": done'], dump);
    assert.equal(result.facts.viewport.width, 1024, dump); assert.equal(result.facts.viewport.title, 'clicked', dump);
    assert.ok(result.facts.scrolled.some(item => item.element === 'div#desk' && item.scrollTop === 200), JSON.stringify(result.facts.scrolled));
    assert.ok(result.facts.scrollable.some(item => item.element === 'div#desk'), 'the desk is scrollable: the fact that solved task 173 ' + dump);
    assert.deepEqual(result.facts.positioned.find(item => item.element === 'p#announce')?.against, 'div#desk', dump);
    assert.deepEqual(result.facts['styles #desk'], { position: 'relative', 'overflow-y': 'auto' });
    assert.equal(result.facts['boxes .msg'].length, 3);
    assert.deepEqual(result.facts.console, [{ level: 'error', text: 'boom' }], dump);
    assert.ok(existsSync(result.facts.screenshot));
    const missing = await look({ target: `http://127.0.0.1:${server.address().port}/`, steps: [{ click: 'Nothing here' }, { click: 'Send' }] }, { chrome });
    assert.match(missing.steps[0], /failed, No element matches/); assert.equal(missing.steps.length, 1, 'stops at the first failed step');
    const own = await look({ target: `http://127.0.0.1:${server.address().port}/` }, { chrome, forbidden: [server.address().port] });
    assert.match(own.error, /person's own workbench/);
  } finally { server.close(); }
});

test('by default it opens a scratch workbench with a Demo project, never the person\'s data', { skip: !chrome && 'no Chromium on this machine', timeout: 90000 }, async () => {
  let workbench;
  try {
    const result = await look({ width: 1024, height: 700, steps: [{ type: { into: '#prompt', text: 'Hello there' } }, { press: 'Enter' }, { waitFor: '.pw-msg--user' }, { wait: 2500 }],
      probes: ['viewport', { text: '#messages' }] }, { chrome, scratch: async () => (workbench ??= await startScratch()) });
    assert.match(result.opened, /^http:\/\/127\.0\.0\.1:\d+\/p\/[0-9a-f]+\/chat$/);
    assert.ok(result.steps.every(step => step.endsWith(': done')), result.steps.join('\n'));
    assert.match(result.facts['text #messages'], /Hello there[\s\S]*reply/);
  } finally { workbench?.stop(); }
});

test('Pi gets it as a tool; the scratch workbench is started once and the person\'s workbench is refused', async () => {
  let tool, started = 0, seen;
  const { installBrowser } = await import('../../harness/browser.mjs');
  const handle = installBrowser({ registerTool: definition => { tool = definition; } }, { forbidden: () => [3000],
    see: async (input, options) => { seen = options; await options.scratch(); await options.scratch(); return { opened: 'x', facts: { viewport: { width: input.width } } }; },
    start: async () => { started++; return { stop() { started = -1; } }; } });
  assert.equal(tool.name, 'browser');
  const answer = await tool.execute('1', { width: 390 });
  assert.match(answer.content[0].text, /"width": 390/); assert.equal(started, 1, 'one scratch workbench per session');
  assert.deepEqual(seen.forbidden, [3000]);
  handle.stop(); assert.equal(started, -1);
  const failed = await installBrowser({ registerTool: definition => { tool = definition; } }, { see: async () => { throw new Error('No Chromium'); } });
  assert.equal((await tool.execute('2', {})).isError, true);
});
