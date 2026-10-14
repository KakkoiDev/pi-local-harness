// Recovery and refusal in terminal Pi (round 6, T_Gate; task 171). They are the harness speaking, so they lead with a
// bold sentence, not a code word, then what happened, then what to do next (dim). Web workers keep the old prefixes
// ("Harness recovery:", "Harness recovery stopped:", "Harness refused:"): harness/web_chat.py reads them.
import { wrap } from './terminal-render.mjs';

const KINDS = {
  loop: { glyph: '!', sentence: 'Harness stopped a loop.', next: 'Pi asks again another way · Esc stops it', web: 'Harness recovery' },
  hang: { glyph: '!', sentence: 'Harness stopped a hang.', next: 'Pi asks again another way · Esc stops it', web: 'Harness recovery' },
  canary: { glyph: '!', sentence: 'Pi drifted from its instructions.', next: 'Pi reads AGENTS.md again and answers again · Esc stops it', web: 'Harness recovery' },
  stopped: { glyph: '✗', sentence: 'Harness stopped retrying.', next: 'Ask again with a hint, or in other words', web: 'Harness recovery stopped' },
  'gate-failed': { glyph: '✗', sentence: 'Gate could not check a tool call.', next: '/doctor checks Gate · ask again once it answers', web: 'Harness refused' },
  refused: { glyph: '■', sentence: 'Another request is running.', next: '/queue shows it · stop it in the web Activity, then send yours again', web: 'Harness refused' },
};

/** The notice for `kind`, from the detail the harness has (a recovery reason, the log path, the lock's message). */
export function harnessNotice(kind, detail) {
  const shape = KINDS[kind];
  const said = kind === 'stopped' ? `The problem came back after one retry; the incident is saved in ${detail}.`
    : kind === 'refused' ? `Pi works on one request at a time; yours was not sent.`
    : kind === 'gate-failed' ? `${detail}. Nothing ran, and the turn stopped so that nothing works around Gate (G-011).`
    : String(detail).replace(/^(Loop|Hang) detected: |^Instruction drift: /, '').replace(/^./, letter => letter.toUpperCase());
  const web = kind === 'gate-failed' ? `Gate could not check a tool call (${detail}); the request stopped. Nothing ran.` : kind === 'stopped' ? `recovery repeated. Stopped automatic retries; the incident is saved in ${detail}.` : detail;
  return { kind, glyph: shape.glyph, sentence: shape.sentence, detail: said, next: shape.next, web: `${shape.web}: ${web}` };
}

/** Its lines at `width`: the bold sentence, then the detail and the dim next step indented by two. */
export function renderNotice(notice, width = 80) {
  const inner = Math.max(20, width - 2);
  return [`\x1b[1m${notice.glyph} ${notice.sentence}\x1b[22m`,
    ...wrap(notice.detail, inner).map(line => `  ${line}`),
    ...wrap(notice.next, inner).map(line => `  \x1b[2m${line}\x1b[22m`)];
}
