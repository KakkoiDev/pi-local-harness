// Pi's chat replies as Markdown: blocks from markdown-blocks.mjs, inline marks as tokens.
// Everything becomes DOM nodes with textContent; model text never reaches innerHTML.
import { parseMarkdown } from './markdown-blocks.mjs';

// The harness checks every reply starts with [CANARY] (harness/memory.mjs); people never need to see it, bare or
// wrapped in code or bold (`[CANARY]`, **[CANARY]**). The server strips it too (harness/canary.py); this covers answers
// saved before that, and a reply still streaming shows nothing while it is only the start of the marker.
const CANARY = /^\s*(?:\[CANARY\]|`{1,3}\[CANARY\]`{1,3}|\*\*\[CANARY\]\*\*|\*\[CANARY\]\*|__\[CANARY\]__|_\[CANARY\]_)[ \t]*:?\s*/;
const CANARY_FORMS = ['[CANARY]', '`[CANARY]`', '**[CANARY]**', '*[CANARY]*', '__[CANARY]__', '_[CANARY]_'];
export const spoken = (text, streaming = false) => {
  const value = text || '', stripped = value.replace(CANARY, '');
  if (streaming && stripped === value) { const head = value.trimStart(); if (head && CANARY_FORMS.some(form => form.startsWith(head))) return ''; }
  return stripped;
};

const INLINE = /(\*\*([^*\n]+)\*\*|`([^`\n]+)`|\*([^*\s][^*\n]*?)\*|(?<![\p{L}\p{N}_])_([^_\s][^_\n]*?)_(?![\p{L}\p{N}_])|\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\))/gu;
export function inlineTokens(text) {
  const tokens = [], push = (type, value, extra = {}) => {
    if (type === 'text' && tokens.at(-1)?.type === 'text') tokens.at(-1).text += value;
    else if (value) tokens.push({ type, text: value, ...extra });
  };
  let cursor = 0;
  for (const match of text.matchAll(INLINE)) {
    push('text', text.slice(cursor, match.index));
    if (match[2]) push('strong', match[2]);
    else if (match[3]) push('code', match[3]);
    else if (match[4] || match[5]) push('em', match[4] || match[5]);
    else push('link', match[6], { href: match[7] });
    cursor = match.index + match[0].length;
  }
  push('text', text.slice(cursor));
  return tokens;
}

const LIST = { bullet: 'ul', number: 'ol', check: 'ul' };

// GFM tables (task 143): a header row, a `---` row (colons set alignment), then body rows; outer pipes optional.
const cells = line => line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(cell => cell.trim().replace(/\\\|/g, '|'));
function table(text) {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length < 2 || !lines[0].includes('|')) return null;
  const rule = cells(lines[1]);
  if (!rule.length || !rule.every(cell => /^:?-{3,}:?$/.test(cell))) return null;
  const head = cells(lines[0]);
  const align = rule.map(cell => cell.startsWith(':') && cell.endsWith(':') ? 'center' : cell.endsWith(':') ? 'right' : 'left');
  return { tag: 'table', head, align, rows: lines.slice(2).map(line => cells(line).slice(0, head.length)) };
}
// Model replies often start a list right under a line of text ("Steps:\n1. …"). Markdown needs a blank line there;
// add it (outside code fences) so the list renders as a list, not as one paragraph.
const LIST_LINE = /^\s*(?:[-*] |\d+\. )/;
function separateLists(markdown) {
  const out = []; let fence = false;
  for (const line of markdown.split('\n')) {
    if (/^```/.test(line)) fence = !fence;
    const previous = out.at(-1);
    if (!fence && LIST_LINE.test(line) && previous && previous.trim() && !LIST_LINE.test(previous) && !/^```/.test(line)) out.push('');
    out.push(line);
  }
  return out.join('\n');
}
// Task 324 (small models' questions): sub-items under a list item ("1. Which colour?\n   * A) Red") are a nested list,
// not a paragraph that swallows the rest; options written on the item's own line ("Which? * A) Red * B) Blue") too.
const SUB_LINE = /^(\s{2,}|\t+)(?:[-*] |\d+[.)] )(.*)$/, TOP_LINE = /^(?:[-*] |\d+\. )/;
function nestSubItems(markdown) {
  const out = [], children = []; let fence = false, parent = -1;
  for (const line of markdown.split('\n')) {
    if (/^```/.test(line)) { fence = !fence; parent = -1; }
    const sub = !fence && parent >= 0 && line.match(SUB_LINE);
    if (sub) { children[parent].push(sub[2]); continue; }
    if (!fence && TOP_LINE.test(line)) { parent = children.length; children.push([]); out.push(line + '\u0001' + parent + '\u0001'); continue; }
    if (line.trim()) parent = -1;
    out.push(line);
  }
  return { markdown: out.join('\n'), children };
}
function itemOf(text, children) {
  let found = text.match(/\u0001(\d+)\u0001$/), items = found ? children[Number(found[1])] : [];
  if (found) text = text.slice(0, found.index);
  const inlineOptions = text.split(/\s[*-]\s+(?=[A-Za-z0-9]\)\s)/);
  if (!items.length && inlineOptions.length > 2) { text = inlineOptions[0]; items = inlineOptions.slice(1).map(part => part.trim()); }
  return { text, ...(items.length ? { items } : {}) };
}
export function messageBlocks(markdown) {
  const result = []; let previous = null;
  const nested = nestSubItems(separateLists(markdown));
  for (const block of parseMarkdown(nested.markdown)) {
    if (block.text?.includes('\u0001')) block.text = LIST[block.type] ? block.text : block.text.replace(/\u0001\d+\u0001/g, '');
    const list = LIST[block.type], adjacent = previous && !/\n\s*\n/.test(previous.raw); previous = block;
    if (list) {
      const last = result.at(-1);
      const item = { ...itemOf(block.text, nested.children), checked: block.type === 'check' ? block.checked : undefined };
      if (last?.tag === list && last.kind === block.type) last.items.push(item);
      else result.push({ tag: list, kind: block.type, items: [item], start: block.type === 'number' ? Number(block.raw.match(/^\s*(\d+)\./)?.[1] || 1) : undefined }); // a list split by a code block keeps counting
    } else if (block.type === 'heading') result.push({ tag: 'h' + Math.min(block.level + 1, 6), text: block.text });
    else if (block.type === 'raw' && table(block.text)) result.push(table(block.text));
    else if (block.type === 'raw' && block.text.includes('|') && !/^\s*(<|~~~|---)/.test(block.text)) result.push({ tag: 'p', text: block.text }); // a pipe in prose is not raw Markdown
    else if (block.type === 'code' || block.type === 'raw') result.push({ tag: 'pre', text: block.text.trim() ? block.text : block.raw });
    else if (block.type === 'quote' && adjacent && result.at(-1)?.tag === 'blockquote') result.at(-1).text += '\n' + block.text; // consecutive > lines: one quote
    else if (block.type === 'quote') result.push({ tag: 'blockquote', text: block.text });
    else if (block.text.trim()) result.push({ tag: 'p', text: block.text });
  }
  return result;
}

