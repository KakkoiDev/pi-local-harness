// Off must reach the model as "no thinking": run real Pi with the project's provider against a capture endpoint.
import { createServer } from 'node:http';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
const [, , project] = process.argv;
const bodies = [];
const server = createServer((request, response) => {
  let text = ''; request.on('data', chunk => text += chunk); request.on('end', () => {
    try { bodies.push(JSON.parse(text)); } catch {}
    response.writeHead(200, { 'Content-Type': 'text/event-stream' });
    const chunk = finish => JSON.stringify({ id: 'x', object: 'chat.completion.chunk', model: 'm', choices: [{ index: 0, delta: finish ? {} : { role: 'assistant', content: 'ok' }, finish_reason: finish }] });
    response.end(`data: ${chunk(null)}\n\ndata: ${chunk('stop')}\n\ndata: [DONE]\n\n`);
  });
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const agent = mkdtempSync(join(tmpdir(), 'pi-bench-agent-'));
writeFileSync(join(agent, 'models.json'), JSON.stringify({ providers: { ollama: { baseUrl: `http://127.0.0.1:${server.address().port}/v1` } } }));
writeFileSync(join(agent, 'ext.mjs'), `import { localModels } from ${JSON.stringify(join(project, 'harness/provider.mjs'))};\nimport { readFileSync } from 'node:fs';\nexport default function (pi) { pi.registerProvider('ollama', localModels(JSON.parse(readFileSync(${JSON.stringify(join(agent, 'models.json'))}, 'utf8')).providers.ollama)); }\n`);
const model = 'qwen3.8:27b-mlx';
await new Promise(resolve => { const child = execFile('pi', ['--no-extensions', '-e', join(agent, 'ext.mjs'), '-p', '--no-session', '--provider', 'ollama', '--model', model, '--thinking', 'off', 'hi'],
  { env: { ...process.env, PI_CODING_AGENT_DIR: agent, PI_HARNESS_MODEL: model, PI_HARNESS_MODEL_THINKING: '1' }, timeout: 120000 }, () => resolve()); child.stdin.end(); }); // pi -p waits for input on an open stdin
server.close();
const body = bodies[0] || {};
const off = body.reasoning_effort === 'none' || body.think === false || body.enable_thinking === false || body.reasoning?.effort === 'none' || body.reasoning?.enabled === false;
console.log(JSON.stringify({ sent: Object.fromEntries(Object.entries(body).filter(([key]) => /reason|think/.test(key))), off }));
process.exit(off ? 0 : 1);
