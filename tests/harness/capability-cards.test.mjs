// Round 12, Project Start: Pi learns each capability the project uses. packaging.json (written by the harness) names
// them; each one's card from kit/ joins the system prompt with the files it put in the project.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { capabilityCards, projectCapabilities } from '../../harness/capability-cards.mjs';

function project(record, files = []) {
  const folder = mkdtempSync(join(tmpdir(), 'pi-cards-'));
  if (record !== undefined) writeFileSync(join(folder, 'packaging.json'), typeof record === 'string' ? record : JSON.stringify(record));
  for (const file of files) { mkdirSync(join(folder, file, '..'), { recursive: true }); writeFileSync(join(folder, file), ''); }
  return folder;
}

test('a project started with capabilities gives Pi each one’s card and where its files are', t => {
  const folder = project({ packages: ['static'], capabilities: ['charts', 'multiplayer', 'offline'] }, ['vendor/p2p-core/p2p-core.js']);
  t.after(() => rmSync(folder, { recursive: true, force: true }));
  const text = capabilityCards(folder);
  assert.match(text, /^Capabilities this project uses/);
  assert.match(text, /### Dashboard and charts\n\n# Charts for Pi/);
  assert.match(text, /Its App Blocks \(copy their markup files, never retype them\):\n\n# Dashboard/, 'the block the capability installed, with its card');
  assert.match(text, /Related App Blocks \(load one with the app_block tool\): BarChart, LineChart, AreaChart, DonutChart, KpiTile\./);
  assert.match(text, /### Multiplayer, real time \(in this project: vendor\/p2p-core\)\n\n# p2p-core for coding agents/);
  assert.match(text, /### Works offline\n\n# Works offline, for Pi/);
  assert.deepEqual(projectCapabilities(folder), ['charts', 'multiplayer', 'offline']);
});

test('no packaging.json, an unreadable one, or no capabilities: nothing joins the prompt', t => {
  const folders = [project(undefined), project('{not json'), project({ packages: ['web'], capabilities: [] }), project({ capabilities: ['no-such-capability'] })];
  t.after(() => { for (const folder of folders) rmSync(folder, { recursive: true, force: true }); });
  for (const folder of folders) assert.equal(capabilityCards(folder), '');
});
