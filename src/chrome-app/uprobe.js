// Listen for the DOM content to be loaded. This event is fired when parsing of
// the page's document has finished.
//document.addEventListener('DOMContentLoaded', function() {

window.onload = function() {
  var button = document.getElementById('get-log-btn');

  button.onclick = function(e) {
    window.freedom.emit('getLogs');
    check();
  };

  outputLine('uProbe started');
  // freedom.emit('command', 'send_udp');

  pgpEncrypt.setup();
  pgpEncrypt.testPgpEncryption('asdfasdf').then(function(result) {
    if (result) {
      outputLine('pgp encryption test succeeded.');
    } else {
      outputLine('pgp encryption test failed.');
    } });
}

function outputLine(msg) {
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
    outputLine(lines[i]);
  }
});
