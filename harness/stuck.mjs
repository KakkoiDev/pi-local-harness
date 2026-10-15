// Stuck detection on actions (strategy 3, after OpenHands' stuck detector): the loop watch reads Pi's thinking; this reads
// what Pi does. The same call with the same result 4 times, the same call failing 3 times in a row, or two calls
// alternating 6 times: Pi is not making progress, and the harness should change its course (a wake-up with a nudge).
const name = step => `${step.tool} ${String(step.input?.command ?? step.input?.path ?? step.input?.pattern ?? JSON.stringify(step.input ?? {})).replace(/\s+/g, ' ').slice(0, 80)}`;
const call = step => `${step.tool}\u0000${JSON.stringify(step.input ?? {})}`;
// Times, durations and long ids do not make a result new; counts do ("3 passed" then "4 passed" is progress).
const result = step => `${step.error ? 'error' : 'ok'}\u0000${String(step.text ?? '').replace(/\d{1,2}:\d{2}(:\d{2})?|\d+(\.\d+)?\s?(ms|s)\b|\d{4,}/g, '#').slice(0, 400)}`;

/** The reason the last steps show no progress, or null. */
export function stuckPattern(steps) {
  const last = steps.at(-1);
  if (!last) return null;
  const tail = count => steps.slice(-count);
  const four = tail(4);
  if (four.length === 4 && four.every(step => call(step) === call(last) && result(step) === result(last))) return `the same call 4 times with the same result: ${name(last)}`;
  const three = tail(3);
  if (three.length === 3 && three.every(step => step.error && call(step) === call(last))) return `the same call failed 3 times in a row: ${name(last)}`;
  const six = tail(6);
  if (six.length === 6 && call(six[0]) !== call(six[1]) && six.every((step, index) => call(step) === call(six[index % 2]))) return `alternated between two calls 6 times: ${name(six[0])} and ${name(six[1])}`;
  return null;
}

export class StepWatch {
  constructor(limit = 12) { this.limit = limit; this.steps = []; }
  /** Add a finished tool call; the reason it is stuck, once, or null. */
  add(step) {
    this.steps = [...this.steps, step].slice(-this.limit);
    const stuck = stuckPattern(this.steps);
    if (stuck) this.steps = []; // say it once; the next pattern starts fresh
    return stuck;
  }
  reset() { this.steps = []; }
}
