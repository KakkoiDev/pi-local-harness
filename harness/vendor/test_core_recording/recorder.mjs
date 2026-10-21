/** Small in-app Recorder-format capture primitive; hosts own injection, storage and consent.
 * No DOM text, field values, IDs, labels, URL paths or error messages are transmitted.
 * Structural selectors intentionally trade resilience for privacy. No network is used
 * except the host-provided post callback. Raw typed text is never retained for export.
 */
const SECRET = /pass(word|wd|code)?|token|secret|api[-_ ]?key|otp|one-time/i;
const KEYS = new Set(['Enter', 'Escape', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown']);

export function isSecret(element) {
  return element?.type === 'password' || /password|one-time-code/i.test(element?.autocomplete || '') ||
    ['name', 'id', 'aria-label', 'placeholder'].some(name => SECRET.test(element?.getAttribute?.(name) || '')) ||
    Boolean(element?.closest?.('[data-secret],[data-private]'));
}

export function selectorsFor(element, root = globalThis.document) {
  if (!element || element.getRootNode() !== root || isSecret(element)) return [];
  const parts = [];
  while (element && element.nodeType === 1 && parts.length < 12) {
    const name = element.localName;
    if (!/^[a-z][a-z0-9-]*$/.test(name)) return [];
    const peers = [...(element.parentElement?.children || [element])].filter(item => item.localName === name);
    parts.unshift(`${name}:nth-of-type(${peers.indexOf(element) + 1})`);
    element = element.parentElement;
  }
  if (element) return []; // too deep: don't emit a selector that could target something else
  return [[parts.join(' > ')]];
}

export function installRecorder({ post, root = globalThis.document, enabled = true, maxSteps = 200 } = {}) {
  if (typeof post !== 'function') throw new TypeError('Supply the recording delivery callback.');
  if (!Number.isInteger(maxSteps) || maxSteps < 1 || maxSteps > 5000) throw new TypeError('Choose a step limit from 1 to 5000.');
  let on = Boolean(enabled), stopped = false, scheduled = false, busy = false, generation = 0, queue = [], delivery = Promise.resolve();
  const listeners = [];
  function push(step) {
    if (!on || stopped) return;
    queue.push(step);
    if (queue.length > maxSteps) queue.shift();
    if (!scheduled) { scheduled = true; queueMicrotask(() => { scheduled = false; void flush(); }); }
  }
  function flush() {
    if (!on || stopped) { queue = []; return delivery; }
    if (busy) return delivery;
    const batch = queue.splice(0, maxSteps), epoch = generation;
    if (batch.length) {
      busy = true;
      delivery = Promise.resolve().then(() => stopped || !on || epoch !== generation ? undefined : post(batch)).catch(() => {}).finally(() => {
        busy = false;
        if (queue.length) void flush();
      });
    }
    return delivery;
  }
  function listen(type, handler) {
    const safe = event => { if (!on || stopped) return; try { handler(event); } catch { /* never interrupt the app */ } };
    root.addEventListener(type, safe, { capture: true, passive: true });
    listeners.push([type, safe]);
  }
  const target = event => event.composedPath?.()[0] || event.target;
  for (const [type, kind] of [['click', 'click'], ['dblclick', 'doubleClick']]) listen(type, event => {
    const element = target(event);
    const selectors = selectorsFor(element, root);
    if (selectors.length) {
      const rect = element.getBoundingClientRect();
      push({ type: kind, selectors, offsetX: Math.max(0, Math.round(event.detail ? event.clientX - rect.left : rect.width / 2)), offsetY: Math.max(0, Math.round(event.detail ? event.clientY - rect.top : rect.height / 2)) });
    }
  });
  listen('input', event => {
    const element = target(event);
    if (isSecret(element) || !element?.matches?.('input:not([type=file]),textarea,[contenteditable]')) return;
    const selectors = selectorsFor(element, root);
    if (selectors.length) push({ type: 'change', selectors, value: { redacted: true, length: [...String(element.value ?? element.textContent ?? '')].length } });
  });
  for (const [type, kind] of [['focusin', 'focus'], ['focusout', 'blur']]) listen(type, event => {
    const selectors = selectorsFor(target(event), root);
    if (selectors.length) push({ type: kind, selectors });
  });
  for (const [type, kind] of [['keydown', 'keyDown'], ['keyup', 'keyUp']]) listen(type, event => {
    if (event.isComposing || event.keyCode === 229 || isSecret(target(event)) || !KEYS.has(event.key)) return;
    push({ type: kind, key: event.key });
  });
  return {
    flush,
    setEnabled(value) { generation++; on = Boolean(value); if (!on) queue = []; },
    get enabled() { return on && !stopped; },
    stop() { generation++; stopped = true; on = false; queue = []; for (const [type, handler] of listeners) root.removeEventListener(type, handler, true); },
  };
}
