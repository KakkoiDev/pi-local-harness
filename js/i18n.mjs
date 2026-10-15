// The workbench's own language (plan 198: "a Japanese UI"; the person: "let's build it then", 2026-10-15). English is
// the source and the key (gettext's way): the page and the scripts keep their English, and this swaps every piece of
// interface text that has a translation, including text added later (alerts, status lines, rows). What the person or
// Pi wrote is never translated: chat messages, documents, file and project names, code, the app in the Preview.
// Translations: messages/ja.json, {"exact": {"English": "日本語"}, "patterns": [["Preview · {name}", "プレビュー · {name}"]]}.

const SKIP = '[data-no-translate], .pw-msg__body, .pw-msg__reasoning, #document-editor, #source-editor, .pw-done__text:not([data-ui]), .pw-row__label, .pw-preview__frame, .pw-preview__error, .pw-mono, pre, code, iframe, script, style, #project-folder, .file-link, ' +
  // what the person or Pi wrote, shown in the workbench's own places (found by the translation's review, 2026-10-15)
  '.activity-request, .activity-detail__request, .pw-thread__msg, .document-request > p, .agent-reply, #retry-dialog-request, .pw-tool__cmd, .pw-tool__reason, .event-info__reason, .pw-suggest, .pw-review-item__text, .pw-review-item__quote';
// Parts that are counts match only numbers, so a pattern like "{n} tasks" never rewrites a sentence that ends in "tasks".
const NUMBERS = new Set(['n', 'm', 'a', 'b', 'c', 'total', 'p', 'w', 'size', 'limit', 'port', 'count']);
const ATTRIBUTES = ['aria-label', 'placeholder', 'title'];

/** A translator for a dictionary: text in English → its translation, or null when there is none. */
export function translator(dictionary = {}) {
  const exact = new Map(Object.entries(dictionary.exact || {}));
  const patterns = (dictionary.patterns || []).map(([source, target]) => {
    const names = [];
    const expression = source.split(/(\{\w+\})/).map(part => {
      const name = part.match(/^\{(\w+)\}$/)?.[1];
      if (name) { names.push(name); return NUMBERS.has(name) ? '(\\d[\\d,.]*)' : '(.+?)'; }
      return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }).join('');
    return { match: new RegExp(`^${expression}$`, 's'), names, target };
  });
  return text => {
    const trimmed = text.trim(); if (!trimmed) return null;
    const lead = text.slice(0, text.indexOf(trimmed)), tail = text.slice(text.indexOf(trimmed) + trimmed.length);
    if (exact.has(trimmed)) return lead + exact.get(trimmed) + tail;
    for (const { match, names, target } of patterns) {
      const found = trimmed.match(match);
      if (found) return lead + names.reduce((result, name, index) => result.replaceAll(`{${name}}`, exact.get(found[index + 1]) ?? found[index + 1]), target) + tail;
    }
    return null;
  };
}

/** The language the person chose: 'en', 'ja', or 'system' (the browser's first known language). */
export function chosenLanguage(saved, browser = []) {
  if (saved === 'en' || saved === 'ja') return saved;
  return browser.map(code => String(code).slice(0, 2).toLowerCase()).find(code => code === 'ja' || code === 'en') || 'en';
}

/** Translate a page and keep it translated: text nodes and labels now, and whatever is added or changed later. */
export function translatePage(root, translate) {
  const originals = new WeakMap(); // node → its English, so a switch back to English restores it
  const skipped = element => Boolean(element?.closest?.(SKIP));
  const text = node => {
    if (skipped(node.parentElement) || node.parentElement?.closest('textarea')) return;  // a field's own text is the person's; its label and placeholder are not
    const english = originals.get(node) ?? node.nodeValue, translated = translate(english);
    if (translated !== null && node.nodeValue !== translated) { originals.set(node, english); node.nodeValue = translated; }
  };
  const element = node => {
    if (skipped(node)) return;
    for (const name of ATTRIBUTES) {
      const value = node.getAttribute(name); if (!value) continue;
      const key = `data-i18n-${name}`, english = node.getAttribute(key) ?? value, translated = translate(english);
      if (translated !== null && value !== translated) { node.setAttribute(key, english); node.setAttribute(name, translated); }
    }
  };
  const walk = start => {
    if (start.nodeType === 3) return text(start);
    if (start.nodeType !== 1) return;
    if (skipped(start)) return;
    element(start);
    const walker = document.createTreeWalker(start, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, { acceptNode: node => (node.nodeType === 1 && skipped(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
    for (let node = walker.nextNode(); node; node = walker.nextNode()) node.nodeType === 3 ? text(node) : element(node);
  };
  walk(root);
  const observer = new MutationObserver(changes => {
    for (const change of changes) {
      if (change.type === 'characterData') text(change.target);
      else if (change.type === 'attributes' && !change.attributeName.startsWith('data-i18n')) { change.target.removeAttribute(`data-i18n-${change.attributeName}`); element(change.target); }
      else for (const node of change.addedNodes) walk(node);
    }
  });
  observer.observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRIBUTES });
  return {
    stop() {
      observer.disconnect();
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (node.nodeType === 3) { const english = originals.get(node); if (english !== undefined) node.nodeValue = english; continue; }
        for (const name of ATTRIBUTES) { const english = node.getAttribute(`data-i18n-${name}`); if (english !== null) { node.setAttribute(name, english); node.removeAttribute(`data-i18n-${name}`); } }
      }
    },
  };
}

let running = null;
/** Apply a language to the workbench: 'en' leaves the English; 'ja' loads messages/ja.json and keeps the page in it. */
export async function applyLanguage(language, { root = document.body, load = path => fetch(path).then(response => response.json()) } = {}) {
  running?.stop(); running = null;
  document.documentElement.lang = language;
  if (language === 'en') return;
  const translate = translator(await load(`/messages/${language}.json`));
  running = translatePage(root, translate);
  const title = translate(document.title); if (title) document.title = title;
  return translate;
}
