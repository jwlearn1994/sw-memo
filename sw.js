importScripts('sw/sw-class.js');

// My setting
const mySW = new SW({
  version: 'v1.0.0',
  fileList: [
    // './index.html',
    './pages/noNetwork.html',
    'https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.3.1/css/bootstrap.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/jquery.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/axios/0.19.0/axios.min.js'
  ],
  offline: './pages/noNetwork.html'
});