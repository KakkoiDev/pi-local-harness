// The harness console in terminal Pi (plan 158, task 159): slash commands that run harness/admin.py at once, without
// the model. The output goes into the session as a custom message, so the person sees it and Pi can explain it.
// Pi's own /settings and /model stay Pi's: the harness uses /config and /models.
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { renderView, ansiStyle } from './terminal-render.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));

// Same names and order as COMMANDS in harness/admin.py (tests/harness/console.test.mjs checks it).
export const CONSOLE_COMMANDS = {
  harness: 'What the harness is and the commands it offers.',
  status: 'Services, model, queue and Gate counts, data folder, build.',
  queue: 'Requests in Activity: /queue [running|waiting|failed|…].',
  job: 'The Markdown record of one request: /job <id>.',
  gate: 'Gate checks, newest first: /gate [n] [blocked] · /gate why <id>.',
  models: 'Installed models; /models use · check · pull · remove <name> (changes ask first).',
  ollama: 'Ollama settings; /ollama set <key> <value> and /ollama restart ask first.',
  projects: 'Projects and their folders.',
  config: 'config.json explained; /config set <key> <value> changes one (asks first).',
  paths: 'Where the harness keeps its data.',
  doctor: 'Checks with what is wrong and what to do.',
  undo: 'Undo the last change made from the console (asks first).',
  guide: 'How to use Pi Workbench: /guide, or /guide <words> for the matching questions.',
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

/** Register the slash commands, and the harness tool Pi calls (task 167). `ports()` returns the running services' ports. */
export function installConsole(pi, { ports = () => undefined, run = runAdmin, seen = () => {} } = {}) {
  // The harness tool: the same commands for Pi, run from the harness's own folder (Pi once tried `python3 -m harness.admin`
  // from the home folder, where it is not found). Reads only: a change returns its preview and asks Pi to have the person
  // type the command, which then asks for their yes (plan 158, C1).
  pi.registerTool?.({
    name: 'harness', label: 'Harness console',
    description: 'Ask the Pi Workbench harness about itself, instead of bash or searching files: status, doctor, queue, job <id>, gate [n] [blocked] | why <id>, models, ollama, projects, config, paths, and guide [words] (how to use the workbench: opening it, projects, comments, models, phone, settings). Changes (config set, models use|pull|remove, ollama set, undo) are not applied: you get what would change, and the person types the command.',
    promptSnippet: 'harness: the Pi Workbench console (status, doctor, queue, gate, models, config, guide for how-to questions)',
    parameters: { type: 'object', properties: { command: { type: 'string', enum: Object.keys(CONSOLE_COMMANDS), description: 'The console command' }, args: { type: 'string', description: 'Its words, e.g. "blocked", "why 12", "phone"' } }, required: ['command'] },
    async execute(_id, params, _signal, _update, ctx) {
      const words = String(params?.args || '').trim().split(/\s+/).filter(Boolean).filter(word => word !== '--yes');
      const { code, text } = await run(params.command, words, { webPort: ports()?.web });
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
    ? { render: width => renderView(message.details.view, width, { style: ansiStyle, ascii }), invalidate() {} }
    : undefined);
  const show = (name, words, view) => pi.sendMessage({ customType: 'harness-console', display: true, details: { view },
    content: `/${[name, ...words].join(' ')}\n\n${renderView(view, 80, { ascii }).join('\n')}` }); // plain text: what Pi reads
  const title = name => name[0].toUpperCase() + name.slice(1);
  for (const [name, description] of Object.entries(CONSOLE_COMMANDS)) {
    pi.registerCommand(name, {
      description: `Harness: ${description}`,
      handler: async (args = '', ctx) => {
        ctx?.ui?.setWidget?.('harness-proposal', undefined);
        const words = String(args).trim().split(/\s+/).filter(Boolean), options = { webPort: ports()?.web };
        const parse = text => { try { return JSON.parse(text); } catch { return null; } };
        const failed = text => ({ title: title(name), parts: [{ kind: 'lines', lines: text.split('\n').map((line, index) => (index ? line : `✗ ${line}`)) }], hint: '/harness lists the commands' });
        let { ok, code, text } = await run(name, [...words, '--view'], options);
        if (code === 3) { // a change: what changes from what to what; it runs only after the person's yes (plan 158, C1)
          const shape = parse(text), preview = shape?.preview || {};
          const action = preview.action || 'Apply', choices = preview.destructive ? ['Cancel', action] : [action, 'Cancel'];
          const detail = (preview.rows || []).map(([label, value]) => `${label.padEnd(10)} ${value}`).join('\n') || preview.detail || '';
          const choice = ctx?.ui?.select ? await ctx.ui.select(`${preview.title || 'Apply this change?'}\n\n${detail}`, choices)
            : ((await ctx?.ui?.confirm?.(preview.title || 'Apply this change?', detail)) ? action : 'Cancel');
          if (choice !== action) { show(name, words, { title: null, parts: [{ kind: 'lines', lines: ['○ Not changed.'] }] }); return; }
          ({ ok, code, text } = await run(name, [...words, '--yes', '--view'], options));
        }
        const view = ok ? parse(text) : null;
        show(name, words, view || failed(text || '(no output)'));
        if (name === 'queue' && ok) await seen(); // the footer stops asking once the person looked
      },
    });
  }
}
