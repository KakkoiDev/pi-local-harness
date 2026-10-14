import { readFileSync, appendFileSync } from 'node:fs';
export function loadMemory(path) { return readFileSync(path, 'utf8'); }
export function missingCanary(message) {
  // Only the final answer must start with [CANARY]; a short preamble before a tool call (stopReason toolUse) is not an answer.
  if (message.role !== 'assistant' || ['toolUse', 'aborted', 'error'].includes(message.stopReason)) return false;
  const text = (message.content || []).filter(block => block.type === 'text').map(block => block.text).join('').trimStart();
  return Boolean(text) && !text.startsWith('[CANARY]');
}
export function recordLesson(path, kind) {
  const lessons = {
    loop: 'If an exact three-line thought sequence repeats twice within the last 100 thought lines, stop and change approach. The harness checks every 10 seconds.',
    hang: 'A thought phase with no active model operation or no streamed activity for the configured timeout requires abort, compaction, and reasking with previous reasoning. Normal idle sessions are healthy.',
    canary: 'Start every user-facing response with [CANARY]. If omitted, the harness compacts and reinjects the current AGENTS.md before retrying.',
  };
  const lesson = lessons[kind];
  if (!lesson || loadMemory(path).includes(lesson)) return;
  appendFileSync(path, `\n### Harness lesson: ${kind}\n- ${lesson}\n`);
}
