// Gherkin for test-core: read a task's scenarios, match a step against a fixed vocabulary, suggest the nearest step.
// The twin of functional/gherkin.py: same rules, same results, names in camelCase. No dependencies.
//
// A step pattern is a step with {name} places: 'When I add the task {title}'. A value is quoted ("Buy milk",
// “Buy milk”, 「牛乳」) or one word without spaces (3, Saturday). An unquoted whole number becomes a number.

export const KEYWORDS = ['Given', 'When', 'Then'];
export const LEVELS = ['unit', 'integration', 'e2e'];

const SECTION = /^\s*##\s+([^#].*?)\s*$/;
const HEADING = /^\s*###\s+(?:Scenario(?: Outline)?:\s*)?(.+?)\s*#*\s*$/i;
const SCENARIO_LINE = /^\s*(?:[-*]\s+)?(?:#+\s*)?Scenario(?: Outline)?:\s*(.+?)\s*#*\s*$/i;
const SCENARIO_ID = /^([A-Z][A-Z0-9]*-(?:\d+|new))\b[\s:]*(.+)$/;
const STEP_LINE = /^\s*(?:[-*]\s+)?(Given|When|Then|And|But)\s+(.+?)\s*$/i;
const PARAM = /\{([A-Za-z_]\w*)\}/g;
const VALUE = '(?:"([^"]*)"|“([^”]*)”|「([^」]*)」|([^\\s"“「]+?))';
const GROUPS_PER_VALUE = 4;
const QUOTED = /"[^"]*"|“[^”]*”|「[^」]*」/g;

const capitalize = (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

/** 'US-312 the counter shows one' -> { id: 'US-312', title: 'the counter shows one' }; no id -> { id: null, title }. */
export function splitHeading(heading) {
  const match = SCENARIO_ID.exec(heading.trim());
  return match ? { id: match[1], title: match[2].trim() } : { id: null, title: heading.trim() };
}

/** Every scenario of a task file, in order: [{ id, title, name, line, source, steps: [{ keyword, kind, text, line, full }] }].
 *  The recommended heading is `### <ID> <title>` (optional story id such as US-312 or US-new, optional `Scenario:`
 *  prefix); `name` is the heading without `Scenario:`, the test's name. */
export function parseScenarios(text, source = '') {
  const scenarios = [];
  let inSection = false;
  let current = null;
  let kind = null;
  text.split(/\r?\n/).forEach((line, index) => {
    const number = index + 1;
    const section = SECTION.exec(line);
    if (section) {
      inSection = section[1].toLowerCase().startsWith('scenarios');
      current = null;
      return;
    }
    const heading = inSection ? HEADING.exec(line) : null;
    const named = SCENARIO_LINE.exec(line);
    if (heading || named) {
      const { id, title } = splitHeading((named || heading)[1]);
      current = { id, title, name: id ? `${id} ${title}` : title, steps: [], line: number, source };
      scenarios.push(current);
      kind = null;
      return;
    }
    if (line.trimStart().startsWith('#')) {
      current = null;
      return;
    }
    const match = current && STEP_LINE.exec(line);
    if (!match) return;
    const keyword = capitalize(match[1]);
    if (keyword === 'And' || keyword === 'But') {
      if (!kind) throw new Error(`${source}:${number}: '${keyword}' needs a Given, When or Then above it`);
    } else {
      kind = keyword;
    }
    current.steps.push({ keyword, kind, text: match[2], line: number, full: `${kind} ${match[2]}` });
  });
  return scenarios;
}

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const literal = (text) => text.split(/(\s+)/).filter(Boolean).map((part) => (/^\s+$/.test(part) ? '\\s+' : escape(part))).join('');

/** 'When I add the task {title}' -> { regex, names: ['title'] }. */
export function compilePattern(pattern) {
  const first = pattern.trim().split(/\s+/)[0];
  if (!KEYWORDS.includes(first)) throw new Error(`a step pattern starts with Given, When or Then: '${pattern}'`);
  const parts = pattern.trim().split(/\{([A-Za-z_]\w*)\}/);
  const names = parts.filter((_, i) => i % 2 === 1);
  if (new Set(names).size !== names.length) throw new Error(`a place name appears twice in '${pattern}'`);
  const source = parts.map((part, i) => (i % 2 === 0 ? literal(part) : VALUE)).join('');
  return { regex: new RegExp(`^${source}$`, 'iu'), names };
}

/** The values of a step for one compiled pattern, or null when it does not match. */
export function matchPattern(compiled, step) {
  const found = compiled.regex.exec(step.trim());
  if (!found) return null;
  const values = {};
  compiled.names.forEach((name, index) => {
    const group = found.slice(1 + index * GROUPS_PER_VALUE, 1 + (index + 1) * GROUPS_PER_VALUE);
    const bare = group[GROUPS_PER_VALUE - 1];
    if (bare !== undefined) values[name] = /^-?\d+$/.test(bare) ? Number(bare) : bare;
    else values[name] = group.slice(0, -1).find((v) => v !== undefined);
  });
  return values;
}

/** A step without its values: 'When I add the task "Buy milk"' -> 'when i add the task {}'. */
export function shape(text) {
  return text.replace(QUOTED, '{}').replace(PARAM, '{}')
    .replace(/(?<![\p{L}\p{N}_{])-?\d+(?![\p{L}\p{N}_}])/gu, '{}')
    .replace(/\s+/g, ' ').trim().toLowerCase();
}

const bigrams = (text) => {
  const chars = Array.from(text);
  const pairs = [];
  for (let i = 0; i < chars.length - 1; i += 1) pairs.push(chars[i] + chars[i + 1]);
  return pairs.length ? pairs : [text];
};

/** Dice coefficient over character pairs of the two shapes (0 to 1), as in gherkin.py. */
export function similarity(a, b) {
  const left = bigrams(shape(a));
  const pool = bigrams(shape(b));
  const total = left.length + pool.length;
  let common = 0;
  for (const pair of left) {
    const at = pool.indexOf(pair);
    if (at >= 0) {
      pool.splice(at, 1);
      common += 1;
    }
  }
  return (2 * common) / total;
}

/** The known steps closest to an unknown one, best first (ties keep the vocabulary's order). */
export function nearest(step, patterns, n = 3, cutoff = 0.5) {
  const unique = [...new Set(patterns)];
  const scored = unique.map((p, i) => ({ p, i, score: similarity(step, p) }))
    .sort((a, b) => b.score - a.score || a.i - b.i);
  const close = scored.filter((s) => s.score >= cutoff).slice(0, n).map((s) => s.p);
  if (close.length) return close;
  const keyword = step.trim() ? capitalize(step.trim().split(/\s+/)[0]) : '';
  return scored.filter((s) => s.p.split(/\s+/)[0] === keyword).slice(0, n).map((s) => s.p);
}

export function unknownStepMessage(step, patterns) {
  const suggestions = nearest(step, patterns);
  QUOTED.lastIndex = 0;
  const hint = suggestions.length && suggestions[0].includes('{') && !step.match(QUOTED)
    ? ' (a value with spaces goes in quotes: "Buy milk")' : '';
  if (!suggestions.length) return `unknown step '${step}'${hint}; no known step is close.`;
  return `unknown step '${step}'${hint}. Nearest known steps:\n${suggestions.map((s) => `  - ${s}`).join('\n')}`;
}
