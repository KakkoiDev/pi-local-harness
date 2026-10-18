self.addEventListener('install', e => e.waitUntil(cacheShell()));   // no skipWaiting() here
self.addEventListener('message', e => { if (e.data === 'activate-update') self.skipWaiting(); });
