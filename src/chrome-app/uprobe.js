// Listen for the DOM content to be loaded. This event is fired when parsing of
// the page's document has finished.
//document.addEventListener('DOMContentLoaded', function() {

window.onload = function() {
  var button = document.getElementById('get-log-btn');
  button.onclick = function(e) {
    window.freedom.emit('logger.getLog');
  };

  outputLine('uProbe started');
  Log.setTag('uprobe');
  Log.debug('perform send_udp test');
  freedom.emit('logger.info', { tag: 'uprobe', msg: 'send_udp test'});
  window.freedom.emit('command', 'send_udp');

  // testRsaEncryption();
}



function testRsaEncryption() {
  var start = new Date();  // timer
  var result = encrypt('plain text test data...');
  if (result) {
    outputLine('encryption took ' + ((new Date()) - start) + ' ms');
  } else {
    outputLine('encrypt failed, mostly because invalid key.');
  }
  outputLine(result);

  start = new Date();  // timer
  result = decrypt(result);
  if (result) {
    outputLine('decryption took ' + ((new Date()) - start) + ' ms');
  } else {
    outputLine('decrypt failed, mostly because invalid key.');
  }
  outputLine(result);
};

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

