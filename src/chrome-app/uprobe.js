
window.onload = function() {
  var button = document.getElementById('get-log-btn');

  button.onclick = function(e) {
    window.freedom.emit('getLogs');
  };

  /*
  printToPage('============ Udp send test ============');
  freedom.emit('command', 'send_udp');

  window.setTimeout(function() {
    printToPage('============ Stun server access test ============')
    freedom.emit('command', 'stun_access');
  }, 3000);
  */
  window.setTimeout(function() {
    printToPage('============ Log encryption test with e2e ============')
    pgpEncrypt.setup();
    pgpEncrypt.testPgpEncryption('asdfasdf').then(function(result) {
      if (result) {
        printToPage('pgp encryption test succeeded.');
      } else {
        printToPage('pgp encryption test failed.');
      } });

    pgpEncrypt.testKeyring().then(function(result) {
      printToPage('PGP keyring test succeeded.');
    });

  }, 0);
}

function printToPage(msg) {
  var logDiv = document.getElementById('log');
  if (typeof msg == 'object') {
      logDiv.innerHTML += JSON.stringify(msg) + '<br />';
  } else {
      logDiv.innerHTML += msg + '<br />';
  }
}

window.freedom.on('print', function(msg) {
  var lines = msg.split('\n');
  for (var i = 0; i < lines.length; i++) {
    printToPage(lines[i]);
  }
});
