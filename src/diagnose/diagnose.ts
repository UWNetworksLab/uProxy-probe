/// <reference path='../common/log.ts' />
/// <reference path='../../node_modules/freedom-typescript-api/interfaces/freedom.d.ts' />
/// <reference path='../../node_modules/freedom-typescript-api/interfaces/udp-socket.d.ts' />
/// <reference path='../../node_modules/freedom-typescript-api/interfaces/promise.d.ts' />

module Diagnose {
  import UdpSocket = freedom.UdpSocket;

  Log.setTag('Diagnose');

  freedom.on('command', function(m) {
    Log.debug('received command ' + m);
    if (m == 'send_udp') {
      doUdpTest();
    } else if (m == 'stun_access') {
    }
  });

  function print(m: any) {
    freedom.emit('print', m);
  }

  export function doUdpTest() {
    Log.debug('start udp test');
    var socket:UdpSocket = freedom['core.udpsocket']();

    function onUdpData(info: UdpSocket.RecvFromInfo) {
      var response = new Uint32Array(info.data);
      Log.info('Ping response received from %1:%2, latency=%3ms',
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
          Log.debug('listening on %1:%2', socketInfo.localAddress, 
                    socketInfo.localPort);
        })
        .then(() => {
          socket.on('onData', onUdpData);
          var pingReq = new Uint32Array(1);
          pingReq[0] = (new Date()).getMilliseconds();
          Log.info('sent ping request to %1:%2', '199.223.236.121', 3333);
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

  }

}

