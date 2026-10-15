// The page: reads the form, calls the logic, saves in the store, draws the list. Rules live in logic/, data in store.mjs.
import { checkTitle, newestFirst, notesFromBackup } from './logic/notes.mjs';
import { openStore } from './store.mjs';
import { choose, load, translate } from './i18n.mjs';

/**
 * @template {Element} T
 * @param {string} selector
 * @param {new () => T} type
 * @returns {T}
 */
const find = (selector, type) => {
  const element = document.querySelector(selector);
  if (!(element instanceof type)) throw new Error(`Missing ${selector}`);
  return element;
};

const form = find('#note-form', HTMLFormElement), input = find('#title', HTMLInputElement), error = find('#title-error', HTMLElement);
const list = find('#notes', HTMLUListElement), item = find('#note-item', HTMLTemplateElement);
const store = await openStore('notes');
const english = await load('en');
let language = choose(localStorage.getItem('lang'), navigator.languages);
let messages = language === 'en' ? english : await load(language);
/** @param {string} key */
const t = key => translate(messages, english, key);
/** @type {import('./logic/notes.mjs').Problem[]} */
let problems = [];  // kept, so a language switch translates the message on screen too

function showProblems() {
  error.hidden = !problems.length; error.textContent = problems.map(problem => t(problem.key)).join(' ');
  input.setAttribute('aria-invalid', String(Boolean(problems.length)));
}

function translatePage() {
  document.documentElement.lang = language;
  document.title = t('app.name');
  for (const element of document.querySelectorAll('[data-t]')) element.textContent = t(element.getAttribute('data-t') ?? '');
  showProblems();
}

async function draw() {
  list.replaceChildren(...newestFirst(await store.all()).map(note => {
    const row = /** @type {HTMLLIElement} */ (/** @type {DocumentFragment} */ (item.content.cloneNode(true)).firstElementChild);
    /** @type {HTMLSpanElement} */ (row.querySelector('span')).textContent = note.title;
    const remove = /** @type {HTMLButtonElement} */ (row.querySelector('button'));
    remove.textContent = t('notes.delete');
    remove.addEventListener('click', async () => { if (confirm(t('notes.confirm_delete'))) { await store.remove(note.id); await draw(); } });
    return row;
  }));
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  const checked = checkTitle(input.value);
  problems = checked.problems; showProblems();
  if (problems.length) return;
  const title = checked.title;
  await store.put({ id: crypto.randomUUID(), title, created: new Date().toISOString() });
  form.reset(); await draw();
});

for (const button of document.querySelectorAll('[data-lang]')) {
  button.addEventListener('click', async () => {
    language = button.getAttribute('data-lang') ?? 'en'; localStorage.setItem('lang', language);
    messages = language === 'en' ? english : await load(language);
    translatePage(); await draw();
  });
}

find('#export', HTMLButtonElement).addEventListener('click', async () => {
  const file = new Blob([JSON.stringify({ notes: await store.all() }, null, 1)], { type: 'application/json' });
  const link = Object.assign(document.createElement('a'), { href: URL.createObjectURL(file), download: 'notes-backup.json' });
  link.click(); URL.revokeObjectURL(link.href);
});

const restore = find('#import', HTMLInputElement);
restore.addEventListener('change', async () => {
  const file = restore.files?.[0];
  if (!file) return;
  for (const note of notesFromBackup(JSON.parse(await file.text()))) await store.put(note);
  restore.value = ''; await draw();
});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
translatePage(); await draw();
