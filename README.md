# Service Worker 學習筆記

使用 SW 可以在一般網頁請求的進程之外，另外加開一個獨立運行的客戶端類 proxy，將頁面請求緩存起來

進行離線存取或是請求延遲發送的功能。

在 SW 中的全域 this, self 指向 SW 本身。



## register - 註冊使用

要使用 SW，必須先檢查瀏覽器是否支援，並進行註冊。

```js
// register.js

if ('serviceWorker' in navigator) {
  console.log('ServiceWorker is supported');

  navigator.serviceWorker.register('./service-worker.js', { scope: './' })
    .then(reg => {
      console.log('Registration succeeded. Scope is ' + reg.scope);
    }).catch(error => {
      console.log('Registration failed with ' + error);
    });
} else {
  console.log('ServiceWorker unsupported')
}
```



## Install - 離線 or IndexedDB 緩存設定

在註冊安裝後調用 install 事件

```js
// service-worker.js

const version = 'v1.0.0';

var filesToCache = [
  './index.html',
  './pages/noNetwork.html',
  'https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.3.1/css/bootstrap.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/jquery.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(version).then(cache => {
      cache.addAll(cacheList);
    })
  );
})
```



## Activate - 處理刪除舊緩存

一般情況下，瀏覽器在接收到新的版本的 SW 時，會對新的版本進行預加載，同時使用著舊的版本，當下一次進入頁面後，

則由新的版本 SW 進行接手處理。隨著版本越來越多，會佔據瀏覽器內存的空間消耗，雖然瀏覽器會進行清理，但如果可以

將每次緩存的版本進行比對，並將舊的版本予以清除的話，是個很好的做法。


```js
// 其中 keyList 包含著當前瀏覽器的網域下，包含的所有　cache 版本array

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
```



## Fetch - 攔截請求

藉由攔截請求，可以將前面離線緩存起來的東西，替換給當下頁面的請求，真實達到離線緩存的功效。

```js
self.addEventListener('fetch', e => {
  // 當請求為　chrome-extension:// 會導致錯誤，將其濾掉
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
```



## 常用 API

**importScripts(filepath)**

可以從同網域下，載入其他js檔或函示庫到service-worker。


### Install 階段

1. waitUntil() 避免cache還在執行，就執行fetch事件

```js
e.waitUntil(
  // ...
)
```

2. caches.open('static').then(cache => {}); 

開啟名為static的快取(若該快取不存在則建立新快取)

3. cache.add('app.js');

新增快取app.js

4. cache.addAll(['app.js', 'index.css']) 

新增快取陣列內容


### Activate 階段 

1. cache.delete('app.js')

刪除快取(對應到的話)

2. cache.put(event.request, response.clone())

將新資源複製一份並放入已存在的快取資源中

3. caches.keys().then(keyList => {})

一次將快取的資源全部撈出來，keyList為一陣列，包含各快取的名子

4. cache.matchAll('/js/').then(response => {})

將符合url規則的資源抓出處理


### Fetch 階段

1. respondWith() 將頁面發出的請求，以()內部的參數做替換

```js
e.respondWith(null); // 頁面會死掉...
e.respondWith(fetch('./index.css')); // 請求導向到某位置
```

2. caches.match(event.request).then(response => {}) 

查詢快取(抓不到時res為null，此時可使用fetch正常請求)



## Sync 同步事件

處理客戶端發出 sync 請求，離線狀態緩存請求，網絡恢復後自動觸發延續執行。

需要在客戶端以及SW端都進行設置。

- 首先在客戶端定義標誌，並且添加觸發事件內容。

```js
// sync.js (client-side)

if ('serviceWorker' in navigator && 'SyncManager' in window) {
  // 同步功能需要在SW 註冊完成後觸發
  navigator.serviceWorker.ready.then(registration => {
    // 建立同步用的標誌
    const tag = 'button-sync';

    // 操作DOM，使用registration.sync.register() 觸發SW 的 sync 事件
    document.querySelector('#btn').addEventListener('click', function() {
      registration.sync.register(tag).then(() => {
        console.log('後台同步已觸發', tag);
      }).catch(err => {
        console.log('後台同步觸發失敗', err);
      })
    })
  })
} else {
  console.log('您的瀏覽器不支援Service Worker');
}
```

- 在SW中定義 sync 事件，並且使用 ajax 調用需要同步的請求內容。

```js
self.addEventListener('sync', e => {
  if (e.tag === 'button-sync') {
    const request = new Request(item.url, { method: item.method });

    e.waitUntil(
      fetch(request, { body: JSON.stringify(item.data) }).then(res => {
        res.json().then(console.log.bind(console));
        return res;
      })
    )
  }
})
```