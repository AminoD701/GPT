const CACHE_VERSION='mabi-pwa-v4';
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
  './home-hub.css',
  './guide-categories.css',
  './site-search.css',
  './member-profile-layout.css',
  './task-progress-v2.css',
  './task-journal-v4.css',
  './task-progress-v6.js?v=1',
  './pet-guide-v4.css',
  './home-hub.js',
  './guide-categories.js',
  './site-search.js',
  './view-state.js',
  './header-title-fix.js',
  './tab-title-fix.js'
];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache=>Promise.allSettled(APP_SHELL.map(url=>cache.add(url))))
      .then(()=>self.skipWaiting())
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
