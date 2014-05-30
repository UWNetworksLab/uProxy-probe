var TCP;
(function (TCP) {
    var DEFAULT_MAX_CONNECTIONS = 1048576;

    

    var Server = (function () {
        function Server(addr, port, options) {
            var _this = this;
            this.addr = addr;
            this.port = port;
            this.conns = {};
            this.endpoint_ = null;
            this.startListening_ = function () {
                if (!_this.serverSocket_) {
                    return Util.reject('failed to create socket on ' + _this.endpoint_);
                }
                dbg('created server socket, listening on ' + _this.endpoint_);
                return _this.serverSocket_.listen(_this.addr, _this.port);
            };
            this.attachSocketHandlers_ = function () {
                _this.serverSocket_.on('onConnection', _this.onConnectionHandler_);
            };
            this.onConnectionHandler_ = function (acceptValue) {
                var socketId = acceptValue.socket;

                var connectionsCount = Object.keys(_this.conns).length;
                if (connectionsCount >= _this.maxConnections) {
                    var tempSocket = freedom['core.tcpsocket'](socketId);
                    tempSocket.close();
                    return Util.reject('too many connections: ' + connectionsCount);
                }

                dbg('TCP.Server accepted connection on socket id ' + socketId);
                _this.conns[socketId] = new Connection(socketId, _this);

                if (_this.callbacks.connection) {
                    _this.callbacks.connection(_this.conns[socketId]);
                }
            };
            this.disconnect = function () {
                return new Promise(function (F, R) {
                    var allPromises = [];

                    if (_this.serverSocket_) {
                        allPromises.push(_this.serverSocket_.close());
                    }

                    for (var i in _this.conns) {
                        try  {
                            allPromises.push(_this.conns[i].disconnect().then(_this.removeFromServer));
                        } catch (ex) {
                            console.warn(ex);
                        }
                    }

                    Promise.all(allPromises).then(function () {
                        dbg('successfully disconnected');
                        F();
                    }, function (ex) {
                        console.warn(ex);
                    });
                });
            };
            this.removeFromServer = function (conn) {
                return new Promise(function (F, R) {
                    delete _this.conns[conn.socketId];
                    F();
                });
            };
            this.on = function (eventName, callback) {
                if (!(eventName in _this.callbacks)) {
                    console.error('TCP.Server: on() failure for ' + eventName);
                    return;
                }
                _this.callbacks[eventName] = callback;
            };
            this.endConnection = function (socketId) {
                if (!(socketId in _this.conns)) {
                    return;
                }
                _this.conns[socketId].close().then(_this.removeFromServer);
            };
            this.handleError_ = function (err) {
                console.error('TCP.Server: ' + err.message);
                console.error(err.stack);
            };
            this.maxConnections = (options && options.maxConnections) || DEFAULT_MAX_CONNECTIONS;
            this.endpoint_ = addr + ':' + port;

            this.callbacks = {
                connection: null,
                disconnect: null
            };
            this.serverSocket_ = freedom['core.tcpsocket']();
        }
        Server.prototype.listen = function () {
            return this.startListening_().then(this.attachSocketHandlers_).catch(this.handleError_);
        };
        return Server;
    })();
    TCP.Server = Server;

    var Connection = (function () {
        function Connection(socketId, server) {
            var _this = this;
            this.socketId = socketId;
            this.onDataHandler_ = function (data) {
                data = data.data;
                if (_this.callbacks.recv) {
                    _this.addPendingData_(data);
                    _this.bufferedCallRecv_();
                } else {
                    _this.addPendingData_(data);
                    _this.pendingRead_ = false;
                }
            };
            this.onDisconnectHandler_ = function (data) {
                if (data.errcode) {
                    dbgWarn('Socket ' + _this.socketId + ' disconnected with errcode ' + data.errcode + ': ' + data.message);
                }
                _this.close().then(function () {
                    _this.server_.removeFromServer(_this);
                });
            };
            this.on = function (eventName, callback, options) {
                if (!(eventName in _this.callbacks)) {
                    dbgErr('TCP.Connection [' + _this.socketId + ']:' + 'no such event for on: ' + eventName + ".  Available keys are " + JSON.stringify({ available_keys: Object.keys(_this.callbacks) }));
                    return;
                }
                _this.callbacks[eventName] = callback;

                if (('recv' == eventName) && callback) {
                    _this.recvOptions = options || null;

                    if (_this.pendingReadBuffer_) {
                        _this.bufferedCallRecv_();
                    }
                }
            };
            this.receive = function (minByteLength) {
                return new Promise(function (F, R) {
                    if (minByteLength) {
                        _this.recvOptions = {
                            minByteLength: minByteLength
                        };
                        if (_this.pendingReadBuffer_) {
                            _this.bufferedCallRecv_();
                        }
                    }
                    _this.on('recv', F);
                });
            };
            this.bufferedCallRecv_ = function () {
                if (_this.recvOptions && _this.recvOptions.minByteLength && _this.recvOptions.minByteLength > _this.pendingReadBuffer_.byteLength) {
                    return;
                }
                var tmpBuf = _this.pendingReadBuffer_;
                _this.pendingReadBuffer_ = null;
                _this.callbacks.recv(tmpBuf);
            };
            this.sendRaw = function (msg, callback) {
                var realCallback = callback || _this.callbacks.sent || function () {
                };
                _this.connectionSocket_.write(msg).then(realCallback);
            };
            this.close = function () {
                return new Promise(function (F, R) {
                    _this.connectionSocket_.close().then(function () {
                        F(_this);
                    });
                });
            };
            this.disconnect = function () {
                _this.fulfillDisconnect_(0);
                return _this.close();
            };
            this.onceDisconnected = function () {
                return _this.disconnectPromise_;
            };
            this.addPendingData_ = function (buffer) {
                if (!_this.pendingReadBuffer_) {
                    _this.pendingReadBuffer_ = buffer;
                } else {
                    var temp = new Uint8Array(_this.pendingReadBuffer_.byteLength + buffer.byteLength);
                    temp.set(new Uint8Array(_this.pendingReadBuffer_), 0);
                    temp.set(new Uint8Array(buffer), _this.pendingReadBuffer_.byteLength);
                    _this.pendingReadBuffer_ = temp.buffer;
                }
            };
            this.toString = function () {
                return '<TCP.Connection[' + _this.socketId + ']>';
            };
            this.callbacks = {
                recv: null,
                sent: null
            };
            this.pendingReadBuffer_ = null;
            this.recvOptions = null;
            this.pendingRead_ = false;
            this.disconnectPromise_ = new Promise(function (F, R) {
                _this.fulfillDisconnect_ = F;
            });
            this.connectionSocket_ = freedom['core.tcpsocket'](socketId);
            this.connectionSocket_.on('onData', this.onDataHandler_);
            this.connectionSocket_.on('onDisconnect', this.onDisconnectHandler_);
            this.server_ = server;
        }
        return Connection;
    })();
    TCP.Connection = Connection;

    var modulePrefix_ = '[TCP] ';
    function dbg(msg) {
        console.log(modulePrefix_ + msg);
    }
    function dbgWarn(msg) {
        console.warn(modulePrefix_ + msg);
    }
    function dbgErr(msg) {
        console.error(modulePrefix_ + msg);
    }
})(TCP || (TCP = {}));

var Util;
(function (Util) {
    function reject(msg) {
        return Promise.reject(new Error(msg));
    }
    Util.reject = reject;
})(Util || (Util = {}));
