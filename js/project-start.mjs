// Round 12, Project Start (plan 253; design/system/components/ProjectStart, boards R12_NP1–NP4, Ph12_NP2–NP4, R12_AddCap).
// New Project is four steps, Name → Capabilities → Packages → Summary: what the app does and how it runs are separate
// choices; suggestions from the person's sentence are marked, never checked; a capability that can't be chosen stays
// listed with its reason; Create assembles a tested base and creates nothing if one of its tests fails. Project › Add a
// Capability… adds one later, kept as one undoable request only if every test still passes. The catalogue, the
// suggestions, the checks and the tests are the workbench's code (kit/capabilities.py), never the model.
import { icon } from './ui.mjs';
import { followProgress, progressId } from './install-packages.mjs';

const STEPS = ['Name', 'Capabilities', 'Packages', 'Summary'];
const BASES = ['web', 'static', 'tui'];
const tilde = path => String(path || '').replace(/^\/(Users|home)\/[^/]+/, '~');
function el(tag, className, text) { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; }
function button(text, className = 'pw-btn') { const node = el('button', className, text); node.type = 'button'; return node; }
const list = names => names.length < 3 ? names.join(' and ') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** A warning line under a row (.pw-cap__warn), shown before choosing. */
function warnLine(text) { const line = el('span', 'pw-cap__warn'); line.append(icon('caution'), el('span', '', text)); return line; }

/** One capability or package row (label.pw-cap): a check, the name, one plain line, the meta line, warnings. */
function row({ id, name, small, meta = [], disabled = false, checked = false, suggested = false, warnings = [], type = 'checkbox', group = '' }) {
  const label = el('label', 'pw-cap'); label.dataset.id = id;
  const input = el('input', type === 'radio' ? 'pw-radio' : 'pw-check'); input.type = type; input.value = id; if (group) input.name = group;
  input.checked = checked && !disabled; input.disabled = disabled;
  if (disabled) label.setAttribute('aria-disabled', 'true');
  if (suggested) label.dataset.suggested = '';
  const parts = el('span', 'pw-cap__meta');
  if (suggested) parts.append(el('span', 'pw-cap__suggested', 'Suggested'));
  for (const part of meta) parts.append(el('span', '', part));
  label.append(input, el('span', 'pw-cap__name', name), el('small', '', small), parts, ...warnings.map(warnLine));
  return label;
}

