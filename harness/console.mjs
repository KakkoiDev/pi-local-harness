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
  models: 'Installed models: tools, thinking, vision, size; the chosen one.',
  ollama: 'Ollama: version, models folder, parallel slots, loaded models.',
  projects: 'Projects and their folders.',
  config: 'config.json with each key explained.',
  paths: 'Where the harness keeps its data.',
  doctor: 'Checks with what is wrong and what to do.',
};

/** python3 -m harness.admin <command> <args>, with the live web port when the services run. */
export function runAdmin(command, args, { webPort } = {}) {
  return new Promise(resolve => {
    const argv = ['-m', 'harness.admin', command, ...args, ...(webPort ? ['--web', String(webPort)] : [])];
    execFile(process.env.PI_PYTHON || 'python3', argv, { cwd: root, timeout: 30000, maxBuffer: 4 * 1024 * 1024 }, (error, stdout, stderr) => {
      resolve({ ok: !error, text: (error ? stderr || error.message : stdout).trimEnd() });
    });
  });
}

/** Register the slash commands. `ports()` returns the running services' ports (or undefined before they start). */
export function installConsole(pi, { ports = () => undefined, run = runAdmin } = {}) {
  if (!pi.registerCommand) return;
  for (const [name, description] of Object.entries(CONSOLE_COMMANDS)) {
    pi.registerCommand(name, {
      description: `Harness: ${description}`,
      handler: async (args = '') => {
        const words = String(args).trim().split(/\s+/).filter(Boolean);
        const { ok, text } = await run(name, words, { webPort: ports()?.web });
        pi.sendMessage({ customType: 'harness-console', display: true,
          content: `Harness console: /${[name, ...words].join(' ')}${ok ? '' : ' (failed)'}\n\n\`\`\`\n${text || '(no output)'}\n\`\`\`` });
      },
    });
  }
}
