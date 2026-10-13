// Pi's chat replies as Markdown: blocks from markdown-blocks.mjs, inline marks as tokens.
// Everything becomes DOM nodes with textContent; model text never reaches innerHTML.
import { parseMarkdown } from './markdown-blocks.mjs';

// The harness checks every reply starts with [CANARY] (harness/memory.mjs); people never need to see it.
export const spoken = text => (text || '').replace(/^\s*\[CANARY\]\s*/, '');

const INLINE = /(\*\*([^*\n]+)\*\*|`([^`\n]+)`|\*([^*\s][^*\n]*?)\*|_([^_\s][^_\n]*?)_|\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\))/g;
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
export function messageBlocks(markdown) {
  const result = [];
  for (const block of parseMarkdown(markdown)) {
    const list = LIST[block.type];
    if (list) {
      const last = result.at(-1);
      const item = { text: block.text, checked: block.type === 'check' ? block.checked : undefined };
      if (last?.tag === list && last.kind === block.type) last.items.push(item);
      else result.push({ tag: list, kind: block.type, items: [item] });
    } else if (block.type === 'heading') result.push({ tag: 'h' + Math.min(block.level + 1, 6), text: block.text });
    else if (block.type === 'raw' && table(block.text)) result.push(table(block.text));
    else if (block.type === 'raw' && block.text.includes('|') && !/^\s*(<|~~~|---)/.test(block.text)) result.push({ tag: 'p', text: block.text }); // a pipe in prose is not raw Markdown
    else if (block.type === 'code' || block.type === 'raw') result.push({ tag: 'pre', text: block.text.trim() ? block.text : block.raw });
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
    if (block.items) for (const item of block.items) {
      const li = document.createElement('li');
      if (item.checked !== undefined) { const box = document.createElement('input'); box.type = 'checkbox'; box.className = 'pw-check'; box.checked = item.checked; box.disabled = true; box.setAttribute('aria-label', item.checked ? 'Done' : 'Not done'); li.className = 'pw-msg__task'; li.append(box); }
      inline(document, li, item.text); element.append(li);
    }
    else if (block.tag === 'pre') element.textContent = block.text;
    else inline(document, element, block.text);
    fragment.append(element);
  }
  return fragment;
}
