// Console output in terminal Pi as the TerminalOutput card draws it (round 6, task 171): the view harness/admin.py builds
// (`--view`), drawn at the terminal's width with bold titles and dim secondary text. No colour carries meaning: bold,
// dim and plain only. harness/terminal.py draws the same view as plain text for the command line and Pi's tool;
// tests/fixtures/terminal-views.json keeps the two in step (render with styles off must equal it).
const CHECK = { ok: '✓ ok  ', fix: '✗ fix ', note: '! note' };
const ASCII = { '✓': 'ok', '✗': 'NO', '!': '!!', '▶': '>', '○': 'o', '■': '#', '●': '*', '─': '-', '═': '=', '│': '|', '→': '->', '…': '...', '·': '-' };
const plainStyle = { bold: text => text, dim: text => text };
export const ansiStyle = { bold: text => `\x1b[1m${text}\x1b[22m`, dim: text => `\x1b[2m${text}\x1b[22m` };

const cut = (text, width) => (text.length <= width ? text : text.slice(0, Math.max(0, width - 1)) + '…');
const pad = (text, width) => text + ' '.repeat(Math.max(0, width - text.length));

export function wrap(text, width) {
  const lines = []; let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (line && line.length + 1 + word.length > width) { lines.push(line); line = word; } else line = line ? `${line} ${word}` : word;
  }
  return line ? [...lines, line] : lines.length ? lines : [''];
}

function tableLines(part, width, style) {
  const columns = [...part.columns], rows = part.rows.map(row => row.map(String));
  const keep = columns.map((_, index) => index);
  for (const index of part.drop || []) if (width < 78 && keep.includes(index) && keep.length > 2) keep.splice(keep.indexOf(index), 1);
  const widths = {};
  for (const i of keep) widths[i] = Math.max(columns[i].length, ...rows.map(row => row[i].length));
  const wanted = part.flex ?? keep.at(-1), flex = keep.includes(wanted) ? wanted : keep.at(-1);
  for (const i of keep) if (part.caps?.[String(i)] !== undefined) widths[i] = Math.min(widths[i], part.caps[String(i)]);
  const over = keep.reduce((sum, i) => sum + widths[i], 0) - (width - 2 * (keep.length - 1));
  if (over > 0) widths[flex] = Math.max(columns[flex].length, widths[flex] - over);
  const dim = new Set(part.dim || []);
  const line = (cells, styled) => keep.map((i, n) => { const text = n === keep.length - 1 ? cut(cells[i], widths[i]) : pad(cut(cells[i], widths[i]), widths[i]); return styled && dim.has(i) && text.trim() ? style.dim(text) : text; }).join('  ').replace(/\s+$/, '');
  const rule = '═'.repeat(Math.min(width, keep.reduce((sum, i) => sum + widths[i], 0) + 2 * (keep.length - 1)));
  return [line(columns, false), rule, ...rows.map(row => line(row, true))];
}

function body(part, width, style) {
  if (part.kind === 'kv') { const labels = Math.max(0, ...part.rows.map(([label]) => label.length)) + 3; return part.rows.map(([label, value]) => pad(label, labels) + String(value)); }
  if (part.kind === 'table') return part.rows.length ? tableLines(part, width, style) : [part.empty || '(none)'];
  if (part.kind === 'checklist') {
    const labels = Math.max(0, ...part.items.map(item => item.label.length)) + 2, lines = [];
    for (const item of part.items) { lines.push(`${CHECK[item.state]}  ${pad(item.label, labels)}${item.detail}`); if (item.fix) lines.push(' '.repeat(8 + labels) + '→ ' + item.fix); }
    return lines;
  }
  if (part.kind === 'prose') return part.text.split('\n').flatMap(paragraph => wrap(paragraph, Math.min(72, width)));
  return [...part.lines];
}

/** The view's lines, `width` columns wide. `style` is ansiStyle in the terminal, plain for tests; ascii swaps glyphs. */
export function renderView(view, width = 80, { style = plainStyle, ascii = false } = {}) {
  width = Math.max(60, width); const inner = width - 2, lines = [];
  if (view.title) {
    const head = `── ${view.title}`, summary = view.summary || '';
    lines.push(summary ? `── ${style.bold(view.title)}${' '.repeat(Math.max(2, width - head.length - summary.length))}${style.dim(summary)}` : `── ${style.bold(view.title)} ${'─'.repeat(Math.max(3, width - head.length - 1))}`);
  }
  (view.parts || []).forEach((part, index) => {
    if (index && part.gap !== false) lines.push('');
    if (part.heading) lines.push(part.heading.startsWith('──') ? part.heading : '  ' + part.heading);
    lines.push(...body(part, inner, style).map(line => (line ? '  ' + line : '')));
  });
  if (view.hint) lines.push('  ' + style.dim(view.hint));
  const out = lines.map(line => line.replace(/\s+$/, ''));
  return ascii ? out.map(line => Object.entries(ASCII).reduce((text, [glyph, word]) => text.split(glyph).join(word), line)) : out;
}
