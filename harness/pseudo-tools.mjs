// Task 324: tool calls a model wrote as text instead of calling the tool (live, gemma4: "<execute_tool>\nread{path:
// app/db.py}\n</execute_tool>"; others write ```tool_code blocks or {"name": …, "arguments": …}). Nothing ran. Each one
// becomes a short readable note, in the answer the person sees and in the session Pi reads back, so no later turn
// (or a bigger model on the next request) imitates the markup.
const BLOCKS = [
  /<(execute_tool|tool_call|tool_code|function_call)>\s*([\s\S]*?)\s*<\/\1>/gi,
  /```(?:tool_code|tool_call|tool|function_call)\s*\n([\s\S]*?)```/gi,
  /\{\s*"(?:name|tool)"\s*:\s*"([\w.-]+)"\s*,\s*"(?:arguments|parameters|args|input)"\s*:\s*\{[^{}]*\}\s*\}/g,
];
const NOTE = name => `(Nothing ran: a tool call${name ? ` to ${name}` : ''} was written as text instead of being called.)`;
const toolName = body => String(body || '').match(/^\s*([A-Za-z_][\w.-]*)\s*[({]/)?.[1] || String(body || '').match(/"(?:name|tool)"\s*:\s*"([\w.-]+)"/)?.[1] || '';

/** The text with each pseudo tool call replaced by a note, and how many there were. */
export function pseudoToolCalls(text) {
  let count = 0, value = String(text || '');
  value = value.replace(BLOCKS[0], (_, _tag, body) => { count++; return NOTE(toolName(body)); });
  value = value.replace(BLOCKS[1], (_, body) => { count++; return NOTE(toolName(body)); });
  value = value.replace(BLOCKS[2], (_, name) => { count++; return NOTE(name); });
  return { text: value, count };
}
