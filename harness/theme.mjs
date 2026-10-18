// Task 312: /theme in terminal Pi prints the app's theme tokens (Basecoat's defaults, then the person's saved block) and
// the file they live in. The panel itself is the workbench's (Project › Theme…); this command only reads.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tr } from './language.mjs';

const FILE = 'styles/input.css', START = '/* theme: edited in the workbench */', END = '/* theme: end */';
const TOKENS = ['background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground', 'primary', 'primary-foreground', 'secondary', 'secondary-foreground',
  'muted', 'muted-foreground', 'accent', 'accent-foreground', 'destructive', 'border', 'input', 'ring', 'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5', 'radius', 'spacing', 'font-sans', 'font-heading'];
const read = path => { try { return readFileSync(path, 'utf8'); } catch { return ''; } };
const rule = (text, selector) => Object.fromEntries([...(text.match(new RegExp(selector + '\\s*\\{([^}]*)\\}'))?.[1] || '').matchAll(/--([a-z0-9-]+):\s*([^;\n]+);/g)].map(found => [found[1], found[2].trim()]));

/** The lines /theme prints for a project folder. */
export function themeLines(cwd) {
  const text = read(join(cwd, FILE));
  if (!/@import\s+["']tailwindcss["']/.test(text) || !text.includes('basecoat')) return [tr('This project has no theme file.')];
  const start = text.indexOf(START), end = text.indexOf(END), block = start >= 0 && end > start ? text.slice(start, end) : '';
  const base = read(join(cwd, 'vendor/basecoat/css/base/base.css'));
  const light = { spacing: '0.25rem', ...rule(base, ':root'), ...rule(block, ':root') }, dark = { ...rule(base, '\\.dark'), ...rule(block, 'html\\.dark') };
  const saved = { ...rule(block, ':root'), ...rule(block, 'html\\.dark') };
  const lines = [`${tr('Theme')}: ${join(cwd, FILE)}`];
  for (const token of TOKENS) {
    if (!light[token] && !dark[token]) continue;
    lines.push(`  --${token}: ${light[token] || '—'}${dark[token] && dark[token] !== light[token] ? ` · ${tr('dark')} ${dark[token]}` : ''}${token in saved ? ` (${tr('changed')})` : ''}`);
  }
  lines.push(tr('Change them in the workbench: Project › Theme…, or ask its chat “adjust the site’s colours”.'));
  return lines;
}

export function installTheme(pi) {
  pi.registerCommand?.('theme', {
    description: tr('Show the app’s theme tokens'),
    async handler(_args, ctx) { ctx?.ui?.notify?.(themeLines(ctx?.cwd || process.cwd()).join('\n'), 'info'); },
  });
}
