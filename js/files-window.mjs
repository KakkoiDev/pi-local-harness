// The Files window body: Plan (ROADMAP.md, tasks/) above Files (everything else), as
// design/system/components/ListGroup and ListRow describe. Display only: nothing moves on disk.
import { icon, readState, writeState } from './ui.mjs';

const isTask = name => /^tasks\/[^/]+\.md$/.test(name);
const isPlan = name => name === 'ROADMAP.md' || isTask(name);
const stem = name => name.split('/').pop().replace(/\.md$/, '');
const finished = file => file.total > 0 && file.done === file.total;
const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

export function planSummary(files) {
  const tasks = files.filter(file => isTask(file.name));
  const open = tasks.filter(file => !finished(file)).length;
  const hasPlan = tasks.length || files.some(file => file.name === 'ROADMAP.md');
  const top = new Set(files.filter(file => !isPlan(file.name)).map(file => file.name.split('/')[0]));
  const folders = [...top].filter(name => files.some(file => file.name.startsWith(name + '/') && !isPlan(file.name))).length;
  return [hasPlan ? plural(open, 'open task') : 'No plan yet', plural(folders, 'folder'), plural(top.size - folders, 'file')].join(' · ');
}

export function installFilesWindow({ tree, note, seg, add, node, open, newTask, newFile, createRoadmap, selected = () => {} }) {
  // A folder row can be selected (click), so File › Rename or Move… and Move to Trash… can act on it (task 146): select, then command.
  let selectedFolder = null;
  let project = null, files = [], current = null, query = '', focusKey = null, segment = 'plan';
  const expanded = new Set();
  // Round 8 (Ph8_Folder): on the phone a tapped folder opens as its own level (‹ Files · name · ⋯), never inline.
  let phoneFolder = null; const small = () => matchMedia('(max-width:760px)').matches;
  const folderPathOf = prefix => { const file = files.find(item => item.name.startsWith(prefix)); return file ? file.path.slice(0, file.path.length - (file.name.length - prefix.length) - 1) : null; };
  const groups = () => ({ plan: true, files: true, done: false, ...(readState('fileGroups', {})[project] || {}) });
  const setGroup = (name, value) => { const all = readState('fileGroups', {}); all[project] = { ...groups(), [name]: value }; writeState('fileGroups', all); render(); };

  function row({ key, label, meta, glyph, depth = 0, kind = 'file', expandedState, onClick, title, current: isCurrent }) {
    const item = node('button', 'pw-row' + (kind === 'file' ? ' file-item' : '') + (kind === 'summary' ? ' pw-row--summary' : '') + (depth ? ' pw-row--nested' : ''));
    item.type = 'button'; item.dataset.key = key; item.tabIndex = -1;
    if (depth > 1) item.style.paddingLeft = 8 + depth * 28 + 'px';
    if (expandedState !== undefined) { item.setAttribute('aria-expanded', String(expandedState)); item.append(icon(expandedState ? 'disclosure-open' : 'disclosure-closed', { size: 12 })); }
    if (kind !== 'summary') item.append(icon(kind === 'folder' ? 'folder' : 'file'));
    item.append(node('span', 'pw-row__label', label));
    // The meta is read as the row's description, so the row's name stays the file name (tests and screen readers).
    if (meta || glyph) { const value = node('span', 'pw-row__meta'); value.setAttribute('aria-hidden', 'true'); if (glyph) value.append(icon(glyph, { size: 12 })); if (meta) value.append(meta); item.append(value); item.setAttribute('aria-description', meta); }
    if (title) item.title = title;
    item.setAttribute('aria-current', isCurrent === true ? 'page' : isCurrent || 'false');
    item.onclick = onClick; return item;
  }
  const fileRow = (file, label, depth = 0) => {
    const meta = isPlan(file.name) ? (file.blocked ? 'Blocked' : file.total ? `${file.done}/${file.total}` : '') : '';
    return row({ key: 'f:' + file.path, label, depth, meta, glyph: file.blocked && isPlan(file.name) ? 'caution' : null, title: file.name, current: !selectedFolder && file.path === current, onClick: () => { selectedFolder = null; selected(); open(file.path); render(); } });
  };

  function group(name, title, count, actionLabel, action, children, isOpen) {
    const section = node('section', 'pw-group'); section.dataset.group = name;
    const head = node('div', 'pw-group__head'), heading = node('h3', 'pw-group__title'), toggle = node('button', 'pw-group__toggle'), body = node('div', 'pw-group__body');
    body.id = 'files-' + name; /* rows are buttons: no list role without listitems */ toggle.type = 'button'; toggle.tabIndex = -1; toggle.dataset.key = 'g:' + name;
    toggle.setAttribute('aria-expanded', String(isOpen)); toggle.setAttribute('aria-controls', body.id);
    toggle.append(icon(isOpen ? 'disclosure-open' : 'disclosure-closed', { size: 10 }), title, node('span', 'pw-group__count', count));
    toggle.onclick = () => { if (!query) setGroup(name, !isOpen); };
    heading.append(toggle);
    const plus = node('button', 'pw-group__action'); plus.type = 'button'; plus.setAttribute('aria-label', actionLabel); plus.append(icon('plus', { size: 12 })); plus.onclick = action;
    head.append(heading, plus); body.append(...children); body.hidden = !isOpen; section.append(head, body); return section;
  }

  const folderPath = ({ file, rest }) => file.path.slice(0, -rest.length - 1);
  function folderRows(entries, depth) {
    const folders = new Map(), leaves = [];
    for (const { file, rest } of entries) {
      const at = rest.indexOf('/');
      if (at < 0) leaves.push(file); else { const name = rest.slice(0, at); if (!folders.has(name)) folders.set(name, []); folders.get(name).push({ file, rest: rest.slice(at + 1) }); }
    }
    const result = [];
    for (const [name, children] of [...folders].sort(([a], [b]) => a.localeCompare(b))) {
      const prefix = children[0].file.name.slice(0, children[0].file.name.length - children[0].rest.length);
      const isOpen = expanded.has(prefix);
      result.push(row({ key: 'd:' + prefix, label: name, kind: 'folder', depth, expandedState: isOpen, current: selectedFolder === folderPath(children[0]) ? 'true' : false, onClick: () => { if (small()) { phoneFolder = prefix; selectedFolder = folderPath(children[0]); render(); selected(); return; } if (isOpen) expanded.delete(prefix); else expanded.add(prefix); selectedFolder = folderPath(children[0]); selected(); render(); } }));
      if (isOpen) result.push(...folderRows(children, depth + 1));
    }
    for (const file of leaves.sort((a, b) => a.name.split('/').pop().localeCompare(b.name.split('/').pop()))) result.push(fileRow(file, file.name.split('/').pop(), depth));
    return result;
  }

  function render() {
    const focused = tree.contains(document.activeElement) ? document.activeElement.dataset.key : null;
    if (focused) focusKey = focused;
    const state = groups(), roadmap = files.find(file => file.name === 'ROADMAP.md');
    const tasks = files.filter(file => isTask(file.name)).sort((a, b) => b.name.localeCompare(a.name));
    const openTasks = tasks.filter(file => !finished(file)), doneTasks = tasks.filter(finished);
    const others = files.filter(file => !isPlan(file.name));
    tree.replaceChildren(); note.hidden = true;
    if (query) {
      const q = query.toLocaleLowerCase(), plan = [roadmap, ...tasks].filter(file => file && (file.name === 'ROADMAP.md' ? 'roadmap.md' : stem(file.name)).toLocaleLowerCase().includes(q));
      const rest = others.filter(file => file.name.toLocaleLowerCase().includes(q));
      if (plan.length) tree.append(group('plan', 'Plan', String(plan.length), 'New Task…', newTask, plan.map(file => fileRow(file, file.name === 'ROADMAP.md' ? file.name : stem(file.name))), true));
      if (rest.length) tree.append(group('files', 'Files', String(rest.length), 'New File…', newFile, rest.map(file => fileRow(file, file.name)), true));
      const total = plan.length + rest.length;
      if (!total) tree.append(node('p', 'list-empty pw-empty', 'No matching files'));
      note.textContent = `${total} ${total === 1 ? 'match' : 'matches'} for “${query}” in both groups. Esc clears.`; note.hidden = false;
    } else {
      const planRows = [];
      if (roadmap) planRows.push(fileRow(roadmap, 'ROADMAP.md'));
      planRows.push(...openTasks.map(file => fileRow(file, stem(file.name))));
      if (doneTasks.length) {
        planRows.push(row({ key: 's:done', label: 'Done', kind: 'summary', expandedState: state.done, meta: plural(doneTasks.length, 'task'), glyph: 'done', onClick: () => setGroup('done', !state.done) }));
        if (state.done) planRows.push(...doneTasks.map(file => fileRow(file, stem(file.name), 1)));
      }
      if (!roadmap && !tasks.length) {
        const empty = node('div', 'pw-group__empty'), create = node('button', 'pw-btn', 'Create Roadmap');
        create.type = 'button'; create.onclick = createRoadmap;
        empty.append(node('span', '', 'No roadmap or tasks in this folder.'), create, node('span', 'pw-help', 'Adds ROADMAP.md and tasks/001-first-task.md. Nothing else changes.'));
        planRows.push(empty);
      }
      if (phoneFolder && small()) {
        const inside = others.filter(file => file.name.startsWith(phoneFolder));
        if (inside.length) { tree.dataset.folder = phoneFolder; seg.hidden = true; tree.append(...folderRows(inside.map(file => ({ file, rest: file.name.slice(phoneFolder.length) })), 0)); const first = visible()[0]; if (first) first.tabIndex = 0; return; }
        phoneFolder = null;
      }
      delete tree.dataset.folder; seg.hidden = false;
      const top = new Set(others.map(file => file.name.split('/')[0]));
      const fileRows = others.length ? folderRows(others.map(file => ({ file, rest: file.name })), 0) : [node('p', 'pw-group__empty', 'No other files yet.')];
      tree.append(group('plan', 'Plan', openTasks.length + ' open', 'New Task…', newTask, planRows, state.plan),
        group('files', 'Files', String(top.size), 'New File…', newFile, fileRows, state.files));
    }
    segments(query ? { plan: tree.querySelector('[data-group="plan"] .pw-group__body')?.childElementCount || 0, files: tree.querySelector('[data-group="files"] .pw-group__body')?.childElementCount || 0 }
      : { plan: openTasks.length + ' open', files: new Set(others.map(file => file.name.split('/')[0])).size });
    // One roving tab stop across toggles and rows (ListGroup § Behaviour).
    const items = visible(), target = items.find(item => item.dataset.key === focusKey) || items.find(item => item.getAttribute('aria-current') === 'page') || items[0];
    if (target) { target.tabIndex = 0; if (focused) target.focus(); }
  }
  // Phone (ListGroup § Phone): the groups become two segments; the + beside them acts on the chosen one.
  function segments(counts) {
    tree.dataset.segment = segment;
    seg.replaceChildren(...['plan', 'files'].map(name => {
      const item = node('button', '', `${name === 'plan' ? 'Plan' : 'Files'} · ${counts[name]}`); item.type = 'button'; item.setAttribute('role', 'radio');
      item.setAttribute('aria-checked', String(segment === name)); item.tabIndex = segment === name ? 0 : -1;
      item.onclick = () => { segment = name; render(); seg.querySelector('[aria-checked="true"]')?.focus(); }; return item;
    }));
    // Arrow keys move between the two segments (radio group), as segmentFor does elsewhere.
    seg.onkeydown = event => { if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return; event.preventDefault(); segment = segment === 'plan' ? 'files' : 'plan'; render(); seg.querySelector('[aria-checked="true"]')?.focus(); };
    add.setAttribute('aria-label', segment === 'plan' ? 'New Task…' : 'New File…'); add.onclick = segment === 'plan' ? newTask : newFile;
  }
  const visible = () => [...tree.querySelectorAll('.pw-group__toggle,.pw-row')].filter(item => !item.closest('[hidden]'));

  tree.addEventListener('keydown', event => {
    const items = visible(), index = items.indexOf(document.activeElement);
    if (index < 0) return;
    const item = items[index], move = next => { if (!next) return; event.preventDefault(); item.tabIndex = -1; next.tabIndex = 0; focusKey = next.dataset.key; next.focus(); };
    const isOpen = item.getAttribute('aria-expanded') === 'true', collapsible = item.hasAttribute('aria-expanded');
    if (event.key === 'ArrowDown') move(items[index + 1]);
    else if (event.key === 'ArrowUp') move(items[index - 1]);
    else if (event.key === 'Home') move(items[0]);
    else if (event.key === 'End') move(items.at(-1));
    else if (event.key === 'ArrowRight' && collapsible) { event.preventDefault(); if (isOpen) move(items[index + 1]); else { focusKey = item.dataset.key; item.click(); visible().find(next => next.dataset.key === focusKey)?.focus(); } }
    else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      if (collapsible && isOpen) { focusKey = item.dataset.key; item.click(); visible().find(next => next.dataset.key === focusKey)?.focus(); return; }
      const parent = item.closest('.pw-group').querySelector('.pw-group__toggle');
      const before = items.slice(0, index).reverse().find(other => other.hasAttribute('aria-expanded') && other.classList.contains('pw-row') && (other.classList.contains('pw-row--nested') ? 1 : 0) < (item.classList.contains('pw-row--nested') ? 1 : 0));
      move(before || (item === parent ? null : parent));
    }
  });

  return {
    update(next) {
      const opened = next.current !== undefined && next.current !== current;
      if (opened || (next.project !== undefined && next.project !== project) || (selectedFolder && next.files && !next.files.some(file => file.path.startsWith(selectedFolder + '/')))) selectedFolder = null;
      if (next.project !== undefined && next.project !== project) { expanded.clear(); phoneFolder = null; }
      ({ project, files, current } = { project, files, current, ...next });
      // Folders start collapsed, except the ones holding the file just opened (ListRow README).
      if (opened && current) { const parts = current.split('/').slice(2, -1); parts.forEach((_, at) => expanded.add(parts.slice(0, at + 1).join('/') + '/')); }
      render();
    },
    search(value) { query = value.trim(); render(); },
    summary: () => planSummary(files),
    openFolder: () => (phoneFolder && small() ? phoneFolder.slice(0, -1) : ''),
    closeFolder() { const parts = phoneFolder ? phoneFolder.slice(0, -1).split('/') : []; parts.pop(); phoneFolder = parts.length ? parts.join('/') + '/' : null; selectedFolder = phoneFolder ? folderPathOf(phoneFolder) : null; render(); selected(); },
    selectOpenFolder() { if (phoneFolder) { selectedFolder = folderPathOf(phoneFolder); selected(); } },
    selection: () => selectedFolder ? { path: selectedFolder, folder: true } : current ? { path: current, folder: false } : null,
  };
}
