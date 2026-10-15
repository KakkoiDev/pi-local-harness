// DoneRow (round 7; boards P_DoneParts, P_Undo, P_UndoConflict, P_UndoUnsaved, P_Undone): under each answer whose
// request made a commit, what was done in plain words, Show in Preview and Undo This Request…. An undo is its own row
// (↶ Undone, Redo Request…). The undo itself is harness/undo.py (task 203, 208); these are its alerts.
import { glyph } from './preview.mjs';

const node = (tag, className = '', text) => { const element = document.createElement(tag); if (className) element.className = className; if (text !== undefined) element.textContent = text; return element; };
const cache = new Map(); // commit → what /api/undo says about it; dropped when an undo changes it

/** The request's first sentence, for alert titles: “Added a Delete button to each note”. */
export function firstSentence(lines, fallback = '') {
  return String(lines?.[0] || fallback).split(/(?<=[.!?。])\s*/)[0].replace(/[.。]$/, '');
}

/** The files that change back, one line each with their lines (the before-undo check, task 203). */
export function fileLines(files) {
  const list = node('ul', 'pw-lines');
  for (const file of files) {
    const item = node('li'); const count = [file.added && `+${file.added}`, file.removed && `−${file.removed}`].filter(Boolean).join(' ');
    item.append(node('span', '', file.path), node('span', '', `${count || '0'} line${file.added + file.removed === 1 ? '' : 's'}`)); list.append(item);
  }
  return list;
}

export function doneRow(commit, { project, api, ask, showPreview, send, changed }) {
  const row = node('section', 'pw-done'); row.setAttribute('aria-label', 'What was done');
  const fill = data => {
    const files = data.files.length, head = node('p', 'pw-done__head'), actions = node('div', 'pw-done__actions');
    const undoRow = Boolean(data.undo_of), redoRow = /^Redo: /.test(data.title);
    head.append(undoRow && !redoRow ? glyph('undo') : glyph('done'), node('span', '', undoRow && !redoRow ? 'Undone' : redoRow ? 'Redone' : 'Done'),
      node('span', '', `· ${files} file${files === 1 ? '' : 's'} · ${data.time}${data.undone ? ` · ${undoRow && !redoRow ? 'redone' : 'undone'} at ${data.undone_at}` : ''}`));
    const words = undoRow && !redoRow
      ? [`Undid “${firstSentence(data.person)}”. ${files} file${files === 1 ? '' : 's'} changed back as a new change: nothing is lost, and Redo brings it back.`]
      : data.person;
    const show = node('button', 'pw-btn', 'Show in Preview'); show.type = 'button'; show.onclick = () => showPreview();
    actions.append(show);
    if (undoRow && !redoRow) {
      const redo = node('button', 'pw-btn', 'Redo Request…'); redo.type = 'button'; redo.disabled = data.undone; redo.onclick = () => run(data, 'redo'); actions.append(redo);
    } else {
      const undo = node('button', 'pw-btn', 'Undo This Request…'); undo.type = 'button'; undo.disabled = data.undone; undo.onclick = () => run(data, 'undo'); actions.append(undo);
    }
    row.replaceChildren(head, ...words.map(line => node('p', 'pw-done__text', line)), actions);
  };
  const load = async () => {
    try { if (!cache.has(commit)) cache.set(commit, await api('/api/undo', { project, commit, preview: true })); fill(cache.get(commit)); }
    catch { row.replaceChildren(node('p', 'pw-done__head', 'This change is no longer in the project’s history.')); }
  };

  async function run(data, kind) {
    const name = firstSentence(data.person, data.name), files = data.files.length;
    const summary = node('details', ''); summary.open = true;
    summary.append(node('summary', '', `${files} file${files === 1 ? '' : 's'} change${files === 1 ? 's' : ''} back`), fileLines(data.files));
    const answer = kind === 'redo'
      ? await ask({ icon: 'caution', message: `Redo “${firstSentence(data.person)}”?`, detail: 'Its changes come back as a new change. Requests after the undo stay.', danger: 'Redo Request', safe: 'Cancel', extra: summary })
      : await ask({ icon: 'caution', message: `Undo “${name}”?`, detail: 'Your app’s data is not touched, and requests after this one stay. Undo is saved as a new change, so nothing is lost: it can be redone.', danger: 'Undo Request', safe: 'Cancel', extra: summary });
    if (answer !== 'danger') return;
    await attempt(data, name, false);
  }

  async function attempt(data, name, save) {
    const result = await api('/api/undo', { project, commit, save });
    if (result.outcome === 'undone') { cache.delete(commit); await changed(); return; }
    if (result.outcome === 'refused') {
      const where = result.message.match(/^Not undone: (.*?) (?:has|have) changes/)?.[1] || 'A file';
      const answer = await ask({ icon: 'note', message: `“${name}” can’t be undone yet.`, plain: true,
        detail: `${where} ${where.includes(',') ? 'have' : 'has'} changes that are not saved as a request: made in Work, or in another editor. Undoing now would overwrite them. Nothing was changed.`,
        extra: node('p', 'pw-alert__detail', `Save Them, Then Undo keeps those changes as their own entry (“Your edits · ${new Date().toTimeString().slice(0, 5)}”), then undoes the request.`),
        danger: 'Save Them, Then Undo', safe: 'Cancel' });
      if (answer === 'danger') await attempt(data, name, true);
      return;
    }
    if (result.outcome === 'conflict') {
      const later = result.later, where = (result.files || []).join(', ') || 'A file';
      cache.delete(commit); await changed(); // Save Them may have made an entry before the overlap stopped the undo
      const answer = await ask({ icon: 'note', message: `“${name}” can’t be undone by itself.`, plain: true, escape: 'danger',
        detail: `${where} changed again after it${later ? `, in “${later.name}” (${later.time})` : ''}, so going back would mix the two. Nothing was changed.`,
        extra: node('p', 'pw-alert__detail', later ? `Pi can take that change out and keep what “${later.name}” did.` : 'Pi can take that change out by hand.'),
        danger: 'Cancel', safe: 'Ask Pi Instead' });
      if (answer === 'default') await send({ message: `Take out what “${name}” did, by hand${later ? `, and keep what “${later.name}” did` : ''}.` });
      return;
    }
    await ask({ icon: 'note', message: result.message, danger: 'Cancel', safe: 'OK', plain: true });
  }

  load();
  return row;
}

export function forgetDone() { cache.clear(); }
