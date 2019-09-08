const sw_starter = new SW_Starter('./sw.js', {
  scope: './',
  register: {
    success(reg) {
      console.log('SW supported at scope: ' + reg.scope);
    }
  },
  sync: [
    {
      tag: 'button-sync',
      success(tag, sync, db) {
        document.querySelector('#btn').addEventListener('click', function() {
          let cacheData = {
            type: 'bgsync',
            payload: '5'
          };
          let tx = db.transaction('syncache', 'readwrite');
          tx.objectStore('syncache').put(cacheData, 1);

          sync.register(tag).then(() => {
            console.log('後台同步已觸發', tag);
          }).catch(err => {
            console.log('後台同步觸發失敗', err);
          })
        })
      }
    }
  ]
})

