// A scratch workbench for the user-story journeys (task 264): the real services (harness/services.py: web, Gate, the
// queue, the preview) with the fake Pi (tests/fixtures/fake-pi.py) on PATH, in a fresh temporary folder. Nothing here
// reaches the person's data folder, projects, tailnet or Ollama: every PI_HARNESS_*/PI_WEB_REMOTE_* is stripped, the
// data, web data, Trash and log are scratch paths, Tailscale is off and Ollama is a closed port (as design.cjs does).
const { spawn, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const readline = require('node:readline');

const python = execFileSync('which', ['python3'], { encoding: 'utf8' }).trim();
const scripts = join(__dirname, 'stories');

/** A temporary folder with the fake `pi`; start() and stop() run the services in it, restart() keeps the data. */
function scratch(prefix = 'pi-stories-') {
  const directory = fs.realpathSync(fs.mkdtempSync(join(tmpdir(), prefix)));
  const fake = join(directory, 'pi');
  fs.writeFileSync(fake, `#!${python}\n` + fs.readFileSync(join(__dirname, '../fixtures/fake-pi.py'), 'utf8')); fs.chmodSync(fake, 0o755);
  const env = {
    ...Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^PI_(HARNESS_|WEB_REMOTE_)/.test(key))),
    PATH: directory + ':' + process.env.PATH, PI_TAILSCALE: 'false', PI_TRASH_DIR: join(directory, 'Trash'), PI_GATE_PORT: '0',
    PI_OLLAMA_URL: 'http://127.0.0.1:9', PI_COLIBRI_URL: 'http://127.0.0.1:9', PI_WEB_PORT: '0', PI_AGENT_DATA: join(directory, 'workspace'), PI_WEB_DATA: join(directory, 'data'),
    PI_HARNESS_LOG_FILE: join(directory, 'audit.log'), PI_FAKE_SCRIPTS: scripts, PI_LAYA_DATA: join(directory, 'laya'),
    PI_NO_DOWNLOADS: '1',  /* task 331: Create and Install Packages… never download; a story with uv stand-ins passes PI_NO_DOWNLOADS: '' */
  };
  const bench = { directory, data: join(directory, 'workspace'), env, server: null, ports: null, base: null, log: [] };
  bench.start = async (extra = {}) => {
    const server = spawn('python3', [join(process.env.PI_TEST_RUNTIME || '.', 'harness/services.py')], { env: { ...env, ...extra }, stdio: ['ignore', 'pipe', 'pipe'] });
    bench.server = server;
    // The request log must be read: an unread pipe fills up and the server stalls mid-request.
    server.stderr.on('data', chunk => { bench.log.push(...String(chunk).split('\n').filter(line => line && !/" (200|304) -/.test(line))); bench.log.splice(0, Math.max(0, bench.log.length - 60)); });
    const lines = readline.createInterface({ input: server.stdout });
    bench.ports = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Server startup timeout')), 15000);
      lines.once('line', line => { clearTimeout(timeout); resolve(JSON.parse(line)); });
      server.once('exit', code => reject(new Error('Server exited ' + code + '\n' + bench.log.join('\n'))));
    });
    bench.base = `http://127.0.0.1:${bench.ports.web}`;
    return bench;
  };
  /** Stop the services this bench started (its own process, by PID); SIGKILL after 5 s so a stuck run still ends. */
  bench.stop = async (signal = 'SIGTERM') => {
    const server = bench.server; if (!server) return;
    const exited = server.exitCode !== null || server.signalCode !== null ? Promise.resolve() : new Promise(resolve => server.once('exit', resolve));
    server.kill(signal); const killer = setTimeout(() => server.kill('SIGKILL'), 5000); await exited; clearTimeout(killer); bench.server = null;
  };
  bench.restart = async (extra) => { await bench.stop(); return bench.start(extra); };
  bench.remove = () => fs.rmSync(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  /** The web API from Node, as the page calls it: same Host, no Origin, and the page's person secret (task 261, the
   * pi-person meta the page reads in js/ui.mjs personHeaders) so a story can act as the person on person-only routes. */
  bench.person = async () => {
    const page = await (await fetch(bench.base + '/')).text();
    return page.match(/<meta name="pi-person" content="([^"]*)">/)?.[1] || '';
  };
  bench.api = async (path, body) => {
    const headers = { 'Content-Type': 'application/json', 'X-Pi-Person': await bench.person() };
    const response = await fetch(bench.base + path, body === undefined ? {} : { method: 'POST', headers, body: JSON.stringify(body) });
    const data = await response.json(); if (!response.ok) throw Object.assign(new Error(data.error || response.status), { status: response.status, data }); return data;
  };
  bench.job = async (id, states = ['completed', 'failed', 'stopped', 'interrupted', 'waiting'] /* task 290: a question or plan pause is 'waiting' */, timeout = 30000) => {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      const job = (await bench.api('/api/workspace')).jobs.find(item => item.id === id);
      if (job && states.includes(job.status)) return job;
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    throw new Error(`Request ${id} did not reach ${states.join('/')} in ${timeout} ms`);
  };
  bench.git = (folder, ...args) => execFileSync('git', ['-C', folder, ...args], { encoding: 'utf8' });
  bench.read = (...parts) => fs.readFileSync(join(...parts), 'utf8');
  bench.lines = (file) => fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line)) : [];
  return bench;
}

function launch() {
  const { chromium } = require('playwright');  // only the browser stories need it; tests/harness/stories.test.mjs does not
  return chromium.launch({ headless: true, args: ['--use-mock-keychain', '--password-store=basic'], ...(process.env.PI_TEST_CHROME ? { executablePath: process.env.PI_TEST_CHROME } : {}) });
}

/**
 * A tiny runner: story(id, title, fn, { xfail: 'review item N: why' }). An expected failure that fails is reported and
 * does not fail the suite; one that passes is reported as XPASS ("remove the marker") and does not fail either, so the
 * suite turns green when the fix merges. Assertions are never weakened for it.
 */
function runner() {
  const stories = [];
  const story = (id, title, fn, options = {}) => stories.push({ id, title, fn, ...options });
  const run = async (context) => {
    const only = process.env.PI_STORIES ? new RegExp(process.env.PI_STORIES) : null;
    const results = [];
    for (const item of stories) {
      if (only && !only.test(item.id)) continue;
      const started = Date.now(); let error = null;
      try { await item.fn(await context.fresh(item)); } catch (caught) { error = caught; }
      try { await context.after?.(item, error); } catch (caught) { error ||= caught; }
      const seconds = ((Date.now() - started) / 1000).toFixed(1);
      const outcome = item.xfail ? (error ? 'XFAIL' : 'XPASS') : (error ? 'FAIL' : 'PASS');
      results.push({ ...item, outcome, error });
      console.log(`${outcome.padEnd(5)} ${item.id} ${item.title} (${seconds} s)${item.xfail ? ` · ${item.xfail}` : ''}`);
      if (error && (outcome === 'FAIL' || process.env.PI_STORIES_VERBOSE)) console.log('      ' + String(error.stack || error).split('\n').slice(0, 6).join('\n      '));
      if (outcome === 'XPASS') console.log('      An expected failure passed: the fix has merged. Remove its xfail marker.');
    }
    const count = kind => results.filter(result => result.outcome === kind).length;
    console.log(`Stories: ${count('PASS')} passed, ${count('XFAIL')} expected failures, ${count('XPASS')} unexpectedly passed, ${count('FAIL')} failed.`);
    return count('FAIL') ? 1 : 0;
  };
  return { story, run };
}

module.exports = { scratch, launch, runner, scripts };
