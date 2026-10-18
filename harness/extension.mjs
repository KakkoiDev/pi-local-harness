import { spawn } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, unlinkSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
import { localModels } from './provider.mjs';
import { attachMedia } from './media.mjs';
import { AgentLock } from './agent-lock.mjs';
import { installStartupDisplay, startupLines } from './startup-display.mjs';
import { installTimestamps } from './timestamps.mjs';
import { loadTerminalLanguage, requestLanguage, tr } from './language.mjs';
import { fileURLToPath } from 'node:url';
import { ThoughtWatch } from './watch.mjs';
import { loadMemory, missingCanary, recordLesson } from './memory.mjs';
import { pseudoToolCalls } from './pseudo-tools.mjs';
import { installConsole } from './console.mjs';
import { installFooter } from './footer.mjs';
import { harnessNotice, renderNotice } from './notices.mjs';
import { installToolRenderer } from './tool-render.mjs';
import { installChoices } from './choices.mjs';
import { installPlanning } from './planning.mjs';
import {installSearch} from './web-search.mjs';
import {installPhases} from './phases.mjs';
import {installTheme} from './theme.mjs';
import {checkIn} from './terminal-planning.mjs';
import { installTaskBox, boxProposal } from './task-box.mjs';
import { report } from './reports.mjs';
import { dataFolder } from './data-folder.mjs';
import {recordGuides,recordBlocks} from './decisions.mjs';
import { installBrowser } from './browser.mjs';
import { StepWatch } from './stuck.mjs';
import { harnessTools, activeTools } from './tool-choice.mjs';
import { loadGuides, chooseGuides } from './guides.mjs';
import { loadBlocks, chooseBlocks, blocksPrompt, blocksHint, installBlocks } from './blocks.mjs';
import { installMusic, musicAvailable } from './music.mjs';
import { capabilityCards } from './capability-cards.mjs';

