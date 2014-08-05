/// <reference path='../logger/logger.d.ts' />
/// <reference path='../freedom-declarations/freedom.d.ts' />
/// <reference path='../freedom-declarations/udp-socket.d.ts' />

module Diagnose {
  var logger = freedom['Logger']();
  var tag = 'Diagnose';

  freedom.on('command', function(m) {
    logger.debug(tag, 'received command ' + m);
    if (m == 'send_udp') {
      doUdpTest();
    } else if (m == 'stun_access') {
      doStunAccessTest();
    } else if (m == 'pgp_test') {
      doPgpTest();
    }
  });

  freedom.on('getLogs', function() {
    logger.getLogs().then((str: string) => {
      freedom.emit('print', str);
    }).then(() => {
      logger.reset();
    });
  });

  function print(m: any) {
    freedom.emit('print', m);
  }

  export function doUdpTest() {
    logger.debug(tag, 'start udp test');
    var socket: freedom_UdpSocket.Socket = freedom['core.udpsocket']();

    function onUdpData(info: freedom_UdpSocket.RecvFromInfo) {
      var response = new Uint32Array(info.data);
      var d = new Date();
      var laterncy = d.getSeconds() * 1000 + d.getMilliseconds() - response[0];
      if (laterncy < 0) {
        laterncy += 60 * 1000;
      }
      print('Ping response received from ' +
            info.address + ':' + info.port +
            ', latency=' + laterncy + 'ms');
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
        .then((socketInfo: freedom_UdpSocket.SocketInfo) => {
          logger.debug(tag, 'listening on %1:%2', socketInfo.localAddress, 
                       socketInfo.localPort);
        })
        .then(() => {
          socket.on('onData', onUdpData);
          var pingReq = new Uint32Array(1);
          var d = new Date();
          pingReq[0] = d.getSeconds() * 1000 + d.getMilliseconds();
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

  function doStunAccessTest() {
    //for (var i = 0; i < 1; i++) {
    for (var i = 0; i < stunServers.length; i++) {
      var promises : Promise<number>[] = [];
      for (var j = 0; j < 5; j++) {
        promises.push(pingStunServer(stunServers[i]));
      }
      Promise.all(promises).then((laterncies: Array<number>) => {
        var server = stunServers[i];
        var total = 0;
        for (var k = 0; k < laterncies.length; k++) {
          total += laterncies[k];
        }
        print('Average laterncy for ' + stunServers[i] +
              ' = ' + total / laterncies.length);
      });
    }
  }

  function pingStunServer(serverAddr: string) {
    return new Promise<number>( (F, R) => {
      var socket:freedom_UdpSocket.Socket = freedom['core.udpsocket']();
      var parts = serverAddr.split(':');
      var start = Date.now();

      var bindRequest: Turn.StunMessage = {
        method: Turn.MessageMethod.BIND,
        clazz:  Turn.MessageClass.REQUEST,
        transactionId: new Uint8Array(12),
        attributes: []
      };

      var uint16View = new Uint16Array(bindRequest.transactionId);
      for (var i = 0; i < 6; i++) {
        uint16View[i] = Math.floor(Math.random() * 65535);
      }

      socket.on('onData', (info: freedom_UdpSocket.RecvFromInfo) => {
        try {
          var response = Turn.parseStunMessage(new Uint8Array(info.data));
        } catch (e) {
          logger.error(tag, 'Failed to parse bind request from %1', serverAddr);
          R(e);
          return;
        }
        var attribute = Turn.findFirstAttributeWithType(
            Turn.MessageAttribute.XOR_MAPPED_ADDRESS, response.attributes);
        var endPoint = Turn.parseXorMappedAddressAttribute(attribute.value);
        var laterncy = Date.now() - start;
        print(serverAddr + ' returned in ' + laterncy + 'ms. ' +
              'report reflexive address: ' + JSON.stringify(endPoint));
        F(laterncy);
      });

      var bytes = Turn.formatStunMessage(bindRequest);
      socket.bind('0.0.0.0', 0)
          .then((result: number) => {
            if (result != 0) {
              return Promise.reject(new Error('listen failed to bind :5758' +
                  ' with result code ' + result));
            }
            return Promise.resolve(result);
          }).then(() => {
            return socket.sendTo(bytes.buffer, parts[1], parseInt(parts[2]));
          }).then((written: number) => {
              logger.debug(tag, '%1 bytes sent correctly', written);
          }).catch((e: Error) => {
              logger.debug(tag, JSON.stringify(e));
              R(e);
          })
    });
  }

  function doPgpTest() {
    logger.debug(tag, 'start doPgpTest');

    pgpEncrypt.setup().then(() => {
      pgpEncrypt.testPgpEncryption('asdfasdf').then(function(result) {
        if (result) {
          print('pgp encryption test succeeded.');
        } else {
          print('pgp encryption test failed.');
        } });

      pgpEncrypt.testKeyring().then(function(result) {
        print('PGP keyring test succeeded.');
      });
    });
  }
}

