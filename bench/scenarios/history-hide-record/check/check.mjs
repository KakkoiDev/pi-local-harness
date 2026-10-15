// Activity: after Show Task Record, a button says "Hide Task Record", and it hides the record.
const [, , project, harness] = process.argv;
const { startScratch, look, findChrome } = await import(`${harness}/harness/browser.mjs`);
if (!findChrome()) { console.log('No Chromium'); process.exit(2); }
const workbench = await startScratch({ root: project });
try {
  await fetch(workbench.url + '/api/jobs/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ project: workbench.project, message: 'Summarise the roadmap' }) });
  for (let i = 0; i < 30; i++) { const { jobs } = await fetch(workbench.url + '/api/workspace').then(r => r.json()); if (jobs.every(job => !['queued', 'running'].includes(job.status))) break; await new Promise(r => setTimeout(r, 1000)); }
  const labels = "[...document.querySelectorAll('button, [role=menuitem]')].filter(item => item.getClientRects().length).map(item => item.textContent.trim())";
  const shown = await look({ target: workbench.url, path: '/activity', width: 1440, height: 900, steps: [{ click: '.activity-request' }, { click: 'Show Task Record' }, { wait: 800 }], probes: [{ eval: labels }] });
  const hidden = await look({ target: workbench.url, path: '/activity', width: 1440, height: 900, steps: [{ click: '.activity-request' }, { click: 'Show Task Record' }, { wait: 800 }, { click: 'Hide Task Record' }, { wait: 800 }],
    probes: [{ eval: "(() => { const text = [...document.querySelectorAll('pre')].find(item => /Summarise the roadmap/.test(item.textContent)); return Boolean(text && text.getClientRects().length); })()" }] });
  const offers = (shown.facts.eval || []).some(label => /^hide task record$/i.test(label));
  const closes = hidden.steps.every(step => step.endsWith(': done')) && hidden.facts.eval === false;
  console.log(JSON.stringify({ offers, closes, steps: hidden.steps }));
  process.exitCode = offers && closes ? 0 : 1;
} finally { workbench.stop(); }
