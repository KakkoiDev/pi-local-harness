// Recovery and refusal in terminal Pi (round 6, T_Gate; task 171). They are the harness speaking, so they lead with a
// bold sentence, not a code word, then what happened, then what to do next (dim). Web workers keep the old prefixes
// ("Harness recovery:", "Harness recovery stopped:", "Harness refused:"): harness/web_chat.py reads them.
import { wrap } from './terminal-render.mjs';

const KINDS = {
  loop: { glyph: '!', sentence: 'Harness stopped a loop.', next: 'Pi asks again another way · Esc stops it', web: 'Harness recovery' },
  stuck: { glyph: '!', sentence: 'Harness stopped a repeat.', next: 'Pi asks again another way · Esc stops it', web: 'Harness recovery' },
  hang: { glyph: '!', sentence: 'Harness stopped a hang.', next: 'Pi asks again another way · Esc stops it', web: 'Harness recovery' },
  canary: { glyph: '!', sentence: 'Pi drifted from its instructions.', next: 'Pi reads AGENTS.md again and answers again · Esc stops it', web: 'Harness recovery' },
  stopped: { glyph: '✗', sentence: 'Harness stopped retrying.', next: 'Ask again with a hint, or in other words', web: 'Harness recovery stopped' },
  committed: { glyph: '✓', sentence: 'Committed.', next: 'The harness made the task, ticked it and committed locally · git push when you want', web: 'Harness note' },
  'commit-failed': { glyph: '!', sentence: 'The harness could not commit.', next: 'The work is there, uncommitted · /reports', web: 'Harness note' },
  'wake-up': { glyph: '▶', sentence: 'Harness woke Pi up.', next: 'Pi continues the request · Esc stops it', web: 'Harness recovery' },
  unverified: { glyph: '!', sentence: 'Not verified.', next: 'Run the tests before relying on it', web: 'Harness note' },
  'gate-failed': { glyph: '✗', sentence: 'Gate could not check a tool call.', next: 'Pi continues · /reports lists it', web: 'Harness note' },
  refused: { glyph: '■', sentence: 'Another request is running.', next: '/queue shows it · stop it in the web Activity, then send yours again', web: 'Harness refused' },
};

/** The notice for `kind`, from the detail the harness has (a recovery reason, the log path, the lock's message). */
export function harnessNotice(kind, detail) {
  const shape = KINDS[kind];
  const said = kind === 'stopped' ? `The problem came back after one retry; the incident is saved in ${detail}.`
    : kind === 'refused' ? `Pi works on one request at a time; yours was not sent.`
    : kind === 'committed' ? `“${detail}”, verified (a test failed first, then passed on the final code).`
    : kind === 'commit-failed' ? String(detail)
    : kind === 'wake-up' ? `It stopped with work open: ${detail} changed and no passing test ran on it.`
    : kind === 'unverified' ? `Code changed (${detail}) and no test passed on it after the last change (G-012), whatever the answer says.`
    : kind === 'gate-failed' ? `${detail}. That call did not run; Pi was told and continues (G-011).`
    : String(detail).replace(/^(Loop|Hang) detected: |^Instruction drift: |^Stuck: /, '').replace(/^./, letter => letter.toUpperCase());
  const web = kind === 'gate-failed' ? `Gate could not check a tool call (${detail}); that call did not run and Pi continues.` : kind === 'stopped' ? `recovery repeated. Stopped automatic retries; the incident is saved in ${detail}.` : detail;
  return { kind, glyph: shape.glyph, sentence: shape.sentence, detail: said, next: shape.next, web: `${shape.web}: ${web}` };
}

/** Its lines at `width`: the bold sentence, then the detail and the dim next step indented by two. */
export function renderNotice(notice, width = 80) {
  const inner = Math.max(20, width - 2);
  return [`\x1b[1m${notice.glyph} ${notice.sentence}\x1b[22m`,
    ...wrap(notice.detail, inner).map(line => `  ${line}`),
    ...wrap(notice.next, inner).map(line => `  \x1b[2m${line}\x1b[22m`)];
}
