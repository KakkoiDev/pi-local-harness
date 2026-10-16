import { test } from 'node:test';
import assert from 'node:assert/strict';
import { harnessTools, activeTools } from '../../harness/tool-choice.mjs';

test('each harness tool is offered only where it helps (strategy 4: a small tool set for a small model)', () => {
  assert.deepEqual(harnessTools('Rename area_rect to rectangle_area', { terminal: false, tasks: true }), ['task_box', 'ask_choices', 'propose_plan']);
  assert.deepEqual(harnessTools("then click on see chat button to go back to the chat then the view is lifted up. there is white at the bottom of the screen", { terminal: false, tasks: true }), ['task_box', 'ask_choices', 'propose_plan', 'browser']);
  assert.deepEqual(harnessTools('The page jumps up when I add things', { terminal: false, tasks: false }), ['browser']);
  assert.deepEqual(harnessTools('fix style.css', { terminal: true, tasks: false }), ['harness', 'browser'], 'a page file named; the console in the terminal');
  assert.deepEqual(harnessTools('Is anything stuck?', { terminal: true, tasks: false }), ['harness']);
});

test('the active set keeps Pi\'s own tools and other extensions\' tools, and switches only the harness\'s', () => {
  assert.deepEqual(activeTools(['read', 'bash', 'edit', 'harness', 'task_box', 'browser', 'other_ext'], ['browser']), ['read', 'bash', 'edit', 'other_ext', 'browser']);
  assert.deepEqual(activeTools(['read', 'bash'], ['harness'], ['read', 'bash', 'harness']), ['read', 'bash', 'harness'], 'adds a harness tool that is registered');
  assert.deepEqual(activeTools(['read'], ['browser'], ['read']), ['read'], 'never one that is not registered');
});
