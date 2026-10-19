// The scenario runner: Given/When/Then text in, registered steps run, at the level asked for.
// The twin of functional/runner.py.
//
//   import { test } from '@playwright/test';      // or vitest's test, for the unit and integration levels
//   for (const scenario of loadScenarios('tasks/12-add-tasks.md')) {
//     // scenario.name is the heading: 'US-12 Add a task', or 'Add a task' without an id
//     test(scenario.name, async ({ page }) => {
//       await runScenario(scenario, { level: 'e2e', registry: steps, world: { page, baseURL } });
//     });
//   }
//
// (Playwright reads a test's fixtures from its destructured first parameter, so the loop stays in the test file.)
// Every step is looked up before the first one runs: an unknown step fails at once with the nearest known steps.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseScenarios } from './gherkin.js';

export class StepFailed extends Error { name = 'StepFailed'; }

/** The scenarios of a task file (a path or a file: URL). */
export function loadScenarios(path) {
  const file = path instanceof URL ? fileURLToPath(path) : String(path);
  const scenarios = parseScenarios(readFileSync(file, 'utf8'), file);
  if (!scenarios.length) throw new Error(`${path}: no scenarios (a \`## Scenarios\` section with \`### <title>\` and Given/When/Then lines)`);
  return scenarios;
}

const where = (scenario, step) => (scenario.source ? `${scenario.source}:${step.line}: ` : '');

/** Every step of a scenario with its definition and values. Throws on the first step it cannot run. */
export function resolve(scenario, registry, level) {
  return scenario.steps.map((step) => {
    try {
      return { step, ...registry.find(step.full, level) };
    } catch (error) {
      const again = new error.constructor(`${where(scenario, step)}scenario "${scenario.name}": ${error.message}`);
      throw again;
    }
  });
}

/** Run each step of a scenario at a level ('unit', 'integration' or 'e2e'). Resolves to the world. */
export async function runScenario(scenario, { level, registry, world = {} }) {
  if (!scenario.steps.length) throw new Error(`scenario "${scenario.name}" has no steps`);
  const plan = resolve(scenario, registry, level);
  world.level = level;
  world.scenario = scenario.name;
  for (const { step, definition, values } of plan) {
    try {
      await definition.fn(world, values);
    } catch (error) {
      throw new StepFailed(`${where(scenario, step)}scenario "${scenario.name}", step "${step.keyword} ${step.text}" failed: ${error.message}`, { cause: error });
    }
  }
  return world;
}
