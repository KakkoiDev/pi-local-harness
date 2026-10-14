const entryType = 'harness-timestamp';

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
  let failed = false, verbose = Boolean(options.verbose);
  const stamp = label => pi.appendEntry(entryType, { label, timestamp: now(), timeZone });
  // Round 6 (T_Noise): the stamps stay in the session record, but the transcript shows one header per Pi message,
  // "Pi 15:12" with the time dim, and nothing else; a failure or a stop still shows. /verbose on shows every stamp.
  const dim = text => `\x1b[2m${text}\x1b[22m`;
  pi.registerEntryRenderer(entryType, entry => ({
    render(width) {
      const data = entry.data, columns = Math.max(1, width);
      const wrap = text => Array.from({ length: Math.ceil(text.length / columns) }, (_, index) => text.slice(index * columns, (index + 1) * columns));
      if (verbose) return wrap(`${formatTimestamp(data.timestamp, data.timeZone)} ${data.label}`).map(dim);
      const time = formatTimestamp(data.timestamp, data.timeZone).slice(12, 17);
      if (data.label === 'Assistant message started') return [`\x1b[1mPi\x1b[22m ${dim(time)}`];
      if (/failed|stopped/i.test(data.label)) return [dim(`${time} ${data.label}`)];
      return [];
    },
    invalidate() {},
  }));
  pi.registerCommand?.('verbose', {
    description: 'Harness: show every timestamp (on) or one header per Pi message (off).',
    getArgumentCompletions: prefix => ['on', 'off'].filter(word => word.startsWith(prefix)).map(word => ({ value: word, label: word })),
    handler: async (args = '', ctx) => { verbose = String(args).trim() !== 'off'; ctx?.ui?.notify?.(verbose ? 'Timestamps: every step (/verbose off hides them).' : 'Timestamps: one header per Pi message.', 'info'); },
  });
  // [CANARY] starts every answer so the harness can spot instruction drift (harness/memory.mjs); people never see it.
  pi.registerMarkdownTransformer?.((markdown, context) => (context?.messageType === 'assistant' ? markdown.replace(/^\s*\[CANARY\]\s*/, '') : markdown));
  pi.on('input', event => {
    stamp(event.source === 'extension' ? 'Recovery question submitted' : 'Question submitted');
    return { action: 'continue' };
  });
  pi.on('agent_start', () => { failed = false; });
  pi.on('message_start', event => {
    if (event.message.role === 'assistant') stamp('Assistant message started');
  });
  pi.on('message_end', event => {
    const message = event.message;
    if (message.role === 'assistant') {
      failed ||= message.stopReason === 'error';
      stamp(message.stopReason === 'error' ? 'Assistant message failed' : message.stopReason === 'aborted' ? 'Assistant message stopped' : 'Assistant message completed');
    } else if (message.role === 'toolResult') {
      stamp(`Tool result ${message.isError ? 'failed' : 'received'}: ${message.toolName}`);
    }
  });
  pi.on('agent_settled', event => {
    stamp(event.aborted ? 'Task stopped' : failed ? 'Task failed' : 'Task completed');
  });
}
