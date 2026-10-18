// js/drag-list.mjs: pointer drag on the handle + keyboard + buttons, one save per move
export function dragList(list, {save, announce, label}) {           // label(li, pos, total) → "Move Hiragana, position 2 of 4"
  const rows = () => [...list.children];
  const done = (li) => { rows().forEach((r, i, all) => { r.querySelector('[data-handle]').setAttribute('aria-label', label(r, i + 1, all.length));
      r.querySelector('[data-move="-1"]')?.toggleAttribute('disabled', i === 0); r.querySelector('[data-move="1"]')?.toggleAttribute('disabled', i === all.length - 1); });
    announce(li); save(rows().map(r => r.dataset.id)); };
  const move = (li, d) => { const to = d < 0 ? li.previousElementSibling : li.nextElementSibling; if (!to) return;
    d < 0 ? to.before(li) : to.after(li); li.querySelector('[data-handle]').focus(); done(li); };
  list.addEventListener('click', e => { const b = e.target.closest('[data-move]'); if (b) move(b.closest('li'), +b.dataset.move); });
  list.addEventListener('keydown', e => { if (!e.altKey || !e.target.matches('[data-handle]')) return;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); move(e.target.closest('li'), e.key === 'ArrowUp' ? -1 : 1); } });
  list.addEventListener('pointerdown', e => {
    const h = e.target.closest('[data-handle]'); if (!h) return; const li = h.closest('li'); h.setPointerCapture(e.pointerId); li.dataset.dragging = '';
    const over = ev => { rows().forEach(r => delete r.dataset.over); const t = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('#' + list.id + ' > li');
      if (t && t !== li) { const r = t.getBoundingClientRect(); t.dataset.over = ev.clientY < r.top + r.height / 2 ? 'before' : 'after'; } };
    const up = ev => { h.removeEventListener('pointermove', over); const t = list.querySelector('[data-over]');
      if (t) { t.dataset.over === 'before' ? t.before(li) : t.after(li); delete t.dataset.over; done(li); } delete li.dataset.dragging; h.focus(); };
    h.addEventListener('pointermove', over); h.addEventListener('pointerup', up, {once: true});
  });
}
