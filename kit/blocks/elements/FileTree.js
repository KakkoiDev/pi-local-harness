// js/tree.mjs: arrow keys for role="tree" (folders open/close, files open on Return)
export function tree(root) {
  const items = () => [...root.querySelectorAll('[role="treeitem"]')].filter(i => !i.closest('ul[hidden]'));
  const focus = el => { root.querySelector('[tabindex="0"]')?.setAttribute('tabindex', '-1'); el.setAttribute('tabindex', '0'); el.focus(); };
  const toggle = (el, open) => { if (!el.hasAttribute('aria-expanded')) return; el.setAttribute('aria-expanded', String(open)); el.querySelector(':scope > ul').hidden = !open; };
  root.addEventListener('click', e => {               // a folder's row toggles it; file links navigate as links
    const row = e.target.closest('[role="treeitem"][aria-expanded] > span');
    if (row) { const it = row.parentElement; toggle(it, it.getAttribute('aria-expanded') !== 'true'); focus(it); }
  });
  root.addEventListener('keydown', e => {
    const list = items(), it = document.activeElement, i = list.indexOf(it), open = it.getAttribute('aria-expanded');
    const k = { ArrowDown: () => list[i + 1] && focus(list[i + 1]), ArrowUp: () => list[i - 1] && focus(list[i - 1]),
      ArrowRight: () => open === 'false' ? toggle(it, true) : open === 'true' && focus(list[i + 1]),
      ArrowLeft: () => open === 'true' ? toggle(it, false) : it.parentElement.closest('[role="treeitem"]') && focus(it.parentElement.closest('[role="treeitem"]')),
      Home: () => focus(list[0]), End: () => focus(list.at(-1)),
      Enter: () => open ? toggle(it, open !== 'true') : it.querySelector('a')?.click() }[e.key];
    if (k) { e.preventDefault(); k(); }
  });
}
