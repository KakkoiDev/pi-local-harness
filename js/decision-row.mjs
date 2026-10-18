// The decision row (plan 267 section 3, task 273; design/system/components/HarnessNotice › DecisionRow, boards R12_Gate
// and Ph12_Gate). Under an answer, collapsed: “▸ 5 decisions · 2 automatic”; open: one row per decision with its source
// tag (you · auto · Laya · code · model; auto and model dotted), the name, the value and Change…. Change… opens a
// ChoiceCard that names what it redoes (a question's answer, the phase, an accepted task); a decision that cannot be
// changed here keeps Change… disabled with the reason. The rows come from GET /api/conversations/<id>/decisions, which
// applies Settings › Pi › Detail (Beginner hides decisions made by code; Expert shows all with rules, paths, commands).
import { icon } from './ui.mjs';

const node = (tag, cls = '', text) => { const el = document.createElement(tag); if (cls) el.className = cls; if (text !== undefined) el.textContent = text; return el; };
const words = (tag, cls, text) => { const el = node(tag, cls, text); el.dataset.noTranslate = ''; return el; };
const time = value => value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
const loaded = new Map(); // chat id → {key, promise}
const opened = new Set(); // chat:index of rows the person opened, kept across re-renders
const rows = new WeakMap(); // li → {row, message, actions}, for Change… on a settled question's card

/** What changes in a conversation that changes its decisions: its answers, choices, decisions and check-ins. */
function version(conversation) {
  return JSON.stringify((conversation?.messages || []).map(message => message.role === 'assistant' ? [message.request, message.choice?.answer, message.choice?.settled, (message.decisions || []).map(item => item.answer), message.check_in?.state] : 0));
}

/** The decisions of every answer in the conversation, fetched once per change of its answers. */
export function decisionsFor(api, conversation) {
  if (!conversation?.id) return Promise.resolve({ messages: {} });
  const key = version(conversation), known = loaded.get(conversation.id);
  if (known && known.key === key) return known.promise;
  const promise = api(`/api/conversations/${conversation.id}/decisions`).catch(() => ({ messages: {} }));
  loaded.set(conversation.id, { key, promise }); return promise;
}

/** Forget what was loaded (after a change, or Settings › Detail), so the next render asks again. */
export function forgetDecisions() { loaded.clear(); }

function tag(who) { return node('span', 'pw-tag' + (who === 'auto' || who === 'model' ? ' pw-tag--dotted' : ''), who); }

function rowView(row, actions) {
  const li = node('li');
  li.append(tag(row.who), (row.words ? words : node)('b', '', row.name));
  li.lastChild.style.fontWeight = '600';
  li.append((row.words && row.value !== 'not answered' ? words : node)('span', 'pw-decisions__value', row.value));
  if (row.detail) li.append((row.kind === 'question_answer' ? node : words)('small', 'pw-decisions__detail', row.detail));
  if (row.rule || typeof row.confidence === 'number') li.append(words('small', 'pw-decisions__rule', [row.rule, typeof row.confidence === 'number' ? row.confidence.toFixed(2) : null].filter(Boolean).join(' · ')));
  if (row.time && actions.expert) li.append(words('small', 'pw-decisions__time', time(row.time)));  // Expert: when; Beginner keeps the row as the board draws it
  const change = node('a', 'pw-link', 'Change…'); change.href = '#';
  if (row.change) change.onclick = event => { event.preventDefault(); actions.change(row, li); };
  else {
    change.setAttribute('aria-disabled', 'true'); change.title = row.why || '';
    change.onclick = event => { event.preventDefault(); if (!li.querySelector('.pw-decisions__why')) li.append(node('small', 'pw-help pw-decisions__why', row.why || '')); };
  }
  li.append(change); return li;
}

/** `details.pw-decisions` for the message at `index`, filled when the conversation's decisions arrive; hidden while it
 * has none. actions: {api, conversation, project, changed(conversation?), phase(value)} for Change…. */
export function decisionRow(message, index, actions) {
  const details = node('details', 'pw-decisions'), summary = node('summary'), list = node('ul');
  details.hidden = true; details.dataset.index = String(index);
  const key = `${actions.conversation?.id}:${index}`;
  const marker = node('span', 'pw-decisions__marker'); marker.setAttribute('aria-hidden', 'true');
  details.open = opened.has(key); marker.textContent = details.open ? '▾' : '▸';
  details.ontoggle = () => { marker.textContent = details.open ? '▾' : '▸'; if (details.open) opened.add(key); else opened.delete(key); };
  summary.append(marker, node('span', 'pw-decisions__count'));
  details.append(summary, list);
  decisionsFor(actions.api, actions.conversation).then(data => {
    const found = data.messages?.[String(index)];
    if (!found || !found.total) return;
    summary.querySelector('.pw-decisions__count').textContent = found.automatic ? `${found.total} decision${found.total === 1 ? '' : 's'} · ${found.automatic} automatic` : `${found.total} decision${found.total === 1 ? '' : 's'}`;
    list.replaceChildren(...found.rows.map(row => { const li = rowView(row, { expert: data.detail === 'expert', change: (row, li) => openChange(row, li, message, actions) }); rows.set(li, { row, message, actions }); return li; }));
    details.hidden = false;
  });
  return details;
}

/** The current options of the question a row changes, from the answer's own record. */
function questionOf(row, message) {
  if (row.change.type === 'question') {
    const item = row.change.source === 'choice' ? message.choice : (message.decisions || [])[row.change.position];
    return { question: item?.question || row.name, options: (item?.options || []).map(option => option.label), current: item?.answer, state: row.who, when: item?.when, words: true };
  }
  if (row.change.type === 'phase') return { question: 'Phase', options: ['Discussion', 'Planning', 'Implementation'], current: row.value, state: row.who, when: row.time };
  return { question: 'Check-in', options: ['Keep it accepted', 'Reopen the task'], current: 'Keep it accepted', state: row.who, when: row.time };
}

