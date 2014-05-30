var Socks;
(function (Socks) {
    function replyToTCP(conn, authType) {
        var response = new Uint8Array(2);
        response[0] = Socks.VERSION5;
        response[1] = authType;
        conn.sendRaw(response.buffer);
    }

    var Server = (function () {
        function Server(address, port, createChannel_) {
            var _this = this;
            this.createChannel_ = createChannel_;
            this.establishSession_ = function (conn) {
                var socksRequest = {};
                var udpRelay;
                conn.receive().then(Server.validateHandshake).catch(function (e) {
                    replyToTCP(conn, 255 /* NONE */);
                    return Promise.reject(e);
                }).then(function () {
                    replyToTCP(conn, 0 /* NOAUTH */);
                    return conn.receive();
                }).then(function (buffer) {
                    Socks.interpretSocksRequest(new Uint8Array(buffer), socksRequest);
                }).catch(function (e) {
                    replyToTCP(conn, 255 /* NONE */);
                    return Promise.reject(e);
                }).then(function () {
                    return (socksRequest.protocol == 'tcp') ? _this.doTcp(conn, socksRequest) : _this.doUdp(conn);
                }).catch(function (e) {
                    dbgWarn('failed to establish SOCKS session: ' + e.message);
                    conn.disconnect();
                });
            };
            this.tcpServer = new TCP.Server(address, port);
            this.tcpServer.on('connection', this.establishSession_);
        }
        Server.prototype.listen = function () {
            var _this = this;
            return this.tcpServer.listen().then(function () {
                dbg('LISTENING ' + _this.tcpServer.addr + ':' + _this.tcpServer.port);
            });
        };

        Server.prototype.doTcp = function (conn, socksRequest) {
            var _this = this;
            var params = {
                protocol: 'tcp',
                address: socksRequest.addressString,
                port: socksRequest.port,
                send: function (buffer) {
                    conn.sendRaw(buffer);
                },
                terminate: function () {
                    _this.tcpServer.endConnection(conn.socketId);
                }
            };
            return this.createChannel_(params).then(function (endpointInfo) {
                conn.onceDisconnected().then(function () {
                    endpointInfo.terminate();
                });
                conn.on('recv', endpointInfo.send);
                var socksResponse = Server.composeSocksResponse(endpointInfo.address, endpointInfo.port);
                conn.sendRaw(socksResponse);
            });
        };

        Server.prototype.doUdp = function (conn) {
            var _this = this;
            var udpRelay = new Socks.UdpRelay();
            return udpRelay.bind(this.tcpServer.addr, 0).then(function () {
                return Promise.resolve(udpRelay);
            }, function (e) {
                return Promise.reject(new Error('could not create udp relay: ' + e.message));
            }).then(function () {
                var udpSession = new UdpSession(udpRelay, _this.createChannel_, function () {
                    _this.tcpServer.endConnection(conn.socketId);
                });

                conn.onceDisconnected().then(function () {
                    udpSession.disconnected();
                });
                var socksResponse = Server.composeSocksResponse(udpRelay.getAddress(), udpRelay.getPort());
                conn.sendRaw(socksResponse);
            });
        };

        Server.prototype.disconnect = function () {
            this.tcpServer.disconnect();
        };

        Server.validateHandshake = function (buffer) {
            var handshakeBytes = new Uint8Array(buffer);

            var socksVersion = handshakeBytes[0];
            if (socksVersion != Socks.VERSION5) {
                throw new Error('unsupported SOCKS version: ' + socksVersion);
            }

            var authMethods = [];
            var numAuthMethods = handshakeBytes[1];
            for (var i = 0; i < numAuthMethods; i++) {
                authMethods.push(handshakeBytes[2 + i]);
            }

            if (authMethods.indexOf(0 /* NOAUTH */) <= -1) {
                throw new Error('client requires authentication');
            }
        };

        Server.composeSocksResponse = function (address, port) {
            var buffer = new ArrayBuffer(10);
            var bytes = new Uint8Array(buffer);
            bytes[0] = Socks.VERSION5;
            bytes[1] = 0 /* SUCCEEDED */;
            bytes[2] = 0x00;
            bytes[3] = 1 /* IP_V4 */;

            var v4 = '([\\d]{1,3})';
            var v4d = '\\.';
            var v4complete = v4 + v4d + v4 + v4d + v4 + v4d + v4;
            var v4regex = new RegExp(v4complete);
            var ipv4 = address.match(v4regex);
            if (ipv4) {
                bytes[4] = parseInt(ipv4[1]);
                bytes[5] = parseInt(ipv4[2]);
                bytes[6] = parseInt(ipv4[3]);
                bytes[7] = parseInt(ipv4[4]);
            }

            bytes[8] = port >> 8;
            bytes[9] = port & 0xFF;

            return buffer;
        };
        return Server;
    })();
    Socks.Server = Server;

    var UdpSession = (function () {
        function UdpSession(udpRelay_, createChannel_, terminate_) {
            var _this = this;
            this.udpRelay_ = udpRelay_;
            this.createChannel_ = createChannel_;
            this.terminate_ = terminate_;
            this.channels_ = {};
            this.onData_ = function (data) {
                var headerLength = 10;
                var header = data.slice(0, headerLength);
                var headerBytes = new Uint8Array(header);
                var payload = data.slice(headerLength);

                var request = {};
                Socks.interpretUdpRequest(headerBytes, request);
                var dest = request.addressString + ':' + request.port;

                var channel;
                if (!(dest in _this.channels_)) {
                    var params = {
                        protocol: 'udp',
                        address: request.addressString,
                        port: request.port,
                        send: function (reply) {
                            var out = new ArrayBuffer(headerLength + reply.byteLength);
                            var outBytes = new Uint8Array(out);
                            for (var i = 0; i < header.byteLength; i++) {
                                outBytes[i] = headerBytes[i];
                            }
                            var replyBytes = new Uint8Array(reply);
                            for (var i = 0; i < reply.byteLength; i++) {
                                outBytes[headerLength + i] = replyBytes[i];
                            }
                            _this.udpRelay_.sendRemoteReply(out);
                        },
                        terminate: function () {
                            _this.terminate_();
                        }
                    };
                    _this.channels_[dest] = _this.createChannel_(params);
                }

                _this.channels_[dest].then(function (endpointInfo) {
                    endpointInfo.send(payload);
                });
            };
            this.udpRelay_.setDataReceivedHandler(this.onData_);
        }
        UdpSession.prototype.disconnected = function () {
            dbg('TODO: close all udp datachannels');
        };
        return UdpSession;
    })();

    var modulePrefix_ = '[SOCKS] ';
    function dbg(msg) {
        console.log(modulePrefix_ + msg);
    }
    function dbgWarn(msg) {
        console.warn(modulePrefix_ + msg);
    }
    function dbgErr(msg) {
        console.error(modulePrefix_ + msg);
    }
})(Socks || (Socks = {}));
