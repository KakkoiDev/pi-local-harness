// Task 325, the waiting messages (the owner, 2026-10-18: "I want to be able to read and update/remove queued messages to
// the agent"). Under the running request, every message of this chat that still waits for Pi: its full text, its
// attachments and when it was queued, in the order Pi takes them. Edit replaces it in place (and can drop attachments);
// Remove… asks first, then Pi never receives it. The server (harness/work_queue.py edit/remove) refuses a message that
// already started, was removed, or changed in another window; then the draft goes back into the composer.
// No board draws it yet (design/briefs/round-13.md, "Waiting messages"): built from pw-card, pw-btn, pw-chip and
// pw-field, with .pw-queue* classes and data-job / data-action hooks so the designer's version can restyle it.
import { icon, readState, writeState } from './ui.mjs';

const el = (tag, className = '', text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
const button = (label, action, className = 'pw-btn') => { const node = el('button', className, label); node.type = 'button'; node.dataset.action = action; return node; };
const clock = iso => { if (!iso) return ''; const date = new Date(iso); return date.toDateString() === new Date().toDateString() ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); };
/** A plain chat message can be edited; an answer to a question, Start Building or Continue can only be removed. */
const editable = job => Boolean(job.editable);

/** The waiting messages of one chat, newest state from the workspace poll; `api` and `ask` are the page's. */
export function installQueue({ container, api, ask, refresh = async () => {} }) {
  let editing = null;   // {id, chat, version, text, removed:Set, job}: survives polls and chat switches
  let busy = false, notice = '', open = readState('queue-open', true), shown = { chat: null, title: '', jobs: [] };
  const rows = new Map(); // job id → {key, element}

  const head = el('button', 'pw-queue-note pw-queue__toggle'); head.type = 'button'; head.dataset.action = 'toggle';
  const list = el('ol', 'pw-queue__list'); list.setAttribute('aria-label', 'Waiting messages');
  const line = el('p', 'pw-queue__notice'); line.setAttribute('role', 'status'); line.hidden = true;
  container.replaceChildren(head, list, line);
  head.onclick = () => { open = !open; writeState('queue-open', open); draw(); };

  let fading = null;
  /** One status line under the list; a success fades after 8 seconds (as the toast does), a refusal stays. */
  function say(text, fade = false) {
    clearTimeout(fading); notice = text; line.textContent = text; line.hidden = !text;
    if (fade && text) fading = setTimeout(() => { say(''); draw(); }, 8000);
  }
  /** The person's words are never lost: a refused edit goes back into the composer (after what is already there). */
  function keepDraft(text) {
    const prompt = document.getElementById('prompt'); if (!prompt || !text.trim()) return;
    prompt.value = prompt.value.trim() ? prompt.value.replace(/\s+$/, '') + '\n\n' + text : text;
    prompt.dispatchEvent(new Event('input'));
  }
  function refuse(sentence) {
    const draft = editing?.text || ''; editing = null;
    keepDraft(draft); say(draft.trim() ? sentence + ' Your text is back in the composer.' : sentence);
    draw();
  }

  function chips(job, removable) {
    const files = job.files || []; if (!files.length) return null;
    const box = el('div', 'pw-chips pw-queue__files');
    files.forEach((name, index) => {
      if (removable && editing.removed.has(index)) return;
      const chip = el('span', 'pw-chip pw-queue__file'); chip.dataset.file = String(index); const label = el('span', '', name); label.dataset.noTranslate = ''; chip.append(label);
      if (removable) { const drop = button('', 'drop-file', ''); drop.append(icon('close')); drop.setAttribute('aria-label', 'Remove ' + name); drop.onclick = () => { editing.removed.add(index); draw(); }; chip.append(drop); }
      box.append(chip);
    });
    return box.children.length ? box : null;
  }

  function row(job, position) {
    const mine = editing?.id === job.id, item = el('li', 'pw-card pw-queue__item' + (mine ? ' pw-queue__item--editing' : ''));
    item.dataset.job = job.id; item.dataset.version = String(job.version || 1);
    const top = el('div', 'pw-card__head pw-queue__head');
    top.append(el('span', 'pw-queue__position', String(position)), el('span', 'pw-queue__when', 'Queued ' + clock(job.created)));
    if (job.edited) top.append(el('span', 'pw-queue__edited', 'Edited'));
    const body = el('div', 'pw-card__body pw-queue__body');
    if (mine) {
      const field = el('textarea', 'pw-field pw-queue__field'); field.value = editing.text; field.rows = Math.min(8, Math.max(3, editing.text.split('\n').length + 1));
      field.setAttribute('aria-label', 'Message text'); field.dataset.noTranslate = '';
      field.oninput = () => { editing.text = field.value; };
      field.onkeydown = event => { if (event.key === 'Escape') { event.preventDefault(); cancel(); } else if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && !event.isComposing) { event.preventDefault(); save(); } };
      body.append(field);
    } else { const text = el('p', 'pw-queue__text', job.message || 'Attached files'); if (job.message) text.dataset.noTranslate = ''; body.append(text); }  /* the person's words are never translated */
    const files = chips(job, mine); if (files) body.append(files);
    const foot = el('div', 'pw-card__foot pw-queue__actions');
    if (mine) {
      const ok = button('Save', 'save', 'pw-btn pw-btn--default'); ok.onclick = save; ok.disabled = busy;
      const no = button('Cancel', 'cancel'); no.onclick = cancel; no.disabled = busy;
      foot.append(ok, no);
    } else {
      if (editable(job)) { const edit = button('Edit', 'edit'); edit.onclick = () => begin(job); edit.disabled = busy || Boolean(editing && editing.chat === shown.chat); foot.append(edit); }
      const remove = button('Remove…', 'remove'); remove.onclick = () => removeJob(job); remove.disabled = busy || editing?.id === job.id; foot.append(remove);
    }
    item.append(top, body, foot);
    return item;
  }

  function begin(job) {
    editing = { id: job.id, chat: job.chat, version: job.version || 1, text: job.message || '', removed: new Set(), job }; say(''); draw();
    list.querySelector(`[data-job="${job.id}"] textarea`)?.focus();
  }
  function cancel() { editing = null; say(''); draw(); }

  async function save() {
    if (!editing || busy) return;
    const target = editing; busy = true; draw();
    try {
      await api(`/api/jobs/${target.id}/edit`, { version: target.version, message: target.text, remove_files: [...target.removed].sort((a, b) => a - b) });
      editing = null; say('Saved. Pi gets the edited message in the same place.', true);
    } catch (error) {
      if (error.data?.refused) { busy = false; refuse(error.message); await refresh(); return; }
      if (!error.stale) say(error.message);  // e.g. "Write a message or keep an attachment": the editor stays open
    } finally { busy = false; }
    await refresh(); draw();
  }

  async function removeJob(job) {
    if (busy) return;
    const choice = await ask({ message: 'Remove this waiting message?', detail: 'Pi will never receive it. Its attachments are released.', danger: 'Remove Message', safe: 'Keep Waiting' });
    if (choice !== 'danger') return;
    busy = true; draw();
    try { await api(`/api/jobs/${job.id}/remove`, { version: job.version || 1 }); say('Removed. Pi will never receive that message.', true); }
    catch (error) { if (!error.stale) say(error.message); }
    finally { busy = false; }
    await refresh(); draw();
  }

  function draw() {
    const { jobs, title } = shown, count = jobs.length;
    container.hidden = !count && !notice && !(editing && editing.chat === shown.chat);
    head.hidden = !count;
    head.textContent = `Next: ${count} request${count === 1 ? '' : 's'} waiting in ${title}`;
    head.setAttribute('aria-expanded', String(open)); head.setAttribute('aria-controls', 'queue-list'); list.id = 'queue-list';
    list.hidden = !open || !count;
    const wanted = jobs.map((job, index) => {
      const mine = editing?.id === job.id;
      const key = JSON.stringify(mine ? ['editing', job.id, index, [...editing.removed], busy] : [job.id, job.version, job.message, job.files, job.created, job.edited, index, busy, Boolean(editing && editing.chat === shown.chat)]);
      const known = rows.get(job.id);
      if (known && known.key === key) return known.element;
      const element = row(job, index + 1);
      if (known?.element.isConnected) known.element.replaceWith(element);
      rows.set(job.id, { key, element }); return element;
    });
    for (const id of [...rows.keys()]) if (!jobs.some(job => job.id === id)) rows.delete(id);
    if (wanted.length !== list.children.length || wanted.some((element, index) => list.children[index] !== element)) list.replaceChildren(...wanted);
  }

  return {
    /** Called on every update of the chat: `jobs` is the workspace's list, `chat` the open chat, `title` its project. */
    render({ jobs = [], chat = null, title = '' }) {
      if (chat !== shown.chat) say('');
      const waiting = jobs.filter(job => job.chat === chat && !job.document && job.status === 'queued');
      if (editing && editing.chat === chat) {
        const now = jobs.find(job => job.id === editing.id);
        if (!now || now.status !== 'queued') { shown = { chat, title, jobs: waiting }; refuse(now?.status === 'cancelled' ? 'This message was removed; your edit was not sent.' : 'Pi already started this message; your edit was not sent.'); return; }
        editing.job = now;
      }
      shown = { chat, title, jobs: waiting }; draw();
    },
    /** The message being edited, if any (the page keeps it when the chat changes). */
    editing: () => editing?.id || null,
  };
}