/** Change… (R12_Gate, the Change flow): a ChoiceCard after the row's details, naming what it redoes; Change and Redo. */
export function openChange(row, li, message, actions) {
  const details = li.closest('details'); details.parentElement?.querySelector('.pw-change')?.remove();
  const value = questionOf(row, message), group = 'change-' + crypto.randomUUID();
  const card = node('section', 'pw-card pw-change'), head = node('div', 'pw-card__head'), body = node('div', 'pw-card__body'), foot = node('div', 'pw-card__foot');
  const title = node('h3', 'pw-card__title'); title.id = group + '-title';
  title.append(node('span', '', 'Change: '), (value.words ? words : node)('span', '', value.question));
  head.append(icon('question'), title, node('span', '', 'Change…'));
  card.setAttribute('aria-labelledby', title.id); body.setAttribute('role', 'radiogroup'); body.setAttribute('aria-labelledby', title.id); body.style.gap = '0';
  const labels = [...value.options, ...(row.change.type === 'question' ? ['Something else…'] : [])];
  let selected = Math.max(0, labels.findIndex(label => label !== value.current && label.toLowerCase() !== String(value.current).toLowerCase()));
  const other = node('input', 'pw-field'); other.placeholder = 'Type your answer'; other.setAttribute('aria-label', 'Your answer'); other.hidden = true;
  const radios = labels.map((label, position) => {
    const option = node('label', 'pw-option'), radio = node('input', 'pw-radio');
    radio.type = 'radio'; radio.name = group; radio.checked = position === selected;
    radio.onchange = () => { selected = position; other.hidden = !(row.change.type === 'question' && position === value.options.length); if (!other.hidden) other.focus(); };
    const text = (value.words && position < value.options.length ? words : node)('span', 'pw-option__label', label);
    option.append(radio, text);
    if (label === value.current || label.toLowerCase() === String(value.current).toLowerCase()) option.append(node('small', '', `Current choice (${value.state}${value.when ? ', ' + time(value.when) : ''}).`));
    if (row.change.type === 'question' && position === value.options.length) option.append(other);
    body.append(option); return radio;
  });
  void radios;
  const redoes = row.change.type === 'question' ? (row.change.redoes ? `Redoes: ${row.change.redoes}` : 'Redoes: Pi’s work after this answer') : row.change.type === 'phase' ? 'Redoes: nothing; the phase changes' : `Redoes: ${row.change.task}, open again`;
  const cancel = node('button', 'pw-btn', 'Cancel'), go = node('button', 'pw-btn pw-btn--default', 'Change and Redo'), problem = node('span', 'pw-help');
  cancel.type = go.type = 'button'; cancel.onclick = () => card.remove();
  const spacer = node('span'); spacer.style.flex = '1';
  foot.append(node('span', 'pw-help', redoes), spacer, cancel, go);
  go.onclick = async () => {
    const label = labels[selected];
    if (label === value.current) { problem.textContent = 'That is already the answer.'; foot.prepend(problem); return; }
    go.disabled = true;
    try {
      let result;
      if (row.change.type === 'question') {
        const typed = selected === value.options.length ? other.value.trim() : null;
        if (selected === value.options.length && !typed) { other.focus(); go.disabled = false; return; }
        result = await actions.api('/api/decisions/change', { project: actions.project, index: row.change.index, source: row.change.source, ...(row.change.position !== undefined ? { position: row.change.position } : {}), ...(typed ? { text: typed } : { option: selected }) });
      } else if (row.change.type === 'phase') { result = await actions.api('/api/phase', { project: actions.project, phase: label.toLowerCase() }); await actions.phase?.(); }
      else if (selected === 1) result = await actions.api('/api/tasks/reopen', { project: actions.project, task: row.change.task, request: message.request });
      card.remove(); forgetDecisions(); await actions.changed(result?.conversation);
    } catch (error) { go.disabled = false; problem.textContent = error.message; foot.prepend(problem); }
  };
  card.append(head, body, foot); details.after(card); (radios[selected] || go).focus();
  return card;
}

/** Settings › Pi › Detail (R12_Gate): Beginner · Expert, saved in config.json like the other settings. */
export function installDetail({ api, form, changed }) {
  const radios = () => [...(form?.querySelectorAll('input[name="detail"]') || [])];
  if (!radios().length) return;
  const show = value => radios().forEach(radio => { radio.checked = radio.value === value; });
  api('/api/settings').then(settings => show(settings.detail || 'beginner')).catch(() => show('beginner'));
  radios().forEach(radio => radio.addEventListener('change', async () => {
    try { await api('/api/settings', { detail: radio.value }); forgetDecisions(); changed?.(); } catch { /* the dialog keeps the choice; the next open reads the saved one */ }
  }));
}

/** Change… on a settled question's card opens the same flow as its decision row; false when the row is not there yet. */
export function openQuestionChange(article, source, position) {
  const details = article.querySelector('details.pw-decisions');
  if (!details || details.hidden) return false;
  const li = [...details.querySelectorAll('li')].find(item => { const row = rows.get(item)?.row; return row?.change?.type === 'question' && row.change.source === source && (position === undefined || row.change.position === position); });
  if (!li) return false;
  const { row, message, actions } = rows.get(li); details.open = true; openChange(row, li, message, actions); return true;
}
