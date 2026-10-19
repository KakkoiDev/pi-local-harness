// The step registry: a fixed vocabulary of step phrases, each bound to one function per test level.
// The twin of functional/registry.py.
//
//   import { Registry } from '../functional/js/index.js';
//   export const steps = new Registry();
//   steps.step('When I add the task {title}', async (world, { title }) => { ... }, { level: 'e2e' });
//   steps.step('When I add the task {title}', (world, { title }) => { ... }, { level: 'unit' });
//
// One phrase, one meaning; one function per level. Registries compose: new Registry(appSteps, logIn.steps).
import { LEVELS, compilePattern, matchPattern, unknownStepMessage } from './gherkin.js';

export class UnknownStep extends Error { name = 'UnknownStep'; }
export class AmbiguousStep extends Error { name = 'AmbiguousStep'; }
export class StepNotAtLevel extends Error { name = 'StepNotAtLevel'; }

function levelsOf(level) {
  const levels = typeof level === 'string' ? [level] : [...level];
  if (!levels.length || levels.some((lv) => !LEVELS.includes(lv))) {
    throw new Error(`level must be among ${LEVELS.join(', ')}: got ${JSON.stringify(level)}`);
  }
  return levels;
}

export class Registry {
  constructor(...include) {
    const options = include.length && !(include.at(-1) instanceof Registry) ? include.pop() : {};
    this.block = options.block ?? null;
    this.definitions = [];
    for (const other of include) this.include(other);
  }

  /** Bind a step phrase to fn(world, values) at one or more levels (default: all). Returns fn. */
  step(pattern, fn, { level = LEVELS, help = null } = {}) {
    this.add(pattern, fn, { level, help });
    return fn;
  }

  add(pattern, fn, { level = LEVELS, block = null, help = null } = {}) {
    const definition = { pattern: pattern.trim(), fn, levels: levelsOf(level), block: block ?? this.block, help };
    definition.compiled = compilePattern(definition.pattern);
    for (const other of this.definitions) {
      const both = other.levels.filter((lv) => definition.levels.includes(lv));
      if (other.pattern === definition.pattern && both.length) {
        throw new Error(`step '${definition.pattern}' is already registered at ${both.join(', ')}`);
      }
    }
    this.definitions.push(definition);
    return definition;
  }

  /** Add every step of another registry. Returns this. */
  include(other) {
    for (const d of other.definitions) this.add(d.pattern, d.fn, { level: d.levels, block: d.block, help: d.help });
    return this;
  }

  patterns(level = null) {
    return [...new Set(this.definitions.filter((d) => level === null || d.levels.includes(level)).map((d) => d.pattern))];
  }

  levelsOf(pattern) {
    return LEVELS.filter((lv) => this.definitions.some((d) => d.pattern === pattern && d.levels.includes(lv)));
  }

  /** { definition, values } for a step at a level. Throws UnknownStep, AmbiguousStep, StepNotAtLevel. */
  find(step, level) {
    levelsOf(level);
    const matched = new Map();
    for (const definition of this.definitions) {
      const values = matchPattern(definition.compiled, step);
      if (values === null) continue;
      if (!matched.has(definition.pattern)) matched.set(definition.pattern, { definitions: [], values });
      matched.get(definition.pattern).definitions.push(definition);
    }
    if (!matched.size) throw new UnknownStep(unknownStepMessage(step, this.patterns()));
    if (matched.size > 1) {
      throw new AmbiguousStep(`step '${step}' matches more than one known step:\n${[...matched.keys()].map((p) => `  - ${p}`).join('\n')}`);
    }
    const [pattern, { definitions, values }] = [...matched.entries()][0];
    const definition = definitions.find((d) => d.levels.includes(level));
    if (!definition) throw new StepNotAtLevel(`step '${pattern}' has no ${level} implementation (it has: ${this.levelsOf(pattern).join(', ')})`);
    return { definition, values };
  }

  /** The registry as a step-vocabulary file (functional/README.md, "Vocabulary files"). */
  vocabulary(name = '') {
    return {
      name,
      steps: this.patterns().map((pattern) => {
        const first = this.definitions.find((d) => d.pattern === pattern);
        return { step: pattern, levels: this.levelsOf(pattern), ...(first.block ? { block: first.block } : {}), ...(first.help ? { help: first.help } : {}) };
      }),
    };
  }

  /** Differences between a vocabulary file and this registry. */
  checkVocabulary(vocabulary) {
    const problems = [];
    const defaults = vocabulary.levels ?? LEVELS;
    const known = new Set(this.patterns());
    const listed = new Set();
    for (const entry of vocabulary.steps ?? []) {
      listed.add(entry.step);
      if (!known.has(entry.step)) {
        problems.push(`no function for the step '${entry.step}'`);
        continue;
      }
      const missing = (entry.levels ?? defaults).filter((lv) => !this.levelsOf(entry.step).includes(lv));
      if (missing.length) problems.push(`the step '${entry.step}' has no function at ${missing.join(', ')}`);
    }
    for (const pattern of this.patterns()) if (!listed.has(pattern)) problems.push(`the step '${pattern}' is not in the vocabulary file`);
    return problems;
  }
}
