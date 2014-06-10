/// <reference path='../../node_modules/freedom-typescript-api/interfaces/freedom.d.ts' />
/// <reference path='../../node_modules/freedom-typescript-api/interfaces/promise.d.ts' />

module Logger {

  var logBuffer: string[] = [];
  var enabled = true;   // TODO: we probably will change it to false as default.
  var consoleFilter: {[s: string]: string;} = {'*': 'D'};

  var LEVEL_CHARS = 'DIWE';

  // get log will return a encrypted blob that only related uProxy personal can
  // decode. 
  export function getLogBlob(...tags: string[]) : ArrayBuffer {
    // return the log for caller to perform submission.
    // TODO: to be implemented.
    return new ArrayBuffer(12);
  }

  export function getLogs(...tags: string[]) : string {
    return logBuffer.join('\n');
  }

  export function reset() {
    logBuffer = [];
  }

  export function enable(newState: boolean) {
    enabled = newState;
  }

  freedom.on('logger.reset', function(m) {
    reset();
  });

  freedom.on('logger.enable', function(m) {
    enable(!!m);
  });

  function getTimestamp() {
    var d = new Date();
    return d.getMonth() + '/' + d.getDate() + ' ' + d.getHours() +
        ':' + d.getMinutes() + ':' + d.getSeconds() + '.' + d.getMilliseconds();
  }

  export function format(level: string, tag: string, msg: string, args: any[]) {
    var formatted_msg = msg;
    if (args && args.length) {
      for (var i = 0; i < args.length; i++) {
        formatted_msg = formatted_msg.replace('%' + (i + 1), args[i]);
      }
    }
    var ret = [getTimestamp(), tag, level, formatted_msg].join('|');
    return ret;
  }


  function isLevelAllowed(request: string, permitted: string) {
    return LEVEL_CHARS.indexOf(request) >= LEVEL_CHARS.indexOf(permitted);
  }

  function doRealLog(level: string, tag: string, msg: string, args: any[]) {
    if (!enabled) {
      return;
    }
    var logMsg = format(level, tag, msg, args);
    if ('*' in consoleFilter && isLevelAllowed(level, consoleFilter['*']) ||
        tag in consoleFilter && isLevelAllowed(level, consoleFilter[tag])) {
      console.log(logMsg);
    }
    logBuffer.push(logMsg);
  }

  export function setConsoleFilter(...args: string[]) {
    consoleFilter = {};
    for (var i = 0; i < args.length; i++) {
      var parts = args[i].split(':');
      consoleFilter[parts[0]] = parts[1];
    }
  }

  export function debug(tag: string, msg: string, ...args: any[]) {
    doRealLog('D', tag, msg, args);
  }

  export function info(tag: string, msg: string, ...args: any[]) {
    doRealLog('I', tag, msg, args);
  }

  export function warn(tag: string, msg: string, ...args: any[]) {
    doRealLog('W', tag, msg, args);
  }

  export function error(tag: string, msg: string, ...args: any[]) {
    doRealLog('E', tag, msg, args);
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
    freedom.emit('logger.report', getLogs());
  });
}

