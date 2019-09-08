/*!
 * SW.js v1.0.0
 * (c) 2019 Johnny Wang
 * Released under the MIT License.
 */

function SW(version, {
  cacheList = [],
  offline,
  sync,
  dev = true
}) {
  const SW = this;

  SW.version = version;
  SW.cacheList = cacheList;
  SW.offline = offline;
  SW.sync = sync;
  SW.messages = new SimpleEvent();


  let SW_install = function(v, list) {
    dev && console.log('[ServiceWorker] Installing');
    self.addEventListener('install', e => {
      e.waitUntil(
        SW.cacheAssets(v, list)
      );
    });
  }
  
  let SW_activate = function(v) {
    self.addEventListener('activate', e => {  
      e.waitUntil(
        caches.keys().then(keyList => {  
          return Promise.all(keyList.map(key => {  
            if (key !== v) {
              dev && console.log('[ServiceWorker] Removing old cache: '+key);
              return caches.delete(key);
            }
          }));
        })  
      );  
    });
  }
  
  let SW_fetch = function(v, offlinePath) {
    self.addEventListener('fetch', e => {
      if(e.request.url.indexOf('http') === 0){
        dev && console.log('[ServiceWorker] Request: '+e.request.url);
        e.respondWith(
          caches.match(e.request).then(res => {
            return res || fetch(e.request).then(resp => {
              return caches.open(v).then(cache => {
                cache.put(e.request, resp.clone());
                return resp;
              });
            });
          })
          .catch(function(){
            return caches.open(v).then(function(cache){
              return cache.match(offlinePath);
            })
          })
        );
      }
    });
  }

  let SW_sync = function(fetchList) {
    self.addEventListener('sync', e => {
      dev && console.log('[ServiceWorker] Sync executing: '+e.tag);
      for (let i=0;i<fetchList.length;i++) {
        let item = fetchList[i];
        if (e.tag === item.tag) {
          return item.content(e, SW.messages);
        }
      }
    })
  }

  let SW_message = function() {
    self.addEventListener('message', e => {
      let data = JSON.parse(e.data);
      let type = data.type;
      let payload = data.payload;
      dev && console.log('[ServiceWorker] Receive message: ', data);

      SW.messages.trigger(type, payload);
    })
  }

  SW_install(SW.version, SW.cacheList);
  SW_activate(SW.version);
  SW_fetch(SW.version, SW.offline);
  SW_sync(SW.sync);
  SW_message();
}

SW.prototype = {
  cacheAssets(v, cacheList) {
    return caches.open(v).then(cache => {
      return cache.addAll(cacheList);
    })
  },
  getVersions() {
    return caches.keys();
  }
}


function SimpleEvent() {
  const self = this;
  self.listenrs = {};

  self.get = function(tag, cb) {
    self.listenrs[tag] || (self.listenrs[tag] = []);
    self.listenrs[tag].push(cb);
  }

  self.trigger = function(tag, data) {
    self.listenrs[tag] = self.listenrs[tag] || [];
    let listenr;
    while (listenr = self.listenrs[tag].shift()) {
      listenr(data)
    }
  }
}

