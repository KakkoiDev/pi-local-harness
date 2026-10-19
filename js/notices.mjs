// Round 12 (design/system/components/HarnessNotice, boards R12_Conversation and Ph12_Cut; tasks 290, 291): the quiet
// lines under an answer. HarnessNotice is the harness speaking (never Pi's voice) in a dotted box; CutLine says an answer
// stopped before Pi finished, with Retry and, only when files changed, Undo This Request…. Other cards build their
// harness notices with harnessNotice() so there is one look and one role for the harness's voice.
import { icon } from './ui.mjs';

const node = (tag, cls = '', text) => { const el = document.createElement(tag); if (cls) el.className = cls; if (text !== undefined) el.textContent = text; return el; };
const time = value => value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

/** `.pw-notice` (role="note"): the info glyph, who speaks (Harness, Suggested, Restored), the sentence and an optional link
 * ({label, action}) or button ({label, action, button: true}). `.message-notice` stays for the suites that find it. */
export function harnessNotice(text, { who = 'Harness', link = null } = {}) {
  const el = node('p', 'pw-notice message-notice'); el.setAttribute('role', 'note');
  el.append(icon('note', { size: 12 }), node('span', 'pw-notice__who', who), node('span', 'pw-notice__text', text));
  if (link) {
    const action = node(link.button ? 'button' : 'a', link.button ? 'pw-btn' : 'pw-link', link.label);
    if (link.button) action.type = 'button'; else action.href = '#';
    action.onclick = event => { event.preventDefault(); link.action(); };
    el.append(action);
  }
  return el;
}

/** The notice for one of the harness's notice lines (`message.notices`), with its link when the harness knows one. */
export function noticeFor(text, { installLaya, installPackages } = {}) {
  if (/^Laya isn’t installed/.test(text) && installLaya) return harnessNotice(text, { link: { label: 'How to Install', action: installLaya } });
  if (/^This project’s packages aren’t installed/.test(text) && installPackages) return harnessNotice(text, { link: { label: 'Install Packages…', action: installPackages, button: true } });  // task 331
  return harnessNotice(text);
}

/** `.pw-cut` (role="status") under an answer that a stop or a failure cut short; the partial answer stays above it.
 * Retry is the default; Undo This Request… only when Gate committed what the request changed (ended.commit). */
export function cutLine(ended, { when, retry, undo } = {}) {
  const stopped = ended.state === 'stopped', el = node('div', 'pw-cut message-ended'); el.setAttribute('role', 'status');
  const text = node('span', 'pw-cut__text');
  text.append(node('span', '', stopped ? 'Stopped by you before Pi finished.' : 'Failed before Pi finished: ' + (ended.reason || 'Pi stopped.')));
  if (when) text.append(` · ${time(when)}`);
  el.append(icon(stopped ? 'stop' : 'stopped', { size: 12 }), text);
  if (ended.job && retry) {
    const button = node('button', 'pw-btn pw-btn--default', 'Retry'); button.type = 'button';
    button.onclick = async () => { button.disabled = true; try { await retry(ended.job); } catch { button.disabled = false; } };
    el.append(button);
  }
  if (ended.commit && undo) { const button = node('button', 'pw-btn', 'Undo This Request…'); button.type = 'button'; button.onclick = () => undo(ended.commit); el.append(button); }
  return el;
}

/** Activity's state words (R12_Conversation): a pause Pi asked for is “Waiting for you”, a request a question replaced
 * “Stopped by a question”, the person's Stop “Stopped by you”; null keeps the glyph's own word. */
export function activityLabel(job) {
  if (job.status === 'waiting') return 'Waiting for you';
  if (job.status === 'stopped') return 'Stopped by you';
  if (job.status === 'completed' && job.choice && /^(Answered|Stopped by a question)/.test(job.progress || '')) return 'Stopped by a question';
  return null;
}

/** Relabel a state glyph (design/icons.mjs stateGlyph) with activityLabel's words, keeping its icon. */
export function relabelState(glyph, job) {
  const label = activityLabel(job); if (!label) return glyph;
  const text = [...glyph.childNodes].find(child => child.nodeType === 3);
  if (text) text.textContent = label; else glyph.append(label);
  return glyph;
}
