class SW_starter {
  constructor({ filepath, scope, sync, notification }) {
    this.filepath = filepath;
    this.scope = scope;
    this.sync = sync;
    this.notification = notification;
    this.init();
  }

  init() {
    SW_starter.register(this.filepath, this.scope);
    SW_starter.syncRegister(this.sync);
    this.notification.open && SW_starter.notification(this.notification.options);
  }

  // 註冊 SW
  static register(filepath, scope) {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register(filepath, {scope})
        .then(function(reg){
          console.log('Service Worker 註冊成功', reg);
        })
        .catch(function(err){
          console.log('Service Worker 註冊失敗', err);
        });
    } else {
      console.log('您的瀏覽器不支援Service Worker');
    }
  }

  // 處理客戶端發出 sync 請求
  static syncRegister(fetchList) {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      // 同步功能需要在SW 註冊完成後觸發
      navigator.serviceWorker.ready.then(registration => {
        for (let i=0;i<fetchList.length;i++) {
          let item = fetchList[i];
          // 建立同步用的標誌
          // const tag = item.tag;

          item.success(registration.sync);
      
          // 操作DOM，使用registration.sync.register() 觸發SW 的 sync 事件
          // document.querySelector('#btn').addEventListener('click', function() {
          //   registration.sync.register(tag).then(() => {
          //     console.log('後台同步已觸發', tag);
          //   }).catch(err => {
          //     console.log('後台同步觸發失敗', err);
          //   })
          // })
        }
      })
    } else {
      console.log('您的瀏覽器不支援Service Worker');
    }
  }

  // 處理訂閱推播按鈕
  static notification(options) {

    if ('Notification' in window) {
      const askForNotificationPermission = function() {
        Notification.requestPermission(function(status){
          console.log('User Choice', status);
          if (status !== 'granted') {
            console.log('推播允許被拒絕了!');
          } else {
            // new Notification('歡迎您!');
            if('serviceWorker' in navigator){
              navigator.serviceWorker.ready.then(registration => {
                registration.showNotification('歡迎您!!!', options);
              })
            }
          }
        });
      }

      askForNotificationPermission();
    }
  }

}


new SW_starter({
  filepath: 'sw.js',
  scope: '/repository/j-sw/',
  sync: [
    {
      tag: 'button_sync',
      success: function(sync) {
        document.querySelector('#btn').addEventListener('click', function() {
          sync.register('button_sync').then(()=>{
            console.log('後台同步已觸發', 'button_sync');
          }).catch(err => {
            console.log('後台同步觸發失敗', err);
          })
        })
      }
    }
  ],
  notification: {
    open: true,
    options: {
      body: '歡迎來到PWA測試頁面',
      icon: './js/fb_icon.jpg', // 網站icon圖示
      dir: 'ltr', // 文字顯示方向
      lang: 'zh-Hant', // 語言代碼(繁中)
      vibrate: [100, 50, 200], // 裝置震動模式(震動100ms，暫停50ms，再振動200ms)
      badge: './js/fb_icon.jpg', // 狀態列圖示
      tag: 'confirm-note', // 通知的ID
      renotify: true, // 通知更新後是否要再通知一次
      actions: [ // 設定通知上的選項
        {
          action: 'confirm', title: '確認'
        },
        {
          action: 'cancel', title: '取消'
        }
      ]
    }
  }
})