
freedom('lib/diagnose/diagnose.json', { 'debug': 'log' }).then(function(interface) {
  var probe = interface();

  var button = document.getElementById('get-log-btn');

  button.onclick = function(e) {
    printToPage('--- dump buffered logs ---');
    probe.emit('getLogs');
  };

  printToPage('============ UDP send test ============');
  probe.emit('command', 'send_udp');

  window.setTimeout(function() {
    printToPage('============ NAT provoking test ============');
    probe.emit('command', 'nat_provoking');
  }, 3000);

  window.setTimeout(function() {
    printToPage('============ STUN server access test ============')
    probe.emit('command', 'stun_access');
  }, 20000);

  probe.on('print', function(msg) {
    var lines = msg.split('\n');
    for (var i = 0; i < lines.length; i++) {
      printToPage(lines[i]);
    }
  });

  function printToPage(msg) {
    var logDiv = document.getElementById('log');
    if (typeof msg == 'object') {
        logDiv.innerHTML += JSON.stringify(msg) + '<br />';
    } else {
        logDiv.innerHTML += msg + '<br />';
    }
  }
});

