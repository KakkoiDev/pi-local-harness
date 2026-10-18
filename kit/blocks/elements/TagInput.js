// js/tag-input.mjs
export function tagInput(root, {max = 10, maxLength = 30} = {}) {
  const input = root.querySelector('input[role="combobox"]');
  const list = root.querySelector('ul');
  const have = () => [...list.querySelectorAll('input[name="tags"]')].map(i => i.value);
  function add(raw) {
    const tag = raw.trim().replace(/\s+/g, ' ').toLowerCase().slice(0, maxLength);
    if (!tag || have().includes(tag) || have().length >= max) return false;
    const li = root.parentElement.querySelector('template').content.firstElementChild.cloneNode(true);
    li.querySelector('span').textContent = tag;
    li.querySelector('button').dataset.tag = tag;
    li.querySelector('button').setAttribute('aria-label', `${t('tags.remove').replace('{tag}', tag)}`); // t(): the app's translate
    li.querySelector('input').value = tag;
    list.append(li); return true;
  }
  input.addEventListener('keydown', e => {
    if (e.isComposing) return;                        // Japanese IME: wait for the composition to end
    if (e.key === 'Enter' || e.key === ',' || e.key === '、') { e.preventDefault(); if (add(input.value)) input.value = ''; }
    if (e.key === 'Backspace' && !input.value) list.lastElementChild?.remove();
  });
  list.addEventListener('click', e => { const b = e.target.closest('button[data-tag]'); if (b) { b.closest('li').remove(); input.focus(); } });
}
