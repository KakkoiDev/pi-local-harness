// Task 327 (finding 4, journey J02): a refusal shown where the person acted. A refused model switch ("Pi is working.
// Switch models when the queue is empty.") was a toast at the bottom of the window, 822 px below the model menu. It is now
// a small note under the menu bar item that was used: the Toast's 1-bit look (.pw-toast), role="status", gone after a few
// seconds, on the next click or on Escape. No drawing yet: design/briefs/round-13.md has the note for the designer.
let shown = null, timer = 0;

function hide() {
  clearTimeout(timer); shown?.remove(); shown = null;
  document.removeEventListener('pointerdown', hide, true); document.removeEventListener('keydown', escape, true);
}
function escape(event) { if (event.key === 'Escape') hide(); }

/** Shows `text` just under `anchor`, right-aligned with it and kept inside the window; returns the note. */
export function noteNear(anchor, text, { ms = 6000 } = {}) {
  hide();
  const note = document.createElement('div'); note.className = 'pw-toast pw-near-note'; note.id = 'near-note';
  note.setAttribute('role', 'status'); note.append(Object.assign(document.createElement('span'), { textContent: text }));
  document.body.append(note);
  const box = anchor.getBoundingClientRect(), width = note.offsetWidth, gap = 8;
  note.style.top = `${Math.round(box.bottom + 4)}px`;
  note.style.left = `${Math.round(Math.max(gap, Math.min(box.right - width, window.innerWidth - width - gap)))}px`;
  shown = note; timer = setTimeout(hide, ms);
  setTimeout(() => { if (shown === note) { document.addEventListener('pointerdown', hide, true); document.addEventListener('keydown', escape, true); } });
  return note;
}
