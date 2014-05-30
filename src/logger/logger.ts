/// <reference path='../../node_modules/freedom-typescript-api/interfaces/freedom.d.ts' />
/// <reference path='../../node_modules/freedom-typescript-api/interfaces/promise.d.ts' />

module Logger {

  var logBuffer: string[] = [];
  var enabled = true;   // TODO: we probably will change it to false as default.

  // get log will return a encrypted blob that only related uProxy personal can
  // decode. 
  function getLog(...tags: string[]) : ArrayBuffer {
    // return the log for caller to perform submission.
    return new ArrayBuffer(12);
  }

  freedom.on('logger.reset', function(m) {
    logBuffer = [];
  });

  freedom.on('logger.enable', function(m) {
    enabled = !!m;
  });

  function getTimestamp() {
    var d = new Date();
    return d.getMonth() + '/' + d.getDate() + ' ' + d.getHours() +
        ':' + d.getMinutes() + '.' + d.getMilliseconds();
  }

  function format(level: string, tag: string, msg: string, args: any[]) {
    var formatted_msg = msg;
    if (args && args.length) {
      for (var i = 0; i < args.length; i++) {
        formatted_msg = formatted_msg.replace('%' + (i + 1), args[i]);
      }
    }
    var ret = tag + ':' + level + ':' + getTimestamp() + '\t' + formatted_msg;
    console.log(ret);
    return ret;
  }

  function debug(tag: string, msg: string, ...args: any[]) {
    enabled && logBuffer.push(format('D', tag, msg, args));
  }

  function info(tag: string, msg: string, ...args: any[]) {
    enabled && logBuffer.push(format('I', tag, msg, args));
  }

  function warn(tag: string, msg: string, ...args: any[]) {
    enabled && logBuffer.push(format('W', tag, msg, args));
  }

  function error(tag: string, msg: string, ...args: any[]) {
    enabled && logBuffer.push(format('E', tag, msg, args));
  }

  function format2(level: string, m: any) {
    enabled && logBuffer.push(format(level, m.tag, m.msg, m.args));
  }

  freedom.on('logger.debug', function(m) {
    format2('D', m);
  });

  freedom.on('logger.info', function(m) {
    format2('I', m);
  });

  freedom.on('logger.warn', function(m) {
    format2('W', m);
  });

  freedom.on('logger.error', function(m) {
    format2('E', m);
  });

  freedom.on('logger.getLog', function() {
    var logs = logBuffer.join('\n');
    freedom.emit('logger.report', logs);
  });
}

