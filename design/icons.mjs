// Pi Workbench System 1 — icon set.
// 1-bit, drawn on a 16px grid (alerts on 36px), stroke 1px with crisp edges.
// Colour comes from `currentColor`; cut-outs use var(--paper) so icons invert
// correctly inside selected rows and in the Inverse theme.
// Replaces the `paths` map in js/ui.mjs. Keep the data-icon="<name>" hydration.

const P = 'var(--paper,#fff)';
export const ICONS = {
  // Objects
  folder: '<path d="M.5 3.5h5l1.5 1.5h8.5v9.5H.5z" fill="none" stroke="currentColor"/>',
  file: '<path d="M2.5.5h7l4 4v11h-11zM9.5.5v4h4" fill="none" stroke="currentColor"/>',
  // Navigation
  'disclosure-closed': '<path d="M5 3.5v9l6-4.5z" fill="currentColor"/>',
  'disclosure-open': '<path d="M3.5 5h9l-4.5 6z" fill="currentColor"/>',
  'popup-arrow': '<path d="M3.5 6h9L8 11z" fill="currentColor"/>',
  back: '<path d="M10.5 2.5 5 8l5.5 5.5" fill="none" stroke="currentColor" stroke-width="2"/>',
  up: '<path d="M8 13.5v-11M3.5 7 8 2.5 12.5 7" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  down: '<path d="M8 2.5v11M3.5 9 8 13.5 12.5 9" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  // Actions
  search: '<circle cx="6.5" cy="6.5" r="4.75" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M10 10l4.5 4.5" stroke="currentColor" stroke-width="2"/>',
  plus: '<path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="2"/>',
  close: '<path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" stroke-width="1.5"/>',
  mic: '<rect x="5.5" y=".5" width="5" height="9" rx="2.5" fill="none" stroke="currentColor"/><path d="M2.5 7.5a5.5 5.5 0 0 0 11 0M8 13v2.5M5 15.5h6" fill="none" stroke="currentColor"/>',
  handle: '<path d="M5 2h2v2H5zM9 2h2v2H9zM5 7h2v2H5zM9 7h2v2H9zM5 12h2v2H5zM9 12h2v2H9z" fill="currentColor"/>',
  'list-bullet': '<path d="M1 3h2v2H1zM1 7h2v2H1zM1 11h2v2H1z" fill="currentColor"/><path d="M5 4h10M5 8h10M5 12h10" stroke="currentColor"/>',
  fence: '<path d="M2.5 1v14M13.5 1v14M2.5 4.5h11M2.5 9.5h11" fill="none" stroke="currentColor"/><path d="M5 4.5v5M8 4.5v5M11 4.5v5" stroke="currentColor"/>', // Gate (C_ProjectsWin)
  'list-check': '<rect x="2.5" y="2.5" width="11" height="11" fill="none" stroke="currentColor"/>',
  // States (always shown with a word beside them)
  running: '<path d="M2.5.5h11M2.5 15.5h11M3.5.5c0 5 4.5 5 4.5 7.5s-4.5 2.5-4.5 7.5M12.5.5c0 5-4.5 5-4.5 7.5s4.5 2.5 4.5 7.5" fill="none" stroke="currentColor"/><path d="M5 14.5h6L8 11.5z" fill="currentColor"/>',
  waiting: '<circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor"/><path d="M8 4v4h3.5" fill="none" stroke="currentColor"/>',
  done: '<path d="M2 8.5 6 12.5 14 3.5" fill="none" stroke="currentColor" stroke-width="2"/>',
  failed: '<path d="M5 .5h6L15.5 5v6L11 15.5H5L.5 11V5z" fill="currentColor"/><path d="M4.5 8h7" stroke="' + P + '" stroke-width="2"/>',
  stopped: '<rect x="3" y="3" width="10" height="10" fill="currentColor"/>',
  interrupted: '<path d="M.5 8h5.5M10 8h5.5M5.5 4.5l5 7" fill="none" stroke="currentColor" stroke-width="1.5"/>',
  caution: '<path d="M8 .8 15.4 14.5H.6z" fill="none" stroke="currentColor"/><path d="M8 5.5v4.5M8 11.5v1.5" stroke="currentColor" stroke-width="1.5"/>',
  note: '<path d="M1.5 1.5h13v9h-7l-3.5 3.5v-3.5H1.5z" fill="none" stroke="currentColor"/><path d="M8 3.5v1M8 6v3" stroke="currentColor" stroke-width="1.5"/>',
};
// Alert icons (36px) for dialogs and the Gate info window.
export const ALERT_ICONS = {
  stop: '<path d="M11.5 1.5h13l10 10v13l-10 10h-13l-10-10v-13z" fill="currentColor"/><path d="M10 18h16" stroke="' + P + '" stroke-width="4"/>',
  caution: '<path d="M18 2.5 34 31.5H2z" fill="' + P + '" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M18 11v11M18 25v3.5" stroke="currentColor" stroke-width="3.5"/>',
  note: '<path d="M2 3h32v22H15l-8 8v-8H2z" fill="' + P + '" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M18 7v2.5M18 12.5v8" stroke="currentColor" stroke-width="3"/>',
};
// Status vocabulary: one glyph + one word per state. Never colour.
export const STATES = {
  running: { icon: 'running', label: 'Running' },
  queued: { icon: 'waiting', label: 'Waiting' },
  completed: { icon: 'done', label: 'Completed' },
  failed: { icon: 'failed', label: 'Failed' },
  stopped: { icon: 'stopped', label: 'Stopped' },
  interrupted: { icon: 'interrupted', label: 'Interrupted' },
  cancelled: { icon: 'close', label: 'Cancelled' },
  // Gate decision outcomes (gate/models.py ActionOutcome)
  ALLOW: { icon: 'done', label: 'Approved' },
  BLOCK: { icon: 'failed', label: 'Blocked' },
  REVISE: { icon: 'caution', label: 'Revise' },
  ESCALATE: { icon: 'note', label: 'Escalated' },
  // Gate audit statuses (gate/engine.py audit)
  SUCCESS: { icon: 'done', label: 'Verified' },
  EXECUTION_FAILED: { icon: 'caution', label: 'Exit ≠ 0' },
  POSTCONDITION_FAILED: { icon: 'caution', label: 'Check failed' },
  DRIFT_DETECTED: { icon: 'failed', label: 'Drift' },
};

const NS = 'http://www.w3.org/2000/svg';
export function icon(name, { size = 16, label } = {}) {
  const alert = name.startsWith('alert-');
  const body = alert ? ALERT_ICONS[name.slice(6)] : ICONS[name];
  const svg = document.createElementNS(NS, 'svg');
  const box = alert ? 36 : 16;
  svg.setAttribute('viewBox', `0 0 ${box} ${box}`);
  svg.setAttribute('width', String(alert ? box : size));
  svg.setAttribute('height', String(alert ? box : size));
  svg.setAttribute('shape-rendering', 'crispEdges');
  if (label) { svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', label); }
  else svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = body || ICONS.file; // static strings from this module only
  return svg;
}
export function hydrateIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((el) => el.replaceChildren(icon(el.dataset.icon)));
}
// A status glyph: <span class="pw-glyph">[icon] Word</span>
export function stateGlyph(state) {
  const s = STATES[state] || { icon: 'note', label: state };
  const span = document.createElement('span');
  span.className = 'pw-glyph';
  span.dataset.state = state;
  span.append(icon(s.icon), document.createTextNode(s.label));
  return span;
}
