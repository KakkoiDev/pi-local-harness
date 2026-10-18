const CONFIRM = { keys: ['Enter', 'Space'], pad: 0 };   // pad 0 = south button
const BACK    = { keys: ['Escape', 'Backspace'], pad: 1 }; // pad 1 = east button
// d-pad: 12 up, 13 down, 14 left, 15 right; 9 = start (opens PauseMenu)
function openScreen(el) {                 // show one screen, remember focus, stop the world for menus
  for (const s of document.querySelectorAll('#ui > section')) s.hidden = s !== el;
  setInputPreventDefault(false);          // let keys reach the HTML buttons
  (el.querySelector('[autofocus]') || el.querySelector('button, [tabindex="0"]'))?.focus();
}
function closeScreen(el, back) { el.hidden = true; setInputPreventDefault(true); back?.focus(); }
function menuUpdate() {                   // call from gameUpdate() while a menu is open
  const pad = (b) => gamepadWasPressed(b);
  const move = pad(12) || pad(14) ? -1 : pad(13) || pad(15) ? 1 : 0;
  if (move) moveFocus(move);
  if (pad(CONFIRM.pad)) document.activeElement?.click();
  if (pad(BACK.pad)) document.activeElement?.closest('section')?.dispatchEvent(new CustomEvent('game:back'));
}
function moveFocus(step) {
  const items = [...document.activeElement.closest('section').querySelectorAll('.game-btn:not(:disabled), .game-option, .game-slot, .game-card, [role=tab], .game-list > li[tabindex]')];
  const i = items.indexOf(document.activeElement);
  items[(i + step + items.length) % items.length]?.focus();
}
addEventListener('blur', () => { if (!paused) openPause(); });      // pausing on blur
document.addEventListener('visibilitychange', () => { if (document.hidden && !paused) openPause(); });