const moduleRoot = fileURLToPath(new URL('../', import.meta.url));
// Pi's tools as Gate's risk categories. harness (the console tool, task 167) only reads: a change it is asked for is just previewed.
export const GATE_TOOL_NAMES = { read: 'read_file', grep: 'read_file', find: 'read_file', ls: 'read_file', harness: 'read_file', ask_choices: 'read_file', propose_plan: 'read_file', web_search:'read_file', app_block:'read_file', task_box: 'write_file', browser: 'write_file', music: 'write_file', write: 'write_file', edit: 'write_file', bash: 'execute_command', powershell: 'execute_command' };
const names = GATE_TOOL_NAMES;
export default function harness(pi, dependencies = {}) {
  // The bench baseline (PI_HARNESS_BARE=1): plain Pi with Gate's core safety rules, none of the harness around it, to
  // measure what the harness adds. No extra tools, recovery, wake-ups, paperwork or rules summary.
  const bare = process.env.PI_HARNESS_BARE === '1';
  // Task 261: Gate's token and port belong to this extension alone. Pi's bash passes process.env to every command it
  // runs, so both leave the environment here, before Pi can spawn anything. The workbench hands the token over in a
  // private file that is read once and removed. A value set explicitly later (the tests' web mode) still wins.
  const captured = {};
  for (const key of ['PI_HARNESS_TOKEN', 'PI_HARNESS_SHARED_PORT']) if (process.env[key] !== undefined) { captured[key] = process.env[key]; delete process.env[key]; }
  if (process.env.PI_HARNESS_TOKEN_FILE !== undefined) {
    const file = process.env.PI_HARNESS_TOKEN_FILE; delete process.env.PI_HARNESS_TOKEN_FILE;
    try { captured.PI_HARNESS_TOKEN = readFileSync(file, 'utf8').trim(); } catch {}
    try { unlinkSync(file); } catch {}
  }
  const sharedPortEnv = () => process.env.PI_HARNESS_SHARED_PORT ?? captured.PI_HARNESS_SHARED_PORT;
  const gateToken = () => process.env.PI_HARNESS_TOKEN ?? captured.PI_HARNESS_TOKEN;
  const extras = bare ? { ...pi, registerTool() {} } : pi;
  try { loadTerminalLanguage(); } catch {} // terminal Pi's screens: the `language` setting (system, en, ja); /commands stay English
  installTimestamps(pi, dependencies.timestamps);
  const showStartup = installStartupDisplay(pi);
  const root = dependencies.root || moduleRoot;
  const agentDir = process.env.PI_CODING_AGENT_DIR || join(homedir(), '.pi/agent');
  const dataDir = dataFolder(); // task 263: under node --test, the person's folder is refused
  // A workbench request runs while the workbench itself holds the lock for all its requests (task 164): skip it there.
  const sharedLock = new AgentLock(join(dependencies.root || dataDir, '.agent-lock'));
  const agentLock = { acquire: () => { if (process.env.PI_HARNESS_LOCK_HELD !== '1') sharedLock.acquire(); }, release: () => sharedLock.release() };
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
  const steps = new StepWatch(); // strategy 3: what Pi does, beside what it thinks
  let guides = []; try { guides = loadGuides(); } catch {} // strategy 5: know-how that joins the prompt when a request calls for it
  let chosenGuides = [],lastGuideDecision;
  // Plan 266 item 7: the App Block cards a request's words call for (code picks; the classifier only when code is unsure).
  let blocks; try { blocks = loadBlocks(); } catch {}
  const noBlocks = () => ({ cards: [], others: [], candidates: [], who: 'code' });
  let chosenBlocks = noBlocks(), lastBlockDecision;
  const proposals = new Map();
  // Round 6 (T_Gate): what Gate and the tool said per call, for the two-line tool rows (toolCallId → check).
  const checks = new Map(), check = (id, values) => { checks.set(id, { ...checks.get(id), ...values }); if (checks.size > 500) checks.delete(checks.keys().next().value); };
  installToolRenderer(pi, checks);
  // The persistent memory (AGENTS.md). Missing, the harness's template stands in and it is reported: a memory file that
  // cannot be read must never stop the session (the first bench run lost every tool to it).
  let memoryMissing = false;
  const memory = () => {
    try { return loadMemory(memoryPath); } catch (error) {
      if (!memoryMissing) { memoryMissing = true; report(dataDir, 'memory-missing', `${memoryPath}: ${error.message}; the template harness/AGENTS.md stands in`); }
      try { return loadMemory(`${moduleRoot}harness/AGENTS.md`); } catch { return ''; }
    }
  };
  let chosenContext = '', contextAttempted = false, requestId, verifiedBefore, child, timer, ports, context, pending, lastQuestion = '', lastImages = [], retries = 0, recovering = false, closing = false;
  const timeout = Number(process.env.PI_HANG_MS || 60000);
  const notify = (text, level = 'info') => context?.ui.notify(text, level);
  // Recovery and refusal (round 6, T_Gate): in terminal Pi a display-only entry, bold sentence first; Pi never reads it.
  // A web worker reports them as notices with the prefixes harness/web_chat.py reads.
  pi.registerEntryRenderer?.('harness-notice', entry => ({ render: width => renderNotice(entry.data, width), invalidate() {} }));
  const say = (kind, detail, level, ui = context?.ui) => {
    const notice = harnessNotice(kind, detail);
    if (sharedPortEnv() || !pi.appendEntry) ui?.notify(notice.web, level); else pi.appendEntry('harness-notice', notice);
  };
  const stop = () => { agentLock.release(); closing = true; clearInterval(timer); watch.stop(); child?.kill('SIGTERM'); ports = undefined; };
  // G-011: a Gate check that fails for a passing reason (no answer, a server error) is tried again before giving up;
  // a 4xx is Gate refusing the input and is not retried.
  const gateDelays = dependencies.gateRetryDelays || [1000, 3000, 6000];
  const gateCall = async (path, body) => {
    for (let attempt = 0; ; attempt++) {
      try { return await call(path, body); } catch (error) {
        if (/Gate HTTP 4\d\d/.test(error.message) || attempt >= gateDelays.length) throw error;
        await new Promise(resolve => setTimeout(resolve, gateDelays[attempt]));
      }
    }
  };
  // Task 260: /request/end may run the harness's own Red proof (the suite twice); it gets the turn's long timeout, not 5 s.
  const turnTimeout = 20 * 60 * 1000;
  const call = async (path, body, timeout = 5000) => {
    if (!ports) throw new Error('Gate is unavailable');
    const response = await fetch(`http://127.0.0.1:${ports.gate}${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Gate-Token': ports.token || '', ...(ports.person ? { 'X-Pi-Person': ports.person } : {}) }, // person: terminal Pi only (task 261)
      body: JSON.stringify(body), signal: AbortSignal.timeout(timeout),
    });
    if (!response.ok) { let said = ''; try { const body = await response.json(); said = body.error || body.message || ''; } catch {} throw new Error(`Gate HTTP ${response.status}${said ? `: ${said}` : ''}`); } // Gate's reason, so Pi can act on it
    return response.json();
  };
  // Plan 184: how many times the harness may wake Pi in one request (recoveries and "continue"); 0 is no limit.
  const wakeUps = () => Number(process.env.PI_HARNESS_WAKE_UPS ?? 5);
  const canWake = () => !wakeUps() || retries < wakeUps();
  const incident = (kind, detail, fields = {}) => report(dataDir, kind, detail, { source: sharedPortEnv() ? 'web' : 'terminal', cwd: context?.cwd || root, ...fields });
  const refreshContext = async () => {
    if (bare || !ports) return;
    contextAttempted = true;
    try { const chosen = await call('/context', { cwd: context?.cwd || root, text: lastQuestion, request: requestId }); chosenContext = chosen.text || ''; }
    catch (error) { chosenContext = ''; incident('context', `could not refresh: ${error.message}`); }
  };
  let noActionWoken=false, textualToolSeen=false, toolRan=false;
  let lastAnswer = '', assistantText = '', waitingChoice = false, nextPlanInput=false, pendingPlanReply='';
  const automatic=()=>call('/auto',{}).then(value=>value.enabled).catch(()=>false);
  const pauseChoice = ctx => { waitingChoice=true;setTimeout(()=>ctx?.abort?.(),0); };
  const askSystemChoice=installChoices(extras, {
    auto:automatic,
    web:()=>Boolean(sharedPortEnv()),
    pending:async (choice,ctx)=>{
      const pending=await call('/choice',{request:requestId,choice});
      if (sharedPortEnv()) {ctx?.ui?.notify?.('Harness choice: '+JSON.stringify(pending),'info');pauseChoice(ctx);}
    },
    record:async decision=>{await call('/decision',{request:requestId,...decision});assistantText='';},
    cancel:pauseChoice,
    waiting:()=>waitingChoice,
  });
  installPlanning(extras, {
    auto:automatic,
    change:async text=>{pendingPlanReply=text;},
    propose:content=>call('/plan',{request:requestId,content}),
    another:plan=>call('/phase',{cwd:plan.root,phase:'discussion',action:'Plan Another Task'}),
    approve:state=>call('/plan/approve',{request:requestId,state}),
    web:()=>Boolean(sharedPortEnv()),
    pending:async(plan,ctx)=>{ctx?.ui?.notify?.('Harness plan: '+JSON.stringify(plan),'info');pauseChoice(ctx);},
    cancel:pauseChoice,
  });
  const trip = (reason, kind = 'loop') => {
    if (bare || pending || !lastQuestion) return;
    pending = `Harness recovery: ${reason}\nLast user question:\n${lastQuestion}\nPrevious reasoning (last 100 lines):\n${[...watch.lines, watch.partial].filter(Boolean).join('\n')}\nExplain the loop or hang briefly, then use a different approach to answer the original question. Do not repeat the failed reasoning.`;
    recordLesson(memoryPath, kind);
    mkdirSync(dataDir, { recursive: true });
    appendFileSync(join(dataDir, 'incident_log.md'), `\n- ${new Date().toISOString()} Harness ${kind}: ${reason}\n`);
    appendFileSync(join(dataDir, 'session.log'), `${JSON.stringify({ event: 'recovery', reason, question: lastQuestion, reasoning: watch.lines })}\n`);
    incident('recovery', reason, { trigger: kind });
    say(kind, reason, 'warning'); // the web worker waits for the re-asked turn on this notice's prefix
    context.abort();
    watch.stop();
  };
  const footer = installFooter(pi, { ports: () => ports,phase:async ctx=>{const value=await call('/phase',{cwd:ctx?.cwd||root});return value.phase?value.phase[0].toUpperCase()+value.phase.slice(1):null;} }); // round 6: the workbench state under the input
  installConsole(extras, {phase:ctx=>call('/phase',{cwd:ctx?.cwd||root}), auto:automatic, recordAuto:action=>call('/auto/action',{request:requestId,...action}), ports: () => ports, seen: () => footer.markAllSeen() }); // /harness, /status, /gate … (plan 158)
  installMusic(extras);
  installPhases(pi,{call});
  installTheme(pi);  // task 312: /theme prints the app's theme tokens (the panel is the workbench's)
  installSearch(extras,{call:(path,data)=>call(path,{...data,request:requestId})});
  installBlocks(extras,{index:blocks});
  installTaskBox(extras, { cwd: () => context?.cwd || root }); // task 183: tick a box by its label
  // L-008: a real browser to reproduce and measure UI bugs; a scratch workbench, never the person's own (its port is refused).
  // Plan 198: target "app" is the project's own app, started through the workbench's Preview if it is not running.
  const projectApp = async () => {
    const web = ports?.web || process.env.PI_WEB_PORT;
    if (!web) throw new Error('The project\'s app is only reachable when the workbench runs (plh).');
    const deadline = Date.now() + 130000;
    for (;;) {
      const response = await fetch(`http://127.0.0.1:${web}/api/preview/start`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cwd: context?.cwd || root }) });
      const status = await response.json();
      if (!response.ok) throw new Error(status.error || `The workbench answered ${response.status}`);
      if (status.state === 'running') return status;
      if (status.state === 'none') throw new Error(status.message || 'This project has no app to show yet.');
      if (status.state === 'stopped') throw new Error(`The app stopped: ${status.error}`);
      if (Date.now() > deadline) throw new Error('The app did not start within two minutes.');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };
  const browserTool = installBrowser(extras, { forbidden: () => [ports?.web, process.env.PI_WEB_PORT].filter(Boolean).map(Number), shots: join(dataDir, 'browser'), app: projectApp });
  const boxes = new Map(); // toolCallId → the exact edit a task_box call became, for Gate's check and its audit
  const sandboxed = new Map(); // task 311: toolCallId → the bash input Gate allowed, before it became the sandboxed command
  pi.on('session_start', async (_event, ctx) => {
    context = ctx; closing = false;
    let stderr = '';
    const sharedPort = sharedPortEnv();
    // A web worker knows Gate's port at once: set it before anything that could fail (bench, 2026-10-15).
    if (sharedPort) ports = { gate: Number(sharedPort), web: Number(process.env.PI_WEB_PORT || 3000), token: gateToken() };
    memory();
    if (!sharedPort) {
    child = spawn(process.env.PI_PYTHON || 'python3', [`${moduleRoot}harness/services.py`], { cwd: root, env: { ...process.env, PI_WEB_CWD: process.env.PI_WEB_CWD || homedir() }, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stderr.on('data', chunk => { stderr = (stderr + chunk).slice(-4000); });
    child.on('exit', () => {
      ports = undefined;
      if (!closing) { notify(`Harness services stopped: ${stderr}`, 'error'); watch.stop(); }
    });
    }
    try {
      ports = sharedPort ? { gate: Number(sharedPort), web: Number(process.env.PI_WEB_PORT || 3000), token: gateToken() } : await new Promise((resolve, reject) => {
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
      // Round 6 header: the build, the data folder, and one line of suggestions on the very first start.
      let build = 'checkout', first = false;
      try { build = JSON.parse(readFileSync(join(moduleRoot, 'install.json'), 'utf8')).commit?.slice(0, 7) || build; } catch {}
      try { const marker = join(dataDir, '.welcomed'); first = !existsSync(marker); if (first && !sharedPort) { mkdirSync(dataDir, { recursive: true }); appendFileSync(marker, new Date().toISOString() + '\n'); } } catch {}
      const lines = startupLines(ports, { build, data: dataDir.replace(homedir(), '~'), first });
      ctx.ui.setWidget('local-harness', undefined);
      ctx.ui.setStatus('local-harness', undefined);
      showStartup?.(lines);
      const rpc = process.argv.some((arg, index) => arg === '--mode=rpc' || (arg === '--mode' && process.argv[index + 1] === 'rpc'));
      // Web workers (shared port) skip the banner: it would become the job's progress line on every request.
      if (!sharedPort && (!showStartup || ctx.hasUI === false || rpc)) notify(lines.join('\n'));
      if (!sharedPort) footer.start(ctx); // web workers have no person watching their terminal
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
    try { agentLock.acquire(); } catch {} // taken in 'input', which can refuse the turn; never let it drop the memory below
    if (!lastQuestion && event.prompt) lastQuestion = event.prompt;
    // Task 114: the web worker's chosen context for this turn; the system prompt is rebuilt each turn, so it never piles up in history.
    let chosen = '';
    if (chosenContext) chosen = `\n\nContext for this request:\n${chosenContext}`;
    try { if (!contextAttempted && process.env.PI_HARNESS_CONTEXT) chosen = `\n\nContext for this request:\n${readFileSync(process.env.PI_HARNESS_CONTEXT, 'utf8')}`; } catch {}
    // Plan 158: a terminal session is the harness console; Pi learns its commands (web workers share the port and skip it).
    let consoleGuide = '';
    try { if (!sharedPortEnv()) consoleGuide = `\n\n${readFileSync(`${moduleRoot}harness/CONSOLE.md`, 'utf8')}`; } catch {}
    // Plan 179: the rules Gate enforces, from its registry (harness/gate-rules.md, generated from gate/rules.py).
    let gateRules = '';
    if (!bare) try { gateRules = `\n\n${readFileSync(`${moduleRoot}harness/gate-rules.md`, 'utf8').replace(/^<!--.*-->\n/, '')}`; } catch {}
    if (!bare && musicAvailable(context?.cwd || root) && !chosenGuides.some(item => item.name === 'music')) { const musicGuide = guides.find(item => item.name === 'music'); if (musicGuide) chosenGuides = [...chosenGuides, musicGuide]; }
    const guideDecision=JSON.stringify([requestId,chosenGuides.map(item=>item.name)]);
    if (!bare && requestId && guideDecision!==lastGuideDecision) {recordGuides(dataDir,requestId,chosenGuides);lastGuideDecision=guideDecision;}
    const guide = chosenGuides.length ? `\n\nGuides for this request:\n${chosenGuides.map(item => item.text).join('\n\n')}` : '';
    let cards = ''; if (!bare) try { const found = capabilityCards(context?.cwd || root); if (found) cards = `\n\n${found}`; } catch {} // round 12: the project's capabilities (packaging.json) and their cards
    const blockDecision=JSON.stringify([requestId,chosenBlocks.cards]);
    if (!bare && requestId && chosenBlocks.cards.length && chosenBlocks.who==='code' && blockDecision!==lastBlockDecision) {try{recordBlocks(dataDir,requestId,chosenBlocks.cards);}catch{}lastBlockDecision=blockDecision;}
    let blockCards = '';
    if (!bare && blocks) try { blockCards = chosenBlocks.cards.length ? blocksPrompt(chosenBlocks.cards, blocks, undefined, chosenBlocks.others) : blocksHint(chosenBlocks.candidates); } catch {}
    const language=requestLanguage(dataDir);loadTerminalLanguage(language);const languageGuide=`\n\nReply to the person in ${language==='ja'?'Japanese':'English'}; keep code, filenames and commands in their original form.`;
    return { systemPrompt: `${event.systemPrompt}${languageGuide}\n\nCurrent persistent memory (${memoryPath}; add a short lesson there with write or edit, at most 32 KiB in all) and operating instructions:\n${memory()}${gateRules}${chosen}${guide}${blockCards}${cards}${consoleGuide}` };
  });
  pi.on('message_end', event => {
    let message=event.message, replacement;
    if(message?.role==='assistant')textualToolSeen ||= /(?:\b(?:bash|read|write|edit)\s*[{(]|<\|tool_call\|>|^\s*call:)/mi.test((message.content||[]).filter(part=>part.type==='text').map(part=>part.text).join(''));
    if (!bare && message?.role==='assistant') {
      let count=0;
      const content=[...(message.content||[])];
      for(let i=0;i<content.length;i++)if(content[i].type==='text')content[i]={...content[i],text:(message.content[i].text||'').replace(/<channel\|>|<\|[^<>\n]*\|>/g,()=>{count++;return '';})};
      // Task 324 (live: gemma4 wrote "<execute_tool>read{path:…}</execute_tool>" and the next model imitated it on every
      // turn): a tool call written as text never stays in the session Pi reads back, nor in the answer the person sees.
      let pseudo=0;
      for(let i=0;i<content.length;i++)if(content[i].type==='text'){const found=pseudoToolCalls(content[i].text||'');if(found.count){pseudo+=found.count;content[i]={...content[i],text:found.text};}}
      if(pseudo){textualToolSeen=true;message={...message,content};replacement={message};incident('pseudo-tool-call',`Replaced ${pseudo} tool calls written as text.`,{count:pseudo});}
      if(count){
        message={...message,content};replacement={message};
        incident('template-tokens',`Removed ${count} leaked template tokens.`,{count});
        appendFileSync(join(dataDir,'session.log'),JSON.stringify({event:'template-tokens',count,question:lastQuestion})+'\n');
      }
    }
    if (message?.role === 'assistant') assistantText+='\n'+(message.content || []).map(part=>part.type === 'thinking' ? part.thinking || '' : part.type === 'text' ? part.text || '' : '').join('\n')+'\n';
    if (message?.role === 'assistant') lastAnswer = (message.content || []).filter(part => part.type === 'text').map(part => part.text).join('');
    if (missingCanary(message)) trip('Instruction drift: the completed response omitted [CANARY]. Compact and reinject AGENTS.md.', 'canary');
    return replacement;
  });
  pi.on('input', async (event, ctx) => {
    if (ctx) context = ctx;
    const chain=nextPlanInput;nextPlanInput=false;
    if (event.source === 'extension' && !chain) { await refreshContext(); return { action: 'continue' }; }
    // One agent at a time (terminal and web share <data>/.agent-lock): refuse here, where a turn can still be refused.
    try { agentLock.acquire(); } catch (error) { say('refused', error.message, 'warning', ctx?.ui || context?.ui); return { action: 'handled' }; }
    assistantText='';waitingChoice=false;noActionWoken=false;textualToolSeen=false;toolRan=false;
    chosenContext = ''; contextAttempted = false; lastQuestion = event.text; retries = 0; pending = undefined; recovering = false; steps.reset();
    const guideReply=String(event.text || '').match(/^Choice: Which guide should Pi use\? → (.+)$/);
    const guideName=guideReply?.[1]==='Use the planning guide'?'planning':guideReply?.[1];
    chosenGuides = bare ? [] : guideReply ? guides.filter(item=>item.name===guideName) : chooseGuides(event.text, guides);
    if (chosenGuides.length) incident('guide', chosenGuides.map(guide => guide.name).join(', '));
    chosenBlocks = bare || !blocks || /^Choice: /.test(String(event.text || '')) ? noBlocks() : { ...chosenBlocks, ...chooseBlocks(event.text, blocks), who: 'code' };
    // Strategy 4: only the harness tools this request needs (a small tool set for a small model).
    if (!bare && pi.setActiveTools && pi.getActiveTools) {
      const folder = ctx?.cwd || context?.cwd || root, tasks = existsSync(join(folder, 'tasks')) && existsSync(join(folder, 'ROADMAP.md'));
      try { pi.setActiveTools(activeTools(pi.getActiveTools(), harnessTools(event.text, { terminal: !sharedPortEnv(), tasks, auto:await automatic(), music:musicAvailable(folder), blocks:Boolean(chosenBlocks.cards.length || chosenBlocks.candidates.length) }), (pi.getAllTools?.() || []).map(tool => tool.name))); } catch {}
    }
    // Plan 184: the harness keeps this request's paperwork (task, progress, commit); Pi only writes content.
    // Task 273: a chained request (the next approved task) keeps its web job's id as a prefix, so its decisions join that answer.
    requestId = bare ? undefined : chain ? (process.env.PI_HARNESS_JOB ? `${process.env.PI_HARNESS_JOB}.${randomUUID().slice(0, 8)}` : randomUUID()) : process.env.PI_HARNESS_JOB || randomUUID();
    let held = [];
    if (requestId) await call('/request', { request: requestId, cwd: context?.cwd || root, text: event.text || '' }).then(async answer=>{
      held = Array.isArray(answer.held) ? answer.held.filter(text => typeof text === 'string' && text.trim()) : []; // task 290: words a question interrupted
      if (answer.advice?.choice) await askSystemChoice(answer.advice.choice,context);
      // Task 290: a phase word gets an inline notice (the web chat shows "Harness notice:" lines under the answer), never a card.
      if (answer.advice?.notice) context?.ui?.notify?.(sharedPortEnv() ? `Harness notice: ${answer.advice.notice}` : tr(answer.advice.notice),'info');
      else if (answer.advice && !answer.advice.abstained) context?.ui?.notify?.(tr('Use the explicit phase and approval controls.'),'info');
      if (answer.root && !answer.planning?.approved) {
        const planning=guides.find(guide=>guide.name==='planning');
        if (planning && !chosenGuides.includes(planning)) chosenGuides=[planning,...chosenGuides];
      }
      if (answer.root && !chosenGuides.length && !waitingChoice && !guideReply) {
        const result=await call('/judgement',{request:requestId,kind:'applicable_guide',args:[event.text || '',guides.map(item=>item.name)]});
        if (result.choice) { const picked=await askSystemChoice(result.choice,context);const name=picked.details?.answer==='Use the planning guide'?'planning':picked.details?.answer;const guide=guides.find(item=>item.name===name);if(guide)chosenGuides=[guide]; }
        else if (!result.abstained) { const guide=guides.find(item=>item.name===result.answer);if(guide)chosenGuides=[guide]; }
      }
      // Plan 266 item 7: only common or shared words matched; the classifier picks one of those few cards, or none.
      if (answer.root && !chosenBlocks.cards.length && chosenBlocks.candidates.length && !waitingChoice) {
        try {
          const result=await call('/judgement',{request:requestId,kind:'app_block',args:[event.text || '',chosenBlocks.candidates]});
          if (!result.abstained && chosenBlocks.candidates.includes(result.answer)) chosenBlocks={...chosenBlocks,cards:[result.answer],candidates:[],who:'laya'};
        } catch (error) { incident('blocks', `no classifier pick: ${error.message}`); } /* the hint with the names still goes to Pi */
      }
    }).catch(error => incident('paperwork', `could not start: ${error.message}`));
    lastAnswer = ''; { const reading = call('/verification', { cwd: context?.cwd || root }).then(answer => answer.verification).catch(() => null); await reading; verifiedBefore = reading; } // G-012 and plan 184: read before the turn starts
    try {
      let attached = await attachMedia(event, ctx?.cwd || root, ctx?.model, transcribe);
      // Task 290 (review item 4): the person's message that a question interrupted before Pi read it comes with the answer.
      if (held.length) attached = { action: 'transform', text: `${attached.action === 'transform' ? attached.text : event.text || ''}\n\nThe person's message from before the question (not answered yet):\n${held.join('\n\n')}`, images: attached.action === 'transform' ? attached.images : event.images || [] };
      if (attached.action === 'transform') {
        lastQuestion = attached.text;
        lastImages = attached.images;
      } else lastImages = event.images || [];
      await refreshContext();
      return attached;
    } catch (error) { notify(`Media attachment failed: ${error.message}`, 'error'); return { action: 'handled' }; }
  });
  // Task 116: agent_end can fire again before a new turn while the usage reading is still stale; compact at most once per turn.
  let compactedThisTurn = false;
  pi.on('agent_start', (_event, ctx) => { context = ctx; recovering = false; compactedThisTurn = false; watch.start(); });
  pi.on('message_update', event => {
    const stream = event.assistantMessageEvent;
    if (stream.type === 'text_delta' || stream.type === 'thinking_delta') assistantText+=stream.delta || '';
    watch.touch();
    if (stream.type === 'thinking_start' || stream.type === 'thinking_delta') watch.thinking = true;
    if (stream.type === 'thinking_delta') watch.feed(stream.delta);
    if (stream.type === 'thinking_end') { watch.feed('\n'); watch.thinking = false; }
    if (stream.type === 'text_start' || stream.type === 'text_delta' || stream.type === 'toolcall_start') watch.thinking = false;
  });
  pi.on('tool_execution_start', () => { toolRan = true; watch.thinking = false; watch.touch(); });
  pi.on('tool_execution_update', () => watch.touch());
  pi.on('tool_execution_end', () => watch.touch());
  // Task 116: compact a long chat after the turn that passes 60% of the window, once per turn, before Pi's own
  // threshold (window - 16,384) is reached. Uses the extension API, so plain pi's settings stay untouched.
  const COMPACT_AT = 0.6;
  pi.on('agent_end', (_event, ctx) => {
    watch.stop();
    if (waitingChoice) return;
    if (!pending) {
      const usage = ctx?.getContextUsage?.();
      if (!compactedThisTurn && usage?.tokens && usage.tokens > COMPACT_AT * usage.contextWindow) {
        compactedThisTurn = true;
        setTimeout(() => {
          if (closing) return;
          ctx.compact({ customInstructions: 'Keep the open work: what the person asked for, decisions made, files touched, and what is left to do. Drop finished detail.',
            onError: error => notify(`Compaction failed: ${error.message}`, 'warning') });
        }, 0);
      }
      return;
    }
    const recovery = pending; pending = undefined;
    if (!canWake()) { incident('stopped', `recovery repeated ${retries} times: ${recovery.split('\n')[0]}`); say('stopped', join(dataDir, 'session.log'), 'error'); return; }
    recovering = true; retries++;
    const reask = () => { if (!closing) pi.sendUserMessage([{ type: 'text', text: `${recovery}\n\nReinjected AGENTS.md:\n${memory()}` }, ...lastImages]); };
    // Defer until pi has completed abort cleanup before compaction.
    setTimeout(() => {
      if (closing) return;
      ctx.compact({ customInstructions: `Preserve the original task and this recovery context:\n${recovery}`, onComplete: reask,
        onError: error => { notify(`Compaction failed: ${error.message}. Reasking with recovery context.`, 'warning'); reask(); } });
    }, 0);
  });
  pi.on('tool_call', async event => {
    // task_box: Gate checks the exact edit it becomes (G-004, G-009, G-010); a vague label is answered with the list.
    let args = event.input, piTool = event.toolName;
    if(event.toolName==='task_box')return {block:true,reason:'System 1 ticks task boxes from recorded evidence. Provide content and run the checks.'};
    try {
      const result = await gateCall('/gatekeep', { request: requestId, tool_name: names[event.toolName] || event.toolName, args, pi_tool: piTool, tool_call_id: event.toolCallId, assistant_text: assistantText, cwd: context.cwd || root, auth_level: process.env.PI_GATE_AUTH || 'admin', source: sharedPortEnv() ? 'web' : 'terminal' }); // task 129
      if (result.outcome === 'REVISE') check(event.toolCallId, { gate: 'revise', reason: result.reason, phase:result.phase });
      else if (result.outcome !== 'ALLOW') check(event.toolCallId, { gate: 'blocked', reason: result.reason || 'Action denied by policy.' });
      else check(event.toolCallId, { gate: 'allowed', started: Date.now() });
      if (result.judgement?.choice) await askSystemChoice(result.judgement.choice,context);
      if (result.outcome === 'REVISE') return { block: true, reason: `Gate pre-execution REVISE for ${event.toolName}: ${result.reason} The tool was not executed. Address the reason above, then retry.` };
      if (result.outcome !== 'ALLOW') return { block: true, reason: `Gate pre-execution ${result.outcome} for ${event.toolName}: ${result.reason || 'Action denied by policy.'} The tool was not executed. Reconsider the target and use a narrowly scoped alternative consistent with the user request. Ordinary shell diagnostics remain available. Do not repeat the same destructive operation or bypass this check with another tool.` };
      proposals.set(event.toolCallId, result.proposal_id);
      // Task 311: Gate runs an allowed test command in the sandbox (gate/sandbox.py). Pi's bash runs Gate's wrapped
      // command; the audit gets the command Gate allowed, so it is not drift.
      if (typeof result.command === 'string' && typeof args?.command === 'string') { sandboxed.set(event.toolCallId, { ...args }); event.input.command = result.command; }
    } catch (error) {
      // G-011 (plan 184, L-002): Gate failed (an error, not a decision) even after retries. This call does not run; the run
      // goes on (no babysitting) and the failure is reported for the analysis.
      check(event.toolCallId, { gate: 'unavailable', reason: error.message });
      incident('gate-failed', error.message, { tool: event.toolName });
      say('gate-failed', error.message, 'warning');
      return { block: true, reason: `G-011 Gate could not check this call: ${error.message}. It did not run. You may continue; try the call again, or another way within the rules.` };
    }
  });
  pi.on('tool_result', async event => {
    // Strategy 3 (OpenHands' stuck detector): the same call with the same result, the same failing call, or two calls
    // alternating: Pi is not making progress. Stop the turn and ask again another way (a wake-up; reported).
    const stuck = steps.add({ tool: event.toolName, input: event.input, error: Boolean(event.isError), text: (event.content || []).map(part => part.text || '').join('\n') });
    if (stuck && !bare) trip(`Stuck: ${stuck}`, 'stuck');
    const token = proposals.get(event.toolCallId);
    proposals.delete(event.toolCallId);
    if (!token) return; // Blocked calls were never approved for execution.
    try {
      const started = checks.get(event.toolCallId)?.started, seconds = started ? (Date.now() - started) / 1000 : undefined;
      const result = await call('/audit', { proposal_id: token, tool_name: names[event.toolName] || event.toolName,
        args: boxes.get(event.toolCallId) || sandboxed.get(event.toolCallId) || event.input, output: event.content, exit_code: event.isError ? 1 : 0 });
      boxes.delete(event.toolCallId); sandboxed.delete(event.toolCallId);
      if (result.sandbox_refused) notify(sharedPortEnv() ? `Harness notice: ${result.sandbox_refused}` : result.sandbox_refused, 'warning'); /* task 311: the person can widen it */
      // Plan 184: the first change gives the request its task; Pi reads where it is and that the harness keeps it.
      const told = result.note ? [{ type: 'text', text: result.note }] : [];
      // Round 6 (T_Gate): Gate's verdict and the command's own result are separate words. A command that exits with an
      // error was still allowed: say so, without an alarm. Only Gate's own findings (the command changed) are Gate's.
      if (result.status === 'EXECUTION_FAILED') {
        const text = (event.content || []).map(part => part.text || '').join('\n'), code = text.match(/exit(?:ed)?(?: with)?(?: code)? (\d+)/i)?.[1] || '1';
        check(event.toolCallId, { ok: false, exit: Number(code), seconds });
        return { isError: true, content: [...event.content, { type: 'text', text: `✓ Gate allowed · ✗ exit ${code}: the command failed on its own; Gate did not block it.` }] };
      }
      if (result.status !== 'SUCCESS') {
        const words = { DRIFT_DETECTED: 'the command that ran was not the one it allowed' }[result.status] || 'it did not accept the result';
        check(event.toolCallId, { drift: words, seconds });
        notify(`Gate: ${words} (${result.status}). ${result.reason}`, 'error');
        return { isError: true, content: [...event.content, { type: 'text', text: `✗ Gate: ${words} (${result.status}). ${result.reason}` }] };
      }
      check(event.toolCallId, { ok: !event.isError, exit: event.isError ? 1 : 0, seconds });
      if (told.length) return { content: [...(event.content || []), ...told] };
    } catch (error) {
      check(event.toolCallId, { drift: `could not check the result (${error.message})` });
      notify(`Gate audit failed: ${error.message}`, 'error');
      return { isError: true, content: [...event.content, { type: 'text', text: `Gate audit unavailable: ${error.message}` }] };
    }
  });
  pi.on('agent_settled', async event => {
    agentLock.release();
    if (waitingChoice) {
      if (requestId) await call('/request/pause',{request:requestId});
      requestId=undefined;
      if(pendingPlanReply){const text=pendingPlanReply;pendingPlanReply='';waitingChoice=false;nextPlanInput=true;recovering=true;pi.sendUserMessage(text);return;}
      notify('Harness settled','info');return;
    }
    // G-012 (plan 179, L-005) and plan 184: code changed during the request and Gate saw no passing test on it afterwards.
    // The harness wakes Pi to finish (not when the person stopped it, nor when Pi asked the person something); out of
    // wake-ups, the turn is marked "Not verified".
    // The web worker ends the request as soon as the harness says it will not wake Pi ("Harness settled").
    // The request is over: the harness finishes its paperwork (commits when verified), then tells the web worker.
    const settledNow = async () => {
      if (requestId) {
        const result = await call('/request/end', { request: requestId, review: !event?.aborted && !/\?\s*$/.test(lastAnswer) && canWake() && !closing }, turnTimeout).then(answer => answer.result).catch(error => { incident('paperwork', `could not finish: ${error.message}`); return null; });
        if (result?.outcome === 'continue') {
          recovering = true; retries++;
          verifiedBefore = call('/verification', { cwd: context?.cwd || root }).then(answer => answer.verification).catch(() => null);
          incident('wake-up', result.kind === 'plan' ? 'plan incomplete' : 'starter sample cleanup');
          say('wake-up', { message: result.kind === 'plan' ? 'Plan incomplete.' : 'This project started from the sample notes app.' }, 'warning');
          pi.sendUserMessage(`Continue (harness wake-up ${retries}): ${result.instruction}`);
          return;
        }
        const ended = requestId; requestId = undefined;  // task 273: the auto acceptance below is recorded under this request
        if (result?.report) {
          const report=result.report;
          notify(tr(`Run report: ${report.counts.done} tasks · ${report.counts.decisions} decisions · ${report.counts.external} external actions · ${report.counts.problems} problems. /report`),'info');
          if (sharedPortEnv()) notify('Harness report: '+JSON.stringify(report),'info');
        }
        if (result?.check_in) {
          const check=result.check_in;
          if (check.verified && await automatic()) {
            await call('/phase/accept',{cwd:check.root,state:'auto',request:ended});
            if(!check.next){check.accepted=true;notify(tr('Plan complete.'),'info');}
            else {say('committed',`${result.message} · committed as ${result.commit}`,'info');
            nextPlanInput=true;recovering=true;
            notify('Harness recovery: Continue the next approved task.','info');
            pi.sendUserMessage('yes');return;}
          }
          if (sharedPortEnv()) notify('Harness check-in: '+JSON.stringify(check),'info');
          else if(!check.accepted) {
            if(await checkIn(context,check)==='continue'){await call('/phase/accept',{cwd:check.root,request:ended});if(check.next){nextPlanInput=true;recovering=true;pi.sendUserMessage('Continue the approved task.');return;}notify(tr('Plan complete.'),'info');}
          }
        }
        if (result?.outcome === 'committed') say('committed', result.commit ? `${result.message} · committed as ${result.commit}` : result.message, 'info');  // the commit: Undo This Request
        else if (result?.outcome === 'not verified' && result.commit) say('saved-unverified', `${result.message} · committed as ${result.commit}`, 'warning');  // committed too, marked (2026-10-15)
        else if (result?.outcome === 'plan incomplete') say('plan-incomplete', `Plan incomplete (G-014): ${result.reason}${result.commit ? ` · committed as ${result.commit}` : ''}`, 'warning');
        else if (result?.outcome === 'commit failed') say('commit-failed', `${result.task}: ${result.reason}`, 'warning');
      }
      if (sharedPortEnv()) notify('Harness settled', 'info');
    };
    // agent_end clears pending before abort cleanup settles; the re-asked turn still owns the request.
    if (pending || recovering) return;
    if (bare) { verifiedBefore = undefined; await settledNow(); return; }
    if (!verifiedBefore) { await settledNow(); return; }
    const before = await verifiedBefore;
    const after = await call('/verification', { cwd: context?.cwd || root }).then(answer => answer.verification).catch(() => null);
    const changing=/\b(?:fix|add|build|create|make|implement|write|document|refactor|rename|repair|do task|next task)\b|修正|追加|作って|作成|書いて|文書化/.test(lastQuestion.toLowerCase());
    const textualTool=textualToolSeen || /(?:\b(?:bash|read|write|edit)\s*[{(]|<\|tool_call\|>|^\s*call:)/mi.test(assistantText);
    const announced=lastAnswer.match(/(?:\b(?:I will|I'll start|Let me|Next, I)\b|\bFirst,)[^\n]*/i);
    // Task 324 (live: a small model thought "I will proceed with the propose_plan call" and ended with no tool call and
    // no answer): a turn with no answer and no tool that ran, or a tool call written as text, is nudged once whatever
    // the request's words; System 1 decides it (recorded as the wake-up incident).
    const silentTurn=!lastAnswer.trim() && !toolRan && !waitingChoice && /\b(?:tool|call|propose_plan|ask_choices|I will|I'll|let me|proceed)\b/i.test(assistantText);
    if(!noActionWoken && !event?.aborted && canWake() && !closing && (textualTool || silentTurn || typeof before?.state==='string' && before.state===after?.state && changing && announced && !/\?\s*$/.test(lastAnswer))){
      noActionWoken=true;recovering=true;retries++;
      const instruction=textualTool?'Nothing ran: your tool call was written as text. Call the tool through the tool interface; do not write it in your answer.':silentTurn?'Call the tool you described now; do not describe it.':`You said: '${announced[0]}'. Do it now with a tool call.`;
      incident('wake-up',instruction,{trigger:'no-action',round:retries});
      say('wake-up',instruction,'warning');
      pi.sendUserMessage(`Continue (harness wake-up ${retries}): ${instruction}`);return;
    }
    if (!(after?.code?.length && !after.verified && before?.state !== after.state)) { verifiedBefore = undefined; await settledNow(); return; }
    const files = after.code.slice(0, 5).join(', ') + (after.code.length > 5 ? ' …' : '');
    if (!event?.aborted && !/\?\s*$/.test(lastAnswer) && canWake() && !closing) {
      recovering = true; retries++;
      const round = wakeUps() ? `${retries} of ${wakeUps()}` : `${retries}`;
      incident('wake-up', `not verified: ${files}`, { round });
      say('wake-up', `${files} (wake-up ${round})`, 'warning'); // the web worker waits for the next turn on this notice's prefix
      pi.sendUserMessage(`Continue (harness wake-up ${round}): you changed ${files} and no passing test ran on that code yet. Run the tests, fix what fails, and finish the request. If it cannot be tested, say why in one line.`);
      return;
    }
    verifiedBefore = undefined; await settledNow();
    if (!sharedPortEnv()) { incident('unverified', files); say('unverified', files, 'warning'); } // the web marks its own answer
  });
  // Task 164: with a model that answers one request at a time, a work request asks the workbench before each model call
  // and waits while Pi answers the person in chat. An unreachable workbench never blocks the model.
  pi.on('before_provider_request', async () => {
    const url = process.env.PI_HARNESS_TURN_URL;
    if (!url) return undefined;
    try { await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(turnTimeout) }); } catch {}
    return undefined;
  });
  pi.on('session_before_compact', () => { try { agentLock.acquire(); } catch { return { cancel: true }; } });
  pi.on('session_compact', () => { if (!watch.active) agentLock.release(); });
  pi.on('session_shutdown', () => { footer.stop(); browserTool.stop(); stop(); });
}
