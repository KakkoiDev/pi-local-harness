// Task 324: tool calls written as text, and turns that only describe a tool call, are System 1's to catch.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pseudoToolCalls } from '../../harness/pseudo-tools.mjs';
import harness from '../../harness/extension.mjs';

test('a tool call written as text becomes a readable note (gemma4 live, ```tool_code, JSON)', () => {
  assert.deepEqual(pseudoToolCalls('Reading.\n<execute_tool>\nread{path:app/db.py}\n</execute_tool>'), { text: 'Reading.\n(Nothing ran: a tool call to read was written as text instead of being called.)', count: 1 });
  assert.equal(pseudoToolCalls('```tool_code\nbash{command: "ls"}\n```').count, 1);
  assert.equal(pseudoToolCalls('{"name": "write", "arguments": {"path": "a.py"}}').text, '(Nothing ran: a tool call to write was written as text instead of being called.)');
  assert.deepEqual(pseudoToolCalls('Use `read` to open a file; JSON like {"a": 1} stays.'), { text: 'Use `read` to open a file; JSON like {"a": 1} stays.', count: 0 });
});

async function turn(answer, { thinking = '', question = 'Plan the icons', missingPlan = false, read = false, stopReason = 'stop', compactFails = false } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'pi-pseudo-')), saved = { ...process.env }, fetchBefore = globalThis.fetch;
  Object.assign(process.env, { PI_AGENT_DATA: join(dir, 'data'), PI_HARNESS_SHARED_PORT: '1', PI_HARNESS_TOKEN: 't', PI_HARNESS_WAKE_UPS: '3' });
  const handlers = {}, sent = [], calls = [], compactions=[];
  let ends = 0, refreshes=0; const prompts=[];
  globalThis.fetch = async (url, options) => { const path = new URL(url).pathname; calls.push(path); const body = JSON.parse(options?.body || '{}'); return { ok: true, json: async () => path === '/context' ? {text:'SELECTED_FILE '.repeat(1000),execution:`Current phase: ${refreshes++?'discussion':'implementation'}; Active approved task: tasks/003-map.md`} : path === '/verification' ? { verification: { state: 'same', code: [], verified: false } } : path === '/request/end' && missingPlan && body.review && !ends++ ? { result: { outcome: 'continue', kind: 'plan', instruction: 'No plan was submitted. Call propose_plan.' } } : {} }; };
  const pi = { on: (name, fn) => handlers[name] = fn, appendEntry() {}, registerEntryRenderer() {}, sendUserMessage: text => sent.push(text) };
  const ctx = { cwd: dir, compact:options=>{compactions.push(options.customInstructions);if(compactFails)options.onError(new Error("Nothing to compact (session too small)"));else options.onComplete();}, ui: { notify() {}, setWidget() {}, setStatus() {} } };
  try {
    harness(pi, { root: dir + '/', setInterval: () => ({ unref() {} }) }); await handlers.session_start({}, ctx);
    const results = [];
    const history=[{role:"user",content:[{type:"text",text:question}]},{role:"assistant",content:[{type:"toolCall",id:"read",name:"read",arguments:{path:"ROADMAP.md"}}]},{role:"toolResult",toolCallId:"read",toolName:"read",content:[{type:"text",text:"OLD_TOOL_OUTPUT".repeat(1000)}]}];const before=JSON.stringify(history);let projected,afterRetryTool;

    for (let round = 0; round < 2; round++) {
      await handlers.input({ source: round ? 'extension' : 'interactive', text: round ? sent.at(-1) : question }, ctx); handlers.agent_start({}, ctx);
      if(!round)await handlers.context?.({messages:history},ctx);
      prompts.push(handlers.before_agent_start({systemPrompt:'Instructions'}).systemPrompt);
      if(read){await handlers.tool_execution_start?.({toolCallId:'read',toolName:'read',args:{path:'ROADMAP.md'}},ctx);await handlers.tool_execution_end?.({toolCallId:'read',toolName:'read',isError:false,result:{content:[{type:'text',text:'# Plan'}]}},ctx);}
      results.push(handlers.message_end({ message: { role: 'assistant', content: [...(thinking ? [{ type: 'thinking', thinking }] : []), ...(answer ? [{ type: 'text', text: answer }] : [])], stopReason } }));
      await handlers.agent_settled({ aborted: false });
    }
    if(sent.length)projected=await handlers.context?.({messages:[...history,{role:"user",content:[{type:"text",text:sent[0]}]}]},ctx);
    if(projected)afterRetryTool=await handlers.context?.({messages:[...projected.messages,{role:"assistant",content:[{type:"toolCall",id:"fresh",name:"read",arguments:{path:"README.md"}}]},{role:"toolResult",toolCallId:"fresh",toolName:"read",content:[{type:"text",text:"FRESH_TOOL_OUTPUT"}]}]},ctx);
    return { sent, results, calls, compactions, prompts, projected, afterRetryTool, historyUnchanged:before===JSON.stringify(history) };
  } finally { handlers.session_shutdown?.(); globalThis.fetch = fetchBefore; for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key]; Object.assign(process.env, saved); rmSync(dir, { recursive: true, force: true }); }
}

