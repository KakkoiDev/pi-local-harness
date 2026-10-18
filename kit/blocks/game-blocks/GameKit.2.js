// keyboard | mouse | gamepad | touch; LittleJS tracks the first three, touch comes from pointer events
const gameBox = document.getElementById('game');
let device = 'keyboard';
function setDevice(next) {
  if (next === device) return;
  device = next;
  gameBox.dataset.device = next;
}
addEventListener('pointerdown', e => setDevice(e.pointerType === 'touch' ? 'touch' : 'mouse'), true);
addEventListener('keydown', () => setDevice('keyboard'), true);
function inputUpdatePost() {            // call from gameUpdatePost()
  if (device === 'touch' && lastInputDevice === 'mouse') return; // a tap also moves the "mouse"
  setDevice(lastInputDevice);           // 'mouse' | 'keyboard' | 'gamepad' from LittleJS
}
