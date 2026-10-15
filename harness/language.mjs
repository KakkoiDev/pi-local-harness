// Terminal Pi's language (the person, 2026-10-15: "only the UI and the texts will be translated, the / commands will
// be kept in English"). The same dictionary as the web workbench (messages/ja.json, English as the key, js/i18n.mjs).
// Only what the person sees is translated: Pi reads the English (the console's text for Pi, tool results).
import { readFileSync } from 'node:fs';
import { translator } from '../js/i18n.mjs';

/** The setting `language` (system, en, ja): system follows the terminal's locale. */
export function terminalLanguage(setting = process.env.PI_HARNESS_LANGUAGE, env = process.env) {
  if (setting === 'en' || setting === 'ja') return setting;
  const locale = String(env.LC_ALL || env.LC_MESSAGES || env.LANG || '').slice(0, 2).toLowerCase();
  return locale === 'ja' ? 'ja' : 'en';
}

let current = null;
/** Load the dictionary for a language ('en' clears it); returns the language. */
export function loadTerminalLanguage(language = terminalLanguage()) {
  current = language === 'ja' ? translator(JSON.parse(readFileSync(new URL('../messages/ja.json', import.meta.url), 'utf8'))) : null;
  return language;
}

/** A line or a sentence in the terminal's language, or as it is when there is no translation. */
export function tr(text) {
  if (!current || text === undefined || text === null) return text;
  return current(String(text)) ?? text;
}

const STATE = /^(state|status|decision|can|result)$/i;
// A value that is a state the harness wrote ("✓ Running · since 9:41", "○ Waiting"), never a name or a path.
const SAID = /^[✓✗○▶!◐●·]\s/;
/** A console view (harness/admin.py --view) for the screen: titles, labels, headers, state words and prose; never values
 * (names, paths, ids) and never a /command (`fix`). */
export function translateView(view, translate = tr) {
  const t = text => {
    if (text === undefined || text === null) return text;
    const whole = translate(String(text)); if (whole !== null && whole !== undefined && whole !== String(text)) return whole;
    const marked = /^([✓✗○▶!◐●·]\s)(.+)$/s.exec(String(text)); // "✓ Running": the mark, then a word that has its own entry
    return marked ? marked[1] + (translate(marked[2]) ?? marked[2]) : text;
  };
  const exact = text => (typeof text === 'string' && (!text.includes(' ') || SAID.test(text)) ? t(text) : text); // a state word or a marked state, never a name with spaces
  const value = text => (typeof text === 'string' && SAID.test(text) ? t(text) : text);
  return {
    ...view, title: t(view.title), summary: t(view.summary), hint: t(view.hint),
    parts: (view.parts || []).map(part => {
      const out = { ...part, heading: t(part.heading) };
      if (part.kind === 'kv') out.rows = part.rows.map(([label, shown]) => [t(label), value(shown)]);
      if (part.kind === 'table') {
        const states = part.columns.map(column => STATE.test(column));
        out.columns = part.columns.map(t); out.empty = t(part.empty);
        out.rows = part.rows.map(row => row.map((cell, index) => (states[index] ? exact(cell) : cell)));
      }
      if (part.kind === 'checklist') out.items = part.items.map(item => ({ ...item, label: t(item.label), detail: t(item.detail) }));
      if (part.kind === 'lines') out.lines = part.lines.map(t);
      if (part.kind === 'prose') out.text = part.text.split('\n').map(t).join('\n');
      return out;
    }),
  };
}
