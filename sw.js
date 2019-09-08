importScripts('./module/idb.min.js');
importScripts('./module/sw-class.js');

new SW('v1.0.0', {
  cacheList: [
    './',
    './index.html',
    './index.js',
    './module/sw-starter.js',
    './module/sw-class.js',
    './module/idb.min.js',
    './sw.js'
  ],
  // offline: './noNet.html',
  sync: [
    {
      tag: 'button-sync',
      content(e, messages) {
        let dbQueryPromise = new Promise((res,rej) => {
          idb.open('swDb', 1).then(function (db) {
            var dbRequest = db.transaction('syncache').objectStore('syncache').get(1);
            dbRequest.request.onsuccess = function (e) {
              res(e.target.result);
            };
          });
        })

        e.waitUntil(
          dbQueryPromise.then(data => {
            return fetch('https://jsonplaceholder.typicode.com/todos/'+data.payload)
          }).then(res=>res.json()).then(res=>console.log(res))
          // fetch('https://jsonplaceholder.typicode.com/todos')
          //   .then(res=>res.json())
          //   .then(res=>console.log(res))
        );
      }
    }
  ]
})