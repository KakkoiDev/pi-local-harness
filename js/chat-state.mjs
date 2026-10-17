export function decodeLines(buffer, chunk, final = false) {
  const lines = (buffer + chunk).split('\n');
  const rest = final ? '' : lines.pop();
  return { rest, events: lines.filter(line => line.trim()).map(line => JSON.parse(line)) };
}
export function applyDelta(state, event) {
  if (event.type === 'agent_start') { state.status = 'Thinking…'; state.text = ''; }
  if (event.type === 'status') state.status = event.text;
  if (event.type === 'message_update') {
    const delta = event.assistantMessageEvent;
    if (delta.type === 'text_start') state.text = '';
    if (delta.type === 'text_delta') { state.text += delta.delta; state.status = 'Responding…'; }
    if (delta.type === 'thinking_delta') { state.thinking += delta.delta; state.status = 'Thinking…'; }
  }
  if (event.type === 'tool_execution_start') state.status = `Using ${event.toolName}…`;
  if (event.type === 'tool_execution_end') state.status = event.isError ? 'Tool failed; reconsidering…' : 'Tool finished; thinking…';
  if (event.type === 'extension_ui_request' && event.method === 'notify') state.status = event.message;
  if (event.type === 'error') state.error = event.error;
  return state;
}

// Activity returns to a live answer; historical requests retain their place in the transcript.
export function revealChatRequest(thread, article, status) {
  if (status === 'running' || status === 'queued') thread.scrollTop = thread.scrollHeight;
  else article?.scrollIntoView({block:'center'});
}
