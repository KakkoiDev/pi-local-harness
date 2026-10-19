// The harness console in terminal Pi (plan 158, task 159): slash commands that run harness/admin.py at once, without
// the model. The output goes into the session as a custom message, so the person sees it and Pi can explain it.
// Pi's own /settings and /model stay Pi's: the harness uses /config and /models.
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { renderView, ansiStyle } from './terminal-render.mjs';
import { translateView, tr } from './language.mjs';
import { queueChange } from './queue-console.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));

// Same names and order as COMMANDS in harness/admin.py (tests/harness/console.test.mjs checks it).
export const CONSOLE_COMMANDS = {
  harness: 'What the harness is and the commands it offers.',
  status: 'Services, model, queue and Gate counts, data folder, build.',
  queue: 'Requests in Activity: /queue [all|running|waiting|failed|…] · /queue edit <id> <words> · /queue remove <id>.',
  job: 'The Markdown record of one request: /job <id> (its first 8 characters).',
  gate: 'Gate checks, newest first: /gate [n] [blocked] · /gate why <id>.',
  models: 'Installed models; /models use · check · pull · remove <name> (changes ask first).',
  ollama: 'Ollama settings; /ollama set <key> <value> and /ollama restart ask first.',
  projects: 'Projects and their folders.',
  auto: 'Run on its own for all projects: /auto on|off|status (on always asks about the risks).',
  report: 'The last automatic run’s report.',
  config: 'config.json explained; /config set <key> <value> changes one (asks first).',
  paths: 'Where the harness keeps its data.',
  doctor: 'Checks with what is wrong and what to do.',
  audit: 'Run the publication checks for this project (asks first; offline).',
  setup: 'Install this project’s packages: /setup packages (asks first; downloads once; your terminal only).',
  undo: 'Undo the last change made from the console (asks first).',
  reports: 'Incidents the harness met while Pi worked (rules, Gate failures, recoveries, wake-ups, stops): /reports [kind].',
  decisions: 'The last request’s decisions with their authors: /decisions [--all] (task 273).',
  bench: 'The bench: scenarios run with the real model; solved, verified, time, wake-ups per model and harness build.',
  guide: 'How to use Pi Workbench: /guide, or /guide <words> for the matching questions.',
  update: 'A new version of Pi Workbench on GitHub, and what changed: /update · /update now (asks first).',
};

/** python3 -m harness.admin <command> <args>, with the live web port when the services run. */
export function runAdmin(command, args, { webPort } = {}) {
  return new Promise(resolve => {
    const argv = ['-m', 'harness.admin', command, ...args, ...(webPort ? ['--web', String(webPort)] : [])];
    execFile(process.env.PI_PYTHON || 'python3', argv, { cwd: root, timeout: args.includes('--yes') ? 4 * 3600000 : 30000 /* a switch waits for the load, a pull for the download */, maxBuffer: 4 * 1024 * 1024 }, (error, stdout, stderr) => {
      const code = error ? (typeof error.code === 'number' ? error.code : 1) : 0; // 3: a change waits for the person's yes
      resolve({ ok: !error, code, text: (code === 3 ? stdout : error ? stderr || error.message : stdout).trimEnd() });
    });
  });
}

/** The words /<command> takes, as [argument, what it is], from harness/admin.py (Tab completion, task 171). */
export function completeAdmin(command, { webPort } = {}) {
  return new Promise(resolve => {
    const argv = ['-m', 'harness.admin', command, '--complete', ...(webPort ? ['--web', String(webPort)] : [])];
    execFile(process.env.PI_PYTHON || 'python3', argv, { cwd: root, timeout: 10000 }, (error, stdout) => {
      try { resolve(error ? [] : JSON.parse(stdout)); } catch { resolve([]); }
    });
  });
}
const COMPLETES = ['queue', 'job', 'gate', 'models', 'ollama', 'config', 'guide', 'reports'];

