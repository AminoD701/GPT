const CACHE_VERSION='mabi-pwa-v25';
const APP_SHELL=[
  './',
  './index.html',
  './site.html',
  './manifest.webmanifest?v=2',
  './apple-touch-icon.png?v=2',
  './icon-192.png?v=2',
  './icon-512.png?v=2',
  './maskable-512.png?v=2',
  './professional-theme.css',
  './editorial-polish.css',
  './header-title-fix.css',
  './top-nav-polish.css',
  './home-hub.css?v=5',
  './guide-categories.css?v=3',
  './site-search.css',
  './member-profile-layout.css',
  './task-progress-v2.css',
  './task-journal-v4.css',
  './task-progress-v7.js?v=3',
  './role-skill-progress.css?v=4',
  './role-skill-progress.js?v=12',
  './live-data.css?v=3',
  './live-data.js?v=3',
  './global-black-hole.css?v=3',
  './global-black-hole.js?v=3',
  './readability-pass.css?v=1',
  './visual-system-v2.css?v=1',
  './site-function-nav.css?v=1',
  './data/black-hole.json',
  './data/market-catalog.json',
  './pet-guide-v4.css',
  './home-hub.js?v=5',
  './guide-categories.js?v=3',
  './site-search.js',
  './view-state.js?v=4',
  './header-title-fix.js',
  './tab-title-fix.js',
  './site-function-nav.js?v=1',
  './pwa-init.js?v=3'
];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache=>Promise.allSettled(APP_SHELL.map(url=>cache.add(url))))
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE_VERSION).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET') return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin) return;

  const isCode=/\.(?:js|css|html)$/.test(url.pathname) || request.mode==='navigate';
  if(isCode){
    event.respondWith(
      fetch(request,{cache:'no-store'})
        .then(response=>{
          if(response && response.ok){
            const copy=response.clone();
            caches.open(CACHE_VERSION).then(cache=>cache.put(request,copy));
          }
          return response;
        })
        .catch(async()=>{
          return (await caches.match(request)) || (request.mode==='navigate' ? await caches.match('./index.html') : undefined);
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached=>{
      const network=fetch(request).then(response=>{
        if(response && response.ok){
          const copy=response.clone();
          caches.open(CACHE_VERSION).then(cache=>cache.put(request,copy));
        }
        return response;
      }).catch(()=>cached);
      return cached || network;
    })
  );
});

self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING') self.skipWaiting();
});
