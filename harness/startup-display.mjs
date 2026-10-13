// Display-only session entries scroll naturally and never enter model context.
export function renderStartup(lines, width) {
  const columns = Math.max(1, width);
  return lines.flatMap(line => {
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
