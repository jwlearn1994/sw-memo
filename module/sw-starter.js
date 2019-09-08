/*!
 * SW_Starter.js v1.0.0
 * (c) 2019 Johnny Wang
 * Released under the MIT License.
 */
(function (global, factory){
  // Nodejs 環境
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  // AMD 環境
  typeof define === 'function' && define.amd ? define(factory) :
  // Browser 環境
  (global = global || self, global.SW_Starter = factory());
}(this, function() { 'use strict';


  /*  */

  const isFn = v => {
    return typeof v === 'function';
  }

  const hasSW = ('serviceWorker' in navigator);

  const SW = hasSW ? navigator.serviceWorker : null;

  const hasSync = ('SyncManager' in window);


  const Register = (filepath, scope) => {
    return new Promise((res, rej) => {
      if (hasSW) {
        SW.register(filepath, {scope})
          .then(function(reg){
            res(reg);
          })
          .catch(function(err){
            rej(err);
          });
      }
    });
  }

  const SyncRegister = (fetchList, dbName) => {
    if (hasSW && hasSync) {
      let dbPromise = idb.open(dbName, 1, upgradeDB => {
        upgradeDB.createObjectStore('syncache');
      });

      SW.ready.then(registration => {
        return Promise.all([
          dbPromise,
          registration
        ])
      }).then(result => {
        let db = result[0];
        let registration = result[1];

        for (let i=0;i<fetchList.length;i++) {
          let item = fetchList[i];
          let tag = item.tag;
          return item.success(tag, registration.sync, db);
        }
      })
    }
  }


  const SW_Starter = function(filepath, {
    scope = './',
    register,
    sync,
    dbName = 'swDb',
    dev = true
  }) {

    const self = this;
    self.sw_path = filepath;
    self.scope = scope;
    self.sync = sync;
    self.dbName = dbName;
    self.post = function(msg) {
      return SW.controller.postMessage(JSON.stringify(msg));
    }

    // Register
    Register(self.sw_path, self.scope).then(reg => {
      dev && console.log('[ServiceWorker] Registered at scope: '+reg.scope);
      isFn(register.success) && register.success(reg);
    }).catch(err => {
      dev && console.log('[ServiceWorker] Registered Error!');
      isFn(register.error) && register.error(err);
    })

    // SyncRegister
    SyncRegister(self.sync, self.dbName);
  }

  return SW_Starter;

}));


