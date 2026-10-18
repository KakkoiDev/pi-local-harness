// autosave: 800 ms after the last keystroke, and on blur and page hide
let timer;
editor.addEventListener('input', () => { setSaved('unsaved'); clearTimeout(timer); timer = setTimeout(save, 800); });
addEventListener('pagehide', save);
async function save() {
  setSaved('saving');
  try { await store.saveNote(note); setSaved('saved', new Date()); }
  catch { setSaved(navigator.onLine ? 'failed' : 'local'); }
}
