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
  let failed = false;
  const stamp = label => pi.appendEntry(entryType, { label, timestamp: now(), timeZone });
  pi.registerEntryRenderer(entryType, entry => ({
    render(width) {
      const data = entry.data;
      const text = `${formatTimestamp(data.timestamp, data.timeZone)} ${data.label}`;
      const columns = Math.max(1, width);
      return Array.from({ length: Math.ceil(text.length / columns) }, (_, index) => text.slice(index * columns, (index + 1) * columns));
    },
    invalidate() {},
  }));
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
