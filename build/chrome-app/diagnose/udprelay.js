var Socks;
(function (Socks) {
    var UdpRelay = (function () {
        function UdpRelay() {
            var _this = this;
            this.attachSocketHandler_ = function () {
                _this.socket_.on('onData', _this.onSocksClientData_);
            };
            this.onSocksClientData_ = function (recvFromInfo) {
                _this.clientAddress_ = recvFromInfo.address;
                _this.clientPort_ = recvFromInfo.port;
                if (_this.dataReceivedHandler) {
                    _this.dataReceivedHandler(recvFromInfo.data);
                }
            };
            this.getAddress = function () {
                return _this.address_;
            };
            this.getPort = function () {
                return _this.port_;
            };
            this.socket_ = freedom['core.udpsocket']();
        }
        UdpRelay.prototype.bind = function (address, port) {
            var _this = this;
            return this.socket_.bind(address, port).then(function (resultCode) {
                if (resultCode != 0) {
                    return Promise.reject(new Error('listen failed on ' + _this.address_ + ':' + _this.port_ + ' with result code ' + resultCode));
                }
                return Promise.resolve(resultCode);
            }).then(this.socket_.getInfo).then(function (socketInfo) {
                _this.address_ = socketInfo.localAddress;
                _this.port_ = socketInfo.localPort;
                dbg('listening on ' + _this.address_ + ':' + _this.port_);
            }).then(this.attachSocketHandler_);
        };

        UdpRelay.prototype.setDataReceivedHandler = function (callback) {
            this.dataReceivedHandler = callback;
        };

        UdpRelay.prototype.sendRemoteReply = function (buffer) {
            if (!this.clientAddress_) {
                throw new Error('cannot send data to client before it sends data');
            }
            return this.socket_.sendTo(buffer, this.clientAddress_, this.clientPort_);
        };
        return UdpRelay;
    })();
    Socks.UdpRelay = UdpRelay;

    var modulePrefix_ = '[UDP-RELAY] ';
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
