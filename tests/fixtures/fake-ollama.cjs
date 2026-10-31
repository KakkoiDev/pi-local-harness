// A scripted stand-in for Ollama (task 327, the golden journey): the real Pi and the real harness extension talk to it
// exactly as they talk to Ollama, so the model is the only thing faked. It answers the harness's model listing
// (/api/tags, /api/show, /api/ps, /api/generate for a switch) and Pi's OpenAI-compatible stream (/v1/chat/completions),
// on 127.0.0.1 only, and never reaches the network.
//
// A script (tests/browser/journey/*.json) is a list of model turns, used in order:
//   {"when": "regex", "say": "text", "think": "thought", "calls": [{"name": "read", "arguments": {...}}], "hang": true,
//    "finish": "stop", "slow": seconds}
// Each chat request takes the first unused turn whose `when` matches the request's new input (everything after the last
// assistant message: the person's message, the harness's context, tool results); no `when` matches anything. A turn
// with `hang` sends its text (if any) and then nothing at all, with the connection left open: what a stalled Ollama
// runner does. A turn with `slow` streams its text over that many seconds (a long answer that keeps coming). Without a matching turn the model answers plainly (`default`), with the [CANARY] marker as the
// harness's AGENTS.md asks.
const http = require('node:http');

const MODELS = [
  { name: 'gemma4:26b-mlx', capabilities: ['completion', 'tools', 'thinking', 'vision'] },
  { name: 'qwen3:8b', capabilities: ['completion', 'tools', 'thinking'] },
  { name: 'tiny:1b', capabilities: ['completion'] },
];

function fakeOllama({ models = MODELS, loadMs = 300 } = {}) {
  const state = { turns: [], used: [], requests: [], other: [], hanging: new Set(), loaded: [], defaultSay: '[CANARY] Done.', server: null, url: null };
  const text = content => typeof content === 'string' ? content : Array.isArray(content) ? content.map(part => part?.text || '').join('') : '';
  /** What is new in a request: the messages after the last assistant message, as text ("tool <name>: <result>"). */
  const fresh = messages => {
    let last = -1; messages.forEach((message, index) => { if (message.role === 'assistant') last = index; });
    return messages.slice(last + 1).map(message => (message.role === 'tool' ? 'tool: ' : message.role + ': ') + text(message.content)).join('\n');
  };
  const chunk = (response, delta, finish = null) => response.write('data: ' + JSON.stringify({ id: 'fake', object: 'chat.completion.chunk', created: 1, model: 'fake', choices: [{ index: 0, delta, finish_reason: finish }] }) + '\n\n');
  function complete(body, response) {
    const input = fresh(body.messages || []);
    const index = state.turns.findIndex((turn, at) => !state.used[at] && (!turn.when || new RegExp(turn.when, 'i').test(input)));
    let turn = index >= 0 ? state.turns[index] : { say: state.defaultSay };
    if(turn.maxToolChars!==undefined && JSON.stringify((body.messages||[]).filter(message=>message.role==='tool')).length>turn.maxToolChars)turn={think:'The window is still full.',finish:'length'};
    if (index >= 0) state.used[index] = true;
    state.requests.push({ input, turn: index, model: body.model, messages: body.messages || [], tools: (body.tools || []).map(tool => tool.function?.name) });
    if(turn.error){response.writeHead(turn.status||400,{'Content-Type':'application/json'});response.end(JSON.stringify({message:turn.error}));return;}
    if (!body.stream) {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ id: 'fake', object: 'chat.completion', created: 1, model: 'fake', choices: [{ index: 0, message: { role: 'assistant', content: turn.say || '' }, finish_reason: 'stop' }] }));
      return;
    }
    response.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' });
    chunk(response, { role: 'assistant', content: '' });
    if (turn.think) chunk(response, { reasoning_content: turn.think });
    const pieces = turn.say ? String(turn.say).match(/[\s\S]{1,40}/g) : [];
    if (turn.slow) {  // a long answer: the pieces arrive over `slow` seconds, so the model never goes quiet
      state.hanging.add(response); response.on('close', () => state.hanging.delete(response));
      const every = turn.slow * 1000 / Math.max(1, pieces.length); let at = 0;
      const next = () => { if (!state.hanging.has(response)) return; if (at < pieces.length) { chunk(response, { content: pieces[at++] }); setTimeout(next, every); return; } state.hanging.delete(response); finish(response, turn); };
      return next();
    }
    for (const piece of pieces) chunk(response, { content: piece });
    if (turn.hang) { state.hanging.add(response); response.on('close', () => state.hanging.delete(response)); return; }
    finish(response, turn);
  }
  function finish(response, turn) {
    (turn.calls || []).forEach((call, at) => chunk(response, { tool_calls: [{ index: at, id: `call_${state.requests.length}_${at}`, type: 'function', function: { name: call.name, arguments: JSON.stringify(call.arguments || {}) } }] }));
    chunk(response, {}, turn.finish || (turn.calls?.length ? 'tool_calls' : 'stop'));
    response.write('data: [DONE]\n\n'); response.end();
  }
  state.server = http.createServer((request, response) => {
    let raw = ''; request.on('data', part => raw += part);
    request.on('end', () => {
      let body = {}; try { body = raw ? JSON.parse(raw) : {}; } catch {}
      const path = request.url.split('?')[0];
      const json = (value, status = 200) => { response.writeHead(status, { 'Content-Type': 'application/json' }); response.end(JSON.stringify(value)); };
      if (path === '/v1/chat/completions') return complete(body, response);
      state.other.push({ method: request.method, path, body });
      if (path === '/api/tags') return json({ models: models.map(model => ({ name: model.name, model: model.name, size: 1e9, details: {} })) });
      if (path === '/api/show') return json({ capabilities: (models.find(model => model.name === body.model || model.name === body.name) || {}).capabilities || [] });
      if (path === '/api/ps') return json({ models: state.loaded.map(name => ({ name, model: name, size_vram: 1e9 })) });
      if (path === '/api/version') return json({ version: '0.12.0' });
      if (path === '/api/generate') {  // load (keep_alive) or unload (keep_alive 0)
        if (body.keep_alive === 0) { state.loaded = state.loaded.filter(name => name !== body.model); return json({ done: true }); }
        return setTimeout(() => { state.loaded = [body.model]; json({ done: true, model: body.model }); }, loadMs);
      }
      if (path === '/v1/models') return json({ object: 'list', data: models.map(model => ({ id: model.name, object: 'model' })) });
      json({ error: 'not faked: ' + path }, 404);
    });
  });
  return {
    state,
    start: () => new Promise(resolve => state.server.listen(0, '127.0.0.1', () => { state.url = `http://127.0.0.1:${state.server.address().port}`; resolve(state.url); })),
    /** Replace the remaining turns with a script's (a file's {"turns": [...]} or a list). */
    script(turns) { state.turns = Array.isArray(turns) ? turns : turns.turns; state.used = []; },
    unused: () => state.turns.filter((_, at) => !state.used[at]),
    /** Close every hanging stream, as a restarted runner finally would. */
    release() { for (const response of state.hanging) response.destroy(); state.hanging.clear(); },
    stop: () => new Promise(resolve => { for (const response of state.hanging) response.destroy(); state.server.closeAllConnections?.(); state.server.close(() => resolve()); }),
  };
}

module.exports = { fakeOllama, MODELS };