test('a pseudo tool call is nudged once, whatever the request says, and never stays in the session', async () => {
  const { sent, results } = await turn('[CANARY] <execute_tool>\nread{path:app/db.py}\n</execute_tool>', { question: 'What is in the database file?' });
  assert.equal(sent.length, 1, 'one nudge per request'); assert.match(sent[0], /tool interface/);
  assert.doesNotMatch(results[0].message.content.at(-1).text, /execute_tool/, 'the session keeps the note, not the markup');
});

test('a turn that only describes its tool call (no answer, no tool) is nudged once', async () => {
  const { sent } = await turn('', { thinking: 'I will proceed with the propose_plan call.' });
  assert.deepEqual(sent.map(text => text.replace(/^Continue \(harness wake-up \d+\): /, '')), ['Your turn ended without an answer. Reply to the person now, using tools only if needed and allowed by the current phase. Do not repeat your reasoning. If older history or tool results are omitted, read project files for missing facts; never infer approvals.']);
});


test('a fluent answer without the plan follows the System 1 retry and then settles', async () => {
  const { sent, calls } = await turn('[CANARY] The counter will have an Add button.', { missingPlan: true });
  assert.equal(sent.length, 1);
  assert.match(sent[0], /No plan was submitted.*propose_plan/);
  assert.equal(calls.filter(path => path === '/request').length, 1, 'the retry retains the request');
  assert.equal(calls.filter(path => path === '/request/end').length, 2, 'the next turn can settle');
});

test('a direct question is not retried as a missing plan', async () => {
  const { sent } = await turn('[CANARY] Who will use this app?', { missingPlan: true });
  assert.equal(sent.length, 0);
});

for (const read of [false,true]) test(`empty reasoning-only turn recovers once, read=${read}`, async () => {
  const { sent } = await turn('', { thinking: 'Need to tidy the roadmap.', read });
  assert.equal(sent.length,1);
  assert.match(sent[0], /answer|reply/i);
});

test('a token-limited reasoning-only reply after reading is recovered once',async()=>{const {sent,compactions}=await turn('',{thinking:'Need to tidy the roadmap.',read:true,stopReason:'length'});assert.equal(compactions.length,0);assert.equal(sent.length,1);assert.match(sent[0],/answer|reply/i);});

 test('US-369 terminal: an output-limited reply recovers when the session is too small to compact',async()=>{const {sent,compactions,projected,afterRetryTool,historyUnchanged}=await turn('',{question:'Explain this roadmap',thinking:'Need to tidy.',read:true,stopReason:'length',compactFails:true});assert.equal(sent.length,1);assert.equal(compactions.length,0,'small-window recovery must not depend on Pi compaction');assert.ok(projected?.messages);assert.match(JSON.stringify(projected.messages),/Explain this roadmap/);assert.doesNotMatch(JSON.stringify(projected.messages),/OLD_TOOL_OUTPUT/);assert.equal(historyUnchanged,true);assert.match(JSON.stringify(afterRetryTool.messages),/FRESH_TOOL_OUTPUT/);});

 test('US-371 the agent receives the current phase and approved task after a phase change',async()=>{
  const {prompts,sent}=await turn('',{question:'Build the map',thinking:'Need room.',read:true,stopReason:'length'});
  assert.equal(sent.length,1);assert.match(prompts[0],/Current phase: implementation/);
  assert.match(prompts[1],/Current phase: discussion/);assert.match(prompts[1],/Active approved task: tasks\/003-map.md/);
  assert.match(prompts[1],/Selected context shortened/);
 });
