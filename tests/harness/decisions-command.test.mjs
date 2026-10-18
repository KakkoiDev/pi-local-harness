// Task 273 (board T_Decisions): terminal Pi's /decisions lists the last request's decisions with their authors, through
// the same backend as the web's decision row (harness/decision_rows.py), drawn by the console's renderer.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { installConsole, runAdmin } from '../../harness/console.mjs';

const row = (request, kind, who, answer, extra = {}) => JSON.stringify({ time: '2026-10-18T05:05:00.000+00:00', request, kind, who, answer, ...extra });

test('/decisions shows the last request’s decisions with you, auto, Laya, code and model; ~ marks automatic ones', async () => {
  const data = mkdtempSync(join(tmpdir(), 'plh-decisions-'));
  const before = process.env.PI_AGENT_DATA; process.env.PI_AGENT_DATA = data;
  try {
    writeFileSync(join(data, 'decisions.jsonl'), [
      row('old', 'phase', 'person', 'discussion', { rule: 'G-015' }),
      row('job1', 'task_kind', 'person', 'docs'),
      row('job1', 'question_answer', 'code', { option: 0 }, { rule: 'auto.recommendation', automatic: true }),
      row('job1', 'task_files', 'laya', 2, { confidence: 0.97 }),
      row('job1', 'guide_chosen', 'code', ['planning'], { rule: 'guides.attach' }),
      row('job1', 'recommendation', 'model', { option: 0 }, { proposal: true }),
    ].join('\n') + '\n');
    const commands = {}, messages = [];
    installConsole({ registerCommand: (name, options) => { commands[name] = options; }, sendMessage: message => messages.push(message) }, { run: runAdmin });
    assert.ok(commands.decisions, 'registered as a slash command');
    await commands.decisions.handler('');
    const text = messages.at(-1).content;
    assert.match(text, /^\/decisions\n\n── Decisions · job1/);
    assert.match(text, /✓ Kind\s+docs\s+you/);
    assert.match(text, /~ Question\s+option 1\s+auto/);
    assert.match(text, /✓ Files\s+2 files\s+Laya/);
    assert.match(text, /~ Recommended option\s+the first option\s+model/);
    assert.doesNotMatch(text, /Guide/, 'Beginner (the default): decisions made by code are hidden');
    assert.match(text, /4 · 2 automatic/);
    await commands.decisions.handler('--all');
    assert.match(messages.at(-1).content, /✓ Guide\s+planning\s+code.*guides\.attach/);
    assert.match(messages.at(-1).content, /Laya.*0\.97/, 'the expert form shows Laya’s confidence');
  } finally {
    if (before === undefined) delete process.env.PI_AGENT_DATA; else process.env.PI_AGENT_DATA = before;
    rmSync(data, { recursive: true, force: true });
  }
});
