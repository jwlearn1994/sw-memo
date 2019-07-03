if ('serviceWorker' in navigator && 'SyncManager' in window) {
  // 同步功能需要在SW 註冊完成後觸發
  navigator.serviceWorker.ready.then(registration => {
    // 建立同步用的標誌
    const tag = "button_sync";

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