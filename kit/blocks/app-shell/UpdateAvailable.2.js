const reg = await navigator.serviceWorker.register('/sw.js');
function offer(worker) {
  document.getElementById('toaster').toast({
    category: 'info',
    title: t('update.title'),
    description: t('update.body'),
    action: { label: t('update.reload'), onclick: 'applyUpdate()' },
    cancel: { label: t('update.later') },
    duration: -1
  });
  window.applyUpdate = async () => {
    await flushSaves();                        // SavedState: finish any pending save first
    worker.postMessage('activate-update');
  };
}
if (reg.waiting) offer(reg.waiting);
reg.addEventListener('updatefound', () => {
  const w = reg.installing;
  w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) offer(w); });
});
navigator.serviceWorker.addEventListener('controllerchange', () => location.reload());
