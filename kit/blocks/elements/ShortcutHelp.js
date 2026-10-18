// js/shortcuts.mjs: one table binds the keys and fills the dialog
export const SHORTCUTS = [
  {group: 'general', key: 'k', mod: true, label: 'keys.search', run: () => openPalette()},
  {group: 'general', key: '?', label: 'keys.help', run: () => document.getElementById('shortcuts').showModal()},
  {group: 'notes', key: 'n', label: 'keys.new_note', run: () => newNote()},
];
const typing = e => e.target.closest('input, textarea, select, [contenteditable="true"]');
document.addEventListener('keydown', e => {
  if (e.isComposing || (typing(e) && !(e.metaKey || e.ctrlKey))) return;   // single keys never fire while typing or composing Japanese
  const s = SHORTCUTS.find(s => s.key === e.key.toLowerCase() && !!s.mod === (e.metaKey || e.ctrlKey));
  if (s) { e.preventDefault(); s.run(); }
});
