/// <reference path='../../node_modules/freedom-typescript-api/interfaces/freedom.d.ts' />
/// <reference path='../../node_modules/freedom-typescript-api/interfaces/promise.d.ts' />
/// <reference path='../../node_modules/uproxy-build-tools/src/logger/logger.d.ts' />
/// <reference path='../../node_modules/freedom-typescript-api/interfaces/udp-socket.d.ts' />

module Diagnose {
  import UdpSocket = freedom.UdpSocket;
  var logger = freedom['Logger']();

  var tag = 'Diagnose';

  freedom.on('command', function(m) {
    logger.debug(tag, 'received command ' + m);
    if (m == 'send_udp') {
      doUdpTest();
    } else if (m == 'stun_access') {
    }
  });

  freedom.on('getLogs', function() {
    logger.getLogs().then(function(str) {
      freedom.emit('print', str);
    });
  });

  function print(m: any) {
    freedom.emit('print', m);
  }

  export function doUdpTest() {
    logger.debug(tag, 'start udp test');
    var socket:UdpSocket = freedom['core.udpsocket']();

    function onUdpData(info: UdpSocket.RecvFromInfo) {
      var response = new Uint32Array(info.data);
      logger.info(tag, 'Ping response received from %1:%2, latency=%3ms',
                  info.address, info.port,
                  (new Date()).getMilliseconds() - response[0]);
    }   

    socket.bind('0.0.0.0', 5758)
        .then((result: number) => {
          if (result != 0) {
            return Promise.reject(new Error('listen failed to bind :5758' +
                ' with result code ' + result));
          }
          return Promise.resolve(result);
        })
        .then(socket.getInfo)
        .then((socketInfo: UdpSocket.SocketInfo) => {
          logger.debug(tag, 'listening on %1:%2', socketInfo.localAddress, 
                       socketInfo.localPort);
        })
        .then(() => {
          socket.on('onData', onUdpData);
          var pingReq = new Uint32Array(1);
          pingReq[0] = (new Date()).getMilliseconds();
          logger.info(tag, 'sent ping request to %1:%2',
                      '199.223.236.121', 3333);
          socket.sendTo(pingReq.buffer, '199.223.236.121', 3333);
        });
  }

  var stunServers = [
    'stun:stun.l.google.com:19302',
    'stun:stun1.l.google.com:19302',
    'stun:stun2.l.google.com:19302',
    'stun:stun3.l.google.com:19302',
    'stun:stun4.l.google.com:19302',
  ];

  export function doStunAccessTest() {
    for (var i = 0; i < stunServers.length; i++) {
      pingStunServer(stunServers[i]);
    }
  }

  function pingStunServer(serverAddr: string) {
    var socket:UdpSocket = freedom['core.udpsocket']();
    var parts = serverAddr.split(':');
    var start = (new Date()).getMilliseconds();

    function onStunDataBack(info: UdpSocket.RecvFromInfo) {
      var response = new Uint32Array(info.data);
      logger.info(tag, 'Response received with latency=%1ms',
                  (new Date()).getMilliseconds() - start);
    }

    var request = new ArrayBuffer(20);
    var bufView = new Uint8Array(request);
    
    socket.sendTo(request, parts[0], parts[1]);
  }

}

