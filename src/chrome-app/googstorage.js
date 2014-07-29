
function store () {
  //this.freedomStorage = freedom['core.storage']();
  this.memStorage = {};
}

store.prototype.set = function(key, val) {
  if (val === undefined) { 
    //this.freedomStorage.remove(key);
    delete this.memStorage[key];
    return val;
  }
  //this.freedomStorage.set(key, val);
  this.memStorage[key] = val;
  return val
};

store.prototype.get = function(key) { return this.memStorage[key]; };

store.prototype.remove = function(key) { 
  delete this.memStorage[key];
  //this.freedomStorage.remove(key);
};

store.prototype.clear = function() {
  this.memStorage = {};
  //this.freedomeStorage.clear();
};

store.prototype.transact = function(key, defaultVal, transactionFn) {
  var val = this.store.get(key)
  if (transactionFn == null) {
    transactionFn = defaultVal
    defaultVal = null
  }
  if (typeof val == 'undefined') { val = defaultVal || {} }
  transactionFn(val)
  this.set(key, val)
};

store.prototype.getAll = function() { return this.storage; };

store.prototype.forEach = function(callback) {
  for (var i in this.storage) {
    callback(i);
  }
};

store.prototype.serialize = function(value) {
  return JSON.stringify(value)
};

store.prototype.deserialize = function(value) {
  if (typeof value != 'string') { return undefined }
  try { return JSON.parse(value) }
  catch(e) { return value || undefined }
};

goog.storage.mechanism.HTML5LocalStorage = store;


