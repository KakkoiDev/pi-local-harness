const entryType = 'harness-timestamp';

/** What the transcript shows, shared with the tool rows: `/verbose on` adds times to headers and rows (round 7, T_Noise). */
export const display = { verbose: false };

export function formatTimestamp(timestamp, timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23', timeZoneName: 'longOffset',
  }).formatToParts(new Date(timestamp)).map(part => [part.type, part.value]));
  const offset = parts.timeZoneName.replace('GMT', '') || '+00:00';
  return `[${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second} ${offset}]`;
}

export function installTimestamps(pi, options = {}) {
  if (!pi.registerEntryRenderer || !pi.appendEntry) return;
  const now = options.now || Date.now;
  const timeZone = options.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  let failed = false, turn;
  display.verbose = Boolean(options.verbose);
  const turns = new Map(); // a request's span and tool count, for its header under /verbose on (this session only)
  const stamp = (label, extra = {}) => pi.appendEntry(entryType, { label, timestamp: now(), timeZone, ...extra });
  // Round 6 (T_Noise): the stamps stay in the session record, but the transcript shows one header per Pi message,
  // "Pi 15:12" with the time dim, and nothing else; a failure or a stop still shows. Round 7: /verbose on puts the
  // request's span, duration and tool count on its first header ("Pi 15:12:56 → 15:13:02 · 6 s · 2 tool calls"),
  // never as separate lines; the tools' own times go on their rows (tool-render.mjs).
  const dim = text => `\x1b[2m${text}\x1b[22m`;
  const clock = (timestamp, zone, seconds) => formatTimestamp(timestamp, zone).slice(12, seconds ? 20 : 17);
  pi.registerEntryRenderer(entryType, entry => ({
    render() {
      const data = entry.data;
      if (display.verbose && data.label === 'Assistant message started') {
        const span = turns.get(data.turn);
        if (!data.first || !span) return data.first || !data.turn ? [`\x1b[1mPi\x1b[22m ${dim(clock(data.timestamp, data.timeZone, true))}`] : [];
        const end = span.end === undefined ? '…' : `${clock(span.end, data.timeZone, true)} · ${Math.round((span.end - span.start) / 1000)} s · ${span.tools} tool call${span.tools === 1 ? '' : 's'}`;
        return [`\x1b[1mPi\x1b[22m ${dim(`${clock(span.start, data.timeZone, true)} → ${end}`)}`];
      }
      const time = clock(data.timestamp, data.timeZone);
      if (data.label === 'Assistant message started') return [`\x1b[1mPi\x1b[22m ${dim(time)}`];
      if (/^(Assistant message|Task) (failed|stopped)/.test(data.label)) return [dim(`${time} ${data.label}`)]; // a failed tool shows on its own row
      return [];
    },
    invalidate() {},
  }));
  pi.registerCommand?.('verbose', {
    description: 'Harness: times on the Pi header and each tool row (on), or one header per Pi message (off).',
    getArgumentCompletions: prefix => ['on', 'off'].filter(word => word.startsWith(prefix)).map(word => ({ value: word, label: word })),
    handler: async (args = '', ctx) => { display.verbose = String(args).trim() !== 'off'; ctx?.ui?.notify?.(display.verbose ? 'Times: the span and tool count on each Pi header, each tool\'s time on its row (/verbose off hides them).' : 'Times: one header per Pi message.', 'info'); },
  });
  // [CANARY] starts every answer so the harness can spot instruction drift (harness/memory.mjs); people never see it.
  pi.registerMarkdownTransformer?.((markdown, context) => (context?.messageType === 'assistant' ? markdown.replace(/^\s*\[CANARY\]\s*/, '') : markdown));
  pi.on('input', event => {
    turn = (turn || 0) + 1; turns.set(turn, { tools: 0 });
    stamp(event.source === 'extension' ? 'Recovery question submitted' : 'Question submitted');
    return { action: 'continue' };
  });
  pi.on('agent_start', () => { failed = false; });
  pi.on('message_start', event => {
    if (event.message.role !== 'assistant') return;
    const span = turns.get(turn), first = Boolean(span) && span.start === undefined;
    if (first) span.start = now();
    stamp('Assistant message started', span ? { turn, first } : {});
  });
  pi.on('message_end', event => {
    const message = event.message;
    if (message.role === 'assistant') {
      failed ||= message.stopReason === 'error';
      stamp(message.stopReason === 'error' ? 'Assistant message failed' : message.stopReason === 'aborted' ? 'Assistant message stopped' : 'Assistant message completed');
    } else if (message.role === 'toolResult') {
      stamp(`Tool result ${message.isError ? 'failed' : 'received'}: ${message.toolName}`);
      const span = turns.get(turn); if (span) span.tools += 1;
    }
  });
  pi.on('agent_settled', event => {
    stamp(event.aborted ? 'Task stopped' : failed ? 'Task failed' : 'Task completed');
    const span = turns.get(turn); if (span && span.start !== undefined && span.end === undefined) span.end = now();
  });
}
