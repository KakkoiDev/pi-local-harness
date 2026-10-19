// Recipe scenario-steps, unit level: the scenarios of the example task against the pure task list (Vitest).
// One test per scenario, titled like the scenario; no browser, no server.
import { test } from 'vitest';
import { loadScenarios, runScenario } from '../../../functional/js/index.js';
import { steps } from './task-steps.js';

const TASK = new URL('../../shared/task-example.md', import.meta.url);

for (const scenario of loadScenarios(TASK)) {
  test(scenario.name, () => runScenario(scenario, { level: 'unit', registry: steps }));
}
