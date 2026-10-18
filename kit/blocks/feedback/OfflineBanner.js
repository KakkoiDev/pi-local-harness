const banner = document.getElementById('offline-banner');
function show() { banner.hidden = navigator.onLine; }
addEventListener('offline', show);
addEventListener('online', async () => {
  banner.querySelector('#offline-banner-text').textContent = t('offline.back');
  banner.querySelector('#offline-banner-count').hidden = true;
  await syncPending();                       // the store sends waiting changes
  setTimeout(() => { banner.hidden = true; }, 3000);
});
show();
