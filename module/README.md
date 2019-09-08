# Service Worker

自己製作的 Service Worker 封裝



## SW_Starter

Service Worker 的 register, sync 動作使用，用於 Client Side。

1. 基本使用

建立註冊新的 Service Worker

```js
const Worker = new SW_Starter('./service-worker.js', {
  scope: './', // 預設
  dev: true, // 預設開啟相關步驟的開發提醒功能
  register: {
    success(reg) {
      // register success to do
    },
    error() {
      // register error to do
    }
  }
});
```

2. 添加 Background Sync 後台同步事件

可以使用 sync 參數傳入數組如下定義同步事件

- tag 為　定義的同步事件名稱

- sync 為 navigator.serviceWorker.ready.then(registration=>{}) 返回的 registration.sync

  可以用 sync.register(tag) 去註冊名稱為 tag 的 sync 事件

```js
const Worker = new SW_Starter('./service-worker.js', {
  // ...
  sync: [
    {
      tag: 'button-sync', // 同步事件名稱
      success(tag, sync) {
        // 定義 DOM 事件
        document.getElementById('btn').onclick = function() {
          sync.register(tag).then(()=>{
            console.log('後台同步已觸發', tag)
          }).catch(err=>{
            console.log('後台同步觸發失敗', err);
          })
        }
      }
    }
  ]
});
```

3. 傳送 message 給 SW (有 bug，無法離線使用)

例如傳送參數給post 事件的情況，可以使用SW的postMessage功能，將資料傳遞給後台的 message 事件接收。

此處傳遞的資料必須為JSON固定格式如下

- type: 定義傳遞的資料名稱

- payload: 傳遞的資料內容(不限為物件，也可以是字串)


```js
const Worker = new SW_Starter('./service-worker.js', {
  // ...
  sync: [
    {
      tag: 'button-sync',
      success(tag, sync) {
        document.querySelector('#btn').addEventListener('click', function() {
          sync.register(tag).then(() => {
            console.log('後台同步已觸發', tag);

            // 獲取資料
            let data = {
              type: 'bgsync',
              payload: '5'
            }

            // 使用 postMessage 傳遞資料
            Worker.post(data);
          })
        })
      }
    }
  ]
});
```


4. 儲存資料到 indexedDB，再經由 SW 傳送

這邊預設的 db 名為 swDb，table 名為 syncache

```js
const Worker = new SW_Starter('./service-worker.js', {
  // ...
  sync: [
    {
      tag: 'button-sync',
      success(tag, sync, db) {
        document.querySelector('#btn').addEventListener('click', function() {
          // 獲取資料
          let cacheData = {
            type: 'bgsync',
            payload: '5'
          };

          // 使用 db 參數開啟 transaction
          let tx = db.transaction('syncache', 'readwrite');
          tx.objectStore('syncache').put(cacheData, 1);

          sync.register(tag).then(() => {
            console.log('後台同步已觸發', tag);
          })
        })
      }
    }
  ]
});
```



## SW

開發 Service Worker 的設定文檔工具包

1. 基本使用

使用時，必須先將 sw-class 模組引用進來，然後再建立新的內容

- cacheList: 快取清單列表

```js
// service-worker.js
importScripts('./module/sw-class.js');

new SW('v1.0', {
  cacheList: [
    './',
    './index.html'
  ]
})
```

2. 設定 sync 同步事件

有兩種方式，一種是不需要處理 message 的情況，一種是需要處理 message。

- 不須 message

```js
new SW('v1.0', {
  // ...
  sync: [
    {
      tag: 'button-sync',
      content(e) {
        e.waitUntil(
          fetch('https://jsonplaceholder.typicode.com/todos')
            .then(res=>res.json())
            .then(res=>console.log(res));
        );
      }
    }
  ]
});
```

- 需要 message

使用 messages.get(訊息type, callback)))，並用 promise 包裹起來，以便後續 e.waitUntil 進行調用。

```js
new SW('v1.0', {
  // ...
  sync: [
    {
      tag: 'button-sync',
      content(e, messages) {
        let msgPromise = new Promise(res => {
          messages.get('bgsync', function(data) {
            // 這個 data 就是前面 postMessage 的 payload 部分。
            res(data)
          })
        })

        e.waitUntil(
          msgPromise.then(data=>{
            console.log('Sync API data: ', data);
            return fetch('https://jsonplaceholder.typicode.com/todos/'+data);
          }).then(res=>res.json()).then(res=>console.log(res))
        );
      }
    }
  ]
});
```

- 使用 IndexedDB

先引入 idb 套件

```js
importScripts('./module/idb.min.js');
importScripts('./module/sw-class.js');
```

稍作修改

```js
new SW('v1.0', {
  // ...
  sync: [
    {
      tag: 'button-sync',
      content(e, messages) {
        let dbQueryPromise = new Promise(res => {
          idb.open('swDb', 1).then(function (db) {
            var dbRequest = db.transaction('syncache').objectStore('syncache').get(1);
            dbRequest.request.onsuccess = function (e) {
              res(e.target.result);
            };
          });
        })

        e.waitUntil(
          dbQueryPromise.then(data => {
            return fetch('https://jsonplaceholder.typicode.com/todos/' + data.payload)
          }).then(res=>res.json()).then(res=>console.log(res))
        );
      }
    }
  ]
});
```
