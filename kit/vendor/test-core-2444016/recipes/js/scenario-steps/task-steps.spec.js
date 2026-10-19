// Recipe scenario-steps, e2e level: the same scenarios in a real browser against the app on a free port
// (@playwright/test). page and appURL come from ../fixtures.js (recipe fixtures).
import { test } from '../fixtures.js';
import { loadScenarios, runScenario } from '../../../functional/js/index.js';
import { steps } from './task-steps.js';

const TASK = new URL('../../shared/task-example.md', import.meta.url);

for (const scenario of loadScenarios(TASK)) {
  test(scenario.name, async ({ page, appURL }) => {
    await runScenario(scenario, { level: 'e2e', registry: steps, world: { page, baseURL: appURL } });
  });
}
