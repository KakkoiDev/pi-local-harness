// stick: the first touch that starts in the left half; value -1..1 on each axis, 12 px dead zone
const stick = document.getElementById('stick'); let id = null, origin = null; const touchMove = vec2();
stick.addEventListener('pointerdown', e => { id = e.pointerId; origin = [e.clientX, e.clientY]; stick.setPointerCapture(id); });
stick.addEventListener('pointermove', e => { if (e.pointerId !== id) return;
  const dx = e.clientX - origin[0], dy = e.clientY - origin[1], d = Math.hypot(dx, dy);
  touchMove.set(d < 12 ? 0 : clamp(dx / 48, -1, 1), d < 12 ? 0 : clamp(-dy / 48, -1, 1)); });
stick.addEventListener('pointerup', () => { id = null; touchMove.set(0, 0); });
document.querySelectorAll('.game-touchbtn[data-action]').forEach(b => {
  b.addEventListener('pointerdown', () => press(b.dataset.action, true));
  b.addEventListener('pointerup', () => press(b.dataset.action, false)); });
