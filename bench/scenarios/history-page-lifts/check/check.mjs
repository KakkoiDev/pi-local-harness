// At 1024x560 with a long conversation, after a message, nothing around the chat thread may scroll (the window lifted).
const [, , project, harness] = process.argv;
const { startScratch, look, findChrome } = await import(`${harness}/harness/browser.mjs`);
if (!findChrome()) { console.log('No Chromium'); process.exit(2); }
const workbench = await startScratch({ root: project });
try {
  const post = (path, body) => fetch(workbench.url + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json());
  for (let i = 1; i <= 8; i++) await post('/api/jobs/create', { project: workbench.project, message: `Question ${i}: tell me more about this project, in some detail.` });
  for (let i = 0; i < 60; i++) { const { jobs } = await fetch(workbench.url + '/api/workspace').then(r => r.json()); if (!jobs.some(job => ['queued', 'running'].includes(job.status))) break; await new Promise(r => setTimeout(r, 1000)); }
  const result = await look({ target: workbench.url, path: `/p/${workbench.project}/chat`, width: 1024, height: 560,
    steps: [{ type: { into: '#prompt', text: 'One more' } }, { press: 'Enter' }, { wait: 3000 }],
    probes: ['scrolled', { eval: "(() => { const desk = document.getElementById('desk'); return desk ? desk.scrollHeight - desk.clientHeight : 0; })()" }] });
  const thread = document => document;
  const outside = (result.facts.scrolled || []).filter(item => !/thread|messages|composer|prompt/.test(item.element));
  console.log(JSON.stringify({ deskExtra: result.facts.eval, outside, steps: result.steps }));
  process.exitCode = result.facts.eval > 1 || outside.length ? 1 : 0;
} finally { workbench.stop(); }
