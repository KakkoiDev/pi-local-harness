// Recipe scenario-steps, integration level: the same scenarios against the routes of the app on port 0, each with
// its own database file in a temporary folder (Vitest).
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'vitest';
import { loadScenarios, runScenario } from '../../../functional/js/index.js';
import { steps } from './task-steps.js';

const TASK = new URL('../../shared/task-example.md', import.meta.url);

for (const scenario of loadScenarios(TASK)) {
  test(scenario.name, async () => {
    const world = { folder: mkdtempSync(join(tmpdir(), 'test-core-')), cleanups: [] };
    try {
      await runScenario(scenario, { level: 'integration', registry: steps, world });
    } finally {
      for (const cleanup of world.cleanups.reverse()) await cleanup();
      rmSync(world.folder, { recursive: true, force: true });
    }
  });
}
