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
export function renderStartup(lines, width) {
  const columns = Math.max(1, width);
  return lines.flatMap(line => {
    const rows = renderLine(line, columns), phone = /^Phone: (https:\/\/\S+)$/.exec(line);
    if (!phone) return rows;
    const qr = qrRows(phone[1]);
    return qr.width <= columns ? [...rows, ...qr.rows] : rows;
  });
}
function renderLine(line, columns) {
  return [line].flatMap(line => {
    const match = /https?:\/\/\S+/.exec(line);
    const rows = [];
    for (let offset = 0; offset < line.length; offset += columns) {
      let text = line.slice(offset, offset + columns);
      if (match) {
        const start = Math.max(offset, match.index), end = Math.min(offset + columns, match.index + match[0].length);
        if (start < end) {
          const linked = `\x1b[4;36m\x1b]8;;${match[0]}\x1b\\${line.slice(start, end)}\x1b]8;;\x1b\\\x1b[0m`;
          text = line.slice(offset, start) + linked + line.slice(end, Math.min(offset + columns, line.length));
        }
      }
      rows.push(text);
    }
    return rows;
  });
}

export function startupLines(ports) {
  const lines = [`Gate: http://127.0.0.1:${ports.gate}`, `Web: http://127.0.0.1:${ports.web}`];
  if (ports.remote) lines.push(`Phone: ${ports.remote}`);
  if (ports.remote_error) lines.push(`Phone access off: ${ports.remote_error}`);
  else if (!ports.remote) lines.push('Phone access off: set remote_hosts and remote_users in config.json'); // the data folder's config.json; see harness/README.md
  return [...lines, 'Loop check: every 10 seconds'];
}

export function installStartupDisplay(pi) {
  if (!pi.registerEntryRenderer || !pi.appendEntry) return undefined;
  pi.registerEntryRenderer('harness-startup', entry => ({
    render: width => renderStartup(entry.data.lines, width),
    invalidate() {},
  }));
  return lines => pi.appendEntry('harness-startup', { lines });
}
