console.log('WEBWORKER SocksToRtc: ' + self.location.href);

var SocksToRTC;
(function (SocksToRTC) {
    var fCore = freedom.core();

    var Peer = (function () {
        function Peer() {
            var _this = this;
            this.socksServer_ = null;
            this.signallingChannel_ = null;
            this.transport_ = null;
            this.channels_ = {};
            this.peerId_ = null;
            this.start = function (remotePeer) {
                _this.reset();
                dbg('starting - target peer: ' + JSON.stringify(remotePeer));

                var peerId = _this.peerId_ = remotePeer.peerId;
                if (!peerId) {
                    dbgErr('no Peer ID provided! cannot connect.');
                    return false;
                }

                _this.transport_ = freedom['transport']();
                _this.transport_.on('onData', _this.onDataFromPeer_);
                _this.transport_.on('onClose', _this.closeConnectionToPeer);

                fCore.createChannel().then(function (chan) {
                    _this.transport_.setup('SocksToRtc-' + peerId, chan.identifier);
                    _this.signallingChannel_ = chan.channel;
                    _this.signallingChannel_.on('message', function (msg) {
                        freedom.emit('sendSignalToPeer', {
                            peerId: peerId,
                            data: msg
                        });
                    });
                    dbg('signalling channel to SCTP peer connection ready.');
                });

                _this.socksServer_ = new Socks.Server(remotePeer.host, remotePeer.port, _this.createChannel_);
                _this.socksServer_.listen();
            };
            this.reset = function () {
                dbg('resetting peer...');
                if (_this.socksServer_) {
                    _this.socksServer_.disconnect();
                    _this.socksServer_ = null;
                }
                for (var tag in _this.channels_) {
                    _this.closeConnectionToPeer(tag);
                }
                _this.channels_ = {};
                if (_this.transport_) {
                    _this.transport_.close();
                    _this.transport_ = null;
                }
                if (_this.signallingChannel_) {
                    _this.signallingChannel_.emit('close');
                }
                _this.signallingChannel_ = null;
                _this.peerId_ = null;
            };
            this.createChannel_ = function (params) {
                if (!_this.transport_) {
                    dbgWarn('transport not ready');
                    return;
                }

                var tag = obtainTag();
                _this.channels_[tag] = params;

                return new Promise(function (F, R) {
                    Peer.connectCallbacks[tag] = function (response) {
                        if (response.address) {
                            var endpointInfo = {
                                protocol: params.protocol,
                                address: response.address,
                                port: response.port,
                                send: function (buf) {
                                    _this.sendToPeer_(tag, buf);
                                },
                                terminate: function () {
                                    _this.terminate_(tag);
                                }
                            };
                            F(endpointInfo);
                        } else {
                            R(new Error('could not create datachannel'));
                        }
                    };
                    var request = {
                        protocol: params.protocol,
                        address: params.address,
                        port: params.port
                    };
                    var command = {
                        type: 1 /* NET_CONNECT_REQUEST */,
                        tag: tag,
                        data: JSON.stringify(request)
                    };
                    _this.transport_.send('control', ArrayBuffers.stringToArrayBuffer(JSON.stringify(command)));
                });
            };
            this.terminate_ = function (tag) {
                if (!(tag in _this.channels_)) {
                    dbgWarn('tried to terminate unknown datachannel ' + tag);
                    return;
                }
                dbg('terminating datachannel ' + tag);
                var command = {
                    type: 4 /* SOCKS_DISCONNECTED */,
                    tag: tag
                };
                _this.transport_.send('control', ArrayBuffers.stringToArrayBuffer(JSON.stringify(command)));
                delete _this.channels_[tag];
            };
            this.onDataFromPeer_ = function (msg) {
                dbg(msg.tag + ' <--- received ' + msg.data.byteLength);
                if (!msg.tag) {
                    dbgErr('received message without datachannel tag!: ' + JSON.stringify(msg));
                    return;
                }

                if (msg.tag == 'control') {
                    var command = JSON.parse(ArrayBuffers.arrayBufferToString(msg.data));

                    if (command.type === 2 /* NET_CONNECT_RESPONSE */) {
                        var response = JSON.parse(command.data);
                        if (command.tag in Peer.connectCallbacks) {
                            var callback = Peer.connectCallbacks[command.tag];
                            callback(response);
                            Peer.connectCallbacks[command.tag] = undefined;
                        } else {
                            dbgWarn('received connect callback for unknown datachannel: ' + command.tag);
                        }
                    } else if (command.type === 3 /* NET_DISCONNECTED */) {
                        dbg(command.tag + ' <--- received NET-DISCONNECTED');
                        _this.closeConnectionToPeer(command.tag);
                    } else {
                        dbgWarn('unsupported control command: ' + command.type);
                    }
                } else {
                    if (!(msg.tag in _this.channels_)) {
                        dbgErr('unknown datachannel ' + msg.tag);
                        return;
                    }
                    var session = _this.channels_[msg.tag];
                    session.send(msg.data);
                }
            };
            this.closeConnectionToPeer = function (tag) {
                if (!(tag in _this.channels_)) {
                    dbgWarn('unknown datachannel ' + tag + ' has closed');
                    return;
                }
                dbg('datachannel ' + tag + ' has closed. ending SOCKS session for channel.');
                _this.channels_[tag].terminate();
                delete _this.channels_[tag];
            };
            this.sendToPeer_ = function (tag, buffer) {
                if (!_this.transport_) {
                    dbgWarn('transport_ not ready');
                    return;
                }
                dbg('send ' + buffer.byteLength + ' bytes on datachannel ' + tag);
                _this.transport_.send(tag, buffer);
            };
            this.handlePeerSignal = function (msg) {
                if (!_this.signallingChannel_) {
                    dbgErr('signalling channel missing!');
                    return;
                }
                _this.signallingChannel_.emit('message', msg.data);
            };
            this.toString = function () {
                var ret = '<SocksToRTC.Peer: failed toString()>';
                try  {
                    ret = JSON.stringify({
                        socksServer: _this.socksServer_,
                        transport: _this.transport_,
                        peerId: _this.peerId_,
                        signallingChannel: _this.signallingChannel_,
                        channels: _this.channels_ });
                } catch (e) {
                }
                return ret;
            };
        }
        Peer.connectCallbacks = {};
        return Peer;
    })();
    SocksToRTC.Peer = Peer;

    function obtainTag() {
        return 'c' + Math.random();
    }

    var modulePrefix_ = '[SocksToRtc] ';
    function dbg(msg) {
        console.log(modulePrefix_ + msg);
    }
    function dbgWarn(msg) {
        console.warn(modulePrefix_ + msg);
    }
    function dbgErr(msg) {
        console.error(modulePrefix_ + msg);
    }
})(SocksToRTC || (SocksToRTC = {}));

function initClient() {
    var peer = new SocksToRTC.Peer();
    freedom.on('handleSignalFromPeer', peer.handlePeerSignal);
    freedom.on('start', peer.start);
    freedom.on('stop', peer.reset);
    freedom.on('test', function () {
        new TcpEchoServer('127.0.0.1', 9998);
    });
    freedom.emit('ready', {});
}

initClient();
