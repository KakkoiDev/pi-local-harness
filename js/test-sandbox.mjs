// Task 311: Project ▸ Test Sandbox… — the person, never Pi, chooses how far this project's test runs may reach.
// The sandbox itself is gate/sandbox.py; this is the one control that widens it (POST /api/projects/sandbox, person only).
// Built from existing 1-bit parts (the alert with radios); a note for the designer is in design/briefs/round-13.md.
import { ask } from './dialogs.mjs';

const CHOICES = [
  ['none', 'No network (recommended)'],
  ['local', 'This computer only (localhost)'],
  ['internet', 'The internet'],
];

export function installTestSandbox({ api, project, toast }) {
  async function open() {
    const name = project(); if (!name) return;
    const state = await api('/api/project-sandbox?project=' + encodeURIComponent(name));
    const group = document.createElement('fieldset'); group.className = 'settings-group'; group.id = 'sandbox-network';
    const legend = document.createElement('legend'); legend.className = 'pw-label'; legend.textContent = 'Network for test runs'; group.append(legend);
    for (const [value, label] of CHOICES) {
      const row = document.createElement('label'); row.className = 'pw-label settings-option';
      const input = document.createElement('input'); input.type = 'radio'; input.className = 'pw-radio'; input.name = 'sandbox-network'; input.value = value; input.checked = state.network === value;
      row.append(input, document.createTextNode(label)); group.append(row);
    }
    const detail = state.available
      ? 'Test runs write only in the project and a temporary folder, cannot read the workbench’s data or your keys, and have no network. Widen the network only for tests that need it.'
      : 'Test runs are not sandboxed on this system yet (the sandbox uses macOS sandbox-exec). The choice is kept for when it is.';
    const answer = await ask({ icon: 'note', message: 'Test Sandbox', detail, danger: 'Change', safe: 'Cancel', plain: true, extra: group, escape: 'default' });
    if (answer !== 'danger') return;
    const network = group.querySelector('input:checked')?.value || 'none';
    if (network === state.network) return;
    const saved = await api('/api/projects/sandbox', { project: name, network });
    toast?.({ none: 'Test runs have no network again.', local: 'Test runs may reach this computer (localhost).', internet: 'Test runs may reach the internet.' }[saved.network]);
  }
  return { open };
}
