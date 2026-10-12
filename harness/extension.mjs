import { spawn } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { localModels } from './provider.mjs';
import { attachMedia } from './media.mjs';
import { installTimestamps } from './timestamps.mjs';
import { fileURLToPath } from 'node:url';
import { ThoughtWatch } from './watch.mjs';
import { loadMemory, missingCanary, recordLesson } from './memory.mjs';

const moduleRoot = fileURLToPath(new URL('../', import.meta.url));
const names = { read: 'read_file', grep: 'read_file', find: 'read_file', ls: 'read_file', write: 'write_file', edit: 'write_file', bash: 'execute_command', powershell: 'execute_command' };
export default function harness(pi, dependencies = {}) {
  installTimestamps(pi, dependencies.timestamps);
  const root = dependencies.root || moduleRoot;
  const agentDir = process.env.PI_CODING_AGENT_DIR || join(homedir(), '.pi/agent');
  const globalMemory = join(agentDir, 'AGENTS.md');
  const memoryPath = dependencies.root ? `${root}AGENT.md` : process.env.PI_HARNESS_MEMORY || (existsSync(globalMemory) ? globalMemory : `${root}AGENT.md`);
  let config = {};
  try { config = JSON.parse(readFileSync(join(agentDir, 'models.json'), 'utf8')).providers?.ollama || {}; } catch {}
  pi.registerProvider?.('ollama', localModels(config));
  const transcribe = dependencies.transcribe || (async path => {
    const { stdout } = await promisify(execFile)('uv', ['run', '--python', '3.12', `${moduleRoot}harness/transcribe.py`, path], { timeout: 180000, maxBuffer: 1024 * 1024 });
    return stdout.trim();
  });
  const schedule = dependencies.setInterval || setInterval;
  const watch = new ThoughtWatch();
  const proposals = new Map();
  let child, timer, ports, context, pending, lastQuestion = '', lastImages = [], retries = 0, closing = false;
  const timeout = Number(process.env.PI_HANG_MS || 60000);
  const notify = (text, level = 'info') => context?.ui.notify(text, level);
  const stop = () => { closing = true; clearInterval(timer); watch.stop(); child?.kill('SIGTERM'); ports = undefined; };
  const call = async (path, body) => {
    if (!ports) throw new Error('Laya is unavailable');
    const response = await fetch(`http://127.0.0.1:${ports.laya}${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error(`Laya HTTP ${response.status}`);
    return response.json();
  };
  const trip = (reason, kind = 'loop') => {
    if (pending || !lastQuestion) return;
    pending = `Harness recovery: ${reason}\nLast user question:\n${lastQuestion}\nPrevious reasoning (last 100 lines):\n${[...watch.lines, watch.partial].filter(Boolean).join('\n')}\nExplain the loop or hang briefly, then use a different approach to answer the original question. Do not repeat the failed reasoning.`;
    recordLesson(memoryPath, kind);
    appendFileSync(`${root}incident_log.md`, `\n- ${new Date().toISOString()} Harness ${kind}: ${reason}\n`);
    appendFileSync(`${root}session.log`, `${JSON.stringify({ event: 'recovery', reason, question: lastQuestion, reasoning: watch.lines })}\n`);
    notify(reason, 'warning');
    context.abort();
    watch.stop();
  };
  pi.on('session_start', async (_event, ctx) => {
    context = ctx; closing = false;
    loadMemory(memoryPath);
    let stderr = '';
    const sharedPort = process.env.PI_HARNESS_SHARED_PORT;
    if (!sharedPort) {
    child = spawn(process.env.PI_PYTHON || 'python3', [`${moduleRoot}harness/services.py`], { cwd: root, env: { ...process.env, PI_WEB_CWD: process.env.PI_WEB_CWD || ctx.cwd || root }, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stderr.on('data', chunk => { stderr = (stderr + chunk).slice(-4000); });
    child.on('exit', () => {
      ports = undefined;
      if (!closing) { notify(`Harness services stopped: ${stderr}`, 'error'); watch.stop(); }
    });
    }
    try {
      ports = sharedPort ? { laya: Number(sharedPort), web: Number(process.env.PI_WEB_PORT || 3000) } : await new Promise((resolve, reject) => {
        let output = '', announced = false;
        const deadline = setTimeout(() => { child.kill(); reject(new Error('Service startup timed out')); }, 10000);
        child.once('error', error => { clearTimeout(deadline); reject(error); });
        child.once('exit', code => { clearTimeout(deadline); reject(new Error(`Services exited (${code}): ${stderr}`)); });
        child.stdout.on('data', chunk => {
          if (announced) return;
          output += chunk;
          if (output.includes('\n')) {
            announced = true;
            clearTimeout(deadline);
            try { resolve(JSON.parse(output.split('\n')[0])); } catch (error) { child.kill(); reject(error); }
          }
        });
      });
      const lines = [`Laya: http://127.0.0.1:${ports.laya}`, `Web: http://127.0.0.1:${ports.web}`, 'Loop check: every 10 seconds'];
      // OSC 8 links are understood by Pi's TUI and hyperlink-capable terminals.
      const linkedLines = lines.map(line => line.replace(/http:\/\/127\.0\.0\.1:\d+/g, url => `\x1b]8;;${url}\x1b\\${url}\x1b]8;;\x1b\\`));
      ctx.ui.setWidget('local-harness', linkedLines);
      ctx.ui.setStatus('local-harness', `Laya :${ports.laya} | Web :${ports.web}`);
      notify((ctx.hasUI === false ? lines : linkedLines).join('\n'));
      timer = schedule(() => {
        if (!watch.active || pending) return;
        const triple = watch.loop();
        if (triple) trip(`Loop detected: the same three thought lines occurred twice in the last 100 lines: ${JSON.stringify(triple)}`);
        else if (watch.thinking && (context.isIdle() || watch.hanging(Date.now(), timeout))) {
          trip(`Hang detected: pi remained in the thought phase with ${context.isIdle() ? 'no active model operation' : `no streamed activity for ${timeout}ms`}.`, 'hang');
        }
      }, 10000);
      timer.unref();
    } catch (error) { notify(`Harness startup failed: ${error.message}`, 'error'); }
  });
  pi.on('before_agent_start', event => {
    if (!lastQuestion && event.prompt) lastQuestion = event.prompt;
    return { systemPrompt: `${event.systemPrompt}\n\nCurrent persistent memory and operating instructions:\n${loadMemory(memoryPath)}` };
  });
  pi.on('message_end', event => {
    if (missingCanary(event.message)) trip('Instruction drift: the completed response omitted [CANARY]. Compact and reinject AGENTS.md.', 'canary');
  });
  pi.on('input', async (event, ctx) => {
    if (event.source === 'extension') return { action: 'continue' };
    lastQuestion = event.text; retries = 0; pending = undefined;
    try {
      const attached = await attachMedia(event, ctx?.cwd || root, ctx?.model, transcribe);
      if (attached.action === 'transform') {
        lastQuestion = attached.text;
        lastImages = attached.images;
      } else lastImages = event.images || [];
      return attached;
    } catch (error) { notify(`Media attachment failed: ${error.message}`, 'error'); return { action: 'handled' }; }
  });
  pi.on('agent_start', (_event, ctx) => { context = ctx; watch.start(); });
  pi.on('message_update', event => {
    const stream = event.assistantMessageEvent;
    watch.touch();
    if (stream.type === 'thinking_start' || stream.type === 'thinking_delta') watch.thinking = true;
    if (stream.type === 'thinking_delta') watch.feed(stream.delta);
    if (stream.type === 'thinking_end') { watch.feed('\n'); watch.thinking = false; }
    if (stream.type === 'text_start' || stream.type === 'text_delta' || stream.type === 'toolcall_start') watch.thinking = false;
  });
  pi.on('tool_execution_start', () => { watch.thinking = false; watch.touch(); });
  pi.on('tool_execution_update', () => watch.touch());
  pi.on('tool_execution_end', () => watch.touch());
  pi.on('agent_end', (_event, ctx) => {
    watch.stop();
    if (!pending) return;
    const recovery = pending; pending = undefined;
    if (retries++ >= 1) { notify('Recovery repeated. Stopped automatic retries; the incident is saved in session.log.', 'error'); return; }
    const reask = () => { if (!closing) pi.sendUserMessage([{ type: 'text', text: `${recovery}\n\nReinjected AGENTS.md:\n${loadMemory(memoryPath)}` }, ...lastImages]); };
    // Defer until pi has completed abort cleanup before compaction.
    setTimeout(() => {
      if (closing) return;
      ctx.compact({ customInstructions: `Preserve the original task and this recovery context:\n${recovery}`, onComplete: reask,
        onError: error => { notify(`Compaction failed: ${error.message}. Reasking with recovery context.`, 'warning'); reask(); } });
    }, 0);
  });
  pi.on('tool_call', async event => {
    try {
      const result = await call('/gatekeep', { tool_name: names[event.toolName] || event.toolName, args: event.input, pi_tool: event.toolName, cwd: context.cwd || root, auth_level: process.env.PI_LAYA_AUTH || 'admin' });
      if (result.outcome !== 'ALLOW') return { block: true, reason: `Laya pre-execution ${result.outcome} for ${event.toolName}: ${result.reason || 'Action denied by policy.'} The tool was not executed. Reconsider the target and use a narrowly scoped alternative consistent with the user request. Ordinary shell diagnostics remain available. Do not repeat the same destructive operation or bypass this check with another tool.` };
      proposals.set(event.toolCallId, result.proposal_id);
    } catch (error) { return { block: true, reason: error.message }; }
  });
  pi.on('tool_result', async event => {
    const token = proposals.get(event.toolCallId);
    proposals.delete(event.toolCallId);
    if (!token) return; // Blocked calls were never approved for execution.
    try {
      const result = await call('/audit', { proposal_id: token, tool_name: names[event.toolName] || event.toolName,
        args: event.input, output: event.content, exit_code: event.isError ? 1 : 0 });
      if (result.status !== 'SUCCESS') {
        notify(`Laya: ${result.status}: ${result.reason}`, 'error');
        return { isError: true, content: [...event.content, { type: 'text', text: `Laya audit failed: ${result.status}. ${result.reason}` }] };
      }
    } catch (error) {
      notify(`Laya audit failed: ${error.message}`, 'error');
      return { isError: true, content: [...event.content, { type: 'text', text: `Laya audit unavailable: ${error.message}` }] };
    }
  });
  pi.on('session_shutdown', stop);
}
