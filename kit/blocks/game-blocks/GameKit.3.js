function openScreen(el) {                 // show one screen, remember focus, stop the world for menus
  for (const s of document.querySelectorAll('#ui > section')) s.hidden = s !== el;
  setInputPreventDefault(false);          // let keys reach the HTML buttons
  (el.querySelector('[autofocus]') || el.querySelector('button, [tabindex="0"]'))?.focus();
}
function closeScreen(el, back) { el.hidden = true; setInputPreventDefault(true); back?.focus(); }
function menuUpdate(input) {              // call from gameUpdate() while a menu is open, with inputUpdate()'s snapshot
  if (input.device !== 'gamepad') return; // keys and clicks already reach the focused HTML button
  const pad = (b) => gamepadWasPressed(b);
  const move = pad(12) || pad(14) ? -1 : pad(13) || pad(15) ? 1 : 0;   // d-pad: menus always move with it
  if (move) moveFocus(move);
  if (input.pressed.confirm) document.activeElement?.click();
  if (input.pressed.back) document.activeElement?.closest('section')?.dispatchEvent(new CustomEvent('game:back'));
}
function moveFocus(step) {
  const items = [...document.activeElement.closest('section').querySelectorAll('.game-btn:not(:disabled), .game-option, .game-slot, .game-card, [role=tab], .game-list > li[tabindex]')];
  const i = items.indexOf(document.activeElement);
  items[(i + step + items.length) % items.length]?.focus();
}
addEventListener('blur', () => { if (!paused) openPause(); });      // pausing on blur
document.addEventListener('visibilitychange', () => { if (document.hidden && !paused) openPause(); });
