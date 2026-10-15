// Tool calls in terminal Pi (round 6, T_Gate; task 171): two lines. The glyph, the tool (bold) and its argument; then
// Gate's verdict and the command's own result as separate words, with the time it took. Nothing ran: say so and point
// to /gate. The output stays below, without the line the harness adds for Pi.
import { display, formatTimestamp } from './timestamps.mjs';
import { tr } from './language.mjs';

const bold = text => `\x1b[1m${text}\x1b[22m`, dim = text => `\x1b[2m${text}\x1b[22m`;
const DRAWN = ['bash', 'read', 'write', 'edit', 'grep', 'find', 'ls', 'task_box', 'browser'];
const FOR_PI = /^(✓ Gate allowed|✗ Gate:|Gate audit unavailable)/;

const argument = (tool, args = {}) => tool === 'bash' ? args.command
  : tool === 'grep' || tool === 'find' ? [args.pattern, args.path].filter(Boolean).join(' ')
  : tool === 'browser' ? `${args.target || 'scratch'}${args.path || ''} at ${args.width || 1440}×${args.height || 900}`
  : tool === 'task_box' ? `${args.path || ''} · ${args.box || ''}`
  : args.path || args.file_path || '';
const clock = seconds => `${Math.floor(seconds / 60)}:${String(Math.round(seconds) % 60).padStart(2, '0')}`;
const cut = (text, width) => (text.length <= width ? text : `${text.slice(0, Math.max(0, width - 1))}…`);

function glyph(check, tool) {
  if (!check) return '▶';
  if (tool !== 'bash' && check.gate === 'allowed' && check.ok === true && !check.drift) return '✓'; // T_Gate (round 7): a finished read or edit
  if (check.gate === 'revise') return '!';
  if (check.gate !== 'allowed' || check.drift || check.ok === false) return '✗';
  return '▶';
}

/** The first line, then the checks once Gate and the tool have answered. */
export function callLine(tool, args, check, width = 80) {
  const words = String(argument(tool, args) || '').replace(/\s+/g, ' ').trim();
  const room = width - tool.length - 4;
  return `${glyph(check, tool)} ${bold(tool)}${words ? `  ${cut(words, Math.max(8, room))}` : ''}`;
}

export function checkLines(tool, check) {
  if (!check) return [];
  if (check.gate === 'blocked') return [`  ✗ Gate blocked it: ${check.reason || 'not allowed'}`, `  ${dim(tr('Nothing ran. /gate blocked'))}`];
  if (check.gate === 'revise') return [`  ! Gate asked Pi to revise: ${check.reason || ''}`.trimEnd()];
  if (check.gate === 'unavailable') return [`  ✗ Gate could not check it: ${check.reason || ''}`.trimEnd(), `  ${dim(tr('Nothing ran.'))}`];
  if (check.drift) return [`  ✗ Gate: ${check.drift}`];
  if (check.ok === undefined) return [];
  const result = tool === 'bash' ? `${check.ok ? '✓' : '✗'} exit ${check.exit ?? (check.ok ? 0 : 1)}` : check.ok ? '✓ done' : '✗ failed';
  const lines = [`  ✓ Gate allowed · ${result}${check.seconds === undefined ? '' : ` · ${clock(check.seconds)}`}`];
  if (!check.ok) lines.push(`  ${dim(tr(tool === 'bash' ? 'The command failed on its own; Gate did not block it.' : 'It failed on its own; Gate did not block it.'))}`);
  return lines;
}

export const toolLines = (tool, args, check, width = 80) => [callLine(tool, args, check, width), ...checkLines(tool, check)];
const shown = lines => lines.map(line => tr(line));  // the check lines in the terminal's language (the dim ones are translated before dim())

/** Draw Pi's built-in tools this way; `checks` (toolCallId → check) is filled by the extension's Gate hooks. */
export function installToolRenderer(pi, checks, { timeZone } = {}) {
  // /verbose on (round 7, T_Noise): the time the tool started, right-aligned on its row.
  const timed = (line, check, width) => {
    if (!display.verbose || !check?.started) return line;
    const time = formatTimestamp(check.started, timeZone).slice(12, 20), shown = line.replace(/\x1b\[[0-9;]*m/g, '').length;
    return `${line}${' '.repeat(Math.max(2, width - shown - time.length))}${dim(time)}`;
  };
  pi.registerToolRenderer?.((tool, next) => {
    if (!DRAWN.includes(tool)) return next();
    const inner = next();
    return {
      ...inner,
      renderCall: (args, _theme, context) => ({ render: width => [timed(callLine(tool, args, checks.get(context?.toolCallId), width - (display.verbose ? 10 : 0)), checks.get(context?.toolCallId), width)], invalidate() {} }),
      renderResult: (result, options, theme, context) => {
        const check = checks.get(context?.toolCallId), ran = !check || ['allowed'].includes(check.gate);
        const below = ran && inner?.renderResult ? inner.renderResult({ ...result, content: (result.content || []).filter(part => !FOR_PI.test(part.text || '')) }, options, theme, context) : undefined;
        return { render: width => [...shown(checkLines(tool, check)), ...(below ? below.render(width) : [])], invalidate() { below?.invalidate?.(); } };
      },
    };
  });
}
