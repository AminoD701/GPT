(() => {
  'use strict';

  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js', { scope: './' });

      // Check for updates quietly. A new worker may activate in the background,
      // but the current page is never forcibly reloaded.
      registration.update().catch(() => {});

      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            console.info('[PWA] 新版本已準備完成，會在下次自然開啟頁面時使用。');
          }
        });
      });
    } catch (error) {
      console.warn('[PWA] Service worker 註冊失敗：', error);
    }
  });

  const isStandalone = () =>
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  if (isStandalone()) document.documentElement.classList.add('pwa-standalone');
})();