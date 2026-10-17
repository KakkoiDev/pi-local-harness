// task_box (task 183, docs/lessons/L-003): tick or untick one checkbox in a task file or ROADMAP.md by the start of its
// label. A small model retypes a line from memory to edit it and gets a character wrong; here it names the box ("Red"),
// and the harness finds the exact line. Gate checks the change as the edit it becomes (G-004, G-009, G-010).
import { readFileSync, writeFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';

const BOX = /^(\s*[-*+]) \[([ xX])\] (.*)$/; // task 263: any list bullet, kept as it was
const plain = text => String(text).toLowerCase().replace(/\s+/g, ' ').trim();

/** {oldText, newText} for the one box whose label starts with `box`, or {error} that lists the candidates. */
export function boxEdit(content, box, done = true) {
  const lines = content.split('\n'), want = plain(box), open = done ? ' ' : 'x';
  const state = line => (BOX.exec(line)?.[2] || '').toLowerCase();
  const boxes = lines.filter(line => BOX.test(line) && state(line) === open);
  const found = boxes.filter(line => plain(BOX.exec(line)[3]).startsWith(want));
  const kind = done ? 'open box' : 'ticked box';
  const list = items => items.slice(0, 15).map(line => `  ${line.trim()}`).join('\n');
  if (!want) return { error: 'Name the box: the start of its label, e.g. "Red".' };
  if (found.length === 1) {
    const [, indent, , label] = BOX.exec(found[0]);
    return { oldText: found[0], newText: `${indent} [${done ? 'x' : ' '}] ${label}` };
  }
  if (found.length > 1) return { error: `${found.length} ${kind}es start with “${box.trim()}”; give more of the label:\n${list(found)}` };
  return { error: `No ${kind} starts with “${box.trim()}”.${boxes.length ? ` The ${kind}es are:\n${list(boxes)}` : ` There are no ${kind}es in this file.`}` };
}

const resolve = (path, cwd) => (isAbsolute(path) ? path : join(cwd, path));

/** The edit Gate checks for a task_box call, or {error}. */
export function boxProposal(input, cwd) {
  let content;
  try { content = readFileSync(resolve(input.path, cwd), 'utf8'); } catch (error) { return { error: `Cannot read ${input.path}: ${error.message}` }; }
  const edit = boxEdit(content, input.box || '', input.done !== false);
  return edit.error ? edit : { path: input.path, edits: [{ oldText: edit.oldText, newText: edit.newText }] };
}

export function installTaskBox(pi, { cwd = () => process.cwd() } = {}) {
  pi.registerTool?.({
    name: 'task_box', label: 'Tick a task box',
    description: 'Tick (or untick) one checkbox in ROADMAP.md or a tasks/*.md file, named by the start of its label: {path: "tasks/173-x.md", box: "Red"}. Use this instead of edit for checkboxes: you do not need to copy the line. If several boxes match, or none, you get the list of boxes. Gate still checks it (a Red box needs a failing test run first, Green a passing one).',
    promptSnippet: 'task_box: tick a checkbox in a task file or ROADMAP.md by the start of its label',
    parameters: { type: 'object', properties: { path: { type: 'string', description: 'ROADMAP.md or tasks/NNN-name.md' }, box: { type: 'string', description: 'The start of the box label, e.g. "Red" or "Green: the desk"' }, done: { type: 'boolean', description: 'false to untick; default true' } }, required: ['path', 'box'] },
    async execute(_id, params, _signal, _update, ctx) {
      const folder = ctx?.cwd || cwd(), proposal = boxProposal(params, folder);
      if (proposal.error) return { content: [{ type: 'text', text: proposal.error }], isError: true, details: {} };
      const path = resolve(params.path, folder), { oldText, newText } = proposal.edits[0];
      writeFileSync(path, readFileSync(path, 'utf8').replace(oldText, newText));
      return { content: [{ type: 'text', text: `${params.done === false ? 'Unticked' : 'Ticked'} in ${params.path}: ${newText.trim()}` }], details: { path: params.path } };
    },
  });
}
