const version = 'v1.0.0';

var filesToCache = [
  './index.html',
  './pages/noNetwork.html',
  'https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.3.1/css/bootstrap.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/jquery.min.js'
];

// 註冊Service Worker
self.addEventListener('install', function(e){
  console.log('[ServiceWorker] Install');
  e.waitUntil(
    caches.open(version).then(function(cache){
      console.log('[ServiceWorker] Caching App Shell');
      return cache.addAll(filesToCache);
    })
  );
});

// 設置緩存下載
self.addEventListener('activate', function(e) {  
  console.log('[ServiceWorker] Activate');  
  e.waitUntil(
    caches.keys().then(function(keyList) {  
      return Promise.all(keyList.map(function(key) {  
        console.log(key !== version)
        if (key !== version) {  
          console.log('[ServiceWorker] Removing old cache', key);  
          return caches.delete(key);
        }
      }));  
    })  
  );  
});

// background sync
self.addEventListener('sync', e => {
  if (e.tag === 'button_sync') {
    const request = new Request('http://httpbin.org/post', { method: 'POST' });
    const data = {
      name: 'Johnny',
      age: '25'
    }

    e.waitUntil(
      fetch(request, { body: JSON.stringify(data) }).then(res => {
        res.json().then(console.log.bind(console));
        return res;
      })
    )
  }
})

// 設置請求響應
self.addEventListener('fetch', function(e) {
  // 檢查請求url 是否為http，避免chrome-extension:// 導致錯誤
  if(e.request.url.indexOf('http') === 0){
    console.log('[ServiceWorker] Fetch', e.request.url);
    e.respondWith(
      // 比對request及cache，若失敗則繼續打HTTP request
      // 若無緩存，抓取HTTP request後，打開v1緩存，將請求數據複製一份加入到緩存中
      // 原始請求結果則返回給瀏覽器
      caches.match(e.request).then(function(res) {
        return res || fetch(e.request).then(function(resp) {
          return caches.open(version).then(function(cache){
            cache.put(e.request, resp.clone());
            return resp;
          });
        });
      })
      // 默認回退方案(無緩存, 無網路時)
      .catch(function(){
        console.log('ERROR');
        return caches.open(version).then(function(cache){
          return cache.match('./pages/noNetwork.html');
        })
      })
    );

  }
});

// 常用API

// importScripts('sw/sw-class.js'); 可以從同網域下，載入其他js檔或函示庫到service-worker

/**
* -------------- install 階段 
*/

// 1. waitUntil() 避免cache還在執行，就執行fetch事件
// e.waitUntil(
//   // ...
// )

// 2. caches.open('static').then(cache => {}); 開啟名為static的快取(若該快取不存在則建立新快取)

// 3. cache.add('app.js') 新增快取app.js

// 4. cache.addAll(['app.js', 'index.css']) 新增快取陣列內容


/**
* -------------- Activate 階段 
*/

// 1. cache.delete('app.js') 刪除快取(對應到的話)

// 2. cache.put(event.request, response.clone()) 將新資源複製一份並放入已存在的快取資源中

// 3. caches.keys().then(keyList => {}) 一次將快取的資源全部撈出來，keyList為一陣列，包含各快取的名子

// 4. cache.matchAll('/js/').then(response => {}) 將符合url規則的資源抓出處理

/**
* -------------- fetch 階段 
*/

// 1. respondWith() 將頁面發出的請求，以()內部的參數做替換
// e.respondWith(null); // 頁面會死掉...
// e.respondWith(fetch('./index.css')); // 請求導向到某位置

// 2. caches.match(event.request).then(response => {}) // 查詢快取(抓不到時res為null，此時可使用fetch正常請求)

// 3. 
