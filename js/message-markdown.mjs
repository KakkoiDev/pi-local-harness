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