export function installProjectStart({ api, workspace, project, showConversation, toast, closeMenu }) {
  let catalogue = null, step = 0, reached = 0, packagesTouched = false, creating = false;
  const choice = { name: '', parent: '', sentence: '', capabilities: new Set(), packages: new Set(), suggested: [] };
  const capability = id => catalogue.capabilities.find(item => item.id === id);
  const pack = id => catalogue.packages.find(item => item.id === id);

  // -- the dialog (built once; the boards' 860 × 760 desk dialog, a full-screen page per step on the phone) ------------
  const dialog = el('dialog', 'pw-dialog pw-start'); dialog.id = 'start-dialog'; dialog.setAttribute('aria-labelledby', 'start-title');
  const head = el('div', 'pw-start__head'), title = el('h2', 'pw-dialog__title', 'New Project'); title.id = 'start-title';
  head.append(title, el('span', 'pw-help', 'Choose what the app needs; Pi starts from a tested base and builds only what is new.'));
  const bar = el('div', 'pw-start__bar'), barCancel = button('Cancel', 'pw-btn pw-btn--plain pw-btn--touch'), barTitle = el('h2', 'pw-start__bar-title'), barCount = el('span', 'pw-help pw-start__count');
  bar.append(barCancel, barTitle, barCount);
  const steps = el('ol', 'pw-steps'); steps.setAttribute('aria-label', 'Steps'); steps.id = 'start-steps';
  STEPS.forEach((name, index) => { const item = el('li', '', `${index + 1} · ${name}`); item.onclick = () => { if (!creating && index < step) show(index); }; steps.append(item); });
  const body = el('div', 'pw-start__body'); body.id = 'start-body';
  const main = el('div', 'pw-start__main'); main.append(steps, body);
  const actions = el('div', 'pw-dialog__actions pw-start__actions');
  const back = button('Back'), status = el('span', 'pw-help pw-start__status'), cancel = button('Cancel'), next = button('Next', 'pw-btn pw-btn--default');
  back.id = 'start-back'; status.id = 'start-status'; status.setAttribute('aria-live', 'polite'); cancel.id = 'start-cancel'; next.id = 'start-next';
  actions.append(back, status, cancel, next);
  dialog.append(head, bar, main, actions); document.body.append(dialog);
  barCancel.onclick = cancel.onclick = () => { if (!creating) dialog.close(); };
  dialog.addEventListener('cancel', event => { if (creating) event.preventDefault(); });
  back.onclick = () => { if (step > 0 && !creating) show(step - 1); };
  next.onclick = () => step < 3 ? forward() : create();

  async function open() {
    closeMenu?.(); // not on top of the π sheet
    choice.name = ''; choice.sentence = ''; choice.capabilities.clear(); choice.packages.clear(); packagesTouched = false; reached = 0;
    status.textContent = '';
    try { catalogue = await api('/api/project-start'); }
    catch (error) { toast?.(error.message); return; }
    choice.parent = catalogue.locations[0] || '';
    dialog.showModal(); show(0);
  }

  function show(index) {
    step = index; reached = Math.max(reached, index);
    [...steps.children].forEach((item, position) => {
      if (position === index) item.setAttribute('aria-current', 'step'); else item.removeAttribute('aria-current');
      item.toggleAttribute('data-done', position < reached && position !== index || position < index);
    });
    barTitle.textContent = STEPS[index]; barCount.textContent = `${index + 1} of 4`;
    back.hidden = index === 0; cancel.hidden = index !== 0 && index !== 3;
    next.textContent = index === 3 ? 'Create' : 'Next'; next.disabled = false; status.textContent = '';
    body.replaceChildren(); body.scrollTop = 0;
    [nameStep, capabilitiesStep, packagesStep, summaryStep][index]();
  }

  async function forward() {
    if (step === 0) {
      choice.name = document.getElementById('start-name').value.trim(); choice.sentence = document.getElementById('start-sentence').value.trim();
      if (!choice.name) { status.textContent = 'Give the project a name.'; document.getElementById('start-name').focus(); return; }
      try { const found = await api('/api/project-start?text=' + encodeURIComponent(choice.sentence)); choice.suggested = found.suggested; }
      catch { choice.suggested = []; }
    }
    show(step + 1);
  }

  // -- 1 · Name ------------------------------------------------------------------------------------------------------
  function nameStep() {
    const name = el('label', 'pw-label pw-start__field', 'Name'), input = el('input', 'pw-field'); input.id = 'start-name'; input.maxLength = 80; input.autocomplete = 'off'; input.placeholder = 'e.g. Class Notes'; input.value = choice.name; name.append(input);
    const where = button('', 'pw-row pw-start__where'); where.id = 'start-where';
    const whereLabel = el('span', 'pw-start__where-label'); whereLabel.textContent = `Create in ${tilde(choice.parent)}`;
    where.append(whereLabel, el('span', '', '›')); where.lastChild.setAttribute('aria-hidden', 'true');
    /* Task 327: the folder is a slug (habit-tracker), the name stays as typed; the workbench says which folder it makes. */
    const folder = el('p', 'pw-help pw-start__folder'); folder.id = 'start-folder';
    let asked = 0;
    const showFolder = async () => {
      const mine = ++asked, typed = input.value.trim();
      if (!typed) { folder.textContent = ''; return; }
      try { const found = await api(`/api/project-start/folder?name=${encodeURIComponent(typed)}&parent=${encodeURIComponent(choice.parent)}`); if (mine === asked) folder.textContent = found.folder ? `Folder: ${tilde(found.folder)}` : ''; }
      catch { if (mine === asked) folder.textContent = ''; }
    };
    input.addEventListener('input', showFolder); showFolder();
    where.onclick = async () => { const picked = await workspace.pickFolder(choice.parent); if (picked) { choice.parent = picked; whereLabel.textContent = `Create in ${tilde(picked)}`; showFolder(); } };
    const sentence = el('label', 'pw-label pw-start__field', 'What is it, in a sentence? (optional)'), text = el('input', 'pw-field'); text.id = 'start-sentence'; text.maxLength = 300; text.placeholder = 'e.g. A notes app for my class, in Japanese and English.'; text.value = choice.sentence; sentence.append(text);
    const help = el('p', 'pw-help', 'The workbench reads the sentence to suggest capabilities in the next step; nothing is chosen for you.');
    const out = el('div', 'pw-start__way-out'), empty = button('Start from an empty folder instead', 'pw-btn'); empty.id = 'start-empty';
    empty.onclick = () => createEmpty(input.value.trim());
    out.append(empty, el('p', 'pw-help', 'Skips capabilities and packages: ROADMAP.md and tasks/001-first-task.md only, as before.'));
    for (const field of [input, text]) field.addEventListener('keydown', event => { if (event.key === 'Enter' && !event.isComposing) { event.preventDefault(); forward(); } });
    body.append(name, where, folder, sentence, help, out);
    setTimeout(() => input.focus());
  }

  // -- 2 · Capabilities ------------------------------------------------------------------------------------------------
  const carriers = id => (capability(id)?.supports || []).filter(base => BASES.includes(base));
  const packageNames = bases => list(bases.map(base => pack(base).name));
  /** Why a capability can't be added to the current choice, or warnings to show before choosing it. */
  function warningsFor(item) {
    const lines = [], chosen = [...choice.capabilities].filter(id => id !== item.id).map(capability).filter(Boolean);
    for (const other of chosen) {
      const text = item.warn_with?.[other.id] || other.warn_with?.[item.id];
      if (text) lines.push(`With ${other.name}: ${text.replace(/^With [^:]+:\s*/, '')}`);
      if (item.available && other.available && !carriers(item.id).some(base => carriers(other.id).includes(base)))
        lines.push(`Not with ${other.name}: no package carries both (${item.name}: ${packageNames(carriers(item.id))}; ${other.name}: ${packageNames(carriers(other.id))}).`);
    }
    if (choice.capabilities.has(item.id)) for (const need of item.needs || []) if (!choice.capabilities.has(need)) lines.push(`Needs ${capability(need).name}: choose it too.`);
    return lines;
  }
  function problems() {
    const chosen = [...choice.capabilities].map(capability);
    const common = BASES.filter(base => chosen.every(item => carriers(item.id).includes(base)));
    if (chosen.length && !common.length) return 'No package carries all of these: see the warnings.';
    const needs = chosen.flatMap(item => (item.needs || []).filter(need => !choice.capabilities.has(need)).map(need => `${item.name} needs ${capability(need).name}.`));
    return needs[0] || '';
  }
  const testsText = item => { const counts = [...new Set(Object.values(item.tests || {}))]; if (!counts.length) return ''; const low = Math.min(...counts), high = Math.max(...counts); return low === high ? plural(low, 'test') : `${low}–${high} tests`; };
  function capabilityMeta(item, reasonFirst) {
    if (!item.available) return [item.reason];
    if (reasonFirst) return [reasonFirst];
    const needs = (item.needs || []).map(need => capability(need).name);
    return [`Adds: ${[item.adds, testsText(item)].filter(Boolean).join(', ')}`, `Needs: ${needs.length ? list(needs) : item.needs_text || 'nothing'}`];
  }
  function capabilityGroups(container, rowFor) {
    for (const group of catalogue.groups) {
      const items = catalogue.capabilities.filter(item => item.group === group.id); if (!items.length) continue;
      const set = el('fieldset', 'pw-capgroup'); set.dataset.group = group.id; set.append(el('legend', '', group.name));
      for (const item of items) set.append(rowFor(item));
      container.append(set);
    }
  }
  function filterRows(container, words) {
    for (const label of container.querySelectorAll('.pw-cap')) label.hidden = Boolean(words) && !label.textContent.toLowerCase().includes(words);
    for (const set of container.querySelectorAll('.pw-capgroup')) set.hidden = ![...set.querySelectorAll('.pw-cap')].some(label => !label.hidden);
  }
  function search(container) {
    const field = el('label', 'pw-search'), input = el('input'); input.placeholder = 'Find a capability'; input.setAttribute('aria-label', 'Find a capability'); input.type = 'search';
    field.append(icon('search'), input);
    input.oninput = () => filterRows(container, input.value.trim().toLowerCase());
    return field;
  }
  function capabilitiesStep() {
    if (choice.suggested.length) {
      const notice = el('p', 'pw-notice'); notice.append(icon('note'), el('span', 'pw-notice__who', 'Suggested'), el('span', 'pw-notice__text', `From your sentence: ${list(choice.suggested.map(id => capability(id)?.name).filter(Boolean))}. Suggestions are marked, never pre-checked.`));
      body.append(notice);
    }
    const groups = el('div', 'pw-start__groups');
    const finder = search(groups);
    body.append(finder, groups);
    const render = () => {
      const scroll = body.scrollTop, focused = groups.contains(document.activeElement) ? document.activeElement.closest('.pw-cap')?.dataset.id : null; groups.replaceChildren();
      capabilityGroups(groups, item => {
        const label = row({ id: item.id, name: item.name, small: item.small, meta: capabilityMeta(item), disabled: !item.available, checked: choice.capabilities.has(item.id), suggested: choice.suggested.includes(item.id), warnings: item.available ? warningsFor(item) : [] });
        label.querySelector('input').onchange = event => { if (event.target.checked) choice.capabilities.add(item.id); else choice.capabilities.delete(item.id); render(); };
        return label;
      });
      filterRows(groups, finder.querySelector('input').value.trim().toLowerCase());
      if (focused) [...groups.querySelectorAll('.pw-cap')].find(row => row.dataset.id === focused)?.querySelector('input')?.focus({preventScroll:true});
      body.scrollTop = scroll;
      const problem = problems(); next.disabled = Boolean(problem);
      status.textContent = problem || (choice.capabilities.size ? `${choice.capabilities.size} chosen` : 'None chosen: the package’s base only');
    };
    render();
  }

  // -- 3 · Packages ----------------------------------------------------------------------------------------------------
  function packageState(item) {
    const chosen = [...choice.capabilities].map(capability), bases = item.on || [item.id];
    const cannot = chosen.filter(other => !bases.some(base => carriers(other.id).includes(base))).map(other => other.name);
    const carried = chosen.filter(other => bases.some(base => carriers(other.id).includes(base))).map(other => other.name);
    const otherBase = [...choice.packages].find(id => BASES.includes(id) && id !== item.id);
    let reason = '';
    if (cannot.length) reason = `Not with: ${cannot.join(', ')}`;
    else if (BASES.includes(item.id) && otherBase) reason = `Not available yet together with ${pack(otherBase).name}: one source for several packages needs the browser adapter (plan 253, task 277).`;
    else if (item.on && otherBase && !item.on.includes(otherBase)) reason = `Not with ${pack(otherBase).name}: a phone app installs a page.`;
    const meta = reason ? [reason] : [
      ...(item.includes || []).map(id => `From: ${capability(id).name}`),
      ...(carried.length ? [`Gets: ${carried.join(', ')}`] : []),
      ...(item.later ? [item.later] : []),
    ];
    return { disabled: Boolean(reason), meta };
  }
  function packagesStep() {
    body.append(el('p', 'pw-help', 'One app, one or more packages. Choose how it runs; the capabilities stay the same.'));
    const rows = el('div', 'pw-start__groups'); rows.id = 'start-packages'; body.append(rows);
    if (!packagesTouched) { const first = ['web', 'static', 'tui'].find(id => !packageState(pack(id)).disabled); choice.packages.clear(); if (first) choice.packages.add(first); }
    const render = () => {
      for (const id of [...choice.packages]) if (packageState(pack(id)).disabled) choice.packages.delete(id);
      rows.replaceChildren();
      for (const item of catalogue.packages) {
        const state = packageState(item);
        const label = row({ id: item.id, name: item.detail ? `${item.name} (${item.detail})` : item.name, small: item.says, meta: state.meta, disabled: state.disabled, checked: choice.packages.has(item.id) });
        label.querySelector('input').onchange = event => { packagesTouched = true; if (event.target.checked) choice.packages.add(item.id); else choice.packages.delete(item.id); render(); };
        rows.append(label);
      }
      next.disabled = !choice.packages.size;
      status.textContent = choice.packages.size ? `${plural(choice.packages.size, 'package')}` : 'Choose at least one package.';
    };
    render();
    body.append(el('p', 'pw-help', 'At least one package. A capability a package can’t carry is listed under it, so nothing is silently dropped.'));
  }

  // -- 4 · Summary and Create ------------------------------------------------------------------------------------------
  async function summaryStep() {
    next.disabled = true; status.textContent = 'Counting the base…';
    let plan;
    try { plan = await api('/api/project-start/plan', { name: choice.name, parent: choice.parent, packages: [...choice.packages], capabilities: [...choice.capabilities] }); }
    catch (error) { status.textContent = error.message; return; }
    if (step !== 3) return;
    const facts = el('dl', 'pw-facts'); facts.id = 'start-facts';
    const fact = (term, value) => { const dd = el('dd', '', value); facts.append(el('dt', '', term), dd); return dd; };
    fact('Name', choice.name).dataset.noTranslate = '';
    fact('Folder', tilde(plan.folder || `${choice.parent}/${choice.name}`)).dataset.noTranslate = '';
    fact('Capabilities', plan.capabilities.length ? plan.capabilities.map(id => capability(id).name + (plan.included[id] ? ` (from ${pack(plan.included[id]).name})` : '')).join(' · ') : 'None: the package’s base only');
    fact('Packages', plan.packages.map(id => pack(id).name).join(' · '));
    fact('The base', `${plural(plan.files, 'file')}, ${plural(plan.tests, 'test')} (checked when you press Create)`);
    if (plan.install) { const download = fact('Download', `${plan.install.line}. Pressing Create approves this download.`); download.id = 'start-download'; } /* task 331 */
    fact('Languages', 'English and Japanese, always');
    fact('Your first phase', 'Discussion: tell Pi what makes this app yours');
    body.append(facts, ...plan.warnings.map(warnLine), ...plan.problems.map(warnLine));
    const result = el('div', 'pw-start__result'); result.id = 'start-result'; body.append(result);
    body.append(el('p', 'pw-help', plan.install ? 'Create assembles the base, installs its packages, runs its tests, and makes the first commit. If a test fails, nothing is created and the failing capability is named; if the download fails, the project is still created and Project › Install Packages… installs them later.' : 'Create assembles the base, runs its tests, and makes the first commit. If a test fails, nothing is created and the failing capability is named.'));
    next.disabled = plan.problems.length > 0; status.textContent = plan.problems.length ? 'Change the choices above to create.' : '';
  }

  function busy(on, text = '') { creating = on; for (const control of [back, cancel, next, barCancel]) control.disabled = on; status.textContent = text; dialog.toggleAttribute('aria-busy', on); }
  async function opened(created) {
    dialog.close(); await workspace.refresh(); await workspace.projectCommand('open', created.project);
  }
  async function create() {
    busy(true, 'Assembling the base and running its tests…');
    const result = document.getElementById('start-result');
    /* task 331: the install's lines while it downloads, then the check */
    const id = progressId(), stop = followProgress(api, id, found => { if (creating) status.textContent = found.stage === 'install' ? `Installing the app’s packages… ${found.line}` : 'Running the base’s tests…'; });
    try {
      const created = await api('/api/projects/start', { name: choice.name, parent: choice.parent, packages: [...choice.packages], capabilities: [...choice.capabilities], sentence: choice.sentence, progress: id });
      stop();
      if (created.created) {
        busy(false); await opened(created);
        const installed = created.check.packages, base = `Created “${choice.name}”: all ${plural(created.check.tests, 'test')} of the base pass`;
        toast?.(!installed ? `${base}.` : installed.installed ? `${base}; ${plural(installed.count, 'package')} installed${installed.disk ? ` (${installed.disk})` : ''}.` : `${base}. Its packages were not installed (${installed.reason}): install them with Project › Install Packages….`);
        return;
      }
      busy(false, 'Nothing was created.');
      result.replaceChildren(warnLine(created.error));
      for (const failing of created.check.failing || []) result.append(el('p', 'pw-help pw-start__failing', `Failing test: ${failing.test} (${failing.file}), from ${failing.capability}.`));
      const output = el('pre', 'pw-start__output pw-mono', created.check.output || ''); output.setAttribute('aria-label', 'Test output'); result.append(output);
    } catch (error) { stop(); busy(false, error.message); }
  }
  async function createEmpty(name) {
    if (!name) { status.textContent = 'Give the project a name.'; document.getElementById('start-name').focus(); return; }
    busy(true, 'Creating the folder…');
    try { const created = await api('/api/projects/start', { empty: true, name, parent: choice.parent }); busy(false); await opened(created); }
    catch (error) { busy(false, error.message); }
  }

  // -- Project › Add a Capability… -------------------------------------------------------------------------------------
  const adding = el('dialog', 'pw-dialog pw-start pw-start--add'); adding.id = 'capability-dialog'; adding.setAttribute('aria-labelledby', 'capability-title');
  const addHead = el('div', 'pw-start__head'), addTitle = el('h2', 'pw-dialog__title', 'Add a Capability'); addTitle.id = 'capability-title'; addHead.append(addTitle);
  const addBar = el('div', 'pw-start__bar'), addBarCancel = button('Cancel', 'pw-btn pw-btn--plain pw-btn--touch'); addBar.append(addBarCancel, el('h2', 'pw-start__bar-title', 'Add a Capability'), el('span'));
  const addBody = el('div', 'pw-start__body'); addBody.id = 'capability-body';
  const addMain = el('div', 'pw-start__main'); addMain.append(addBody);
  const addActions = el('div', 'pw-dialog__actions pw-start__actions'), addStatus = el('span', 'pw-help pw-start__status'), addCancel = button('Cancel'), addGo = button('Add Capability', 'pw-btn pw-btn--default');
  addStatus.id = 'capability-status'; addStatus.setAttribute('aria-live', 'polite'); addGo.id = 'capability-add';
  addActions.append(addStatus, addCancel, addGo); adding.append(addHead, addBar, addMain, addActions); document.body.append(adding);
  let target = null, picked = null, working = false;
  addBarCancel.onclick = addCancel.onclick = () => { if (!working) adding.close(); };
  adding.addEventListener('cancel', event => { if (working) event.preventDefault(); });
  adding.addEventListener('close', () => addBody.replaceChildren());

  async function addCapability() {
    target = project(); if (!target) return;
    closeMenu?.();
    let found;
    try { found = await api('/api/project-start?project=' + encodeURIComponent(target)); } catch (error) { toast?.(error.message); return; }
    catalogue = found; picked = null; addGo.disabled = true; addStatus.textContent = '';
    const state = found.project, base = state.base, name = document.getElementById('project-title')?.textContent.trim() || '';
    addTitle.textContent = name ? `Add a capability to ${name}` : 'Add a Capability';
    addBody.replaceChildren();
    if (!base) addBody.append(warnLine('This project was not made from a package (an empty folder or an existing one): there is no base to add a capability to.'));
    const groups = el('div', 'pw-start__groups'), facts = el('dl', 'pw-facts'); facts.id = 'capability-facts';
    addBody.append(search(groups), groups, facts);
    capabilityGroups(groups, item => {
      const present = state.present.includes(item.id);
      const carried = base && (item.supports || []).includes(base);
      const reason = present ? 'Already in this project' : !item.available ? '' : !base ? 'Needs a project made from a package' : !carried ? `The ${pack(base).name} can't carry it: it runs in ${packageNames(carriers(item.id))}.` : '';
      const missing = (item.needs || []).filter(need => !state.present.includes(need)).map(need => capability(need).name);
      const label = row({ id: item.id, name: item.name, small: item.small, meta: capabilityMeta(item, reason || (missing.length && item.available ? `Needs ${list(missing)} first` : '')), disabled: !item.available || Boolean(reason) || missing.length > 0, type: 'radio', group: 'capability' });
      label.querySelector('input').onchange = () => choose(item);
      return label;
    });
    describe(facts, null);
    adding.showModal();
  }
  function describe(facts, preview) {
    facts.replaceChildren();
    const fact = (term, value) => facts.append(el('dt', '', term), el('dd', '', value));
    fact('What changes', preview ? `adds ${plural(preview.added.length, 'file')} · changes ${preview.changed.length} (${preview.changed.join(', ')}) · adds ${plural(preview.tests_added, 'test')}` : 'Choose a capability to see what it adds.');
    fact('Safety', 'every existing test must still pass; if one fails, nothing is kept');
    fact('Undo', 'it is one request: Undo This Request… takes it back');
  }
  async function choose(item) {
    picked = item; addGo.disabled = true; addStatus.textContent = '';
    try { describe(document.getElementById('capability-facts'), await api('/api/project-start/preview', { project: target, capability: item.id })); addGo.disabled = picked !== item; }
    catch (error) { addStatus.textContent = error.message; }
  }
  addGo.onclick = async () => {
    if (!picked) return;
    working = true; addGo.disabled = addCancel.disabled = addBarCancel.disabled = true; addStatus.textContent = `Adding ${picked.name} and running every test…`;
    try {
      const result = await api('/api/projects/capability', { project: target, capability: picked.id });
      if (result.added) { adding.close(); showConversation?.(result.conversation); return; }
      addStatus.textContent = result.message;
      const output = el('pre', 'pw-start__output pw-mono', result.check?.output || ''); output.setAttribute('aria-label', 'Test output');
      addBody.querySelector('.pw-start__output')?.remove(); addBody.append(output);
    } catch (error) { addStatus.textContent = error.data?.busy ? 'Pi is answering about this project. Try again when that request ends: nothing was changed.' : error.message; }
    finally { working = false; addCancel.disabled = addBarCancel.disabled = false; addGo.disabled = !picked; }
  };

  document.getElementById('new-project').onclick = open;
  return { open, addCapability };
}
