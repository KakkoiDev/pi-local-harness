// Task 331: Project ▸ Install Packages… — the person, never Pi, installs a project's packages from its lock file
// (`uv sync --frozen`, or `npm ci`) when the project has a lock file but no environment. The dialog says how many
// packages and how big the download is before anything happens; Install is the approval (POST /api/projects/packages,
// person only); the installer's lines show while it runs. Built from existing 1-bit parts (the desk dialog, the help
// line, the mono output); a note for the designer is in design/briefs/round-13.md.

function el(tag, className, text) { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; }

/** Poll an install's progress (Create and Install Packages… share it) until stop() is called; shows each line. */
export function followProgress(api, id, show) {
  let stopped = false, timer = 0;
  const tick = async () => {
    if (stopped) return;
    try { const found = await api('/api/packages/progress?id=' + encodeURIComponent(id)); if (!stopped && found.stage) show(found); } catch { /* the next tick tries again */ }
    if (!stopped) timer = setTimeout(tick, 500);
  };
  timer = setTimeout(tick, 300);
  return () => { stopped = true; clearTimeout(timer); };
}
export const progressId = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), byte => byte.toString(16).padStart(2, '0')).join('');

export function installPackages({ api, project, toast, refresh }) {
  const dialog = el('dialog', 'pw-dialog'); dialog.id = 'packages-dialog'; dialog.setAttribute('aria-labelledby', 'packages-title');
  const title = el('h2', 'pw-dialog__title', 'Install Packages'); title.id = 'packages-title';
  const line = el('p', 'pw-dialog__text'); line.id = 'packages-line';
  const help = el('p', 'pw-help'); help.id = 'packages-help';
  const status = el('p', 'pw-help pw-mono'); status.id = 'packages-status'; status.setAttribute('aria-live', 'polite');
  const output = el('pre', 'pw-start__output pw-mono'); output.id = 'packages-output'; output.hidden = true; output.setAttribute('aria-label', 'Installer output');
  const actions = el('div', 'pw-dialog__actions'), cancel = el('button', 'pw-btn', 'Cancel'), go = el('button', 'pw-btn pw-btn--default', 'Install');
  cancel.type = go.type = 'button'; cancel.id = 'packages-cancel'; go.id = 'packages-install';
  actions.append(cancel, go); dialog.append(title, line, help, status, output, actions); document.body.append(dialog);
  let target = null, working = false;
  cancel.onclick = () => { if (!working) dialog.close(); };
  dialog.addEventListener('cancel', event => { if (working) event.preventDefault(); });

  async function open() {
    target = project(); if (!target) return;
    let found;
    try { found = await api('/api/project-packages?project=' + encodeURIComponent(target.id)); } catch (error) { toast?.(error.message); return; }
    line.textContent = found.missing ? found.line : 'This project’s packages are installed: nothing to download.';
    help.textContent = found.missing ? `Runs ${found.command} in ${target.name} once. Pi’s test runs and the Preview then use the packages offline; nothing else downloads.` : '';
    status.textContent = ''; output.hidden = true; output.textContent = ''; go.textContent = 'Install'; go.disabled = !found.missing;
    dialog.showModal(); (found.missing ? go : cancel).focus();
  }

  go.onclick = async () => {
    if (!target || working) return;
    working = true; go.disabled = cancel.disabled = true; dialog.setAttribute('aria-busy', 'true'); output.hidden = true;
    status.textContent = 'Downloading and installing…';
    const id = progressId(), stop = followProgress(api, id, found => { if (found.line) status.textContent = found.line; });
    try {
      const done = await api('/api/projects/packages', { project: target.id, progress: id });
      stop();
      if (done.installed) {
        dialog.close();
        toast?.(`Installed ${done.count} package${done.count === 1 ? '' : 's'}${done.disk ? ` (${done.disk} on disk)` : ''}: Pi’s tests and the Preview can use them now.`);
        await refresh?.();
        return;
      }
      status.textContent = `Not installed: ${done.reason}`;
      if (done.output) { output.textContent = done.output; output.hidden = false; }
      go.textContent = 'Try Again';
    } catch (error) { stop(); status.textContent = error.data?.busy ? 'Pi is answering about this project. Try again when that request ends: nothing was installed.' : error.message; }
    finally { working = false; cancel.disabled = false; go.disabled = false; dialog.removeAttribute('aria-busy'); }
  };
  return { open };
}
