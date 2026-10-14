import qrcode from './vendor/qrcode.mjs';
// Display-only session entries scroll naturally and never enter model context.
// Task 122: the phone address as a QR code. Modules as booleans (true = dark); error correction M, smallest version.
export function qrModules(text) {
  const code = qrcode(0, 'M'); code.addData(text); code.make();
  const size = code.getModuleCount();
  return Array.from({ length: size }, (_, row) => Array.from({ length: size }, (_, col) => code.isDark(row, col)));
}
// Half blocks pack two module rows into one text row; black on white with a 4-module quiet zone scans in any terminal theme.
function qrRows(text) {
  const modules = qrModules(text), quiet = 4, size = modules.length + 2 * quiet;
  const dark = (row, col) => Boolean(modules[row - quiet]?.[col - quiet]);
  const rows = [];
  for (let row = 0; row < size; row += 2) {
    let line = '';
    for (let col = 0; col < size; col++) line += { 3: '█', 2: '▀', 1: '▄', 0: ' ' }[(dark(row, col) ? 2 : 0) + (dark(row + 1, col) ? 1 : 0)];
    rows.push(`\x1b[30;47m${line}\x1b[0m`);
  }
  return { rows, width: size };
}
// Round 6 (T_Startup): links underlined (no colour); under 80 columns the phone-off reason moves into /guide phone; the
// QR code sits beside the lines from 100 columns, below the phone line otherwise, and not at all when it does not fit.
export function renderStartup(lines, width) {
  const columns = Math.max(1, width);
  const shown = lines.map(line => (columns < 80 ? line.replace(/^(\s*Phone\s+off) · .*\s{2}\/guide phone$/, '$1 · /guide phone') : line))
    .map(line => (line.length > columns && line.startsWith('π Pi Workbench') ? line.replace(/ · data in .*$/, '') : line)); // /paths shows the data folder
  const phone = shown.map(line => /^\s*Phone:?\s+(https:\/\/\S+)/.exec(line)?.[1]).find(Boolean);
  const qr = phone ? qrRows(phone) : null, longest = Math.max(0, ...shown.map(line => line.length));
  if (qr && columns >= 100 && longest + 4 + qr.width <= columns) {
    const height = Math.max(shown.length, qr.rows.length);
    return Array.from({ length: height }, (_, index) => {
      const line = shown[index] || '';
      return (line ? renderLine(line, columns)[0] : '') + ' '.repeat(longest + 4 - line.length) + (qr.rows[index] || '');
    });
  }
  return shown.flatMap(line => {
    const rows = renderLine(line, columns);
    return qr && /^\s*Phone:?\s+https:/.test(line) && qr.width <= columns ? [...rows, ...qr.rows] : rows;
  });
}
function renderLine(line, columns) {
  const match = /https?:\/\/\S+/.exec(line), rows = [];
  for (let offset = 0; offset < Math.max(1, line.length); offset += columns) {
    let text = line.slice(offset, offset + columns);
    if (match) {
      const start = Math.max(offset, match.index), end = Math.min(offset + columns, match.index + match[0].length);
      if (start < end) text = line.slice(offset, start) + `\x1b[4m\x1b]8;;${match[0]}\x1b\\${line.slice(start, end)}\x1b]8;;\x1b\\\x1b[24m` + line.slice(end, Math.min(offset + columns, line.length));
    }
    rows.push(text);
  }
  return rows;
}

/** The header (T_Startup): name and build, Web, Gate, Phone (or why it is off), how to begin; the first start adds one line. */
export function startupLines(ports, { build = 'checkout', data = '~/pi-local-harness-data', first = false } = {}) {
  const phone = ports.remote ? `${ports.remote}  scan →`
    : `off · ${ports.remote_error || 'set remote_hosts and remote_users'}  /guide phone`; // see /guide phone and harness/README.md
  return [`π Pi Workbench  build ${build} · data in ${data}`, `  Web     http://127.0.0.1:${ports.web}`, `  Gate    http://127.0.0.1:${ports.gate}`,
    `  Phone   ${phone}`, '  Ask in words, or type /harness for commands.', ...(first ? ['  New here? Try “is anything stuck?”, /status or /guide.'] : [])];
}

export function installStartupDisplay(pi) {
  if (!pi.registerEntryRenderer || !pi.appendEntry) return undefined;
  pi.registerEntryRenderer('harness-startup', entry => ({
    render: width => renderStartup(entry.data.lines, width),
    invalidate() {},
  }));
  return lines => pi.appendEntry('harness-startup', { lines });
}