function inline(document, parent, text) {
  for (const token of inlineTokens(text)) {
    if (token.type === 'text') { parent.append(document.createTextNode(token.text)); continue; }
    const element = document.createElement({ strong: 'strong', code: 'code', em: 'em', link: 'a' }[token.type]);
    if (token.type === 'strong' || token.type === 'em') inline(document, element, token.text); // **Updated `x`:** nests code
    else element.textContent = token.text;
    if (token.type === 'link') { element.href = token.href; element.target = '_blank'; element.rel = 'noopener noreferrer'; }
    parent.append(element);
  }
}

export function renderMessage(document, markdown) {
  const fragment = document.createDocumentFragment();
  for (const block of messageBlocks(spoken(markdown))) {
    if (block.tag === 'table') {
      // A wide table scrolls inside its own box instead of widening the message (phone).
      const box = document.createElement('div'); box.className = 'pw-msg__table'; const element = document.createElement('table');
      const row = (values, cellTag) => { const tr = document.createElement('tr'); values.forEach((value, index) => { const cell = document.createElement(cellTag); cell.style.textAlign = block.align[index] || 'left'; inline(document, cell, value || ''); tr.append(cell); }); return tr; };
      const thead = document.createElement('thead'); thead.append(row(block.head, 'th'));
      const tbody = document.createElement('tbody'); for (const values of block.rows) tbody.append(row(values, 'td'));
      element.append(thead, tbody); box.append(element); fragment.append(box); continue;
    }
    const element = document.createElement(block.tag);
    if (block.start > 1) element.start = block.start;
    if (block.kind === 'check') element.className = 'pw-msg__tasks';
    if (block.items) for (const item of block.items) {
      const li = document.createElement('li');
      if (item.checked !== undefined) { const box = document.createElement('input'); box.type = 'checkbox'; box.className = 'pw-check'; box.checked = item.checked; box.disabled = true; box.setAttribute('aria-label', item.checked ? 'Done' : 'Not done'); li.className = 'pw-msg__task'; li.append(box); }
      inline(document, li, item.text);
      if (item.items) { const sub = document.createElement('ul'); for (const text of item.items) { const child = document.createElement('li'); inline(document, child, text); sub.append(child); } li.append(sub); }
      element.append(li);
    }
    else if (block.tag === 'pre') element.textContent = block.text;
    else if (block.tag === 'blockquote') block.text.split('\n').forEach((line, index) => { if (index) element.append(document.createElement('br')); inline(document, element, line); });
    else inline(document, element, block.text);
    fragment.append(element);
  }
  return fragment;
}
