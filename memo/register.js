if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('sw.js', {scope: '/johnny_test/serviceworker/'})
    .then(function(reg){
      console.log('Service Worker 註冊成功', reg);
    })
    .catch(function(err){
      console.log('Service Worker 註冊失敗', err);
    });
} else {
  console.log('您的瀏覽器不支援Service Worker');
}