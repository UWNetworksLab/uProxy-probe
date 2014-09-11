
window.onload = function() {
  var button = document.getElementById('get-log-btn');

  button.onclick = function(e) {
    freedom.emit('getLogs');
  };

  printToPage('============ UDP send test ============');
  freedom.emit('command', 'send_udp');

  window.setTimeout(function() {
    printToPage('============ NAT provoking test ============');
    freedom.emit('command', 'nat_provoking');
  }, 3000);

  window.setTimeout(function() {
    printToPage('============ STUN server access test ============')
    freedom.emit('command', 'stun_access');
  }, 20000);

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
