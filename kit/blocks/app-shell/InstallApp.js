let deferred;
const card = document.getElementById('install-card');
const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
const declined = Number(localStorage.getItem('installDeclinedAt') || 0) > Date.now() - 30 * 864e5;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; if (!standalone && !declined) card.hidden = false; });
document.getElementById('install-now').onclick = async () => { deferred.prompt(); const { outcome } = await deferred.userChoice; card.hidden = true; if (outcome === 'dismissed') localStorage.setItem('installDeclinedAt', Date.now()); };
document.getElementById('install-later').onclick = () => { card.hidden = true; localStorage.setItem('installDeclinedAt', Date.now()); };
// iPhone Safari: no beforeinstallprompt; show the steps instead
if (/iPhone|iPad/.test(navigator.userAgent) && !standalone && !declined) { card.hidden = false; document.getElementById('install-prompt').hidden = true; document.getElementById('install-steps').hidden = false; }