/** Register the slash commands, and the harness tool Pi calls (task 167). `ports()` returns the running services' ports. */
export function installConsole(pi, { ports = () => undefined, run = runAdmin, seen = () => {}, complete = completeAdmin, auto = async()=>false, recordAuto=async()=>{}, phase=async()=>null } = {}) {
  // The harness tool: the same commands for Pi, run from the harness's own folder (Pi once tried `python3 -m harness.admin`
  // from the home folder, where it is not found). Reads only: a change returns its preview and asks Pi to have the person
  // type the command, which then asks for their yes (plan 158, C1).
  pi.registerTool?.({
    name: 'harness', label: 'Harness console',
    description: 'Ask the Pi Workbench harness about itself, instead of bash or searching files: status, doctor, queue, job <id>, gate [n] [blocked] | why <id>, models, ollama, projects, config, paths, and guide [words] (how to use the workbench: opening it, projects, comments, models, phone, settings). Changes are previewed for the person unless Run on its own is on; then changes run automatically. Turning automation on always requires the person’s risk confirmation.',
    promptSnippet: 'harness: the Pi Workbench console (status, doctor, queue, gate, models, config, guide for how-to questions)',
    parameters: { type: 'object', properties: { command: { type: 'string', enum: Object.keys(CONSOLE_COMMANDS), description: 'The console command' }, args: { type: 'string', description: 'Its words, e.g. "blocked", "why 12", "phone"' } }, required: ['command'] },
    async execute(_id, params, _signal, _update, ctx) {
      const words = String(params?.args || '').trim().split(/\s+/).filter(Boolean).filter(word => word !== '--yes');
      const target=params.command === 'audit' && !words.length ? [ctx?.cwd || process.cwd()] : params.command === 'setup' && words.length === 1 ? [...words, ctx?.cwd || process.cwd()] : words;
      let { code, text } = await run(params.command, target, { webPort: ports()?.web });
      // Enabling automation always needs the person's risk confirmation, including from Pi.
      const enabling=params.command==='auto' && words[0]==='on' || params.command==='config' && words[0]==='set' && ['auto','auto_accept'].includes(words[1]) || params.command==='setup'; /* task 331: an install is the person's, even with Run on its own */
      if (code===3 && !enabling && await auto()) {
        ({code,text}=await run(params.command,[...target,'--yes'],{webPort:ports()?.web}));
        await recordAuto({command:params.command,args:words,code});
      }
      const line = `/${[params.command, ...words].join(' ')}`, ui = ctx?.ui;
      // T_Changes: Pi never changes anything. A change goes on the input line with a dim hint; Return runs it and the
      // person confirms. A question answered from live data offers its command the same way, if the line is empty.
      if (code === 3 || (ui?.getEditorText?.() ?? 'x') === '') {
        ui?.setEditorText?.(line);
        if (code === 3) ui?.setWidget?.('harness-proposal', [ansiStyle.dim('Pi proposed this · Return runs it · Esc clears · nothing changes until you confirm')], { placement: 'belowEditor' });
      }
      const answer = code === 3 ? `Not changed. The command is on the person's input line (${line}): Return runs it and asks for their yes. Say so in one line.\n\n${text}` : text || '(no output)';
      return { content: [{ type: 'text', text: answer }], details: { command: params.command, code } };
    },
  });
  pi.on?.('input', (_event, ctx) => { ctx?.ui?.setWidget?.('harness-proposal', undefined); }); // the hint goes once the person sends something
  if (!pi.registerCommand) return;
  // Round 6 (TerminalOutput card): every output is drawn from its view, at the terminal's width, bold and dim only.
  // ASCII only when the locale says the terminal is not UTF-8 (C, POSIX, Latin-1…); unset means a UTF-8 terminal, as on macOS.
  const locale = process.env.LC_ALL || process.env.LC_CTYPE || process.env.LANG || '', ascii = Boolean(locale) && !/utf-?8/i.test(locale);
  pi.registerMessageRenderer?.('harness-console', message => message.details?.view
    ? { render: width => renderView(translateView(message.details.view), width, { style: ansiStyle, ascii }), invalidate() {} }  // the screen translated; Pi reads `content`, in English
    : undefined);
  const show = (name, words, view) => pi.sendMessage({ customType: 'harness-console', display: true, details: { view },
    content: `/${[name, ...words].join(' ')}\n\n${renderView(view, 80, { ascii }).join('\n')}` }); // plain text: what Pi reads
  const title = name => name[0].toUpperCase() + name.slice(1);
  // Tab: the backend's words for this command (installed models, settings, guide topics, request ids), kept 20 seconds.
  const cache = {};
  const completions = name => async prefix => {
    if (!cache[name] || Date.now() - cache[name].at > 20000) cache[name] = { at: Date.now(), items: complete(name, { webPort: ports()?.web }) };
    const typed = String(prefix || '').toLowerCase();
    const items = (await cache[name].items).filter(([value]) => value.toLowerCase().startsWith(typed)).map(([value, description]) => ({ value, label: value, ...(description ? { description } : {}) }));
    return items.length ? items : null;
  };
  // T_Wayfinding: /harness is a list, “Ask in words” first; a command goes on the input line for the person to finish.
  const choose = async ctx => {
    const width = '/harness list'.length;
    const options = ['Ask in words', `${'/harness list'.padEnd(width)}  Print this list`, ...Object.entries(CONSOLE_COMMANDS).filter(([name]) => name !== 'harness').map(([name, about]) => `${`/${name}`.padEnd(width)}  ${about}`)];
    const choice = await ctx.ui.select('Harness · choose a command; it goes on the input line', options);
    if (!choice) return;
    if (choice === 'Ask in words') { ctx.ui.setEditorText?.(''); return; }
    const command = choice.split(/\s+/)[0];
    if (command === '/harness') return 'list';
    ctx.ui.setEditorText?.(`${command} `);
  };
  for (const [name, description] of Object.entries(CONSOLE_COMMANDS)) {
    pi.registerCommand(name, {
      description: `Harness: ${description}`,
      ...(COMPLETES.includes(name) ? { getArgumentCompletions: completions(name) } : {}),
      handler: async (args = '', ctx) => {
        ctx?.ui?.setWidget?.('harness-proposal', undefined);
        if (name === 'harness' && ctx?.ui?.select) {
          if (!String(args).trim() && (await choose(ctx)) !== 'list') return;
          if (String(args).trim() === 'list') args = '';
        }
        const words = String(args).trim().split(/\s+/).filter(Boolean), options = { webPort: ports()?.web };
        const target = name === 'audit' && !words.length ? [ctx?.cwd || process.cwd()] : name === 'setup' && words.length === 1 ? [...words, ctx?.cwd || process.cwd()] : words;  // task 331: /setup packages in this project
        const parse = text => { try { return JSON.parse(text); } catch { return null; } };
        const failed = text => ({ title: title(name), parts: [{ kind: 'lines', lines: text.split('\n').map((line, index) => (index ? line : `✗ ${tr(line)}`)) }], hint: '/harness lists the commands' });
        if (name === 'queue' && ['edit', 'remove'].includes(words[0])) { show(name, words, await queueChange(words, { ports, ask: ctx?.ui?.select ? (question, choices) => ctx.ui.select(question, choices) : null })); return; }  // task 325: the person's terminal only
        let { ok, code, text } = await run(name, [...target, '--view'], options);
        if (code === 3) { // a change: what changes from what to what; it runs only after the person's yes (plan 158, C1)
          const shape = parse(text), preview = shape?.preview || {};
          const action = preview.action || 'Apply', actionLabel=tr(action), choices = preview.destructive ? [tr('Cancel'), actionLabel] : [actionLabel, tr('Cancel')];
          const detail = (preview.rows || []).map(([label, value]) => `${label.padEnd(10)} ${value}`).join('\n') || preview.detail || '';
          const choice = ctx?.ui?.select ? await ctx.ui.select(`${tr(preview.title || 'Apply this change?')}\n\n${tr(detail)}`, choices)
            : ((await ctx?.ui?.confirm?.(tr(preview.title || 'Apply this change?'), tr(detail))) ? actionLabel : tr('Cancel'));
          if (choice !== actionLabel) { show(name, words, { title: null, parts: [{ kind: 'lines', lines: ['○ Not changed.'] }] }); return; }
          ({ ok, code, text } = await run(name, [...target, '--yes', '--view'], options));
        }
        const view = ok ? parse(text) : null;
        if(name==='status'&&view){const shared=await phase(ctx);if(shared?.phase)view.parts.unshift({kind:'kv',rows:[['Phase',shared.phase[0].toUpperCase()+shared.phase.slice(1)],['Planned tasks',String(shared.tasks.length)]]});}
        show(name, words, view || failed(text || '(no output)'));
        if (name === 'queue' && ok) await seen(); // the footer stops asking once the person looked
      },
    });
  }
}
