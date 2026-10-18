// Round 12, Project Start (plan 253): Pi learns each capability the project was started with, or had added. The project's
// packaging.json names them (the harness writes it, never Pi); each capability's card (kit/capabilities.json "card",
// a file under kit/) joins the system prompt with the files the capability put in this project. A project without
// packaging.json, or a capability without a card, adds nothing.
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const KIT = fileURLToPath(new URL('../kit/', import.meta.url));

/** The capability ids a project folder uses, from its packaging.json ([] when there is none or it is unreadable). */
export function projectCapabilities(folder) {
  try {
    const record = JSON.parse(readFileSync(join(folder, 'packaging.json'), 'utf8'));
    return Array.isArray(record.capabilities) ? record.capabilities.filter(item => typeof item === 'string') : [];
  } catch { return []; }
}

/** The cards for a project folder, as one block for the system prompt ('' when it uses none). */
export function capabilityCards(folder, kit = KIT) {
  const used = projectCapabilities(folder); if (!used.length) return '';
  let catalogue; try { catalogue = JSON.parse(readFileSync(join(kit, 'capabilities.json'), 'utf8')); } catch { return ''; }
  const cards = [];
  for (const id of used) {
    const item = catalogue.capabilities.find(capability => capability.id === id);
    if (!item?.card || !existsSync(join(kit, item.card))) continue;
    const files = Object.values(item.install || {}).flatMap(spec => (spec.copy || []).map(([, target]) => target)).filter((path, index, all) => all.indexOf(path) === index && existsSync(join(folder, path)));
    cards.push(`### ${item.name}${files.length ? ` (in this project: ${files.join(', ')})` : ''}\n\n${readFileSync(join(kit, item.card), 'utf8').trim()}`);
  }
  return cards.length ? `Capabilities this project uses (chosen in Project Start; each one's card):\n\n${cards.join('\n\n')}` : '';
}
