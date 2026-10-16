import { tr } from './language.mjs';
// Terminal Pi's footer and workbench notifications (round 6, T_Footer and T_Workbench; task 171). One status item
// under the input: model · thinking │ state │ Gate today │ phone. The state uses the menu bar's words and glyphs; what
// needs the person inverts and names /queue until they look. Routine work only changes the footer; one notification
// appears when something new needs the person.
const ATTENTION = ['failed', 'stopped', 'interrupted'];
const WORD = { failed: 'Failed', stopped: 'Stopped', interrupted: 'Interrupted' };
const inverse = text => `\x1b[7m ${text} \x1b[27m`, dim = text => `\x1b[2m${text}\x1b[22m`;

/** The footer line from the workbench's /api/config and /api/workspace, and the problems already seen. */
export function footerText({ online = true, config = {}, jobs = [], projects = [], gate = {}, seen = new Set() } = {}) {
  if (!online) return inverse(tr('✗ Workbench not running · /doctor'));
  const model = `${config.model || '?'} · ${tr(config.thinking === false ? 'no thinking' : `${config.effort || 'high'} thinking`)}`;
  const attention = jobs.filter(job => ATTENTION.includes(job.status) && !seen.has(job.id));
  const running = jobs.filter(job => job.status === 'running'), waiting = jobs.filter(job => job.status === 'queued').length;
  const name = id => projects.find(project => project.id === id)?.name || id;
  let state = 'Ready';
  if (attention.length) {
    const kinds = [...new Set(attention.map(job => job.status))];
    state = inverse(tr(kinds.length === 1 ? `! ${WORD[kinds[0]]} · ${attention.length} need${attention.length === 1 ? 's' : ''} attention · /queue` : `! ${attention.length} need attention · /queue`));
  } else if (running.length) {
    const worker = running.find(job => job.role === 'worker') && !running.some(job => job.role === 'chat') ? running.find(job => job.role === 'worker') : null;
    state = tr(worker ? `▶ Working · worker in ${name(worker.project)}` : `▶ Working${waiting ? ` · ${waiting} waiting` : ''}`);
  } else if (waiting) state = tr(`○ ${waiting} waiting`);
  if (config.auto_accept) state+=` · ${tr('Auto')}`;
  const checks = tr(gate.today ? `Gate today ${gate.today}${gate.blocked_today ? ` · ${gate.blocked_today} blocked` : ''}` : 'Gate today 0');
  return `${dim(model)}  │  ${state}  │  ${dim(`${checks}  │  ${tr(`Phone ${config.phoneUrl ? 'on' : 'off'}`)}`)}`;
}

/** Notification lines for problems not announced yet; `known` remembers them. */
export function newProblems(jobs, known, projects = []) {
  const name = id => projects.find(project => project.id === id)?.name || id;
  const fresh = jobs.filter(job => ATTENTION.includes(job.status) && !known.has(job.id));
  for (const job of fresh) known.add(job.id);
  return fresh.map(job => `! ${WORD[job.status]} in ${name(job.project)}: “${String(job.message || 'Attached files').replace(/\s+/g, ' ').slice(0, 60)}” · /queue`);
}

/** Poll the workbench and keep the footer current (interactive terminal Pi only). */
export function installFooter(pi, { ports, every = 3000, fetchJson = (url) => fetch(url, { signal: AbortSignal.timeout(2500) }).then(response => response.json()), schedule = setInterval } = {}) {
  const seen = new Set(), known = new Set();
  let started = false, timer;
  const refresh = async ctx => {
    const web = ports()?.web;
    if (!web) return;
    try {
      const [config, workspace] = await Promise.all([fetchJson(`http://127.0.0.1:${web}/api/config`), fetchJson(`http://127.0.0.1:${web}/api/workspace`)]);
      const jobs = workspace.jobs || [];
      if (!started) { jobs.forEach(job => known.add(job.id)); started = true; } // problems from before this session were already there
      for (const line of newProblems(jobs, known, workspace.projects)) ctx.ui.notify(line, 'warning');
      ctx.ui.setStatus('harness-footer', footerText({ config, jobs, projects: workspace.projects, gate: workspace.gate, seen }));
    } catch { ctx.ui.setStatus('harness-footer', footerText({ online: false })); }
  };
  return {
    start(ctx) { if (timer || !ctx?.ui?.setStatus) return; refresh(ctx); timer = schedule(() => refresh(ctx), every); timer?.unref?.(); },
    stop() { clearInterval(timer); timer = undefined; },
    // /queue or the web Activity shows them: the footer stops asking.
    markSeen(jobs) { for (const job of jobs) if (ATTENTION.includes(job.status)) seen.add(job.id); },
    async markAllSeen() { try { const web = ports()?.web; if (web) this.markSeen((await fetchJson(`http://127.0.0.1:${web}/api/workspace`)).jobs || []); } catch {} },
    seen,
  };
}
