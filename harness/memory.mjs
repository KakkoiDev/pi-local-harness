import { readFileSync, appendFileSync } from 'node:fs';
export function loadMemory(path) { return readFileSync(path, 'utf8').replace('If omitted, the harness compacts and reinjects the current AGENTS.md before retrying.', 'Omissions are diagnostic; keep the answer without replaying the request.').replace('Recovery aborts the operation, compacts context, and reasks the original question with the incident, preceding reasoning, and current AGENTS.md.', 'Recovery aborts the operation and tries compaction; if unavailable, it resumes with reduced context. Current AGENTS.md is refreshed in the system prompt, never copied into recovery messages.'); }
export function missingCanary(message) {
  // Only the final answer must start with [CANARY]; a short preamble before a tool call (stopReason toolUse) is not an answer.
  if (message.role !== 'assistant' || ['toolUse', 'aborted', 'error'].includes(message.stopReason)) return false;
  const text = (message.content || []).filter(block => block.type === 'text').map(block => block.text).join('').trimStart();
  // The marker in code or bold (`[CANARY]`, **[CANARY]**) is still the marker: the model followed its instructions, and
  // treating it as drift made the harness compact and re-ask every answer (the owner's session.log, 2026-10-18).
  return Boolean(text) && !/^(?:\[CANARY\]|`{1,3}\[CANARY\]`{1,3}|\*\*\[CANARY\]\*\*|\*\[CANARY\]\*|__\[CANARY\]__|_\[CANARY\]_)/.test(text);
}
export function recordLesson(path, kind) {
  const lessons = {
    loop: 'If an exact three-line thought sequence repeats twice within the last 100 thought lines, stop and change approach. The harness checks every 10 seconds.',
    hang: 'A thought phase with no active model operation or no streamed activity for the configured timeout requires abort, compaction, and reasking with previous reasoning. Normal idle sessions are healthy.',
    canary: 'Start every user-facing response with [CANARY]. The harness records omissions as diagnostics; it does not replay a usable answer. Current instructions are refreshed in the system prompt.',
  };
  const lesson = lessons[kind];
  if (!lesson || loadMemory(path).includes(lesson)) return;
  appendFileSync(path, `\n### Harness lesson: ${kind}\n- ${lesson}\n`);
}
