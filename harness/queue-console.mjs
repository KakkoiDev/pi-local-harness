// Task 325 in terminal Pi: /queue edit <id> <new words> and /queue remove <id>, the web chat's Edit and Remove… for a
// message that waits for Pi. Only the person's own terminal can do it: the change goes to the workbench's person-only
// routes (/api/jobs/<id>/edit|remove) with the person secret services.py gave this terminal (task 261). The harness
// tool Pi calls never reaches this code (it runs harness/admin.py, which reads only), so Pi cannot change its own queue.
// Each change shows what it does and asks first; a message that started or changed meanwhile is refused by the server.
import { tr } from './language.mjs';

const lines = (...text) => ({ kind: 'lines', lines: text });
const view = (parts, hint = '/queue waiting lists the waiting messages') => ({ title: 'Queue', parts: Array.isArray(parts) ? parts : [parts], hint });
const failed = text => view(lines(`✗ ${tr(text)}`));
const quote = text => `“${String(text || 'Attached files').replace(/\s+/g, ' ').slice(0, 300)}”`;

/** words: ['edit', id, ...new words] or ['remove', id]. ask(title, choices) is the person's select. Returns a view. */
export async function queueChange(words, { ports = () => undefined, ask, fetchImpl = globalThis.fetch } = {}) {
  const [action, prefix = '', ...rest] = words, text = rest.join(' ').trim();
  if (!/^[0-9a-f]{4,32}$/i.test(prefix) || (action === 'edit' && !text)) return failed(action === 'edit' ? 'Usage: /queue edit <id> <the new words> (the id’s first 8 characters, from /queue waiting)' : 'Usage: /queue remove <id> (the id’s first 8 characters, from /queue waiting)');
  const { web, person } = ports() || {};
  if (!web) return failed('The workbench is not running, so no message waits for Pi.');
  if (!person) return failed('Only the person’s own terminal can change the queue.');
  const base = `http://127.0.0.1:${web}`;
  let jobs;
  try { jobs = (await (await fetchImpl(base + '/api/workspace')).json()).jobs || []; } catch (error) { return failed(`The workbench did not answer: ${error.message}`); }
  const found = jobs.filter(job => job.status === 'queued' && String(job.id).startsWith(prefix.toLowerCase()));
  if (found.length > 1) return failed(`${prefix} starts more than one waiting message: type more of its id.`);
  const job = found[0];
  if (!job) return failed(`No waiting message ${prefix}. It may have started or been removed.`);
  if (action === 'edit' && !job.editable) return failed('Only a chat message can be edited; remove this request instead.');
  const go = action === 'edit' ? tr('Save') : tr('Remove Message'), cancel = tr('Cancel');
  const question = action === 'edit'
    ? `${tr('Save the edited message?')}\n\n${'Before'.padEnd(8)} ${quote(job.message)}\n${'After'.padEnd(8)} ${quote(text)}${job.files?.length ? `\n${'Files'.padEnd(8)} ${job.files.join(', ')} (kept)` : ''}`
    : `${tr('Remove this waiting message?')}\n\n${quote(job.message)}\n${tr('Pi will never receive it. Its attachments are released.')}`;
  const choice = ask ? await ask(question, action === 'edit' ? [go, cancel] : [cancel, go]) : cancel;  // a removal's default is Cancel
  if (choice !== go) return view(lines('○ Not changed.'));  // as the other console changes say it
  const response = await fetchImpl(`${base}/api/jobs/${job.id}/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Pi-Person': person }, body: JSON.stringify(action === 'edit' ? { version: job.version || 1, message: text } : { version: job.version || 1 }) });
  const answer = await response.json().catch(() => ({}));
  if (!response.ok) return failed(answer.error || `The workbench refused (${response.status}).`);
  return view(lines(action === 'edit' ? `✓ ${tr('Saved. Pi gets the edited message in the same place.')} ${quote(answer.message)}` : `✓ ${tr('Removed. Pi will never receive that message.')}`));
}
