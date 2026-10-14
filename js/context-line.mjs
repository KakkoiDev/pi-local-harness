// "Pi sees:" (ContextLine card, task 134): which files Pi gets with a request, before it is sent. The items come from
// GET /api/context-preview, the same selection the request itself uses (harness/context.py), so the line never
// promises a file Pi will not get. One line: items that do not fit are hidden from the end and counted in "+N".
const KIND = { plan: 'plan', 'this file': 'this file' }; // mentioned and related files need no word
const cache = new Map(); // query → {at, items}; threads re-render on every poll, the preview need not
const fresh = 3000;
// Refit when the room changes: the container is watched, not the line, and only a new width counts, so hiding items
// (which can change the line's own size) never sets off another fit.
const widths = new WeakMap();
const sized = new ResizeObserver(entries => entries.forEach(({ target, contentRect }) => {
  if (widths.get(target) === contentRect.width) return;
  widths.set(target, contentRect.width);
  target.querySelectorAll(':scope > .pw-context, :scope .pw-thread__actions > .pw-context').forEach(fit);
}));

function span(className, text) {
  const element = document.createElement('span');
  element.className = className;
  if (text) element.textContent = text;
  return element;
}

/** An empty line, shown once `showContext` has loaded it. */
export function contextLine(id) {
  const line = document.createElement('p');
  line.className = 'pw-context';
  if (id) line.id = id;
  line.hidden = true;
  return line;
}

/** Update `line` for a request: {project, text, document} or {project, path, comment}; debounced while typing.
 *  `force`: ask again even if the answer is fresh (the project changed: a new exchange in the chat).
 *  `rendered` runs after the line changed, for a container that measures itself (the phone composer). */
export function showContext(line, query, { delay = 300, rendered, force = false } = {}) {
  clearTimeout(line.contextTimer);
  if (rendered) line.contextRendered = rendered;
  if (!query.project) { line.hidden = true; delete line.dataset.query; line.contextRendered?.(); return; }
  const key = new URLSearchParams(Object.entries(query).filter(([, value]) => value)).toString();
  const hit = cache.get(key);
  if (hit && !force && Date.now() - hit.at < fresh) { if (line.dataset.query !== key || line.hidden) render(line, query.project, hit.items, key); return; }
  line.contextTimer = setTimeout(() => load(line, query.project, key), delay);
}

async function load(line, project, key) {
  line.dataset.loading = key;
  try {
    const response = await fetch('/api/context-preview?' + key);
    if (!response.ok) throw new Error(response.status);
    const { items } = await response.json();
    cache.set(key, { at: Date.now(), items });
    if (line.dataset.loading === key) render(line, project, items, key);
  } catch { /* the line keeps what it showed; the request itself still works */ }
}

function open(event) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.button) return; // a new tab, as for any link
  event.preventDefault();
  history.pushState({}, '', event.currentTarget.getAttribute('href'));
  dispatchEvent(new PopStateEvent('popstate')); // js/chat.mjs applies the route: Work with that file
}

/** "Also read:" after an answer (task 136): the files Pi opened itself beyond its context. Same links, no counter: it wraps. */
export function alsoReadLine(project, files) {
  const line = document.createElement('p');
  line.className = 'pw-context pw-context--after';
  line.setAttribute('data-expanded', '');
  const list = span('pw-context__list');
  list.setAttribute('role', 'list');
  for (const path of files) list.append(fileItem(project, { path, label: path.split('/').pop() }));
  line.append(span('pw-context__label', 'Also read:'), list);
  return line;
}

function fileItem(project, item) {
  const entry = span('pw-context__item');
  entry.setAttribute('role', 'listitem');
  if (item.path) {
    const link = document.createElement('a');
    link.href = `/p/${encodeURIComponent(project)}/work/` + item.path.split('/').map(encodeURIComponent).join('/');
    link.title = item.path;
    link.textContent = item.label;
    link.onclick = open;
    entry.append(link);
  } else entry.append(item.label); // "11 open tasks" is text
  if (KIND[item.kind]) entry.append(span('pw-context__kind', `(${KIND[item.kind]})`));
  return entry;
}

function render(line, project, items, key) {
  line.dataset.query = key;
  if (!items.length) { line.replaceChildren(span('pw-context__label', 'Pi sees: nothing from this project')); line.hidden = false; line.contextRendered?.(); return; }
  const list = span('pw-context__list');
  list.setAttribute('role', 'list');
  for (const item of items) list.append(fileItem(project, item));
  const more = document.createElement('button');
  more.type = 'button';
  more.className = 'pw-context__more';
  more.onclick = () => { line.toggleAttribute('data-expanded'); fit(line); };
  line.replaceChildren(span('pw-context__label', 'Pi sees:'), list, more);
  line.hidden = false;
  if (line.parentElement) sized.observe(line.parentElement);
  fit(line);
}

function fit(line) {
  const list = line.querySelector('.pw-context__list'), more = line.querySelector('.pw-context__more');
  if (!list || !more) return;
  const items = [...list.children];
  items.forEach(item => { item.hidden = false; });
  more.hidden = false;
  if (line.hasAttribute('data-expanded')) {
    more.textContent = 'Less'; more.setAttribute('aria-expanded', 'true'); more.setAttribute('aria-label', 'Show fewer');
    line.contextRendered?.();
    return;
  }
  more.textContent = '+' + items.length; // room for the widest counter while measuring
  let hidden = 0;
  while (list.scrollWidth > list.clientWidth && hidden < items.length - 1) items[items.length - 1 - hidden++].hidden = true;
  more.hidden = hidden === 0;
  more.textContent = '+' + hidden; more.setAttribute('aria-expanded', 'false'); more.setAttribute('aria-label', `Show ${hidden} more`);
  line.contextRendered?.(); // its height may have changed (the phone "+N" is taller than the line)
}
