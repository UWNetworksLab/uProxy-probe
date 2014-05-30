/// <reference path='../../node_modules/freedom-typescript-api/interfaces/freedom.d.ts' />

module Log {
  // From App, there might not be access to logger module. In such case,
  // use freedom for message sending.
  var logger = freedom['logger'] ? freedom['logger']() : freedom;
  var tag: string = '';

  export function setTag(t: string) {
    tag = t;
  }

  export function debug(m, ...args: any[]) {
    logger.emit('logger.debug', {tag: tag, msg: m, args: args});
  }

  export function info(m, ...args: any[]) {
    logger.emit('logger.info', {tag: tag, msg: m, args: args});
  }

  export function warn(m, ...args: any[]) {
    logger.emit('logger.warn', {tag: tag, msg: m, args: args});
  }

  export function error(m, ...args: any[]) {
    logger.emit('logger.error', {tag: tag, msg: m, args: args});
  }

  export function getLog(m: any) {
    logger.emit('logger.getLog', m);
  }

  /******************* Logger relay **********************/
  freedom['reflectEvents'] = false;

  // do relay for message received from app.
  freedom.on('logger.debug', function(m) {
    logger.emit('logger.debug', m);
  });

  freedom.on('logger.info', function(m) {
    logger.emit('logger.info', m);
  });

  freedom.on('logger.warn', function(m) {
    logger.emit('logger.warn', m);
  });

  freedom.on('logger.error', function(m) {
    logger.emit('logger.error', m);
  });

  freedom.on('logger.getLog', function(m) {
    logger.emit('logger.getLog', m);
  });

  logger.on('logger.report', function(m){
    freedom.emit('print', m);
  });

  freedom.on('')
}
