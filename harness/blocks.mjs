// App Blocks (plan 266 item 7): the designer's ready-made app and game parts, as cards Pi gets one at a time. System 1
// picks: code matches the request's words against kit/blocks/index.json (English and Japanese keywords) and attaches
// exactly the matching cards, never the library; when the only matches are common words or a word several cards share,
// the classifier chooses among those few (harness/judgements.py, kind app_block) or nothing is attached. Pi can load one
// more card by its exact name with the app_block tool, so it never browses kit/blocks.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

export const MAX_CARDS = 2;      // chosen cards per request; the foundation card they assume comes on top
export const BUDGET = 14000;     // characters of cards in the system prompt (about 3.5k tokens)
const MAX_CANDIDATES = 4;
const CJK = /[^\x00-\x7f]/;

export function loadBlocks(file = new URL('../kit/blocks/index.json', import.meta.url)) {
  const path = file instanceof URL ? fileURLToPath(file) : file;
  const index = JSON.parse(readFileSync(path, 'utf8'));
  // Card paths in the index are relative to the harness folder (kit/blocks/…): three folders above index.json.
  return { ...index, byName: new Map(index.cards.map(card => [card.name, card])), root: dirname(dirname(dirname(path))) };
}

const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Every keyword occurrence in the text: {name, keyword, start, end, weak}. English words match whole (a plural s too). */
function matches(text, index) {
  const lower = String(text || '').toLowerCase(), found = [];
  for (const card of index.cards) {
    const weak = new Set((card.weak || []).map(word => word.toLowerCase()));
    for (const keyword of new Set([...card.keywords.en, ...card.keywords.ja].map(word => word.toLowerCase()))) {
      const pattern = CJK.test(keyword) ? new RegExp(escape(keyword), 'g') : new RegExp(`(?<![a-z0-9@'-])${escape(keyword)}(?:s|es)?(?![a-z0-9-])`, 'g');
      for (const match of lower.matchAll(pattern)) found.push({ name: card.name, keyword, start: match.index, end: match.index + match[0].length, weak: weak.has(keyword) });
    }
  }
  // A longer match covers the shorter ones inside it: "admin dashboard" is AppAdmin, not also Dashboard.
  return found.filter(item => !found.some(other => other !== item && other.start <= item.start && other.end >= item.end && other.end - other.start > item.end - item.start));
}

/**
 * The cards for a request. cards: attach these (code is sure: a specific word that only one card has). candidates: code
 * is unsure (common words only, or a word several cards share); the classifier may choose one, else none is attached.
 */
export function chooseBlocks(text, index, max = MAX_CARDS) {
  const found = matches(text, index);
  const sharedSpan = item => found.some(other => other.name !== item.name && other.start === item.start && other.end === item.end);
  const score = new Map(), first = new Map(), sure = new Set();
  for (const item of found) {
    score.set(item.name, (score.get(item.name) || 0) + (item.weak ? 1 : 3));
    first.set(item.name, Math.min(first.get(item.name) ?? Infinity, item.start));
    if (!item.weak && !sharedSpan(item)) sure.add(item.name);
  }
  const rank = (a, b) => {
    const whole = name => ['archetype', 'genre'].includes(index.byName.get(name).kind) ? 0 : 1;
    return whole(a) - whole(b) || score.get(b) - score.get(a) || first.get(a) - first.get(b) || a.localeCompare(b);
  };
  const ranked = [...sure].sort(rank), cards = ranked.slice(0, max), others = ranked.slice(max, max + MAX_CANDIDATES);
  const candidates = cards.length ? [] : [...score.keys()].sort(rank).slice(0, MAX_CANDIDATES);
  return { cards, others, candidates, keywords: [...new Set(found.filter(item => cards.includes(item.name) || candidates.includes(item.name)).map(item => item.keyword))] };
}

/** A card's text, with {harness} filled in (Pi works in the project folder; the cards name the harness's own files). */
export function cardText(name, index) {
  const card = index.byName.get(name);
  if (!card) return null;
  return readFileSync(`${index.root}/${card.card}`, 'utf8').trim().replaceAll('{harness}', index.root);
}

/** The system prompt section for the chosen cards: the first card, the foundation it assumes, then the rest, in budget.
 * others: more cards the request named (over MAX_CARDS), listed by name only. */
export function blocksPrompt(names, index, budget = BUDGET, others = []) {
  if (!names.length) return '';
  const order = [];
  const push = name => { if (index.byName.has(name) && !order.includes(name)) order.push(name); };
  push(names[0]); for (const required of index.byName.get(names[0])?.requires || []) push(required);
  for (const name of names.slice(1)) { push(name); for (const required of index.byName.get(name)?.requires || []) push(required); }
  const parts = [], left = [];
  let used = 0;
  for (const name of order) {
    const text = cardText(name, index);
    if (!parts.length || used + text.length <= budget) { parts.push(text); used += text.length; } else left.push(name);
  }
  left.push(...others.filter(name => index.byName.has(name) && !order.includes(name)));
  const more = left.length ? `\n\nAlso relevant (load with app_block when you need it): ${left.join(', ')}.` : '';
  return `\n\nApp Blocks for this request (the designer's ready-made parts: copy their markup files, never retype or invent):\n\n${parts.join('\n\n---\n\n')}${more}`;
}

/** The one-line hint when code was unsure and nothing was attached: names only, and the tool. */
export function blocksHint(candidates) {
  return candidates.length ? `\n\nApp Blocks that may fit this request: ${candidates.join(', ')}. If one does, load its card with the app_block tool (exact name).` : '';
}

/** The app_block tool: one card by its exact name. Unknown names are refused with the nearest real names. */
export function loadCard(name, index) {
  const wanted = String(name || '').trim();
  const card = index.byName.get(wanted) || [...index.byName.values()].find(item => item.name.toLowerCase() === wanted.toLowerCase());
  if (!card) {
    const lower = wanted.toLowerCase().replace(/[^a-z0-9]/g, '');
    const near = lower ? [...index.byName.keys()].filter(item => item.toLowerCase().includes(lower) || lower.includes(item.toLowerCase())).slice(0, 5) : [];
    return { error: `No App Block called "${wanted}". Use an exact name${near.length ? `: ${near.join(', ')}` : ' from the cards you were given (an archetype card lists its blocks)'}.` };
  }
  return { name: card.name, text: cardText(card.name, index) };
}

export function installBlocks(pi, { index } = {}) {
  pi.registerTool?.({
    name: 'app_block', label: 'App Block card',
    description: 'Load one App Block card by its exact name (LogIn, SidePanel, DataTable, BarChart, Cart, Kanban, AppShop, GameRpg…): the designer’s ready-made part with its markup file to copy, states, English and Japanese texts, keyboard, phone and data. Use the names an archetype card or a hint gives you; one card per call.',
    parameters: { type: 'object', properties: { name: { type: 'string', description: 'The exact card name, e.g. LogIn' } }, required: ['name'] },
    async execute(_id, params) {
      let blocks = index;
      try { blocks ||= loadBlocks(); } catch (error) { return { isError: true, content: [{ type: 'text', text: `App Blocks are not installed: ${error.message}` }], details: {} }; }
      const result = loadCard(params?.name, blocks);
      if (result.error) return { isError: true, content: [{ type: 'text', text: result.error }], details: {} };
      return { content: [{ type: 'text', text: result.text }], details: { block: result.name } };
    },
  });
}
