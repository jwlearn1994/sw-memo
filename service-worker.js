const version = 'v1.1';

const cacheList = [
  './',
  './index.html'
];


// this 或 self 指向 Service Worker
console.log(self);


// install - 在註冊安裝完 SW 後觸發，常用於 離線緩存 或 indexedDB
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(version).then(cache => {
      cache.addAll(cacheList);
    })
  );
})


// Activate - 激活設置緩存及刪除舊緩存
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if (key !== version) {
          console.log('[ServiceWorker] Removing old cache', key);  
          return caches.delete(key);
        }
      }))
    })
  );
})


// Fetch - 攔截請求
self.addEventListener('fetch', e => {
  if(e.request.url.indexOf('chrome') === 0) return;

  console.log('[ServiceWorker] Fetch', e.request.method, e.request.url);
  e.respondWith(
    caches.match(e.request).then(res => {
      return res || fetch(e.request).then(resp => {
        return caches.open(version).then(cache => {
          cache.put(e.request, resp.clone());
          return resp;
        });
      });
    })
    // 默認回退方案(無緩存, 無網路時)
    .catch(() => {
      console.log('ERROR');
      return caches.open(version).then(function(cache){
        return cache.match('./index.html');
      })
    })
  );
})