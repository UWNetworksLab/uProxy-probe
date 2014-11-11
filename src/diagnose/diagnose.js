var Diagnose;
(function (Diagnose) {
    var TEST_SERVER = '54.68.73.184';
    var TEST_PORT = 6666;
    var log = new Logging.Log('Diagnose');
    Logging.setBufferedLogFilter(['*:I']);
    freedom().on('command', function (m) {
        log.debug('received command %1', [m]);
        if (m == 'send_udp') {
            doUdpTest();
        }
        else if (m == 'stun_access') {
            doStunAccessTest();
        }
        else if (m == 'nat_provoking') {
            doNatProvoking().then(function (natType) {
                log.debug('!!! natType =' + natType);
                freedom().emit('print', 'NAT type is ' + natType);
            });
        }
    });
    freedom().on('getLogs', function () {
        var strs = Logging.getLogs();
        for (var i = 0; i < strs.length; i++) {
            freedom().emit('print', strs[i]);
        }
        Logging.clearLogs();
    });
    function print(m) {
        freedom().emit('print', m);
    }
    function doUdpTest() {
        log.info('perform udp test');
        var socket = freedom['core.udpsocket']();
        function onUdpData(info) {
            var rspStr = ArrayBuffers.arrayBufferToString(info.data);
            log.debug(rspStr);
            var rsp = JSON.parse(rspStr);
            if (rsp['answer'] == 'Pong') {
                print('Pong resonse received, latency=' + (Date.now() - rsp['ping_time']) + 'ms');
            }
        }
        socket.bind('0.0.0.0', 0).then(function (result) {
            if (result != 0) {
                return Promise.reject(new Error('listen failed to bind :5758' + ' with result code ' + result));
            }
            return Promise.resolve(result);
        }).then(socket.getInfo).then(function (socketInfo) {
            log.debug('listening on %1:%2', [socketInfo.localAddress, socketInfo.localPort]);
        }).then(function () {
            socket.on('onData', onUdpData);
            var pingReq = new Uint32Array(1);
            var reqStr = JSON.stringify({
                'ask': 'Ping',
                'ping_time': Date.now()
            });
            var req = ArrayBuffers.stringToArrayBuffer(reqStr);
            socket.sendTo(req, TEST_SERVER, TEST_PORT);
        });
    }
    Diagnose.doUdpTest = doUdpTest;
    var stunServers = [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
        'stun:stun3.l.google.com:19302',
        'stun:stun4.l.google.com:19302',
    ];
    function doStunAccessTest() {
        log.info('perform Stun access test');
        for (var i = 0; i < stunServers.length; i++) {
            var promises = [];
            for (var j = 0; j < 5; j++) {
                promises.push(pingStunServer(stunServers[i]));
            }
            Promise.all(promises).then(function (laterncies) {
                var server = stunServers[i];
                var total = 0;
                for (var k = 0; k < laterncies.length; k++) {
                    total += laterncies[k];
                }
                print('Average laterncy for ' + stunServers[i] + ' = ' + total / laterncies.length);
            });
        }
    }
    function pingStunServer(serverAddr) {
        return new Promise(function (F, R) {
            var socket = freedom['core.udpsocket']();
            var parts = serverAddr.split(':');
            var start = Date.now();
            var bindRequest = {
                method: 1 /* BIND */,
                clazz: 1 /* REQUEST */,
                transactionId: new Uint8Array(12),
                attributes: []
            };
            var uint16View = new Uint16Array(bindRequest.transactionId);
            for (var i = 0; i < 6; i++) {
                uint16View[i] = Math.floor(Math.random() * 65535);
            }
            socket.on('onData', function (info) {
                try {
                    var response = Turn.parseStunMessage(new Uint8Array(info.data));
                }
                catch (e) {
                    log.error('Failed to parse bind request from %1', [serverAddr]);
                    R(e);
                    return;
                }
                var attribute = Turn.findFirstAttributeWithType(32 /* XOR_MAPPED_ADDRESS */, response.attributes);
                var endPoint = Turn.parseXorMappedAddressAttribute(attribute.value);
                var laterncy = Date.now() - start;
                print(serverAddr + ' returned in ' + laterncy + 'ms. ' + 'report reflexive address: ' + JSON.stringify(endPoint));
                F(laterncy);
            });
            var bytes = Turn.formatStunMessage(bindRequest);
            socket.bind('0.0.0.0', 0).then(function (result) {
                if (result != 0) {
                    return Promise.reject(new Error('listen failed to bind :5758' + ' with result code ' + result));
                }
                return Promise.resolve(result);
            }).then(function () {
                return socket.sendTo(bytes.buffer, parts[1], parseInt(parts[2]));
            }).then(function (written) {
                log.debug('%1 bytes sent correctly', [written]);
            }).catch(function (e) {
                log.debug(JSON.stringify(e));
                R(e);
            });
        });
    }
    function doNatProvoking() {
        return new Promise(function (F, R) {
            log.info('perform NAT provoking');
            var socket = freedom['core.udpsocket']();
            var timerId = -1;
            var rejectShortcut = null;
            function onUdpData(info) {
                var rspStr = ArrayBuffers.arrayBufferToString(info.data);
                log.debug('receive response = ' + rspStr);
                var rsp = JSON.parse(rspStr);
                if (rsp['answer'] == 'FullCone') {
                    F('FullCone');
                }
                else if (rsp['answer'] == 'RestrictedConePrepare') {
                    var peer_addr = rsp['prepare_peer'].split(':');
                    var req = ArrayBuffers.stringToArrayBuffer('{"ask":""}');
                    log.debug('reply to RestrictedConePrepare');
                    socket.sendTo(req, peer_addr[0], parseInt(peer_addr[1]));
                    return;
                }
                else if (rsp['answer'] == 'RestrictedCone') {
                    F('RestrictedCone');
                }
                else if (rsp['answer'] == 'PortRestrictedConePrepare') {
                    var peer_addr = rsp['prepare_peer'].split(':');
                    var req = ArrayBuffers.stringToArrayBuffer('{"ask":""}');
                    log.debug('reply to PortRestrictedConePrepare');
                    socket.sendTo(req, peer_addr[0], parseInt(peer_addr[1]));
                    return;
                }
                else if (rsp['answer'] == 'PortRestrictedCone') {
                    F('PortRestrictedCone');
                }
                else if (rsp['answer'] == 'SymmetricNATPrepare') {
                    var peer_addr = rsp['prepare_peer'].split(':');
                    var reqStr = JSON.stringify({ 'ask': 'AmISymmetricNAT' });
                    var req = ArrayBuffers.stringToArrayBuffer(reqStr);
                    socket.sendTo(req, peer_addr[0], parseInt(peer_addr[1]));
                    return;
                }
                else if (rsp['answer'] == 'SymmetricNAT') {
                    F('SymmetricNAT');
                }
                else {
                    return;
                }
                if (timerId != -1) {
                    clearTimeout(timerId);
                    if (rejectShortcut) {
                        rejectShortcut(new Error('shortCircuit'));
                    }
                }
            }
            socket.on('onData', onUdpData);
            socket.bind('0.0.0.0', 0).then(function (result) {
                if (result != 0) {
                    return Promise.reject(new Error('failed to bind to a port: err=' + result));
                }
                return Promise.resolve(result);
            }).then(socket.getInfo).then(function (socketInfo) {
                log.debug('listening on %1:%2', [socketInfo.localAddress, socketInfo.localPort]);
            }).then(function () {
                var reqStr = JSON.stringify({ 'ask': 'AmIFullCone' });
                log.debug('send ' + reqStr);
                var req = ArrayBuffers.stringToArrayBuffer(reqStr);
                for (var i = 0; i < 10; i++) {
                    socket.sendTo(req, TEST_SERVER, TEST_PORT);
                }
            }).then(function () {
                return new Promise(function (F, R) {
                    rejectShortcut = R;
                    timerId = setTimeout(function () {
                        timerId = -1;
                        F();
                    }, 2000);
                });
            }).then(function () {
                var reqStr = JSON.stringify({ 'ask': 'AmIRestrictedCone' });
                log.debug(reqStr);
                var req = ArrayBuffers.stringToArrayBuffer(reqStr);
                for (var i = 0; i < 3; i++) {
                    socket.sendTo(req, TEST_SERVER, TEST_PORT);
                }
            }).then(function () {
                return new Promise(function (F, R) {
                    rejectShortcut = R;
                    timerId = setTimeout(function () {
                        timerId = -1;
                        F();
                    }, 3000);
                });
            }).then(function () {
                var reqStr = JSON.stringify({ 'ask': 'AmIPortRestrictedCone' });
                log.debug(reqStr);
                var req = ArrayBuffers.stringToArrayBuffer(reqStr);
                for (var i = 0; i < 3; i++) {
                    socket.sendTo(req, TEST_SERVER, TEST_PORT);
                }
            }).then(function () {
                return new Promise(function (F, R) {
                    rejectShortcut = R;
                    timerId = setTimeout(function () {
                        timerId = -1;
                        F();
                    }, 10000);
                });
            }).then(function () {
                var reqStr = JSON.stringify({ 'ask': 'AmISymmetricNAT' });
                log.debug(reqStr);
                var req = ArrayBuffers.stringToArrayBuffer(reqStr);
                for (var i = 0; i < 3; i++) {
                    socket.sendTo(req, TEST_SERVER, TEST_PORT);
                }
            }).then(function () {
                return new Promise(function (F, R) {
                    rejectShortcut = R;
                    timerId = setTimeout(function () {
                        timerId = -1;
                        F();
                    }, 3000);
                });
            }).catch(function (e) {
                if (e.message != 'shortCircuit') {
                    log.error('something wrong: ' + e.message);
                    R(e);
                }
                else {
                    log.debug('shortCircuit');
                }
            });
        });
    }
})(Diagnose || (Diagnose = {}));
//# sourceMappingURL=diagnose.js.map