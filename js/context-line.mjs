// "Pi sees:" (ContextLine card, task 134): which files Pi gets with a request, before it is sent. The items come from
// GET /api/context-preview, the same selection the request itself uses (harness/context.py), so the line never
// promises a file Pi will not get. One line: items that do not fit are hidden from the end and counted in "+N".
const REASONS = {
 'Project rules':['rules','Always: the project’s rules'], Plan:['plan','Always: the plan'],
 'Task in progress':['task','Always: the task in progress'], 'Named in the request':['named',null],
 'Last harness commit':['changed','Last harness commit'], 'Relevant file name':['related','Relevant file name'],
 'Relevant contents':['related','Relevant contents'], 'Listed by the current task':['related','Listed by the current task'],
 'Linked from the current document':['related','Linked from the current document'], 'Current document':['this file','Current document'],
};
let closeReasons;
export function contextReason(item) {
 if(item.kind==='this file')return ['this file','Current document'];
 if(item.reason==='Pi opened it')return [item.reason,item.reason];
 const value=REASONS[item.reason] || [item.kind==='plan'?'plan':'related',item.reason || 'Related'];
 return [value[0],value[1] || `You named it: “${item.label}” in your message`];
}
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
  if (!query.project) { line.contextClose?.(); line.hidden = true; delete line.dataset.query; line.contextRendered?.(); return; }
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
  for (const path of files) list.append(fileItem(project, { path, label: path.split('/').pop(), reason:'Pi opened it' }));
  line.append(span('pw-context__label', 'Also read:'), list);
  return line;
}

function fileItem(project, item) {
  const entry = span('pw-context__item');
  entry.setAttribute('role', 'listitem');
  if (item.path) {
    const link = document.createElement('a');
    link.href = `/p/${encodeURIComponent(project)}/work/` + item.path.split('/').map(encodeURIComponent).join('/');
    link.title = item.full_path || item.path;
    link.textContent = item.label;link.dataset.noTranslate='';
    link.onclick = open;
    entry.append(link);
  } else entry.append(item.label); // "11 open tasks" is text
  const word=item.path?contextReason(item)[0]:'';
  if (word) entry.append(span('pw-context__kind', `(${word})`));
  return entry;
}

function render(line, project, items, key) {
  const signature=JSON.stringify(items);
  if(line.contextItems===signature && !line.hidden){line.dataset.query=key;return;}
  line.contextItems=signature;
  if(line.contextClose)line.contextClose();
  line.dataset.query = key;
  if (!items.length) { line.replaceChildren(span('pw-context__label', 'Pi sees: nothing from this project')); line.hidden = false; line.contextRendered?.(); return; }
  const list = span('pw-context__list');
  list.setAttribute('role', 'list');
  for (const item of items) list.append(fileItem(project, item));
  const more = document.createElement('button');
  more.type = 'button';
  more.className = 'pw-context__more';
  more.onclick = () => { line.toggleAttribute('data-expanded'); fit(line); };
  const why=document.createElement('button');why.type='button';why.className='pw-context__why';why.textContent='Why?';why.setAttribute('aria-expanded','false');why.setAttribute('aria-controls','ctx-why');
  why.onclick=()=>{if(why.getAttribute('aria-expanded')==='true')line.contextClose?.();else showReasons(line,why,project,items.filter(item=>item.path));};
  line.replaceChildren(span('pw-context__label', 'Pi sees:'), list, more, why);
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


// Round 11: the compact labels and this explanation use the same recorded selection, never a second selection.
function showReasons(line,button,project,items) {
 closeReasons?.();
 const phone=matchMedia('(max-width: 760px)').matches;
 const panel=document.createElement('section');panel.id='ctx-why';panel.className='pw-reasons';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Why Pi sees these files');panel.tabIndex=-1;
 const title=document.createElement('h3');title.textContent=`Why Pi sees these ${items.length} files`;
 const list=document.createElement('ol');
 for(const item of items){
  const row=document.createElement('li'),link=fileItem(project,item).querySelector('a');link.className='pw-link';
  const [word,sentence]=contextReason(item);row.append(link,span('pw-context__kind',word),span('pw-reasons__why',sentence),span('pw-reasons__path',item.full_path || item.path));list.append(row);
 }
 const note=document.createElement('p');note.className='pw-help';note.textContent='Chosen again for every message. Never vendor/, licences, build output or files over 40 KB.';
 panel.append(...(phone?[]:[title]),list,note);
 let host=panel;
 if(phone){
  host=document.createElement('dialog');host.className='pw-sheet';host.setAttribute('aria-label',`Pi sees these ${items.length} files`);host.style.margin='0';host.style.width='100%';host.style.maxWidth='none';host.style.boxSizing='border-box';host.style.top='auto';
  const head=document.createElement('div');head.className='pw-sheet__head';const heading=document.createElement('h2');heading.className='pw-dialog__title';heading.textContent=`Pi sees these ${items.length} files`;
  const done=document.createElement('button');done.type='button';done.className='pw-btn pw-btn--plain pw-btn--touch';done.textContent='Done';done.onclick=()=>close();head.append(heading,done);host.append(head,panel);
 }else{panel.setAttribute('popover','manual');panel.style.position='fixed';panel.style.margin='0';panel.style.maxWidth='calc(100vw - 24px)';}
 const events=new AbortController();
 const close=()=>{if(!host.isConnected)return;events.abort();host.remove();button.setAttribute('aria-expanded','false');line.contextClose=null;if(closeReasons===close)closeReasons=null;if(button.isConnected)button.focus();};
 closeReasons=close;line.contextClose=close;document.body.append(host);button.setAttribute('aria-expanded','true');
 if(phone){host.addEventListener('cancel',event=>{event.preventDefault();close();});host.addEventListener('close',close);host.showModal();}
 else{panel.addEventListener('toggle',event=>{if(event.newState==='closed')close();});panel.showPopover();const box=button.getBoundingClientRect();panel.style.left=Math.max(12,Math.min(box.right-panel.offsetWidth,innerWidth-panel.offsetWidth-12))+'px';panel.style.top=Math.max(12,box.top-panel.offsetHeight-8)+'px';}
 panel.querySelectorAll('.pw-reasons__path').forEach(path=>path.dataset.noTranslate='');
 document.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();close();}},{signal:events.signal});
 if(!phone)document.addEventListener('pointerdown',event=>{if(!panel.contains(event.target)&&!button.contains(event.target))close();},{signal:events.signal});
 panel.focus();
}
