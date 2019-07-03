class SW {
  constructor({ version, fileList = [], offline, sync = [] }) {
    this.version = version;
    this.fileList = fileList;
    this.offline = offline;
    this.sync = sync;
    this.init();
  }

  init() {
    SW.install(this.version, this.fileList);
    SW.activate(this.version);
    SW.sync(this.sync);
    SW.fetch(this.version, this.offline);
  }

  // 安裝Service Worker
  static install(v, fileList) {
    self.addEventListener('install', e => {
      console.log('[ServiceWorker] Install');

      e.waitUntil(
        caches.open(v).then(cache => {
          console.log('[ServiceWorker] Caching App Shell');
          return cache.addAll(fileList);
        })
      );
    });
  }

  // 設置緩存下載
  static activate(v) {
    self.addEventListener('activate', e => {  
      console.log('[ServiceWorker] Activate');  

      e.waitUntil(
        caches.keys().then(keyList => {  
          return Promise.all(keyList.map(key => {  
            if (key !== v) {  
              console.log('[ServiceWorker] Removing old cache', key);  
              return caches.delete(key);
            }
          }));
        })  
      );  
    });
  }

  // Background Sync(POST)
  static sync(fetchList) {
    self.addEventListener('sync', e => {
      for (let i=0;i<fetchList.length;i++) {
        let item = fetchList[i];

        if (e.tag === item.tag) {
          const request = new Request(item.url, { method: item.method });
  
          e.waitUntil(
            fetch(request, { body: JSON.stringify(item.data) }).then(res => {
              res.json().then(console.log.bind(console));
              return res;
            })
          )
        }
      }
    })
  }

  // 設置請求響應
  static fetch(v, offline) {
    self.addEventListener('fetch', e => {
      if(e.request.url.indexOf('http') === 0){
        console.log('[ServiceWorker] Fetch', e.request.url);

        e.respondWith(
          caches.match(e.request).then(res => {
            return res || fetch(e.request).then(resp => {
              return caches.open(v).then(cache => {
                cache.put(e.request, resp.clone());
                return resp;
              });
            });
          })
          // 默認回退方案(無緩存, 無網路時)
          .catch(function(){
            return caches.open(v).then(function(cache){
              return cache.match(offline);
            })
          })
        );
      }
    });
  }

}
