// The harness console in terminal Pi (plan 158, task 159): slash commands that run harness/admin.py at once, without
// the model. The output goes into the session as a custom message, so the person sees it and Pi can explain it.
// Pi's own /settings and /model stay Pi's: the harness uses /config and /models.
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';

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
export function installConsole(pi, { ports = () => undefined, run = runAdmin } = {}) {
  // The harness tool: the same commands for Pi, run from the harness's own folder (Pi once tried `python3 -m harness.admin`
  // from the home folder, where it is not found). Reads only: a change returns its preview and asks Pi to have the person
  // type the command, which then asks for their yes (plan 158, C1).
  pi.registerTool?.({
    name: 'harness', label: 'Harness console',
    description: 'Ask the Pi Workbench harness about itself, instead of bash or searching files: status, doctor, queue, job <id>, gate [n] [blocked] | why <id>, models, ollama, projects, config, paths, and guide [words] (how to use the workbench: opening it, projects, comments, models, phone, settings). Changes (config set, models use|pull|remove, ollama set, undo) are not applied: you get what would change, and the person types the command.',
    promptSnippet: 'harness: the Pi Workbench console (status, doctor, queue, gate, models, config, guide for how-to questions)',
    parameters: { type: 'object', properties: { command: { type: 'string', enum: Object.keys(CONSOLE_COMMANDS), description: 'The console command' }, args: { type: 'string', description: 'Its words, e.g. "blocked", "why 12", "phone"' } }, required: ['command'] },
    async execute(_id, params) {
      const words = String(params?.args || '').trim().split(/\s+/).filter(Boolean).filter(word => word !== '--yes');
      const { code, text } = await run(params.command, words, { webPort: ports()?.web });
      const answer = code === 3 ? `Not changed. This needs the person's yes: ask them to type /${[params.command, ...words].join(' ')} in this terminal.\n\n${text}` : text || '(no output)';
      return { content: [{ type: 'text', text: answer }], details: { command: params.command, code } };
    },
  });
  if (!pi.registerCommand) return;
  for (const [name, description] of Object.entries(CONSOLE_COMMANDS)) {
    pi.registerCommand(name, {
      description: `Harness: ${description}`,
      handler: async (args = '', ctx) => {
        const words = String(args).trim().split(/\s+/).filter(Boolean), options = { webPort: ports()?.web };
        let { ok, code, text } = await run(name, words, options);
        if (code === 3) { // a change: show what it does, run it only after the person's yes (plan 158, C1)
          let preview = { title: 'Apply this change?', detail: text };
          try { preview = JSON.parse((await run(name, [...words, '--json'], options)).text); } catch {}
          const yes = await ctx?.ui?.confirm?.(preview.title, preview.detail);
          ({ ok, text } = yes ? await run(name, [...words, '--yes'], options) : { ok: true, text: 'Not changed.' });
        }
        pi.sendMessage({ customType: 'harness-console', display: true,
          content: `Harness console: /${[name, ...words].join(' ')}${ok ? '' : ' (failed)'}\n\n\`\`\`\n${text || '(no output)'}\n\`\`\`` });
      },
    });
  }
}
