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