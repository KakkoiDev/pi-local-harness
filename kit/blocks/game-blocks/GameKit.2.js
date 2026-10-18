// Actions: gaming-core's own (moveX/moveY axes, jump, fire, confirm, back, pause) plus the genre's, declared once here.
// Every genre card lists its actions; the primary action is always `fire` (its label says Attack, Shoot or Use).
const GAME_ID = document.documentElement.dataset.gameId || 'meadow-quest';
const GAME_ACTIONS = {
  interact: ['key:KeyE', 'pad:3'],                  // genre additions: [binding strings]
  map:      ['key:KeyM', 'pad:8'],
};
function inputInit() {                              // call from gameInit()
  gcInput.init({ storageKey: GAME_ID + '.input', padStyle: 'position', fixed: ['pause', 'back'], actions: GAME_ACTIONS });
}

// keyboard | mouse | gamepad from gaming-core; touch from pointer events (LittleJS reports a tap as the mouse)
const gameBox = document.getElementById('game');
let touching = false;
addEventListener('pointerdown', (e) => { touching = e.pointerType === 'touch'; if (touching) gameBox.dataset.device = 'touch'; }, true);
function inputUpdate() {                            // call first in gameUpdate(); returns gaming-core's snapshot
  const input = gcInput.update();
  if (!(touching && input.device === 'mouse')) gameBox.dataset.device = input.device;
  if (input.device !== 'mouse') touching = false;
  const t = touchState.pressed;                     // TouchControls: its buttons press the same actions
  for (const name in t) { input.pressed[name] ||= t[name]; input.held[name] ||= touchState.held[name]; }
  if (touchState.move) { input.moveX ||= touchState.move.x; input.moveY ||= touchState.move.y; }
  touchState.pressed = {};
  return input;
}
const touchState = { pressed: {}, held: {}, move: null };   // filled by TouchControls' pointer handlers

// The prompt for an action on the device in use, as HTML, in the page's language (t = the game's text lookup)
const PAD = ['south', 'east', 'west', 'north', 'left_shoulder', 'right_shoulder', 'left_trigger', 'right_trigger',
  'select', 'start', 'left_stick', 'right_stick', 'dpad_up', 'dpad_down', 'dpad_left', 'dpad_right', 'home'];
function promptHTML(action, device = gameBox.dataset.device) {
  const binding = gcInput.binding(action, device === 'touch' ? 'mouse' : device);  // 'key:Space' | 'mouse:0' | 'pad:0' | ''
  const [kind, code] = binding.split(':');
  if (kind === 'pad') {
    const pos = PAD[+code];
    return +code < 4
      ? `<span class="game-padpos" data-pos="${pos}" aria-label="${t('game.pad.' + pos)}"></span>`
      : `<span class="game-padkey">${t('game.pad.' + pos + '.short')}</span>`;
  }
  if (kind === 'mouse') return `<span class="game-mouse" data-button="${['left', 'middle', 'right'][+code] || 'left'}" aria-label="${t('game.mouse.' + (['left', 'middle', 'right'][+code] || 'left'))}"></span>`;
  if (kind === 'key') return `<span class="game-key">${gcInputCore.label(binding)}</span>`;
  return '';
}
